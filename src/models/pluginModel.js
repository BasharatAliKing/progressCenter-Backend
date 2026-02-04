import mongoose from "mongoose";

const pluginSchema = new mongoose.Schema({
  img: {
    type: String,
    required: true,
  },
  heading: {
    type: String,
    required: true,
  },
  para: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
pluginSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Plugin = mongoose.model("Plugin", pluginSchema);

export default Plugin;
