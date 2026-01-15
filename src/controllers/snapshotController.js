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
    const { from, to } = req.query;

    const query = { cameraId };
    if (from && to) {
      query.createdAt = { $gte: new Date(from), $lte: new Date(to) };
    }

    const snapshots = await Snapshot.find(query).sort({ createdAt: -1 });
    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
