import axios from "axios";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import Snapshot from "../models/snapshotModel.js";

const __dirname = path.resolve();
const baseDir = path.join(__dirname, "public/images");
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

// ✅ Capture a snapshot from one camera
export const captureSnapshot = async (camera) => {
  try {
    const folder = path.join(baseDir, camera._id.toString());
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

    // Get current date and time in YYYYMMDDHHMM format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;
    const timeStr = `${hours}${minutes}`;

    // Get start and end of today
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    // Count existing snapshots for this camera today
    const count = await Snapshot.countDocuments({
      cameraId: camera._id,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });
    // Generate filename: YYYYMMDDHHMM + sequential number (e.g., 20260115143001)
    const imageNumber = String(count + 1).padStart(2, "0");
    const filename = `${dateStr}${timeStr}${imageNumber}.jpg`;
    const filePath = path.join(folder, filename);
    const url = `/images/${camera._id}/${filename}`;

    const cmd = `ffmpeg -y -i "${camera.rtmpPath}" -frames:v 1 -q:v 2 "${filePath}"`;

    exec(cmd, async (error) => {
      if (error) {
        console.error(`❌ ${camera._id}: ${error.message}`);
      } else {
        await Snapshot.create({ cameraId: camera._id, imagePath: filePath, url });
        console.log(`📸 Saved snapshot for camera ${camera._id}: ${filename}`);
      }
    });
  } catch (err) {
    console.error("Error capturing snapshot:", err.message);
  }
};

// ✅ Capture all camera snapshots
export const captureAllSnapshots = async (req, res) => {
  try {
    const { data: cameras } = await axios.get(process.env.CAMERA_API);
    for (const cam of cameras) {
      if (cam.rtmpPath) await captureSnapshot(cam);
    }
    res.json({ message: "Snapshot capture started for all cameras" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get snapshots by camera + date range
export const getSnapshots = async (req, res) => {
  try {
    const { cameraId } = req.params;
    const { from, to, date } = req.query;

    const query = { cameraId };

    // If a date range is provided, use it; otherwise default to a single day (today or the provided date)
    if (from || to) {
      if (!from || !to) {
        return res.status(400).json({ message: "Provide both 'from' and 'to' when using a range." });
      }
      query.createdAt = { $gte: new Date(from), $lte: new Date(to) };
    } else {
      const targetDate = date ? new Date(date) : new Date();
      if (Number.isNaN(targetDate.getTime())) {
        return res.status(400).json({ message: "Invalid 'date' value. Use YYYY-MM-DD." });
      }

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const snapshots = await Snapshot.find(query).sort({ createdAt: -1 });
    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Build a timelapse by sampling images per day within a date range
export const getTimelapse = async (req, res) => {
  try {
    const { cameraId } = req.params;
    const { range, perDay, timeFilter } = req.query;

    if (!range) {
      return res.status(400).json({
        message: "Provide valid range parameter",
      });
    }
    // Parse perDay, if not provided or invalid, return all frames
    const framesPerDay = perDay ? parseInt(perDay, 10) : null;
    if (framesPerDay !== null && (Number.isNaN(framesPerDay) || framesPerDay <= 0)) {
      return res.status(400).json({
        message: "perDay must be a positive number if provided",
      });
    }

    // Calculate date range based on the 'range' parameter
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    switch (range) {
      case "1day":
        // start is already today
        break;
      case "5days":
        start.setDate(start.getDate() - 4);
        break;
      case "15days":
        start.setDate(start.getDate() - 14);
        break;
      case "30days":
        start.setDate(start.getDate() - 29);
        break;
      case "3months":
        start.setMonth(start.getMonth() - 3);
        break;
      case "6months":
        start.setMonth(start.getMonth() - 6);
        break;
      case "1year":
        start.setFullYear(start.getFullYear() - 1);
        break;
      case "2years":
        start.setFullYear(start.getFullYear() - 2);
        break;
      case "3years":
        start.setFullYear(start.getFullYear() - 3);
        break;
      default:
        return res.status(400).json({
          message: "Invalid range. Use: 1day, 5days, 15days, 30days, 3months, 6months, 1year, 2years, 3years",
        });
    }

    // Parse time filter
    let startHour = 0;
    let endHour = 23;
    if (timeFilter) {
      switch (timeFilter) {
        case "8-5":
          startHour = 8;
          endHour = 17;
          break;
        case "6-6":
          startHour = 6;
          endHour = 18;
          break;
        case "24h":
          startHour = 0;
          endHour = 23;
          break;
        default:
          return res.status(400).json({
            message: "Invalid timeFilter. Use: 8-5, 6-6, 24h",
          });
      }
    }

    const snapshots = await Snapshot.find({
      cameraId,
      createdAt: { $gte: start, $lte: end },
    })
      .sort({ createdAt: 1 })
      .select("url createdAt");

    // Filter by time of day if specified
    const filteredSnapshots = timeFilter
      ? snapshots.filter((snap) => {
          const hour = snap.createdAt.getHours();
          return hour >= startHour && hour <= endHour;
        })
      : snapshots;

    // Group snapshots by calendar day to sample frames evenly
    const grouped = new Map();
    for (const snap of filteredSnapshots) {
      const dayKey = snap.createdAt.toISOString().slice(0, 10);
      if (!grouped.has(dayKey)) grouped.set(dayKey, []);
      grouped.get(dayKey).push(snap);
    }

    const days = [];
    for (const [dateKey, snaps] of grouped.entries()) {
      if (snaps.length === 0) continue;
      
      // If framesPerDay is not specified, return all frames
      if (framesPerDay === null || snaps.length <= framesPerDay) {
        days.push({
          date: dateKey,
          frames: snaps.map((s) => ({ url: s.url, createdAt: s.createdAt })),
        });
        continue;
      }

      // Evenly sample across the day while always including first/last frame
      const step = framesPerDay === 1 ? 0 : (snaps.length - 1) / (framesPerDay - 1);
      const sampled = [];
      for (let i = 0; i < framesPerDay; i += 1) {
        const idx = Math.round(i * step);
        sampled.push(snaps[idx]);
      }

      days.push({
        date: dateKey,
        frames: sampled.map((s) => ({ url: s.url, createdAt: s.createdAt })),
      });
    }

    res.status(200).json({
      success: true,
      cameraId,
      range,
      timeFilter: timeFilter || "24h",
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      perDay: framesPerDay || "all",
      days,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get dates (and counts) that have images for a camera
export const getSnapshotDates = async (req, res) => {
  try {
    const { cameraId } = req.params;

    const results = await Snapshot.aggregate([
      { $match: { cameraId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const dates = results.map((r) => ({ date: r._id, count: r.count }));

    res.status(200).json({ success: true, cameraId, dates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get latest image for a camera
export const getLatestImage = async (req, res) => {
  try {
    const { id } = req.params;
    const folder = path.join(baseDir, id);

    // Check if folder exists
    if (!fs.existsSync(folder)) {
      return res.status(404).json({
        success: false,
        message: "No images found for this camera",
      });
    }

    // Read all files in the folder
    const files = fs.readdirSync(folder).filter((file) => file.endsWith(".jpg"));

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No images found in folder",
      });
    }

    // Sort files by name (descending) to get the latest
    files.sort().reverse();
    const latestFile = files[0];
    const latestImageUrl = `/images/${id}/${latestFile}`;

    res.status(200).json({
      success: true,
      image: {
        filename: latestFile,
        url: latestImageUrl,
        cameraId: id,
      },
    });
  } catch (err) {
    console.error("Error getting latest image:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
