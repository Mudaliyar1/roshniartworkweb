const mongoose = require('mongoose');

const AboutSchema = new mongoose.Schema({
  bio: { type: String, default: '' },
  journey: { type: String, default: '' },
  philosophy: { type: String, default: '' },
  inspiration: { type: String, default: '' },
  mission: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  social: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    youtube: { type: String, default: '' }
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('About', AboutSchema);