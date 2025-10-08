const mongoose = require('mongoose');
const slugify = require('slugify');

const ArtworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  images: [{
    path: String,
    isMain: {
      type: Boolean,
      default: false
    },
    thumbnailPath: String
  }],
  video: {
    type: {
      type: String,
      enum: ['upload', 'embed', 'none', 'file'],
      default: 'none'
    },
    path: String,
    embedUrl: String
  },
  visibility: {
    type: String,
    enum: ['draft', 'public'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate slug before saving
ArtworkSchema.pre('save', function(next) {
  if (!this.isModified('title')) return next();
  
  this.slug = slugify(this.title, {
    lower: true,
    strict: true
  });
  
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Artwork', ArtworkSchema);