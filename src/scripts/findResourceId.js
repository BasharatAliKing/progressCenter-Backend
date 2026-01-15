import dotenv from "dotenv";
dotenv.config();
import { getAccessToken } from "../services/hikvision.service.js";
import axios from "axios";

const HIKVISION_CONFIG = {
  baseUrl: "https://isgp-team.hikcentralconnect.com",
};

/**
 * Get the correct camera resource ID from Hikvision API
 */
const getCorrectResourceId = async () => {
  try {
    console.log("\n🔍 Finding correct camera resource ID...\n");

    const token = await getAccessToken();

    // Try to get cameras list with different filters
    console.log("📡 Attempting to fetch cameras...\n");

    // Method 1: Direct camera list
    // try {
    //   const response = await axios.post(
    //     `${HIKVISION_CONFIG.baseUrl}/api/hccgw/resource/v1/cameras/get`,
    //     {
    //       pageIndex: 1,
    //       pageSize: 100,
    //       filter: {
    //         deviceSerialNo: "FC9147667",
    //       },
    //     },
    //     {
    //       headers: {
    //         "Content-Type": "application/json",
    //         Token: token,
    //       },
    //     }
    //   );

    //   if (response.data.errorCode === "0" && response.data.data?.camera) {
    //     const cameras = response.data.data.camera;
    //     console.log(`✅ Found ${cameras.length} camera(s) for device FC9147667:\n`);
        
    //     cameras.forEach((cam, index) => {
    //       console.log(`Camera ${index + 1}:`);
    //       console.log(`  Name: ${cam.name}`);
    //       console.log(`  Resource ID: ${cam.id}`);
    //       console.log(`  Channel: ${cam.channelNo || "N/A"}`);
    //       console.log(`  Status: ${cam.online === "1" ? "🟢 Online" : "🔴 Offline"}`);
    //       console.log(`  Camera No: ${cam.cameraNo || "N/A"}`);
    //       console.log("");
    //     });

    //     console.log("\n💡 Use one of these Resource IDs to update your camera!\n");
    //   } else {
    //     console.log("⚠️  Method 1 failed:", response.data.errorCode);
    //   }
    // } catch (error) {
    //   console.log("⚠️  Method 1 error:", error.response?.data || error.message);
    // }
    // Method 2: Try without deviceSerial filter
    try {
      console.log("\n📡 Trying alternate method (all cameras)...\n");
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

      if (response.data.errorCode === "0" && response.data.data?.camera) {
        const cameras = response.data.data.camera;
        console.log(`✅ Found ${cameras.length} total camera(s):\n`);
        
        cameras.forEach((cam, index) => {
          console.log(`Camera ${index + 1}:`);
          console.log(`  Name: ${cam.name}`);
          console.log(`  Resource ID: ${cam.id}`);
          console.log(`  Device Serial: ${cam.deviceSerial || "N/A"}`);
          console.log(`  Status: ${cam.online === "1" ? "🟢 Online" : "🔴 Offline"}`);
          console.log("");
        });
      } else {
        console.log("⚠️  Method 2 failed:", response.data.errorCode);
      }
    } catch (error) {
      console.log("⚠️  Method 2 error:", error.response?.data || error.message);
    }

    console.log("\n✨ Search completed!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
};

getCorrectResourceId();
