# Timelapse Video API Documentation

## Overview
This API allows you to create timelapse videos from camera snapshots and manage them.

## Endpoints

### 1. Create Timelapse Video
**POST** `/api/snapshots/:cameraId/timelapse/video`

Creates a video from timelapse images.

#### Request Body
```json
{
  "range": "1day",           // Required: 1day, 5days, 15days, 30days, 3months, 6months, 1year, 2years, 3years
  "perDay": 2,               // Optional: Number of frames per day (null = all frames)
  "timeFilter": "24h",       // Optional: 8-5, 6-6, 24h (default: 24h)
  "username": "john_doe",    // Required: User's name
  "userId": "user123",       // Required: User's ID
  "fps": 10                  // Optional: Frames per second (default: 10)
}
```

#### Example Request
```bash
curl -X POST http://localhost:5000/api/snapshots/69730ae8ebcf4689ef4eb4ae/timelapse/video \
  -H "Content-Type: application/json" \
  -d '{
    "range": "1day",
    "perDay": 2,
    "timeFilter": "24h",
    "username": "admin",
    "userId": "12345",
    "fps": 10
  }'
```

#### Response
```json
{
  "success": true,
  "message": "Video created successfully",
  "video": {
    "id": "65f123abc456...",
    "cameraId": "69730ae8ebcf4689ef4eb4ae",
    "username": "admin",
    "userId": "12345",
    "url": "/videos/69730ae8ebcf4689ef4eb4ae_admin_1234567890.mp4",
    "duration": 12.5,
    "frameCount": 125,
    "range": "1day",
    "timeFilter": "24h",
    "perDay": 2,
    "createdAt": "2026-01-27T10:30:00.000Z"
  }
}
```

---

### 2. Get User Videos
**GET** `/api/snapshots/videos/user/:userId?cameraId=xxx`

Get all videos for a specific user.

#### Query Parameters
- `cameraId` (optional): Filter videos by camera ID

#### Example Request
```bash
# Get all videos for user
curl http://localhost:5000/api/snapshots/videos/user/12345

# Get videos for specific camera
curl http://localhost:5000/api/snapshots/videos/user/12345?cameraId=69730ae8ebcf4689ef4eb4ae
```

#### Response
```json
{
  "success": true,
  "count": 3,
  "videos": [
    {
      "_id": "65f123abc456...",
      "cameraId": "69730ae8ebcf4689ef4eb4ae",
      "username": "admin",
      "userId": "12345",
      "videoPath": "C:\\...\\public\\videos\\69730ae8ebcf4689ef4eb4ae_admin_1234567890.mp4",
      "url": "/videos/69730ae8ebcf4689ef4eb4ae_admin_1234567890.mp4",
      "duration": 12.5,
      "frameCount": 125,
      "range": "1day",
      "timeFilter": "24h",
      "perDay": 2,
      "createdAt": "2026-01-27T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Get Video by ID
**GET** `/api/snapshots/videos/:videoId`

Get details of a specific video.

#### Example Request
```bash
curl http://localhost:5000/api/snapshots/videos/65f123abc456...
```

#### Response
```json
{
  "success": true,
  "video": {
    "_id": "65f123abc456...",
    "cameraId": "69730ae8ebcf4689ef4eb4ae",
    "username": "admin",
    "userId": "12345",
    "url": "/videos/69730ae8ebcf4689ef4eb4ae_admin_1234567890.mp4",
    "duration": 12.5,
    "frameCount": 125,
    "range": "1day",
    "timeFilter": "24h",
    "perDay": 2,
    "createdAt": "2026-01-27T10:30:00.000Z"
  }
}
```

---

### 4. Delete Video
**DELETE** `/api/snapshots/videos/:videoId`

Delete a video and its file.

#### Example Request
```bash
curl -X DELETE http://localhost:5000/api/snapshots/videos/65f123abc456...
```

#### Response
```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

---

## Video Access

Videos can be accessed directly via URL:
```
http://localhost:5000/videos/69730ae8ebcf4689ef4eb4ae_admin_1234567890.mp4
```

Or embedded in HTML:
```html
<video controls width="1280" height="720">
  <source src="http://localhost:5000/videos/69730ae8ebcf4689ef4eb4ae_admin_1234567890.mp4" type="video/mp4">
</video>
```

---

## Notes

1. **Video Format**: Videos are created in MP4 format (H.264 codec) with 1280x720 resolution
2. **FPS**: Default is 10 frames per second, adjustable via `fps` parameter
3. **Storage**: Videos are stored in `public/videos/` directory
4. **Filename Format**: `{cameraId}_{username}_{timestamp}.mp4`
5. **Processing Time**: Video creation is asynchronous and may take a few seconds depending on the number of frames
6. **Database**: Video metadata is stored in MongoDB for easy retrieval and management
