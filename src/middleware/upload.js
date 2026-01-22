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
    cb(null, uploadPath);
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
  
  next(error);
};