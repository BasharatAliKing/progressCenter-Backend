import express from 'express';
import {
    createGridWall,
    getAllGridWalls,
    getGridWallById,
    updateGridWall,
    deleteGridWall
} from '../controllers/gridWallController.js';
const router = express.Router();
// Create a new grid wall configuration
router.post('/', createGridWall);
// Get all grid wall configurations
router.get('/', getAllGridWalls);
// Get a specific grid wall configuration by ID
router.get('/:id', getGridWallById);
// Update a grid wall configuration by ID
router.put('/:id', updateGridWall);
// delete route can be added here in future if needed
router.delete('/:id', deleteGridWall); 

export default router;