import express from 'express';
import  mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        },
        designation:{
            type:String,
            default:"",
            required:true,
        },
        email:{
            type:String,
            required:true,
            unique:true,
        },
        password:{
            type:String,
            required:true,
        },
        role:{
            type:String,
            enum:["admin","editor","viewer"],
            default:"viewer",
        },
        invitedBy:{
            type:String,
            default:null,
        },
        lastActive:{
            type:Date,
            default:Date.now,
        },
        status:{
            type:String,
            enum:["active","inactive","banned"],
            default:"active",
        },
        cameras:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Camera",
            }
        ],
        createdAt:{
            type:Date,
            default:Date.now,
        },

});

// model here

const User= mongoose.model("User",userSchema);


export default User;