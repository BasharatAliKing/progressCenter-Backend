import express from "express";
import {
  captureAllSnapshots,
  getSnapshots,
} from "../controllers/snapshotController.js";

const router = express.Router();

// Manual trigger for snapshots
router.get("/capture", captureAllSnapshots);

// Get snapshots by cameraId + date range
router.get("/:cameraId", getSnapshots);

export default router;
