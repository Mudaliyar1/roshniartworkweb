const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Media = require('../models/Media'); // Import the Media model

// Set storage engine to memory storage for better control
const storage = multer.memoryStorage();

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