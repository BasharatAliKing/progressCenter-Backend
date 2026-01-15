import axios from "axios";

const HIKVISION_CONFIG = {
  baseUrl: "https://isgp-team.hikcentralconnect.com",
  appKey: "4EDTZmF6f0RPURVmGO1cife5fHZcNeO0",
  secretKey: "ZR7nWEp9lVRUcUwVCjnNgfoyJyUOUfnC",
  expireTime: 999999999999999999999999,
};

let cachedToken = null;
let tokenExpireTime = null;

/**
 * Get access token from Hikvision API
 * Caches token until it expires
 */
export const getAccessToken = async () => {
  try {
    // Return cached token if still valid
    if (cachedToken && tokenExpireTime && Date.now() < tokenExpireTime * 1000) {
      console.log("✅ Using cached Hikvision token");
      return cachedToken;
    }

    console.log("🔑 Fetching new Hikvision token...");
    const response = await axios.post(
      `${HIKVISION_CONFIG.baseUrl}/api/hccgw/platform/v1/token/get`,
      {
        appKey: HIKVISION_CONFIG.appKey,
        secretKey: HIKVISION_CONFIG.secretKey,
        expireTime: HIKVISION_CONFIG.expireTime,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.errorCode === "0") {
      cachedToken = response.data.data.accessToken;
      tokenExpireTime = response.data.data.expireTime;
      console.log("✅ Hikvision token obtained successfully");
      return cachedToken;
    } else {
      throw new Error(`Token error: ${response.data.errorCode}`);
    }
  } catch (error) {
    console.error("❌ Error getting Hikvision token:", error.message);
    throw error;
  }
};

/**
 * Get all devices from Hikvision
 */
export const getDevices = async () => {
  try {
    const token = await getAccessToken();

    const response = await axios.post(
      `${HIKVISION_CONFIG.baseUrl}/api/hccgw/resource/v1/devices/get`,
      {
        pageIndex: 1,
        pageSize: 20,
        filter: {
          matchKey: "",
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Token: token,
        },
      }
    );

    if (response.data.errorCode === "0") {
      return response.data.data.device || [];
    } else {
      throw new Error(`Devices error: ${response.data.errorCode}`);
    }
  } catch (error) {
    console.error("❌ Error getting Hikvision devices:", error.message);
    throw error;
  }
};

/**
 * Get all cameras for a specific device
 * @param {string} deviceSerialNo - Device serial number (e.g., "FC9147667")
 */
export const getCameras = async (deviceSerialNo) => {
  try {
    const token = await getAccessToken();

    const response = await axios.post(
      `${HIKVISION_CONFIG.baseUrl}/api/hccgw/resource/v1/cameras/get`,
      {
        pageIndex: 1,
        pageSize: 10,
        filter: {
          includeSubArea: "1",
          deviceSerialNo: deviceSerialNo,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Token: token,
        },
      }
    );

    if (response.data.errorCode === "0") {
      return response.data.data.camera || [];
    } else {
      throw new Error(`Cameras error: ${response.data.errorCode}`);
    }
  } catch (error) {
    console.error("❌ Error getting Hikvision cameras:", error.message);
    throw error;
  }
};

/**
 * Get live stream URL for a camera
 * @param {string} deviceSerial - Device serial number
 * @param {string} resourceId - Camera resource ID
 * @param {number} expireTime - URL expiration time in seconds (default: 600000 = 10 minutes)
 */
export const getLiveStreamUrl = async (
  deviceSerial,
  resourceId,
  expireTime = 600000
) => {
  try {
    const token = await getAccessToken();

    const response = await axios.post(
      `${HIKVISION_CONFIG.baseUrl}/api/hccgw/video/v1/live/address/get`,
      {
        deviceSerial: deviceSerial,
        resourceId: resourceId,
        type: "2",
        protocol: 3, // RTMP protocol
        quality: 1,
        expireTime: expireTime,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Token: token,
        },
      }
    );

    if (response.data.errorCode === "0") {
      return {
        url: response.data.data.url,
        expireTime: response.data.data.expireTime,
        id: response.data.data.id,
      };
    } else {
      throw new Error(`Stream URL error: ${response.data.errorCode}`);
    }
  } catch (error) {
    console.error("❌ Error getting stream URL:", error.message);
    throw error;
  }
};

/**
 * Get stream URL for all cameras associated with Hikvision devices
 * Returns array of cameras with their stream URLs
 */
export const getAllCameraStreams = async () => {
  try {
    const devices = await getDevices();
    const allCameraStreams = [];

    for (const device of devices) {
      // Only process online devices
      if (device.onlineStatus === 1) {
        const cameras = await getCameras(device.serialNo);

        for (const camera of cameras) {
          // Only process online cameras
          if (camera.online === "1") {
            const streamData = await getLiveStreamUrl(
              device.serialNo,
              camera.id,
              120 // 2 minutes = 120 seconds (TESTING MODE)
            );

            allCameraStreams.push({
              cameraName: camera.name,
              deviceSerial: device.serialNo,
              resourceId: camera.id,
              rtmpUrl: streamData.url,
              expireTime: streamData.expireTime,
              deviceName: device.name,
            });
          }
        }
      }
    }

    return allCameraStreams;
  } catch (error) {
    console.error("❌ Error getting all camera streams:", error.message);
    throw error;
  }
};
