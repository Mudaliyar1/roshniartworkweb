const mongoose = require('mongoose');

const mediaBackupSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  thumbnailPath: {
    type: String,
  },
  originalName: {
    type: String,
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  // mediaData: {
  //   type: String, // Storing Base64 encoded string
  //   required: true,
  // },
  description: {
    type: String,
  },
  originalMediaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
    required: true,
  },
  backupDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MediaBackup', mediaBackupSchema);