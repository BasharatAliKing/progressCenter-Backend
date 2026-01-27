import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  cameraId: { type: String, required: true },
  username: { type: String, required: true },
  userId: { type: String, required: true },
  videoPath: { type: String, required: true },
  url: { type: String, required: true },
  duration: { type: Number }, // in seconds
  frameCount: { type: Number },
  range: { type: String }, // e.g., "1day", "30days"
  timeFilter: { type: String }, // e.g., "8-5", "24h"
  perDay: { type: Number }, // frames per day
  quality: { type: String, default: "1080p" }, // video quality: 720p, 1080p
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Video", videoSchema);
