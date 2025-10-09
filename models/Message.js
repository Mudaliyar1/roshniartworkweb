const mongoose = require('mongoose');
const sanitizeHtml = require('sanitize-html');

const MessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Sanitize HTML before saving
MessageSchema.pre('save', function(next) {
  console.log('Message pre-save hook triggered for:', this.name);
  
  if (this.isModified('message')) {
    this.message = sanitizeHtml(this.message, {
      allowedTags: [],
      allowedAttributes: {}
    });
  }
  
  if (this.isModified('subject')) {
    this.subject = sanitizeHtml(this.subject, {
      allowedTags: [],
      allowedAttributes: {}
    });
  }
  
  next();
});

module.exports = mongoose.model('Message', MessageSchema);