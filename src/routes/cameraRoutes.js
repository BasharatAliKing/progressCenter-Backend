import express from "express";
import multer from "multer";
import path from "path";
import {
  addCamera,
  getCameras,
  getCameraById,
  updateCamera,
  deleteCamera,
 getCameraLiveView
} from "../controllers/cameraController.js";

const router = express.Router();

// 🔧 Setup Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images"); // save to /public/images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  },
});

const upload = multer({ storage });

// Routes
router.post("/camera", upload.single("image"), addCamera); // upload one image
router.get("/camera", getCameras);
router.get("/camera/:id", getCameraById);
router.put("/camera/:id", upload.single("image"), updateCamera);
router.delete("/camera/:id", deleteCamera);
router.get("/camera/:id/live", getCameraLiveView);

export default router;
