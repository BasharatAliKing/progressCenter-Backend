import express from "express";
import {
  renewStreamUrls,
  initializeHikvisionCameras,
} from "../jobs/streamRenew.job.js";
import Camera from "../models/cameraModel.js";

const router = express.Router();

/**
 * POST /api/hikvision/initialize
 * Initialize Hikvision cameras - discovers cameras from Hikvision API and adds them to database
 */
router.post("/hikvision/initialize", async (req, res) => {
  try {
    await initializeHikvisionCameras();
    res.status(200).json({
      success: true,
      message: "Hikvision cameras initialized successfully",
    });
  } catch (error) {
    console.error("Error initializing Hikvision:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/hikvision/renew
 * Manually trigger stream URL renewal for all Hikvision-enabled cameras
 */
router.post("/hikvision/renew", async (req, res) => {
  try {
    await renewStreamUrls();
    res.status(200).json({
      success: true,
      message: "Stream URLs renewed successfully",
    });
  } catch (error) {
    console.error("Error renewing streams:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/hikvision/camera/:id/enable
 * Enable Hikvision auto-renewal for a specific camera
 * Body: { deviceSerial: "FC9147667", resourceId: "ad52c2efccd64193a51594a44feaa160" }
 */
router.patch("/hikvision/camera/:id/enable", async (req, res) => {
  try {
    const { deviceSerial, resourceId } = req.body;

    if (!deviceSerial || !resourceId) {
      return res.status(400).json({
        success: false,
        message: "deviceSerial and resourceId are required",
      });
    }

    const camera = await Camera.findByIdAndUpdate(
      req.params.id,
      {
        hikvisionDeviceSerial: deviceSerial,
        hikvisionResourceId: resourceId,
        hikvisionEnabled: true,
      },
      { new: true }
    );

    if (!camera) {
      return res.status(404).json({
        success: false,
        message: "Camera not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Hikvision integration enabled for camera",
      camera,
    });
  } catch (error) {
    console.error("Error enabling Hikvision:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/hikvision/camera/:id/disable
 * Disable Hikvision auto-renewal for a specific camera
 */
router.patch("/hikvision/camera/:id/disable", async (req, res) => {
  try {
    const camera = await Camera.findByIdAndUpdate(
      req.params.id,
      { hikvisionEnabled: false },
      { new: true }
    );

    if (!camera) {
      return res.status(404).json({
        success: false,
        message: "Camera not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Hikvision integration disabled for camera",
      camera,
    });
  } catch (error) {
    console.error("Error disabling Hikvision:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/hikvision/status
 * Get status of all Hikvision-enabled cameras
 */
router.get("/hikvision/status", async (req, res) => {
  try {
    const cameras = await Camera.find({ hikvisionEnabled: true }).select(
      "name rtmpPath hikvisionDeviceSerial hikvisionResourceId status updatedAt"
    );

    res.status(200).json({
      success: true,
      count: cameras.length,
      cameras,
    });
  } catch (error) {
    console.error("Error getting status:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
