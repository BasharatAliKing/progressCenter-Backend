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
import detailedScheduleRoutes from "./routes/detailedScheduleRoutes.js";
import hikvisionRoutes from "./routes/hikvisionRoutes.js";
import userRoutes from "./routes/userRouter.js";
import pluginRoutes from "./routes/pluginRoutes.js";
import sideBySideVideoRoutes from "./routes/sideBySideVideoRoutes.js";
const PORT = process.env.PORT || 4000;
import cron from "node-cron"; 
import { captureSnapshot } from "./controllers/snapshotController.js";
import snapshotRoutes from "./routes/snapshotRoutes.js";
import { renewStreamUrls } from "./jobs/streamRenew.job.js";
import { cleanupOldVideos } from "./jobs/cleanupVideos.job.js";
import gridwall from "./routes/gridWallRoutes.js";
import aqiRoutes from "./routes/aqiRoutes.js";
import dailyProgress from "./routes/dailyProgressReportRoutes.js";
import morgan from "morgan";  
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  "https://nespakprogresscenter.com",
  "https://api.nespakprogresscenter.com",
  "http://localhost:5173"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(morgan("dev")); 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use("/images", express.static("public/images"));
app.use("/videos", express.static("public/videos"));
app.use("/api/snapshots", snapshotRoutes);

// 🕒 Cron job every 30 minutes for snapshots
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

// 🔄 Cron job every 5 days at 11:55 PM to renew Hikvision stream URLs (PRODUCTION - URLs expire in 6 days)
cron.schedule("55 23 */1 * *", async () => {
  console.log(`🔄 Running stream URL renewal at ${new Date().toLocaleString()}`);
  try {
    await renewStreamUrls();
  } catch (err){
    console.error("❌ Stream renewal cron error:", err.message);
  }
});

// 🧹 Cron job every day at 2:00 AM to delete videos older than 7 days
cron.schedule("0 2 * * *", async () => {
  console.log(`🧹 Running video cleanup at ${new Date().toLocaleString()}`);
  try {
    await cleanupOldVideos();
  } catch (err) {
    console.error("❌ Video cleanup cron error:", err.message);
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
app.use("/api", detailedScheduleRoutes);
app.use("/api", hikvisionRoutes);
app.use("/api", userRoutes);
app.use("/api", pluginRoutes);
app.use("/api/gridwall", gridwall);
app.use("/api", aqiRoutes);
app.use("/api", sideBySideVideoRoutes);
app.use("/api/dailyprogress", dailyProgress);

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
