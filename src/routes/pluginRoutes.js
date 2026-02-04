import express from "express";
import {
  createPlugin,
  getAllPlugins,
  getPluginById,
  updatePlugin,
  deletePlugin,
} from "../controllers/pluginController.js";
import { pluginUpload } from "../middleware/upload.js";

const router = express.Router();

// Create plugin (with image upload)
router.post("/plugins", pluginUpload.single("img"), createPlugin);

// Get all plugins
router.get("/plugins", getAllPlugins);

// Get plugin by ID
router.get("/plugins/:id", getPluginById);

// Update plugin (with optional image upload)
router.put("/plugins/:id", pluginUpload.single("img"), updatePlugin);

// Delete plugin
router.delete("/plugins/:id", deletePlugin);

export default router;
