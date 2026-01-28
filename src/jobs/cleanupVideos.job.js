import Video from "../models/videoModel.js";
import fs from "fs";

export const cleanupOldVideos = async () => {
  try {
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find videos older than 7 days
    const oldVideos = await Video.find({
      createdAt: { $lt: sevenDaysAgo },
    });

    if (oldVideos.length === 0) {
      console.log("🧹 No old videos to cleanup");
      return;
    }

    let deletedCount = 0;
    let errorCount = 0;

    for (const video of oldVideos) {
      try {
        // Delete video file if it exists
        if (fs.existsSync(video.videoPath)) {
          fs.unlinkSync(video.videoPath);
          console.log(`🗑️  Deleted video file: ${video.videoPath}`);
        }

        // Delete from database
        await Video.findByIdAndDelete(video._id);
        deletedCount++;
      } catch (err) {
        console.error(`❌ Error deleting video ${video._id}:`, err.message);
        errorCount++;
      }
    }

    console.log(
      `✅ Video cleanup completed: ${deletedCount} deleted, ${errorCount} errors`
    );
  } catch (err) {
    console.error("❌ Error in video cleanup job:", err.message);
  }
};
 