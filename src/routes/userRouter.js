import express from "express";
import { register, login, getAllUsers, getUserById } from "../controllers/userController.js";
const router = express.Router();

// Register route
router.post("/register", register);
// login route
router.post("/login", login);
// Get all users route
router.get("/users", getAllUsers);
// Get user by ID route
router.get("/user/:id", getUserById);

export default router; 

