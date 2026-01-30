import  express from "express";
import dotenv from "dotenv"
dotenv.config();
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// 🔐 Generate Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// create User 
export const register = async (req, res) => {
  try {
    const { username, email, password, designation, role, invitedBy, cameras } = req.body;
    
    const existingUser = await User.findOne({email});
    if(existingUser){
        return res.status(400).json({message:"User Already Exists"});
    }
     // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new User({
      username,
      email,
      password:hashedPassword,
      designation: designation || "",
      role: role || "viewer",
      invitedBy: invitedBy || null,
      status: "active",
      cameras: cameras || [],
      lastActive: new Date()
    });
    await newUser.save();
    const token = generateToken(newUser._id);
    res
      .status(201)
      .json({ message: "User created successfully",
         token,user: newUser});
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

export const login =async(req,res)=>{
    try{
       const {email,password} = req.body;
       const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({message:"User not Found"});
        }
        const isPasswordValid = await bcrypt.compare(password,user.password);
        if(!isPasswordValid){
            return res.status(400).json({message:"Invalid Credentials"});
        }
        const token = generateToken(user._id);
        res.status(200).json({message:"Login Successful",token,user});
    }catch(err){
        res.status(500).json({message:err});
    }
}

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        if (!users || users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }
        res.status(200).json({ message: "Users retrieved successfully", users });
    } catch (err) {
        res.status(500).json({ message: err });
    }
}

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User retrieved successfully", user });
    } catch (err) {
        res.status(500).json({ message: err });
    }
}
