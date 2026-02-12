import Aqi from "../models/aqiModel.js";

// Create a new AQI entry
export const createAqi = async (req, res) => {
  try {
    const aqi = await Aqi.create(req.body);
    res.status(201).json({
      success: true,
      message: "AQI created successfully",
      aqi,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all AQI entries
export const getAllAqi = async (req, res) => {
  try {
    const aqiList = await Aqi.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, aqi: aqiList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get AQI by ID
export const getAqiById = async (req, res) => {
  try {
    const aqi = await Aqi.findById(req.params.id);
    if (!aqi) {
      return res.status(404).json({ success: false, message: "AQI not found" });
    }
    res.status(200).json({ success: true, aqi });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update AQI by ID
export const updateAqi = async (req, res) => {
  try {
    const aqi = await Aqi.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!aqi) {
      return res.status(404).json({ success: false, message: "AQI not found" });
    }
    res.status(200).json({
      success: true,
      message: "AQI updated successfully",
      aqi,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete AQI by ID
export const deleteAqi = async (req, res) => {
  try {
    const aqi = await Aqi.findByIdAndDelete(req.params.id);
    if (!aqi) {
      return res.status(404).json({ success: false, message: "AQI not found" });
    }
    res.status(200).json({ success: true, message: "AQI deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
