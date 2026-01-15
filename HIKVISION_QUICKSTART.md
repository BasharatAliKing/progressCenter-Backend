# Hikvision Integration - Quick Start

## 🚀 What's Been Added

Your backend now has **automatic Hikvision camera integration** that:
- ✅ Fetches live stream URLs from Hikvision API
- ✅ Auto-updates camera `rtmpPath` in database every 2 minutes
- ✅ Auto-updates `mediamtx.yml` configuration
- ✅ Provides API endpoints for manual control

## 📁 New Files Created

```
src/
  ├── services/hikvision.service.js      # Hikvision API client
  ├── jobs/streamRenew.job.js            # Auto-renewal job
  ├── routes/hikvisionRoutes.js          # API endpoints
  └── test-hikvision.js                  # Test script

HIKVISION_SETUP.md                       # Detailed documentation
Hikvision_API.postman_collection.json    # Postman collection
```

## 🔧 Changes to Existing Files

### Camera Model (`cameraModel.js`)
Added 3 new fields:
- `hikvisionDeviceSerial` - Device serial number
- `hikvisionResourceId` - Camera resource ID
- `hikvisionEnabled` - Enable/disable auto-renewal

### Server (`server.js`)
- Added cron job to renew streams every 2 minutes
- Added Hikvision routes

## 🎯 Quick Start Guide

### Step 1: Test the Integration (Optional)
```bash
node src/test-hikvision.js
```
This will verify your Hikvision credentials and show all available cameras.

### Step 2: Start Your Server
```bash
npm run dev
```

### Step 3: Initialize Cameras
Use Postman, curl, or any HTTP client:

```bash
POST http://localhost:4000/api/hikvision/initialize
```

This will:
- Discover all cameras from Hikvision
- Add them to your database
- Update mediamtx.yml
- Enable auto-renewal

### Step 4: Verify It's Working

#### Check Status
```bash
GET http://localhost:4000/api/hikvision/status
```

#### Watch Console Logs
You'll see updates every 2 minutes:
```
🔄 Starting stream URL renewal...
📹 Processing 1 Hikvision camera(s)...
🎥 Updating camera: Camera 01
   ✅ Stream URL updated
   🔗 New URL: rtmp://vtmsgpzl.ezvizlife.com:1935/v3/openlive/...
   ⏰ Expires: 1/14/2026, 10:30:00 AM
✅ mediamtx.yml updated successfully
✨ Stream renewal completed
```

## 🔍 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/hikvision/initialize` | POST | Initialize all Hikvision cameras |
| `/api/hikvision/renew` | POST | Manually renew stream URLs |
| `/api/hikvision/status` | GET | Get status of all cameras |
| `/api/hikvision/camera/:id/enable` | PATCH | Enable auto-renewal for camera |
| `/api/hikvision/camera/:id/disable` | PATCH | Disable auto-renewal for camera |

## ⚙️ Configuration

### Change Renewal Interval
Edit `src/server.js`:

```javascript
// Every 2 minutes (current - for testing)
cron.schedule("*/2 * * * *", async () => {

// Every 5 minutes
cron.schedule("*/5 * * * *", async () => {

// Every 10 minutes (recommended for production)
cron.schedule("*/10 * * * *", async () => {
```

### Change Stream Expiration Time
Edit `src/services/hikvision.service.js`:

```javascript
getLiveStreamUrl(deviceSerial, resourceId, 600000) // 10 minutes
getLiveStreamUrl(deviceSerial, resourceId, 1800000) // 30 minutes
```

### Update Credentials
Edit `src/services/hikvision.service.js`:

```javascript
const HIKVISION_CONFIG = {
  baseUrl: "https://isgp-team.hikcentralconnect.com",
  appKey: "YOUR_APP_KEY",
  secretKey: "YOUR_SECRET_KEY",
  expireTime: 999999999999999999999999,
};
```

## 🎥 View Live Streams

After initialization, access streams at:
```
http://localhost:8889/{cameraId}/index.m3u8
```

Where `{cameraId}` is the MongoDB ObjectId of the camera.

## 📚 Need More Help?

- **Full Documentation**: See [HIKVISION_SETUP.md](HIKVISION_SETUP.md)
- **Postman Collection**: Import `Hikvision_API.postman_collection.json`
- **Test Script**: Run `node src/test-hikvision.js`

## 🎉 That's It!

Your Hikvision integration is ready to go. The system will automatically:
1. Fetch new stream URLs every 2 minutes
2. Update camera records in MongoDB
3. Update mediamtx.yml configuration
4. Keep your streams always available

Just start the server and call the initialize endpoint!
