/**
 * Test script for Hikvision integration
 * Run with: node src/test-hikvision.js
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import {
  getAccessToken,
  getDevices,
  getCameras,
  getLiveStreamUrl,
  getAllCameraStreams,
} from "./services/hikvision.service.js";

async function testHikvisionIntegration() {
  console.log("🧪 Testing Hikvision Integration\n");
  console.log("=".repeat(50));

  try {
    // Connect to MongoDB
    console.log("\n1️⃣ Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Test 1: Get Access Token
    console.log("\n2️⃣ Testing Access Token...");
    const token = await getAccessToken();
    console.log(`✅ Token obtained: ${token.substring(0, 20)}...`);

    // Test 2: Get Devices
    console.log("\n3️⃣ Testing Get Devices...");
    const devices = await getDevices();
    console.log(`✅ Found ${devices.length} device(s):`);
    devices.forEach((device) => {
      console.log(`   - ${device.name} (${device.serialNo})`);
      console.log(`     Status: ${device.onlineStatus === 1 ? "Online" : "Offline"}`);
      console.log(`     Type: ${device.type}`);
    });

    // Test 3: Get Cameras for each device
    console.log("\n4️⃣ Testing Get Cameras...");
    for (const device of devices) {
      if (device.onlineStatus === 1) {
        const cameras = await getCameras(device.serialNo);
        console.log(`✅ Device ${device.serialNo} has ${cameras.length} camera(s):`);
        cameras.forEach((camera) => {
          console.log(`   - ${camera.name} (${camera.id})`);
          console.log(`     Status: ${camera.online === "1" ? "Online" : "Offline"}`);
        });
      }
    }

    // Test 4: Get Stream URL for first online camera
    console.log("\n5️⃣ Testing Get Stream URL...");
    for (const device of devices) {
      if (device.onlineStatus === 1) {
        const cameras = await getCameras(device.serialNo);
        const onlineCamera = cameras.find((cam) => cam.online === "1");

        if (onlineCamera) {
          const streamData = await getLiveStreamUrl(
            device.serialNo,
            onlineCamera.id,
            120000 // 2 minutes
          );

          console.log(`✅ Stream URL obtained for ${onlineCamera.name}:`);
          console.log(`   URL: ${streamData.url.substring(0, 80)}...`);
          console.log(`   Expires: ${new Date(streamData.expireTime).toLocaleString()}`);
          console.log(`   ID: ${streamData.id}`);
          break;
        }
      }
    }

    // Test 5: Get All Camera Streams
    console.log("\n6️⃣ Testing Get All Camera Streams...");
    const allStreams = await getAllCameraStreams();
    console.log(`✅ Retrieved ${allStreams.length} camera stream(s):`);
    allStreams.forEach((stream) => {
      console.log(`\n   📹 ${stream.cameraName}`);
      console.log(`      Device: ${stream.deviceName}`);
      console.log(`      Serial: ${stream.deviceSerial}`);
      console.log(`      Resource ID: ${stream.resourceId}`);
      console.log(`      URL: ${stream.rtmpUrl.substring(0, 60)}...`);
    });

    console.log("\n" + "=".repeat(50));
    console.log("✨ All tests passed successfully!\n");

    console.log("📝 Next Steps:");
    console.log("   1. Start your server: npm run dev");
    console.log("   2. Initialize cameras: POST http://localhost:4000/api/hikvision/initialize");
    console.log("   3. Check status: GET http://localhost:4000/api/hikvision/status");
    console.log("   4. Watch console logs for auto-renewal every 2 minutes\n");

  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
    process.exit(0);
  }
}

// Run tests
testHikvisionIntegration();
