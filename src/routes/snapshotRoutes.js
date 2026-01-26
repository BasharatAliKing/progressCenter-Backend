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
//GET /api/snapshots/:cameraId/timelapse?range=1day&timeFilter=8-5
// Returns ALL snapshots from 8am-5pm today
//GET /api/snapshots/:cameraId/timelapse?range=30days&perDay=5
// Returns 5 sampled snapshots per day for the last 30 days
router.get("/camera/:cameraId/timelapse", getTimelapse);
router.get("/:cameraId/timelapse", getTimelapse);

// Get snapshots by cameraId + date range
router.get("/camera/:cameraId", getSnapshots);
router.get("/:cameraId", getSnapshots);

export default router;
