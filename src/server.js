import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const PORT = process.env.PORT || 4000;

// Launch MediaMTX automatically
const exe = process.platform === "win32" ? "mediamtx.exe" : "./mediamtx";
const configPath = path.join(__dirname, "../mediamtx.yml");

console.log("🎬 Launching MediaMTX...");
const mediamtx = spawn(exe, [configPath], { cwd: path.join(__dirname, "../") });

mediamtx.stdout.on("data", (d) => console.log("MediaMTX:", d.toString().trim()));
mediamtx.stderr.on("data", (d) => console.error("MediaMTX err:", d.toString().trim()));
mediamtx.on("close", (code) => console.log("MediaMTX stopped:", code));

app.get("/", (req, res) => res.send("✅ MediaMTX backend running"));
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

