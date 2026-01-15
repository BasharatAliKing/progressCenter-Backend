import dotenv from "dotenv";
dotenv.config();
import { getDevices, getCameras, getLiveStreamUrl } from "../services/hikvision.service.js";

/**
 * Test script to discover correct Hikvision camera details
 */

const testHikvisionAPI = async () => {
  try {
    console.log("\n🔍 Testing Hikvision API Connection...\n");

    // Step 1: Get all devices
    console.log("📱 Fetching devices...");
    const devices = await getDevices();
    console.log(`✅ Found ${devices.length} device(s)\n`);

    for (const device of devices) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📹 Device: ${device.name}`);
      console.log(`   Serial: ${device.serialNo}`);
      console.log(`   Model: ${device.model || "N/A"}`);
      console.log(`   Status: ${device.onlineStatus === 1 ? "🟢 Online" : "🔴 Offline"}`);

      if (device.onlineStatus === 1) {
        // Step 2: Get cameras for this device
        console.log(`\n   📸 Fetching cameras for device ${device.serialNo}...`);
        try {
          const cameras = await getCameras(device.serialNo);
          console.log(`   ✅ Found ${cameras.length} camera(s)\n`);

          for (const camera of cameras) {
            console.log(`   ┌─ Camera: ${camera.name}`);
            console.log(`   │  Resource ID: ${camera.id}`);
            console.log(`   │  Status: ${camera.online === "1" ? "🟢 Online" : "🔴 Offline"}`);
            console.log(`   │  Channel: ${camera.channelNo || "N/A"}`);

            // Step 3: Try to get stream URL
            if (camera.online === "1") {
              try {
                console.log(`   │  🔄 Testing stream URL generation...`);
                const streamData = await getLiveStreamUrl(
                  device.serialNo,
                  camera.id,
                  120 // 2 minutes
                );
                console.log(`   │  ✅ Stream URL generated successfully!`);
                console.log(`   │  URL: ${streamData.url.substring(0, 80)}...`);
                console.log(`   │  Expires: ${new Date(streamData.expireTime).toLocaleString()}`);
              } catch (error) {
                console.log(`   │  ❌ Failed to generate stream: ${error.message}`);
              }
            }
            console.log(`   └─────────────────────────────────────`);
          }
        } catch (error) {
          console.log(`   ❌ Error fetching cameras: ${error.message}`);
        }
      }
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    }

    console.log("\n✨ Test completed!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

testHikvisionAPI();
