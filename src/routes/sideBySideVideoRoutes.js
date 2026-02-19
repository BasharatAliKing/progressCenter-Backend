import express from "express";
import {
	createSideBySideVideo,
	getAllSideBySideVideos,
	getSideBySideVideoById,
	updateSideBySideVideo,
	deleteSideBySideVideo,
} from "../controllers/sideBySideVideoController.js";
import { sideBySideVideoUploadFlexible, handleVideoUploadError } from "../middleware/upload.js";

const router = express.Router();

// Create a new side-by-side video
router.post("/side-by-side-videos", sideBySideVideoUploadFlexible, handleVideoUploadError, createSideBySideVideo);

// Get all side-by-side videos
router.get("/side-by-side-videos", getAllSideBySideVideos);

// Get a side-by-side video by ID
router.get("/side-by-side-videos/:id", getSideBySideVideoById);

// Update a side-by-side video by ID
router.put("/side-by-side-videos/:id", sideBySideVideoUploadFlexible, handleVideoUploadError, updateSideBySideVideo);

// Delete a side-by-side video by ID
router.delete("/side-by-side-videos/:id", deleteSideBySideVideo);

export default router;

