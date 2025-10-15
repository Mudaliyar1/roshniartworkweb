const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
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
  operation: {
    type: String,
    enum: ['backup', 'restore', 'sync'],
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'skipped'],
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  environment: {
    type: String,
    enum: ['local', 'production', 'development'],
    default: 'local',
  },
  errorDetails: {
    type: String,
    default: '',
  },
});

// Index for efficient querying
syncLogSchema.index({ timestamp: -1 });
syncLogSchema.index({ fileName: 1 });
syncLogSchema.index({ operation: 1, status: 1 });

module.exports = mongoose.model('SyncLog', syncLogSchema);