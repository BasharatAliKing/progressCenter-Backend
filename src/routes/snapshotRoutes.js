import express from "express";
import {
  captureAllSnapshots,
  getSnapshots,
  getSnapshotDates,
  getLatestImage,
  getTimelapse,
} from "../controllers/snapshotController.js";

const router = express.Router();

// Manual trigger for snapshots
router.get("/capture", captureAllSnapshots);

// Get latest image for a camera
router.get("/latest/:id", getLatestImage);

// Get dates that have snapshots for a camera
router.get("/camera/:cameraId/dates", getSnapshotDates);

// Get timelapse frames for a camera across a date range
router.get("/camera/:cameraId/timelapse", getTimelapse);

// Get snapshots by cameraId + date range
router.get("/camera/:cameraId", getSnapshots);
router.get("/:cameraId", getSnapshots);

export default router;
