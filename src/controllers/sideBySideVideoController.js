import sideBySideVideo from "../models/sideBySideVideoModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildPublicPath = (videoUrl) => {
  const normalizedUrl = videoUrl.startsWith("/")
    ? videoUrl.slice(1)
    : videoUrl;
  return path.join(__dirname, "../../public", normalizedUrl);
};

const isLocalSideBySideVideo = (videoUrl) => {
  return (
    typeof videoUrl === "string" &&
    videoUrl.startsWith("/videos/side-by-side/")
  );
};



// ✅ CREATE
export const createSideBySideVideo = async (req, res) => {
  try {
    const { project_name, videoUrl, video_date } = req.body;

    let uploadedFile = req.file;
    if (!uploadedFile && req.files && req.files.length > 0) {
      uploadedFile = req.files[0];
    }

    const fileUrl = uploadedFile
      ? `/videos/side-by-side/${uploadedFile.filename}`
      : videoUrl;

    if (!project_name || !fileUrl || !video_date) {
      return res.status(400).json({
        message: "project_name, video and video_date are required",
      });
    }

    const newVideo = new sideBySideVideo({
      project_name,
      videoUrl: fileUrl,
      video_date,   // ✅ added
    });

    await newVideo.save();

    res.status(201).json({
      message: "Side-by-side video created",
      video: newVideo,
    });
  } catch (error) {
    console.error("Error creating side-by-side video:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



// ✅ GET ALL
export const getAllSideBySideVideos = async (req, res) => {
  try {
    const videos = await sideBySideVideo
      .find()
      .sort({ createdAt: -1 });

    res.status(200).json({ message: "Side-by-side videos fetched", videos });
  } catch (error) {
    console.error("Error fetching side-by-side videos:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



// ✅ GET BY ID
export const getSideBySideVideoById = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await sideBySideVideo.findById(id);

    if (!video) {
      return res.status(404).json({
        message: "Side-by-side video not found",
      });
    }

    res.status(200).json({messaage:"Side-by-side video fetched", video});
  } catch (error) {
    console.error("Error fetching side-by-side video:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



// ✅ UPDATE
export const updateSideBySideVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { project_name, videoUrl, video_date } = req.body;

    const existingVideo = await sideBySideVideo.findById(id);

    if (!existingVideo) {
      return res.status(404).json({
        message: "Side-by-side video not found",
      });
    }

    let uploadedFile = req.file;
    if (!uploadedFile && req.files && req.files.length > 0) {
      uploadedFile = req.files[0];
    }

    let nextVideoUrl = videoUrl || existingVideo.videoUrl;

    if (uploadedFile) {
      nextVideoUrl = `/videos/side-by-side/${uploadedFile.filename}`;
    }

    const updatedVideo = await sideBySideVideo.findByIdAndUpdate(
      id,
      {
        project_name: project_name || existingVideo.project_name,
        videoUrl: nextVideoUrl,
        video_date: video_date || existingVideo.video_date,  // ✅ added
      },
      { new: true }
    );

    // Delete old file if new uploaded
    if (uploadedFile && isLocalSideBySideVideo(existingVideo.videoUrl)) {
      const oldFilePath = buildPublicPath(existingVideo.videoUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    res.status(200).json({
      message: "Side-by-side video updated",
      video: updatedVideo,
    });
  } catch (error) {
    console.error("Error updating side-by-side video:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



// ✅ DELETE
export const deleteSideBySideVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedVideo = await sideBySideVideo.findByIdAndDelete(id);

    if (!deletedVideo) {
      return res.status(404).json({
        message: "Side-by-side video not found",
      });
    }

    if (isLocalSideBySideVideo(deletedVideo.videoUrl)) {
      const filePath = buildPublicPath(deletedVideo.videoUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(200).json({
      message: "Side-by-side video deleted",
    });
  } catch (error) {
    console.error("Error deleting side-by-side video:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSideBySideVideosByDate = async (req, res) => {
  try {
    const { date } = req.params;
    if (!date) {
      return res.status(400).json({
        message: "Date query parameter is required",
      });
    }
    const videos = await sideBySideVideo.find({ video_date: date }).sort({ createdAt: -1 });
    res.status(200).json({ message: "Side-by-side videos fetched", videos });
  } catch (error) {
    console.error("Error fetching videos by date:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// ✅ Export
export default {
  createSideBySideVideo,
  getAllSideBySideVideos,
  getSideBySideVideoById,
  deleteSideBySideVideo,
  getSideBySideVideosByDate,   // ✅ added
  updateSideBySideVideo,
};