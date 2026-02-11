import express from "express";
import GridWall from "../models/gridWallModel.js";

const getRequiredSlots = (layout) => {
  const layoutToSlots = {
    "1": 2,
    "2": 4,
    "3": 9,
    "4": 16,
  };
  return layoutToSlots[layout];
};

const normalizeCameraIds = (layout, cameraIds) => {
  const requiredSlots = getRequiredSlots(layout);
  if (!requiredSlots) {
    return { error: "Invalid layout value" };
  }

  if (cameraIds === undefined) {
    return { cameraIds: new Array(requiredSlots).fill(null) };
  }

  if (!Array.isArray(cameraIds)) {
    return { error: "cameraIds must be an array" };
  }

  if (cameraIds.length !== requiredSlots) {
    return {
      error: `cameraIds must have exactly ${requiredSlots} values for layout ${layout}`,
    };
  }

  return { cameraIds };
};

// Create a new grid wall configuration
export const createGridWall = async (req, res) => {
  try {
    const {
      name,
      layout,
      showDateTime,
      showProjectName,
      showCameraName,
      cameraIds,
      createdBy,
      creatorId,
    } = req.body;

    const cameraIdsResult = normalizeCameraIds(layout, cameraIds);
    if (cameraIdsResult.error) {
      return res
        .status(400)
        .json({ success: false, message: cameraIdsResult.error });
    }

    const newGridWall = new GridWall({
      name,
      layout,
      showDateTime,
      showProjectName,
      showCameraName,
      cameraIds: cameraIdsResult.cameraIds,
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
    const existingGridWall = await GridWall.findById(id);
    if (!existingGridWall) {
      return res
        .status(404)
        .json({ success: false, message: "Grid wall not found" });
    }

    const nextLayout = updates.layout ?? existingGridWall.layout;
    const requiredSlots = getRequiredSlots(nextLayout);
    if (!requiredSlots) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid layout value" });
    }

    if (updates.cameraIds !== undefined) {
      const cameraIdsResult = normalizeCameraIds(nextLayout, updates.cameraIds);
      if (cameraIdsResult.error) {
        return res
          .status(400)
          .json({ success: false, message: cameraIdsResult.error });
      }
      updates.cameraIds = cameraIdsResult.cameraIds;
    } else if (updates.layout !== undefined) {
      const currentCameraIds = Array.isArray(existingGridWall.cameraIds)
        ? existingGridWall.cameraIds
        : [];
      if (currentCameraIds.length === requiredSlots) {
        updates.cameraIds = currentCameraIds;
      } else if (currentCameraIds.length > requiredSlots) {
        updates.cameraIds = currentCameraIds.slice(0, requiredSlots);
      } else {
        updates.cameraIds = currentCameraIds.concat(
          new Array(requiredSlots - currentCameraIds.length).fill(null)
        );
      }
    }

    const updatedGridWall = await GridWall.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
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
