import express from "express";
import GridWall from "../models/gridWallModel.js";

// Create a new grid wall configuration
export const createGridWall = async (req, res) => {
  try {
    const {
      name,
      layout,
      showDateTime,
      showProjectName,
      showCameraName,
      createdBy,
      creatorId,
    } = req.body;
    const newGridWall = new GridWall({
      name,
      layout,
      showDateTime,
      showProjectName,
      showCameraName,
      createdBy,
      creatorId,
    });
    const savedGridWall = await newGridWall.save();
    res.status(201).json({ success: true, data: savedGridWall });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get all grid wall configurations
export const getAllGridWalls = async (req, res) => {
  try {
    const gridWalls = await GridWall.find();
    res.status(200).json({ success: true, data: gridWalls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get a specific grid wall configuration by ID
export const getGridWallById = async (req, res) => {
  try {
    const { id } = req.params;
    const gridWall = await GridWall.findById(id);
    if (!gridWall) {
      return res
        .status(404)
        .json({ success: false, message: "Grid wall not found" });
    }
    res.status(200).json({ success: true, data: gridWall });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Update a grid wall configuration by ID
export const updateGridWall = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedGridWall = await GridWall.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!updatedGridWall) {
      return res
        .status(404)
        .json({ success: false, message: "Grid wall not found" });
    }
    res.status(200).json({ success: true, data: updatedGridWall });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Delete a grid wall configuration by ID
export const deleteGridWall = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedGridWall = await GridWall.findByIdAndDelete(id);
    if (!deletedGridWall) {
      return res
        .status(404)
        .json({ success: false, message: "Grid wall not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Grid wall deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
