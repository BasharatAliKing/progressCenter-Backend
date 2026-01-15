import mongoose from "mongoose";

const cameraSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rtmpPath: { type: String, required: true },
    status: { type: String, default: "inactive" },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    }, 
    location: { type: String },
    city: { type: String },
    image: { type: String }, // saved path: /images/xxxx.jpg
    aqi_api_key: { type: String },
    // Hikvision integration fields
    hikvisionDeviceSerial: { type: String }, // Device serial number (e.g., "FC9147667")
    hikvisionResourceId: { type: String }, // Camera resource ID from Hikvision
    hikvisionEnabled: { type: Boolean, default: false }, // Whether to auto-update stream URL
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // assuming you have a User model
      },
    ],
  },
  { timestamps: true }
);

const Camera = mongoose.model("Camera", cameraSchema);

export default Camera;
