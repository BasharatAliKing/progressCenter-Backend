# 🔧 Setup Auto-Update RTMP Path

## Current Status
✅ APIs work in Postman  
✅ Backend system ready  
❌ Need correct resourceId for your camera

---

## Step 1: Update Camera with Correct resourceId

### Using Postman:

**Endpoint:**
```
PATCH http://localhost:5000/api/hikvision/camera/695790375d8eeb3dd0168102/enable
```

**Body (JSON):**
```json
{
  "deviceSerial": "FC9147667",
  "resourceId": "YOUR_ACTUAL_RESOURCE_ID_HERE"
}
```

**Where to find resourceId:**
- Hikvision Cloud dashboard → Camera settings
- The format should be like: `ad52c2efccd64193a51594a44feaa160` (32-character hex string)
- NOT like: `FC9147667_1_1`

---

## Step 2: Test Auto-Renewal

After updating with correct resourceId, manually trigger renewal:

```
POST http://localhost:5000/api/hikvision/renew
```

You should see:
```
🔄 Starting stream URL renewal...
📹 Processing 1 Hikvision camera(s)...
🎥 Updating camera: Camera 01
   ✅ Stream URL updated
   🔗 New URL: rtmp://...
✅ Successfully updated 1 camera(s)
```

---

## Step 3: Verify It Works

Check your camera:
```
GET http://localhost:5000/api/camera/695790375d8eeb3dd0168102
```

The `rtmpPath` should be updated with a new URL!

---

## How Auto-Update Works

Once configured correctly:

1. **Cron job runs every 2 minutes** (testing mode)
2. Calls Hikvision API to get fresh RTMP URL
3. Updates `rtmpPath` in database automatically
4. Updates `mediamtx.yml` configuration
5. MediaMTX reloads and streams continue

---

## Alternative: Use Initialize Endpoint

If you have multiple cameras, use:

```
POST http://localhost:5000/api/hikvision/initialize
```

This will:
- Auto-discover all cameras from Hikvision
- Get correct deviceSerial and resourceId
- Set up auto-renewal for all cameras
- Generate fresh RTMP URLs

---

## Production Settings

After testing works (2-minute expiry), update to production:

### File: `src/jobs/streamRenew.job.js`
**Line ~85 & ~152:**
```javascript
432000  // 5 days (change from 120)
```

### File: `src/server.js`
**Line ~47:**
```javascript
"0 0 */4 * *"  // Every 4 days (change from "*/2 * * * *")
```

---

## Troubleshooting

### Error: OPEN000503
- Wrong resourceId format
- Camera offline
- API permission issue

**Solution:** Get correct resourceId from Hikvision dashboard

### Error: 404
- Check API endpoint is correct
- Verify Hikvision credentials

---

## Quick Commands

**Enable camera:**
```bash
curl -X PATCH http://localhost:5000/api/hikvision/camera/CAMERA_ID/enable \
  -H "Content-Type: application/json" \
  -d '{"deviceSerial":"FC9147667","resourceId":"YOUR_RESOURCE_ID"}'
```

**Manual renewal:**
```bash
curl -X POST http://localhost:5000/api/hikvision/renew
```

**Check all cameras:**
```bash
curl http://localhost:5000/api/camera
```

---

✅ **Once set up, your rtmpPath will auto-update every 2 minutes (testing) or every 4-5 days (production)!**
