import mongoose from "mongoose";

//  Schema here
const sideBySideVideoSchema = new mongoose.Schema({
    project_name: { type: String, required: true },
    videoUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const sideBySideVideo = new  mongoose.model("SideBySideVideo", sideBySideVideoSchema);
export default sideBySideVideo;
