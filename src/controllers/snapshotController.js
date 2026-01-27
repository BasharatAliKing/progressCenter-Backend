import axios from "axios";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import Snapshot from "../models/snapshotModel.js";
import Video from "../models/videoModel.js";

ffmpeg.setFfmpegPath(ffmpegPath.path);

const __dirname = path.resolve();
const baseDir = path.join(__dirname, "public/images");
const videoDir = path.join(__dirname, "public/videos");
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

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

// ✅ Create timelapse video from images
export const createTimelapseVideo = async (req, res) => {
  try {
    const { cameraId } = req.params;
    const { range, perDay, timeFilter, username, userId, fps, frameDuration, quality } = req.body;

    if (!username || !userId) {
      return res.status(400).json({
        success: false,
        message: "username and userId are required",
      });
    }

    if (!range) {
      return res.status(400).json({
        success: false,
        message: "range parameter is required",
      });
    }

    // Parse parameters
    const framesPerDay = perDay ? parseInt(perDay, 10) : null;
    
    // Calculate FPS from frameDuration (seconds per frame) or use fps directly
    // frameDuration: 0.1 = 10 FPS, 0.5 = 2 FPS, 1 = 1 FPS
    let videoFps = 10; // default
    if (frameDuration) {
      const duration = parseFloat(frameDuration);
      if (duration > 0) {
        videoFps = Math.round(1 / duration);
      }
    } else if (fps) {
      videoFps = parseInt(fps, 10) || 10;
    }

    // Set video resolution based on quality
    let videoQuality = quality || "1080p"; // default to 1080p
    let resolution = "";
    let crfValue = 23; // default CRF
    
    switch (videoQuality) {
      case "720p":
        resolution = "1280:720";
        crfValue = 24; // Slightly lower quality for smaller size
        break;
      case "1080p":
        resolution = "1920:1080";
        crfValue = 23;
        break;
      default:
        resolution = "1920:1080";
        crfValue = 23;
        videoQuality = "1080p";
    }

    // Calculate date range
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    switch (range) {
      case "1day":
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
          success: false,
          message: "Invalid range",
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
            success: false,
            message: "Invalid timeFilter",
          });
      }
    }

    // Get snapshots
    const snapshots = await Snapshot.find({
      cameraId,
      createdAt: { $gte: start, $lte: end },
    })
      .sort({ createdAt: 1 })
      .select("imagePath url createdAt");

    // Filter by time of day
    const filteredSnapshots = timeFilter
      ? snapshots.filter((snap) => {
          const hour = snap.createdAt.getHours();
          return hour >= startHour && hour <= endHour;
        })
      : snapshots;

    // Group and sample snapshots by day
    const grouped = new Map();
    for (const snap of filteredSnapshots) {
      const dayKey = snap.createdAt.toISOString().slice(0, 10);
      if (!grouped.has(dayKey)) grouped.set(dayKey, []);
      grouped.get(dayKey).push(snap);
    }

    const allFrames = [];
    for (const [, snaps] of grouped.entries()) {
      if (snaps.length === 0) continue;

      if (framesPerDay === null || snaps.length <= framesPerDay) {
        allFrames.push(...snaps);
        continue;
      }

      const step = framesPerDay === 1 ? 0 : (snaps.length - 1) / (framesPerDay - 1);
      for (let i = 0; i < framesPerDay; i += 1) {
        const idx = Math.round(i * step);
        allFrames.push(snaps[idx]);
      }
    }

    if (allFrames.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No images found for the specified criteria",
      });
    }

    // Create temporary file list for ffmpeg
    const timestamp = Date.now();
    const fileListPath = path.join(videoDir, `filelist_${timestamp}.txt`);
    const videoFilename = `${cameraId}_${username}_${timestamp}.mp4`;
    const videoPath = path.join(videoDir, videoFilename);
    const videoUrl = `/videos/${videoFilename}`;

    // Write file list
    const fileListContent = allFrames
      .map((snap) => `file '${path.resolve(snap.imagePath)}'`)
      .join("\n");
    fs.writeFileSync(fileListPath, fileListContent);

    // Generate video using ffmpeg with optimized timelapse settings
    ffmpeg()
      .input(fileListPath)
      .inputOptions(["-f concat", "-safe 0", "-r 1"]) // Read images at 1 fps
      .outputOptions([
        `-r ${videoFps}`, // Output at desired fps
        `-vf scale=${resolution}:force_original_aspect_ratio=decrease,pad=${resolution}:(ow-iw)/2:(oh-ih)/2:black`, // Dynamic resolution with black padding
        "-c:v libx264", // H.264 codec
        "-preset medium", // Better quality/speed balance
        `-crf ${crfValue}`, // Constant Rate Factor (quality setting)
        "-pix_fmt yuv420p", // Compatibility format
        "-movflags +faststart", // Enable streaming (progressive download)
      ])
      .output(videoPath)
      .on("end", async () => {
        // Clean up file list
        fs.unlinkSync(fileListPath);

        // Get video duration
        ffmpeg.ffprobe(videoPath, async (err, metadata) => {
          const duration = err ? 0 : metadata.format.duration;

          // Save video metadata to database
          const video = await Video.create({
            cameraId,
            username,
            userId,
            videoPath,
            url: videoUrl,
            duration,
            frameCount: allFrames.length,
            range,
            timeFilter: timeFilter || "24h",
            perDay: framesPerDay,
            quality: videoQuality,
          });

          res.status(201).json({
            success: true,
            message: "Video created successfully",
            video: {
              id: video._id,
              cameraId: video.cameraId,
              username: video.username,
              userId: video.userId,
              url: video.url,
              duration: video.duration,
              frameCount: video.frameCount,
              range: video.range,
              timeFilter: video.timeFilter,
              perDay: video.perDay,
              quality: video.quality,
              createdAt: video.createdAt,
            },
          });
        });
      })
      .on("error", (err) => {
        console.error("Error creating video:", err);
        // Clean up file list
        if (fs.existsSync(fileListPath)) {
          fs.unlinkSync(fileListPath);
        }
        res.status(500).json({
          success: false,
          message: "Failed to create video",
          error: err.message,
        });
      })
      .run();
  } catch (err) {
    console.error("Error in createTimelapseVideo:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get all videos for a user
export const getUserVideos = async (req, res) => {
  try {
    const { userId } = req.params;
    const { cameraId } = req.query;

    const query = { userId };
    if (cameraId) {
      query.cameraId = cameraId;
    }

    const videos = await Video.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: videos.length,
      videos,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get video by ID
export const getVideoById = async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    res.status(200).json({
      success: true,
      video,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Delete video
export const deleteVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Delete video file
    if (fs.existsSync(video.videoPath)) {
      fs.unlinkSync(video.videoPath);
    }

    // Delete from database
    await Video.findByIdAndDelete(videoId);

    res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

