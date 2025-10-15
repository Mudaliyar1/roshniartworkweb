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
  // Accept all file types
  cb(null, true);
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