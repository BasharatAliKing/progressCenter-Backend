import express from "express";
import {
  createAqi,
  getAllAqi,
  getAqiById,
  updateAqi,
  deleteAqi,
} from "../controllers/aqiController.js";

const router = express.Router();

// Create AQI
router.post("/aqi", createAqi);

// Get all AQI
router.get("/aqi", getAllAqi);

// Get AQI by ID
router.get("/aqi/:id", getAqiById);

// Update AQI by ID
router.put("/aqi/:id", updateAqi);

// Delete AQI by ID
router.delete("/aqi/:id", deleteAqi);

export default router;
