import Plugin from "../models/pluginModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new plugin
export const createPlugin = async (req, res) => {
  try {
    const { heading, para, status } = req.body;

    // Check if image is uploaded
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const imgPath = `/images/plugins/${req.file.filename}`;

    const newPlugin = new Plugin({
      img: imgPath,
      heading,
      para,
      status: status || "active",
    });

    await newPlugin.save();
    res.status(201).json({
      message: "Plugin created successfully",
      plugin: newPlugin,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all plugins
export const getAllPlugins = async (req, res) => {
  try {
    const plugins = await Plugin.find().sort({ createdAt: -1 });
    if (!plugins || plugins.length === 0) {
      return res.status(404).json({ message: "No plugins found" });
    }
    res.status(200).json({
      message: "Plugins retrieved successfully",
      plugins,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get plugin by ID
export const getPluginById = async (req, res) => {
  try {
    const { id } = req.params;
    const plugin = await Plugin.findById(id);
    if (!plugin) {
      return res.status(404).json({ message: "Plugin not found" });
    }
    res.status(200).json({
      message: "Plugin retrieved successfully",
      plugin,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update plugin
export const updatePlugin = async (req, res) => {
  try {
    const { id } = req.params;
    const { heading, para, status } = req.body;

    const plugin = await Plugin.findById(id);
    if (!plugin) {
      return res.status(404).json({ message: "Plugin not found" });
    }

    // If new image is uploaded, delete old image and update
    if (req.file) {
      // Delete old image
      const oldImagePath = path.join(__dirname, "../../public", plugin.img);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      plugin.img = `/images/plugins/${req.file.filename}`;
    }

    // Update fields
    if (heading) plugin.heading = heading;
    if (para) plugin.para = para;
    if (status) plugin.status = status;

    await plugin.save();
    res.status(200).json({
      message: "Plugin updated successfully",
      plugin,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete plugin
export const deletePlugin = async (req, res) => {
  try {
    const { id } = req.params;
    const plugin = await Plugin.findById(id);
    
    if (!plugin) {
      return res.status(404).json({ message: "Plugin not found" });
    }

    // Delete image file
    const imagePath = path.join(__dirname, "../../public", plugin.img);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Plugin.findByIdAndDelete(id);
    res.status(200).json({ message: "Plugin deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
