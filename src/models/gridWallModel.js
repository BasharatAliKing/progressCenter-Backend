import express from "express";
import mongoose from "mongoose";

const getRequiredSlots = (layout) => {
    const layoutToSlots = {
        "1": 2,
        "2": 4,
        "3": 9,
        "4": 16,
    };
    return layoutToSlots[layout];
};

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
    cameraIds:{
        type:[String],
        default:function(){
            const requiredSlots = getRequiredSlots(this.layout);
            return requiredSlots ? new Array(requiredSlots).fill(null) : [];
        },
        validate:{
            validator:function(value){
                const requiredSlots = getRequiredSlots(this.layout);
                if (!requiredSlots) {
                    return false;
                }
                return Array.isArray(value) && value.length === requiredSlots;
            },
            message:props => `cameraIds must have exactly ${getRequiredSlots(props.instance?.layout)} values for layout ${props.instance?.layout}`,
        },
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