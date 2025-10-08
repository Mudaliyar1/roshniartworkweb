require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Import models
const User = require('./models/User');
const SiteStyling = require('./models/SiteStyling');
const Artwork = require('./models/Artwork');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roshniartworkweb')
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Ensure uploads directories exist
const createDirs = () => {
  const dirs = [
    './public/uploads/images',
    './public/uploads/thumbnails',
    './public/uploads/videos'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

// Seed admin user
const seedAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || 'password123', 
      salt
    );
    
    const newAdmin = new User({
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: hashedPassword,
      isAdmin: true
    });
    
    await newAdmin.save();
    console.log('Admin user created successfully');
  } catch (err) {
    console.error('Error seeding admin user:', err);
  }
};

// Seed default site styling
const seedSiteStyling = async () => {
  try {
    const existingStyling = await SiteStyling.findOne({});
    
    if (existingStyling) {
      console.log('Site styling already exists');
      return;
    }
    
    const defaultStyling = new SiteStyling({
      primaryColor: '#3498db',
      secondaryColor: '#2c3e50',
      accentColor: '#e74c3c',
      backgroundColor: '#f8f9fa',
      textColor: '#333333',
      headingFont: 'Montserrat, sans-serif',
      bodyFont: 'Open Sans, sans-serif',
      headingSize: 2.5,
      bodySize: 1,
      logoPath: '/uploads/images/default-logo.svg'
    });
    
    await defaultStyling.save();
    console.log('Default site styling created successfully');
  } catch (err) {
    console.error('Error seeding site styling:', err);
  }
};

// Create default logo if it doesn't exist
const createDefaultLogo = () => {
  const logoPath = './public/uploads/images/default-logo.svg';
  
  if (!fs.existsSync(logoPath)) {
    const svgContent = `<svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="none"/>
      <text x="10" y="40" font-family="Arial" font-size="30" font-weight="bold" fill="#3498db">Roshni Art</text>
    </svg>`;
    
    fs.writeFileSync(logoPath, svgContent);
    console.log('Default logo created successfully');
  }
};

// Seed sample artwork
const seedSampleArtwork = async () => {
  try {
    const artworkCount = await Artwork.countDocuments();
    
    if (artworkCount > 0) {
      console.log('Sample artworks already exist');
      return;
    }
    
    // Create sample artwork
    const sampleArtwork = new Artwork({
      title: 'Sample Artwork',
      description: '<p>This is a sample artwork to demonstrate the portfolio functionality.</p><p>Replace this with your actual artwork.</p>',
      year: new Date().getFullYear(),
      tags: ['sample', 'demo'],
      images: [
        {
          path: '/uploads/images/sample-artwork.svg',
          thumbnailPath: '/uploads/thumbnails/sample-artwork.svg',
          isMain: true
        }
      ],
      isVisible: true
    });
    
    await sampleArtwork.save();
    console.log('Sample artwork created successfully');
    
    // Create sample artwork SVG
    const artworkSvgPath = './public/uploads/images/sample-artwork.svg';
    const thumbnailSvgPath = './public/uploads/thumbnails/sample-artwork.svg';
    
    if (!fs.existsSync(artworkSvgPath)) {
      const svgContent = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <circle cx="400" cy="300" r="150" fill="#3498db" opacity="0.7"/>
        <rect x="250" y="150" width="300" height="300" fill="#e74c3c" opacity="0.5"/>
        <polygon points="400,150 550,350 250,350" fill="#2ecc71" opacity="0.6"/>
        <text x="400" y="500" font-family="Arial" font-size="24" text-anchor="middle" fill="#333">Sample Artwork</text>
      </svg>`;
      
      fs.writeFileSync(artworkSvgPath, svgContent);
      fs.writeFileSync(thumbnailSvgPath, svgContent);
      console.log('Sample artwork image created successfully');
    }
  } catch (err) {
    console.error('Error seeding sample artwork:', err);
  }
};

// Create placeholder profile image
const createPlaceholderProfile = () => {
  const profilePath = './public/uploads/images/profile-placeholder.jpg';
  
  if (!fs.existsSync(profilePath)) {
    // Create a directory if it doesn't exist
    const dir = path.dirname(profilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create an SVG instead of JPG since we can't generate binary images
    const svgContent = `<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <circle cx="300" cy="230" r="130" fill="#ddd"/>
      <circle cx="300" cy="600" r="300" fill="#ddd"/>
      <text x="300" y="500" font-family="Arial" font-size="24" text-anchor="middle" fill="#333">Profile Placeholder</text>
    </svg>`;
    
    // Save as SVG instead
    fs.writeFileSync(profilePath.replace('.jpg', '.svg'), svgContent);
    console.log('Profile placeholder image created successfully (as SVG)');
  }
};

// Run all seed functions
const seedAll = async () => {
  try {
    createDirs();
    await seedAdminUser();
    await seedSiteStyling();
    createDefaultLogo();
    await seedSampleArtwork();
    createPlaceholderProfile();
    
    console.log('Database seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
};

// Run the seeding
seedAll();