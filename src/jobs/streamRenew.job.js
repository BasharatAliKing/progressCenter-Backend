import Camera from "../models/cameraModel.js";
import { getLiveStreamUrl } from "../services/hikvision.service.js";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";
import axios from "axios";

// ⚙️ CONFIGURATION - Stream URL Expiry Time
// 
// PRODUCTION MODE: 518400 seconds (6 days)
// Renewal Schedule: Every 5 days at 11:55 PM
// Safety Margin: 1 day before expiry

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Reload MediaMTX configuration via API
 * MediaMTX automatically reloads config file changes, so this is optional
 */
const reloadMediaMtx = async () => {
  try {
    // Try to reload via API (MediaMTX v1.0.0+)
    const response = await axios.post("http://localhost:9997/v3/config/paths/patch", {}, {
      timeout: 3000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log("✅ MediaMTX configuration reloaded via API");
    return true;
  } catch (error) {
    // MediaMTX automatically watches config file changes
    // No need to manually reload - just log as info
    console.log("ℹ️  MediaMTX will auto-reload config file changes");
    return false;
  }
};

/**
 * Update mediamtx.yml with new camera stream paths
 * @param {Array} cameras - Array of camera objects with _id and rtmpPath
 */
const updateMediaMtxConfig = async (cameras) => {
  try {
    const configPath = path.join(__dirname, "../../mediamtx.yml");

    // Read existing config
    let config = {};
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, "utf8");
      config = yaml.load(fileContent) || {};
    }

    // Ensure paths object exists
    if (!config.paths) {
      config.paths = {};
    }

    // Update paths for each camera
    cameras.forEach((camera) => {
      if (camera.rtmpPath) {
        config.paths[camera._id.toString()] = {
          source: camera.rtmpPath,
          sourceOnDemand: true,
        };
      }
    });

    // Write updated config back to file
    const yamlStr = yaml.dump(config, {
      lineWidth: -1, // Prevent line wrapping
      noRefs: true,
    });

    fs.writeFileSync(configPath, yamlStr, "utf8");
    console.log("✅ mediamtx.yml updated successfully");
    
    // Reload MediaMTX to apply changes
    await reloadMediaMtx();
  } catch (error) {
    console.error("❌ Error updating mediamtx.yml:", error.message);
    throw error;
  }
};

/**
 * Renew stream URLs for all Hikvision-enabled cameras
 */
export const renewStreamUrls = async () => {
  console.log("\n🔄 Starting stream URL renewal...");
  console.log(`⏱ ${new Date().toLocaleString()}`);

  try {
    // Find all cameras with Hikvision integration enabled
    const cameras = await Camera.find({
      hikvisionEnabled: true,
      hikvisionDeviceSerial: { $exists: true, $ne: null },
      hikvisionResourceId: { $exists: true, $ne: null },
    });

    if (cameras.length === 0) {
      console.log("ℹ️ No Hikvision-enabled cameras found");
      return;
    }

    console.log(`📹 Processing ${cameras.length} Hikvision camera(s)...`);

    const updatedCameras = [];

    // Update each camera's stream URL
    for (const camera of cameras) {
      try {
        console.log(`\n🎥 Updating camera: ${camera.name}`);
        console.log(`   Device Serial: ${camera.hikvisionDeviceSerial}`);
        console.log(`   Resource ID: ${camera.hikvisionResourceId}`);

        // Get new stream URL (expires in 6 days - PRODUCTION)
        const streamData = await getLiveStreamUrl(
          camera.hikvisionDeviceSerial,
          camera.hikvisionResourceId,
          518400 // 6 days = 6 * 24 * 60 * 60 seconds (PRODUCTION MODE)
        );

        // Update camera in database
        camera.rtmpPath = streamData.url;
        camera.status = "active";
        await camera.save();

        updatedCameras.push(camera);

        console.log(`   ✅ Stream URL updated`);
        console.log(`   🔗 New URL: ${streamData.url.substring(0, 80)}...`);
        console.log(`   ⏰ Expires: ${new Date(streamData.expireTime).toLocaleString()}`);
      } catch (error) {
        console.error(`   ❌ Error updating ${camera.name}:`, error.message);
        
        // Check if it's an API error
        if (error.message.includes("OPEN000503")) {
          console.log(`   ⚠️  Hikvision API error - camera may need manual configuration`);
          console.log(`   💡 Tip: Use existing RTMP URL or check Hikvision API access`);
        }
        
        // Continue with other cameras even if one fails
      }
    }

    // Update mediamtx.yml with all updated cameras
    if (updatedCameras.length > 0) {
      await updateMediaMtxConfig(updatedCameras);
      console.log(`\n✅ Successfully updated ${updatedCameras.length} camera(s)`);
    }

    console.log("\n✨ Stream renewal completed\n");
  } catch (error) {
    console.error("\n❌ Stream renewal failed:", error.message);
    throw error;
  }
};

/**
 * Initialize Hikvision cameras from API
 * This is a one-time setup function to link existing cameras with Hikvision
 */
export const initializeHikvisionCameras = async () => {
  console.log("\n🚀 Initializing Hikvision cameras...");

  try {
    const { getAllCameraStreams } = await import("../services/hikvision.service.js");
    const hikvisionCameras = await getAllCameraStreams();

    console.log(`📹 Found ${hikvisionCameras.length} Hikvision camera(s)`);

    for (const hikCam of hikvisionCameras) {
      console.log(`\n🔍 Processing: ${hikCam.cameraName}`);

      // Check if camera already exists in database
      let camera = await Camera.findOne({
        hikvisionDeviceSerial: hikCam.deviceSerial,
        hikvisionResourceId: hikCam.resourceId,
      });

      if (camera) {
        // Update existing camera
        camera.rtmpPath = hikCam.rtmpUrl;
        camera.hikvisionEnabled = true;
        camera.status = "active";
        await camera.save();
        console.log(`   ✅ Updated existing camera: ${camera.name}`);
      } else {
        // Create new camera
        camera = new Camera({
          name: hikCam.cameraName,
          rtmpPath: hikCam.rtmpUrl,
          hikvisionDeviceSerial: hikCam.deviceSerial,
          hikvisionResourceId: hikCam.resourceId,
          hikvisionEnabled: true,
          status: "active",
        });
        await camera.save();
        console.log(`   ✅ Created new camera: ${camera.name}`);
      }
    }

    // Update mediamtx.yml
    const allCameras = await Camera.find({ hikvisionEnabled: true });
    await updateMediaMtxConfig(allCameras);

    console.log("\n✨ Hikvision initialization completed\n");
  } catch (error) {
    console.error("\n❌ Hikvision initialization failed:", error.message);
    throw error;
  }
};
