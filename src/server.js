// import dotenv from "dotenv";
// dotenv.config();
// import express from "express";
// import cors from "cors";
// import { spawn } from "child_process";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// app.use(cors());

// const PORT = process.env.PORT || 4000;

// // Launch MediaMTX automatically
// const exe = process.platform === "win32" ? "mediamtx.exe" : "./mediamtx";
// const configPath = path.join(__dirname, "../mediamtx.yml");

// console.log("🎬 Launching MediaMTX...");
// const mediamtx = spawn(exe, [configPath], { cwd: path.join(__dirname, "../") });

// mediamtx.stdout.on("data", (d) => console.log("MediaMTX:", d.toString().trim()));
// mediamtx.stderr.on("data", (d) => console.error("MediaMTX err:", d.toString().trim()));
// mediamtx.on("close", (code) => console.log("MediaMTX stopped:", code));

// app.get("/", (req, res) => res.send("✅ MediaMTX backend running"));
// app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));


import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import mongoose from "mongoose";
import cameraRoutes from "./routes/cameraRoutes.js";
const PORT = process.env.PORT || 4000;
import cron from "node-cron";
import { captureSnapshot } from "./controllers/snapshotController.js";
import snapshotRoutes from "./routes/snapshotRoutes.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use("/images", express.static("public/images"));
app.use("/api/snapshots", snapshotRoutes);
// 🕒 Cron job every 30 minutes
cron.schedule("*/30 * * * *", async () => {
  console.log(`⏱ Running snapshot job at ${new Date().toLocaleString()}`);
  try {
    const { data } = await axios.get(process.env.CAMERA_API);
     
    // ✅ Access actual camera array
    const cameras = data.cameras || [];
 
    for (const cam of cameras) {
      if (cam.rtmpPath) await captureSnapshot(cam);
    } 
  } catch (err) {
    console.error("❌ Error fetching cameras:", err.message);
  }
});

// ------------------------
// MongoDB connection
// ------------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));
 
// ------------------------
// Routes
// ------------------------
app.use("/api", cameraRoutes);

// ------------------------
// MediaMTX Launch
// ------------------------

// Set paths for MediaMTX binary and config
const exePath = process.platform === "win32"
  ? path.join(__dirname, "../mediamtx.exe") // put mediamtx.exe in project root
  : path.join(__dirname, "../mediamtx");   // Linux/macOS binary

const configPath = path.join(__dirname, "../mediamtx.yml"); // YAML in project root

// Spawn MediaMTX process
console.log("🎬 Launching MediaMTX...");
const mediamtx = spawn(exePath, [configPath], { cwd: path.join(__dirname, "..") });

mediamtx.stdout.on("data", (data) => console.log("MediaMTX:", data.toString().trim()));
mediamtx.stderr.on("data", (data) => console.error("MediaMTX err:", data.toString().trim()));
mediamtx.on("error", (err) => console.error("MediaMTX failed to start:", err));
mediamtx.on("close", (code) => console.log("MediaMTX stopped:", code));

// ------------------------
// Test route
// ------------------------
app.get("/", (req, res) => res.send("✅ MediaMTX backend running"));

// ------------------------
// Start server
// ------------------------
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));



