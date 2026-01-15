import express from "express";
import {
  captureAllSnapshots,
  getSnapshots,
  getLatestImage,
} from "../controllers/snapshotController.js";

const router = express.Router();

// Manual trigger for snapshots
router.get("/capture", captureAllSnapshots);

// Get latest image for a camera
router.get("/latest/:id", getLatestImage);

// Get snapshots by cameraId + date range
router.get("/:cameraId", getSnapshots);

export default router;
