# 🎥 Permanent Live Streaming Guide - Hikvision + MediaMTX

## 📋 Overview

This system provides **permanent live streaming** from Hikvision cameras using:
- **Hikvision Cloud API** - Generates temporary RTMP URLs (expire after 7 days)
- **MediaMTX** - Streaming server that re-streams to HLS/WebRTC
- **Auto-Renewal System** - Refreshes URLs before expiration

---

## 🔄 How It Works

```
Hikvision Camera → Hikvision Cloud API → RTMP URL (7-day expiry)
                                              ↓
                                         MediaMTX Server
                                              ↓
                                  HLS Stream (permanent access)
                                              ↓
                                      Your Dashboard
```

### Key Components:

1. **Stream URL Generation** (`src/services/hikvision.service.js`)
   - Fetches fresh RTMP URLs from Hikvision API
   - URLs valid for 7 days (604,800 seconds)

2. **Auto-Renewal Job** (`src/jobs/streamRenew.job.js`)
   - Runs every 5 days (before URLs expire)
   - Updates database and MediaMTX config
   - Reloads MediaMTX without interruption

3. **MediaMTX Config** (`mediamtx.yml`)
   - Automatically updated with fresh URLs
   - Uses camera ID as stream path

---

## 🚀 Setup Instructions

### Step 1: Initialize Hikvision Cameras

**Option A: API Call (Recommended)**
```bash
POST http://localhost:4000/api/hikvision/initialize
```

This will:
- Discover all online Hikvision cameras
- Create/update camera records in database
- Generate initial RTMP URLs
- Update `mediamtx.yml` configuration

**Option B: Manual Database Entry**

Add cameras with these required fields:
```javascript
{
  name: "Camera Name",
  rtmpPath: "rtmp://...",  // from Hikvision API
  hikvisionDeviceSerial: "FC9147667",
  hikvisionResourceId: "camera_resource_id",
  hikvisionEnabled: true,  // ✅ Enable auto-renewal
  status: "active"
}
```

---

### Step 2: Verify MediaMTX Configuration

Check `mediamtx.yml` - should look like:

```yaml
api: yes
rtsp: yes
rtmp: yes
hls: yes
webrtc: yes

paths:
  "690ae10827fa4dbc1f111fac":  # Camera ID
    source: rtmp://vtmsgpzl.ezvizlife.com:1935/v3/openlive/...
    sourceOnDemand: yes
```

---

### Step 3: Access Live Stream

**HLS URL Format:**
```
http://localhost:8888/{camera_id}/index.m3u8
```

**Example:**
```
http://localhost:8888/690ae10827fa4dbc1f111fac/index.m3u8
```

**API Endpoint:**
```bash
GET /api/camera/{camera_id}/live
```

Returns:
```json
{
  "success": true,
  "hlsUrl": "http://localhost:8888/690ae10827fa4dbc1f111fac/index.m3u8",
  "cameraInfo": { ... }
}
```

---

## ⏰ Automatic Renewal Schedule

### Current Cron Jobs:

1. **Snapshot Capture** - Every 30 minutes
   ```javascript
   cron.schedule("*/30 * * * *", ...)
   ```

2. **Stream URL Renewal** - Every 5 days (at midnight)
   ```javascript
   cron.schedule("0 0 */5 * *", ...)
   ```

### Manual Renewal:

Trigger renewal anytime via API:
```bash
POST http://localhost:4000/api/hikvision/renew
```

---

## 🎬 Dashboard Integration

### HTML5 Video Player:
```html
<video controls>
  <source src="http://localhost:8888/{camera_id}/index.m3u8" type="application/x-mpegURL">
</video>
```

### HLS.js (Recommended):
```javascript
import Hls from 'hls.js';

const video = document.getElementById('video');
const hlsUrl = 'http://localhost:8888/690ae10827fa4dbc1f111fac/index.m3u8';

if (Hls.isSupported()) {
  const hls = new Hls();
  hls.loadSource(hlsUrl);
  hls.attachMedia(video);
} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
  // Safari native support
  video.src = hlsUrl;
}
```

### Video.js:
```javascript
import videojs from 'video.js';

const player = videojs('my-video', {
  sources: [{
    src: 'http://localhost:8888/690ae10827fa4dbc1f111fac/index.m3u8',
    type: 'application/x-mpegURL'
  }]
});
```

---

## 🔧 Configuration Settings

### Expiry Time Configuration:

**Current:** 7 days (604,800 seconds)

To change:

1. Edit `src/jobs/streamRenew.job.js`:
```javascript
const streamData = await getLiveStreamUrl(
  camera.hikvisionDeviceSerial,
  camera.hikvisionResourceId,
  604800  // Change this value (in seconds)
);
```

2. Adjust cron schedule in `src/server.js`:
```javascript
// For 7-day expiry → renew every 5 days
cron.schedule("0 0 */5 * *", ...)

// For 1-day expiry → renew every 20 hours
cron.schedule("0 */20 * * *", ...)
```

---

## 🛠️ Troubleshooting

### Stream Not Loading:

1. **Check MediaMTX is running:**
   ```bash
   # Should see "MediaMTX running" in console
   ```

2. **Verify camera URL is active:**
   ```bash
   ffplay "rtmp://vtmsgpzl.ezvizlife.com:1935/v3/openlive/..."
   ```

3. **Check MediaMTX logs:**
   - Look for connection errors in server console

4. **Test HLS endpoint:**
   ```bash
   curl http://localhost:8888/{camera_id}/index.m3u8
   ```

### URLs Still Expiring:

1. **Check renewal job is running:**
   - Should see console logs every 5 days
   - Look for: "🔄 Running stream URL renewal at..."

2. **Verify `hikvisionEnabled` flag:**
   ```javascript
   db.cameras.find({ hikvisionEnabled: true })
   ```

3. **Check Hikvision credentials:**
   - Ensure `HIKVISION_APP_KEY` and `HIKVISION_SECRET` are valid

### MediaMTX Not Reloading:

1. **Enable MediaMTX API in config:**
   ```yaml
   api: yes
   apiAddress: :9997
   ```

2. **Manually restart server if needed:**
   ```bash
   npm run dev
   ```

---

## 📊 Monitoring

### Check Stream Status:

**All Cameras:**
```bash
GET /api/camera
```

**Single Camera:**
```bash
GET /api/camera/{camera_id}
```

**Camera Live View:**
```bash
GET /api/camera/{camera_id}/live
```

### Logs to Monitor:

1. **Stream Renewal:**
   ```
   🔄 Running stream URL renewal at...
   📹 Processing X Hikvision camera(s)...
   ✅ Successfully updated X camera(s)
   ```

2. **MediaMTX:**
   ```
   MediaMTX: [HLS] [conn from {ip}] ...
   MediaMTX: [path {camera_id}] ready
   ```

---

## 🎯 Best Practices

1. **Set appropriate expiry time:**
   - Too short: Frequent API calls
   - Too long: Risk of service interruption if renewal fails
   - **Recommended:** 7 days with 5-day renewal

2. **Monitor renewal logs:**
   - Ensure cron jobs execute successfully
   - Check for API errors

3. **Backup strategy:**
   - Keep old URLs until new ones are verified
   - Implement fallback mechanism

4. **Network considerations:**
   - Ensure stable connection to Hikvision Cloud
   - MediaMTX should have sufficient bandwidth

5. **Database backups:**
   - Backup camera configurations regularly
   - Store Hikvision credentials securely

---

## 🔐 Security Notes

1. **API Keys:** Store in `.env` file (never commit)
2. **MediaMTX Access:** Consider authentication for production
3. **CORS:** Configure properly for your frontend domain
4. **RTMP URLs:** Don't expose publicly (they're temporary but sensitive)

---

## 📝 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/camera` | List all cameras |
| GET | `/api/camera/:id` | Get camera details |
| GET | `/api/camera/:id/live` | Get HLS stream URL |
| POST | `/api/camera` | Add new camera |
| PUT | `/api/camera/:id` | Update camera |
| DELETE | `/api/camera/:id` | Delete camera |
| POST | `/api/hikvision/initialize` | Discover Hikvision cameras |
| POST | `/api/hikvision/renew` | Manually renew stream URLs |

---

## 🚦 Production Checklist

- [ ] Hikvision credentials configured in `.env`
- [ ] MongoDB connection established
- [ ] MediaMTX running and accessible
- [ ] Initial camera setup completed via `/hikvision/initialize`
- [ ] First stream URL renewal successful
- [ ] Cron jobs verified in server logs
- [ ] Dashboard successfully playing streams
- [ ] Monitoring/alerting configured
- [ ] Backup strategy implemented

---

## 📚 Additional Resources

- [MediaMTX Documentation](https://github.com/bluenviron/mediamtx)
- [HLS.js Documentation](https://github.com/video-dev/hls.js/)
- [Hikvision API Documentation](https://open.hikvision.com/)

---

**✅ Your streams will now stay online permanently!**

The system automatically refreshes URLs every 5 days, ensuring continuous streaming without manual intervention.
