import mongoose from "mongoose";

const snapshotSchema = new mongoose.Schema({
  cameraId: { type: String, required: true },
  imagePath: { type: String, required: true },
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Snapshot", snapshotSchema);

