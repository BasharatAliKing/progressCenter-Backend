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

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `snapshot-${timestamp}.jpg`;
    const filePath = path.join(folder, filename);
    const url = `/images/${camera._id}/${filename}`;

    const cmd = `ffmpeg -y -i "${camera.rtmpPath}" -frames:v 1 -q:v 2 "${filePath}"`;

    exec(cmd, async (error) => {
      if (error) {
        console.error(`❌ ${camera._id}: ${error.message}`);
      } else {
        await Snapshot.create({ cameraId: camera._id, imagePath: filePath, url });
        console.log(`📸 Saved snapshot for camera ${camera._id}`);
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
