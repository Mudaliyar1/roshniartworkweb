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
    mediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media'
    },
    isMain: {
      type: Boolean,
      default: false
    }
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
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Like'
  }]
});

// Generate slug before saving
ArtworkSchema.pre('save', async function(next) {
  if (!this.isModified('title')) return next();
  
  // Create base slug from title
  let baseSlug = slugify(this.title, {
    lower: true,
    strict: true
  });
  
  // If title is too short (like "s"), add a random suffix
  if (baseSlug.length <= 2) {
    baseSlug = baseSlug + '-artwork';
  }
  
  // Check for duplicate slugs
  let slug = baseSlug;
  let counter = 1;
  let slugExists = true;
  
  // Keep checking until we find a unique slug
  while (slugExists) {
    // Check if slug exists (except for current document)
    const existingArtwork = await mongoose.model('Artwork').findOne({ 
      slug: slug,
      _id: { $ne: this._id } 
    });
    
    if (!existingArtwork) {
      slugExists = false;
    } else {
      // If slug exists, add counter and try again
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  
  this.slug = slug;
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Artwork', ArtworkSchema);