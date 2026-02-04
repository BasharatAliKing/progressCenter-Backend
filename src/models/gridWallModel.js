import express from "express";
import mongoose from "mongoose";

// Schema Here
const GridWallSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    layout:{
        type:String,
        required:true,
        enum:["1","2","3","4"]
    },
    showDateTime:{
        type:Boolean,
        default:false,
    },
    showProjectName:{
        type:Boolean,
        default:false,
    },
    showCameraName:{
        type:Boolean,
        default:false,
    },
    createdBy:{
        type:String,
        required:true,
    },
    creatorId:{
        type:String,
        required:true,
    },
    status:{
        type:String,
        enum:["active","inactive"],
        default:"active",
    },
    createdAt:{
        type:Date,
        default:Date.now,
    }
});

// model here 
const GridWall = mongoose.model("GridWall",GridWallSchema);

export default GridWall;