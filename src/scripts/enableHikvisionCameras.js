import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Camera from "../models/cameraModel.js";
import { getAccessToken } from "../services/hikvision.service.js";
import axios from "axios";

const HIKVISION_CONFIG = {
  baseUrl: "https://isgp-team.hikcentralconnect.com",
};

/**
 * Migration script to enable Hikvision auto-renewal for existing cameras
 * Fetches correct resource IDs from Hikvision API
 */

const enableHikvisionCameras = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Get all cameras with RTMP paths
    const cameras = await Camera.find({
      rtmpPath: { $exists: true, $ne: null }
    });

    console.log(`\n📹 Found ${cameras.length} camera(s) in database\n`);

    // Get token and fetch Hikvision cameras
    console.log("🔑 Fetching Hikvision camera data...");
    const token = await getAccessToken();
    
    const response = await axios.post(
      `${HIKVISION_CONFIG.baseUrl}/api/hccgw/resource/v1/cameras/get`,
      {
        pageIndex: 1,
        pageSize: 100,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Token: token,
        },
      }
    );

    if (response.data.errorCode !== "0" || !response.data.data?.camera) {
      console.log("⚠️  Could not fetch Hikvision cameras, using RTMP path extraction\n");
      
      // Fallback: Extract from RTMP paths
      let updatedCount = 0;
      for (const camera of cameras) {
        const match = camera.rtmpPath.match(/openlive\/([A-Z0-9]+)_(\d+)_(\d+)\?/);
        
        if (match) {
          const deviceSerial = match[1];
          const resourceId = `${deviceSerial}_${match[2]}_${match[3]}`;

          console.log(`🔧 Updating: ${camera.name}`);
          console.log(`   Device Serial: ${deviceSerial}`);
          console.log(`   Resource ID: ${resourceId} (extracted from URL)`);

          camera.hikvisionEnabled = true;
          camera.hikvisionDeviceSerial = deviceSerial;
          camera.hikvisionResourceId = resourceId;
          
          await camera.save();
          updatedCount++;
          console.log(`   ✅ Updated successfully\n`);
        }
      }
      
      console.log(`\n✨ Migration complete!`);
      console.log(`📊 Updated ${updatedCount} out of ${cameras.length} camera(s)\n`);
      process.exit(0);
      return;
    }

    // Use Hikvision API data
    const hikvisionCameras = response.data.data.camera;
    console.log(`✅ Found ${hikvisionCameras.length} camera(s) from Hikvision API\n`);

    let updatedCount = 0;

    for (const camera of cameras) {
      // Extract device serial from RTMP path
      const match = camera.rtmpPath.match(/openlive\/([A-Z0-9]+)_/);
      
      if (match) {
        const deviceSerial = match[1];
        
        // Find matching Hikvision camera
        const hikvisionCam = hikvisionCameras.find(
          hc => hc.device?.devInfo?.serialNo === deviceSerial
        );

        if (hikvisionCam) {
          console.log(`🔧 Updating: ${camera.name}`);
          console.log(`   Device Serial: ${deviceSerial}`);
          console.log(`   Resource ID: ${hikvisionCam.id} (from Hikvision API)`);
          console.log(`   Camera Name: ${hikvisionCam.name}`);

          camera.hikvisionEnabled = true;
          camera.hikvisionDeviceSerial = deviceSerial;
          camera.hikvisionResourceId = hikvisionCam.id; // Use correct ID from API
          
          await camera.save();
          updatedCount++;
          console.log(`   ✅ Updated successfully\n`);
        } else {
          console.log(`⚠️  No matching Hikvision camera found for: ${camera.name}`);
          console.log(`   Device Serial: ${deviceSerial}\n`);
        }
      } else {
        console.log(`⚠️  Could not parse RTMP path for: ${camera.name}\n`);
      }
    }

    console.log(`\n✨ Migration complete!`);
    console.log(`📊 Updated ${updatedCount} out of ${cameras.length} camera(s)\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

enableHikvisionCameras();
