const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  originalName: {
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
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  filePath: {
    type: String, // Storing the path to the file on the server
    required: true,
  },
  thumbnailPath: {
    type: String, // Storing the path to the thumbnail file on the server
  },
  description: {
    type: String,
  },
  backupStatus: {
    type: Boolean,
    default: false,
  },
  // New fields for binary storage
  fileData: {
    type: Buffer, // Binary data of the file
    required: false,
  },
  thumbnailData: {
    type: Buffer, // Binary data of the thumbnail
    required: false,
  },
  isStoredInDB: {
    type: Boolean, // Indicates if binary data is stored in MongoDB
    default: false,
  },
  lastSynced: {
    type: Date, // Last time the file was synced from DB to filesystem
    default: null,
  },
});

module.exports = mongoose.model('Media', mediaSchema);