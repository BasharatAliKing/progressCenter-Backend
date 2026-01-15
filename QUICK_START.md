# 🚀 Quick Start - Permanent Live Streaming

## One-Time Setup (5 minutes)

### 1. Initialize Hikvision Cameras
```bash
curl -X POST http://localhost:4000/api/hikvision/initialize
```

This discovers all your Hikvision cameras and sets up auto-renewal.

### 2. Verify Cameras
```bash
curl http://localhost:4000/api/camera
```

Should show all cameras with `hikvisionEnabled: true`

### 3. Get Stream URL
```bash
curl http://localhost:4000/api/camera/{camera_id}/live
```

Returns HLS URL like: `http://localhost:8888/{camera_id}/index.m3u8`

### 4. Test in Browser
Open: `http://localhost:8888/{camera_id}/index.m3u8`

---

## That's It! 🎉

Your streams will now:
- ✅ Stay online **permanently**
- ✅ Auto-renew URLs every 5 days (before 7-day expiry)
- ✅ Automatically update MediaMTX configuration
- ✅ Work continuously without manual intervention

---

## Quick Commands

### Manually Renew URLs (if needed)
```bash
curl -X POST http://localhost:4000/api/hikvision/renew
```

### Check System Status
```bash
# View logs
npm run dev

# Look for these messages:
# ✅ MongoDB connected
# 🎬 Launching MediaMTX...
# ✅ Server running on http://localhost:4000
```

---

## Dashboard Integration (React/Vue/Angular)

```javascript
// Using HLS.js
import Hls from 'hls.js';

const video = document.getElementById('video');
const hlsUrl = `http://localhost:8888/${cameraId}/index.m3u8`;

if (Hls.isSupported()) {
  const hls = new Hls();
  hls.loadSource(hlsUrl);
  hls.attachMedia(video);
}
```

---

## Troubleshooting

### Stream Not Loading?

1. **Check server is running:**
   ```bash
   npm run dev
   ```

2. **Verify MediaMTX is active:**
   - Should see "MediaMTX running" in logs

3. **Check camera config:**
   ```bash
   curl http://localhost:4000/api/camera/{camera_id}
   ```
   - Verify `hikvisionEnabled: true`
   - Check `rtmpPath` exists

4. **Test MediaMTX directly:**
   ```bash
   curl http://localhost:8888/{camera_id}/index.m3u8
   ```

### Need Help?

See [PERMANENT_STREAMING_GUIDE.md](./PERMANENT_STREAMING_GUIDE.md) for detailed documentation.

---

**⏰ Automatic Renewal Schedule:**
- Runs every 5 days at midnight
- Refreshes URLs before 7-day expiry
- Zero downtime guaranteed
