const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Media = require('../models/Media'); // Import the Media model

// Set storage engine to memory storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/uploads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
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