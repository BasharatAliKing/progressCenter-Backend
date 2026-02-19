import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for XER file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/xer");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);8
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept XER and XML files
const fileFilter = (req, file, cb) => {
  // Check file extension
  const allowedExtensions = ['.xer', '.XER', '.xml', '.XML'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExtension) || 
      file.mimetype === 'application/octet-stream' || 
      file.mimetype === 'text/xml' || 
      file.mimetype === 'application/xml') {
    cb(null, true);
  } else {
    cb(new Error('Only XER and XML files are allowed!'), false);
  }
};

// Multer configuration
export const xerUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Configure multer for Plugin image uploads
const pluginStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../public/images/plugins");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'plugin-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only images
const imageFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExtension) || 
      file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Multer configuration for plugins
export const pluginUpload = multer({
  storage: pluginStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Configure multer for side-by-side video uploads
const sideBySideVideoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../public/videos/side-by-side");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate filename in same format as snapshots: YYYYMMDDHHMM + sequential number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    
    const dateStr = `${year}${month}${day}`;
    const timeStr = `${hours}${minutes}`;
    
    // Get start and end of today to count videos
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Use timestamp-based unique identifier instead of relying on database count
    // Format: YYYYMMDDHHMM + milliseconds (ensures uniqueness)
    const milliseconds = String(now.getMilliseconds()).padStart(3, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    
    const filename = `${dateStr}${timeStr}${seconds}${milliseconds}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

const videoFilter = (req, file, cb) => {
  const allowedExtensions = ['.mp4', '.mov', '.webm', '.mkv', '.avi'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(fileExtension) || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

export const sideBySideVideoUpload = multer({
  storage: sideBySideVideoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  }
});

// Alternative flexible upload that accepts any field name but validates it's a video
export const sideBySideVideoUploadFlexible = multer({
  storage: sideBySideVideoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  }
}).any();

// Error handling middleware for multer
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
  }
  
  if (error.message === 'Only XER files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only XER files are allowed.'
    });
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only image files are allowed.'
    });
  }
  
  next(error);
};

export const handleVideoUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 500MB.'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Please send the video file with field name "video".'
      });
    }
  }

  if (error.message === 'Only video files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only video files are allowed.'
    });
  }

  next(error);
};