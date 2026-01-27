import express from "express";
import {
  captureAllSnapshots,
  getSnapshots,
  getSnapshotDates,
  getLatestImage,
  getTimelapse,
  createTimelapseVideo,
  getUserVideos,
  getVideoById,
  deleteVideo,
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

// Create timelapse video from images
// POST /api/snapshots/:cameraId/timelapse/video
// Body: { range, perDay?, timeFilter?, username, userId, fps? }
router.post("/:cameraId/timelapse/video", createTimelapseVideo);

// Get all videos for a user
// GET /api/snapshots/videos/user/:userId?cameraId=xxx
router.get("/videos/user/:userId", getUserVideos);

// Get video by ID
// GET /api/snapshots/videos/:videoId
router.get("/videos/:videoId", getVideoById);

// Delete video
// DELETE /api/snapshots/videos/:videoId
router.delete("/videos/:videoId", deleteVideo);

// Get snapshots by cameraId + date range
router.get("/camera/:cameraId", getSnapshots);
router.get("/:cameraId", getSnapshots);

export default router;
