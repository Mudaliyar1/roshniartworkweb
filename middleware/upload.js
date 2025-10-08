const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set storage engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let uploadPath;
    
    // Determine upload path based on file type
    if (file.fieldname === 'logo') {
      uploadPath = './public/uploads/images';
    } else if (file.mimetype.startsWith('image/')) {
      uploadPath = './public/uploads/images';
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath = './public/uploads/videos';
    } else {
      uploadPath = './public/uploads';
    }
    
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    // Generate unique filename with timestamp
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  const allowedVideoTypes = ['video/mp4', 'video/webm'];
  
  if (file.fieldname === 'logo') {
    // Logo can only be image
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Logo must be an image file (JPG, PNG, WebP, or SVG)'), false);
    }
  } else if (file.fieldname === 'images' || file.fieldname === 'artworkImages') {
    // Images
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WebP, and SVG images are allowed'), false);
    }
  } else if (file.fieldname === 'video' || file.fieldname === 'videoFile') {
    // Videos
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP4 and WebM videos are allowed'), false);
    }
  } else {
    cb(null, false);
  }
};

// File size limits
const limits = {
  fileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024 // 10MB default
};

// Export multer middleware
module.exports = multer({
  storage,
  fileFilter,
  limits
});