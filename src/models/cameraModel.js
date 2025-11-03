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
    // members: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User", // assuming you have a User model
    //   },
    // ],
  },
  { timestamps: true }
);

const Camera = mongoose.model("Camera", cameraSchema);

export default Camera;
