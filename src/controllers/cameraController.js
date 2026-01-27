import Camera from "../models/cameraModel.js";
import axios from "axios";
// ✅ Add new camera with image upload
export const addCamera = async (req, res) => {
  try {
    const { name, rtmpPath, status, coordinates, location, city, members ,aqi_api_key ,hikvisionDeviceSerial, hikvisionResourceId } =
      req.body;
    const image = req.file ? `/images/${req.file.filename}` : null;
    const newCamera = new Camera({
      name,
      rtmpPath,
      status,
      coordinates: JSON.parse(coordinates),
      location,
      city,
      image,
      aqi_api_key,
      hikvisionDeviceSerial,
      hikvisionResourceId,
      members: members ? JSON.parse(members) : [],
    });

    await newCamera.save();
    res.status(201).json({
      success: true,
      message: "Camera added and registered with MediaMTX",
      camera: newCamera,
    });
  } catch (error) {
    console.error("Error adding camera:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// ✅ Get all cameras
export const getCameras = async (req, res) => {
  try {
    // 1️⃣ Fetch all cameras from MongoDB
    const cameras = await Camera.find();

    // 2️⃣ Optional: Include AQI data if requested (default: skip for speed)
    const includeAQI = req.query.includeAQI === 'true';

    if (!includeAQI) {
      // Fast response without AQI data
      return res.status(200).json({
        success: true,
        cameras: cameras.map(cam => ({
          ...cam.toObject(),
          aqiData: null,
        })),
      });
    }

    // 3️⃣ Fetch AQI data with timeout (only if requested)
    const camerasWithAQI = await Promise.all(
      cameras.map(async (camera) => {
        if (camera.aqi_api_key) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2000); // 2 second timeout

            const response = await fetch(camera.aqi_api_key, {
              signal: controller.signal
            });
            clearTimeout(timeout);
            
            const aqiData = await response.json();

            return {
              ...camera.toObject(),
              aqiData,
            };
          } catch (err) {
            console.error(`AQI fetch failed for ${camera.name}:`, err.message);
            return {
              ...camera.toObject(),
              aqiData: null,
            };
          }
        } else {
          return {
            ...camera.toObject(),
            aqiData: null,
          };
        }
      })
    );
    
    // 4️⃣ Send combined result
    res.status(200).json({
      success: true,
      cameras: camerasWithAQI,
    });
  } catch (error) {
    console.error("Error fetching cameras:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
// ✅ Get single camera
export const getCameraById = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    if (!camera)
      return res
        .status(404)
        .json({ success: false, message: "Camera not found" });
    res.status(200).json({ success: true, camera });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Update camera
export const updateCamera = async (req, res) => {
  try {
    const updates = req.body;
    if (req.file) updates.image = `/images/${req.file.filename}`;
    const camera = await Camera.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!camera)
      return res
        .status(404)
        .json({ success: false, message: "Camera not found" });
    res.status(200).json({ success: true, message: "Camera updated", camera });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Delete camera
export const deleteCamera = async (req, res) => {
  try {
    const camera = await Camera.findByIdAndDelete(req.params.id);
    if (!camera)
      return res
        .status(404)
        .json({ success: false, message: "Camera not found" });
    res.status(200).json({ success: true, message: "Camera deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Get live view HLS link for a camera
export const getCameraLiveView = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    if (!camera)
      return res.status(404).json({ success: false, message: "Camera not found" });

    // The stream name should match the path configured in MediaMTX (e.g., camera._id)
    const streamName = camera._id.toString();
    // Adjust host/port if MediaMTX runs elsewhere
    const hlsUrl = `http://localhost:8888/${streamName}/index.m3u8`;

    res.status(200).json({
      success: true,
      hlsUrl,
      cameraInfo: {
        name: camera.name,
        status: camera.status,
        location: camera.location,
        city: camera.city,
        image: camera.image,
        members: camera.members,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
