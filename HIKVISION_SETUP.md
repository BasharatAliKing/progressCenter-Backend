# Hikvision Integration Setup Guide

## Overview
This integration automatically fetches live stream URLs from Hikvision API and updates your cameras and mediamtx.yml configuration every 2 minutes (configurable).

## Features
- ✅ Automatic token management (cached until expiration)
- ✅ Auto-discovery of Hikvision cameras
- ✅ Periodic stream URL renewal (2 minutes for testing)
- ✅ Automatic mediamtx.yml updates
- ✅ Manual API endpoints for control

## Setup Steps

### 1. Initialize Hikvision Cameras (First Time Only)

**Option A: Using API (Recommended)**
```bash
POST http://localhost:4000/api/hikvision/initialize
```

This will:
- Fetch all devices from Hikvision
- Fetch all cameras from each device
- Create/update cameras in your database
- Update mediamtx.yml with stream paths
- Enable auto-renewal for all cameras

**Option B: Manually Enable for Existing Camera**
```bash
PATCH http://localhost:4000/api/hikvision/camera/{cameraId}/enable
Content-Type: application/json

{
  "deviceSerial": "FC9147667",
  "resourceId": "ad52c2efccd64193a51594a44feaa160"
}
```

### 2. Automatic Renewal

Once cameras are initialized, the system will automatically:
- Renew stream URLs every 2 minutes (configured in server.js)
- Update camera rtmpPath in database
- Update mediamtx.yml configuration
- Log all activities to console

**Change Renewal Interval:**
Edit `src/server.js`:
```javascript
// Every 2 minutes (testing)
cron.schedule("*/2 * * * *", async () => {

// Every 5 minutes (production)
cron.schedule("*/5 * * * *", async () => {

// Every 10 minutes (production)
cron.schedule("*/10 * * * *", async () => {
```

### 3. Available API Endpoints

#### Get Status
```bash
GET http://localhost:4000/api/hikvision/status
```
Returns all Hikvision-enabled cameras and their status.

#### Manual Renewal
```bash
POST http://localhost:4000/api/hikvision/renew
```
Manually trigger stream URL renewal (useful for testing).

#### Disable Camera
```bash
PATCH http://localhost:4000/api/hikvision/camera/{cameraId}/disable
```
Disable auto-renewal for a specific camera.

## Camera Model Fields

New fields added to Camera schema:
- `hikvisionDeviceSerial`: Device serial number (e.g., "FC9147667")
- `hikvisionResourceId`: Camera resource ID from Hikvision API
- `hikvisionEnabled`: Boolean flag to enable/disable auto-renewal

## Configuration

Update Hikvision credentials in `src/services/hikvision.service.js`:
```javascript
const HIKVISION_CONFIG = {
  baseUrl: "https://isgp-team.hikcentralconnect.com",
  appKey: "YOUR_APP_KEY",
  secretKey: "YOUR_SECRET_KEY",
  expireTime: 999999999999999999999999,
};
```

## Testing

1. Start your server:
```bash
npm run dev
```

2. Initialize cameras:
```bash
POST http://localhost:4000/api/hikvision/initialize
```

3. Check status:
```bash
GET http://localhost:4000/api/hikvision/status
```

4. Watch the console logs:
- You'll see token fetches
- Stream URL updates every 2 minutes
- mediamtx.yml updates

5. Verify live stream:
```
http://localhost:8889/{cameraId}/index.m3u8
```

## Troubleshooting

### Stream URLs expiring too fast
Increase the `expireTime` parameter in `src/services/hikvision.service.js`:
```javascript
export const getLiveStreamUrl = async (
  deviceSerial,
  resourceId,
  expireTime = 600000 // 10 minutes instead of 2
) => {
```

And update the cron schedule to run less frequently.

### Cameras not appearing
1. Check that devices are online in Hikvision (onlineStatus === 1)
2. Check that cameras are online (camera.online === "1")
3. Verify credentials in hikvision.service.js

### mediamtx.yml not updating
1. Check file permissions
2. Verify path in streamRenew.job.js
3. Check console logs for errors

## Production Recommendations

1. **Set longer expiration times**: Change from 120000 (2 min) to 600000 (10 min) or more
2. **Adjust cron schedule**: Change from `*/2 * * * *` to `*/10 * * * *` or `*/30 * * * *`
3. **Add error notifications**: Implement alerts when stream renewal fails
4. **Monitor token usage**: Hikvision may have rate limits

## File Structure

```
src/
  ├── services/
  │   └── hikvision.service.js    # Hikvision API integration
  ├── jobs/
  │   └── streamRenew.job.js      # Stream renewal job
  ├── routes/
  │   └── hikvisionRoutes.js      # API endpoints
  └── models/
      └── cameraModel.js          # Updated with Hikvision fields
```
