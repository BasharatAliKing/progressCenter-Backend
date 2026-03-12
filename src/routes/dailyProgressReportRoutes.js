import express from "express";
import { progressPhotoUpload } from "../middleware/upload.js";
import {
  createDailyProgress,
  getAllDailyProgress,
  getDailyProgressById,
  updateDailyProgress,
  deleteDailyProgress,
} from "../controllers/dailyProgressReportController.js";

const router = express.Router();

router.post(
  "/",
  progressPhotoUpload.array("progressPhotos", 10),
  createDailyProgress,
);

router.get("/", getAllDailyProgress);

router.get("/:id", getDailyProgressById);

router.put(
  "/:id",
  progressPhotoUpload.array("progressPhotos", 10),
  updateDailyProgress,
);

router.delete("/:id", deleteDailyProgress);

export default router;
