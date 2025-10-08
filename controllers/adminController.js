const Artwork = require('../models/Artwork');
const Message = require('../models/Message');
const SiteStyling = require('../models/SiteStyling');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const sanitizeHtml = require('sanitize-html');
const { createObjectCsvWriter } = require('csv-writer');

// Dashboard
exports.getDashboard = async (req, res) => {
  try {
    // Get stats for dashboard
    const totalArtworks = await Artwork.countDocuments();
    const draftArtworks = await Artwork.countDocuments({ visibility: 'draft' });
    const unreadMessages = await Message.countDocuments({ isRead: false });
    
    // Get recent artworks
    const recentArtworks = await Artwork.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get recent messages
    const recentMessages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      layout: 'layouts/admin',
      stats: {
        totalArtworks,
        draftArtworks,
        unreadMessages
      },
      recentArtworks,
      recentMessages
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error_msg', 'An error occurred while loading the dashboard');
    res.redirect('/admin');
  }
};

// Get all artworks
exports.getArtworks = async (req, res) => {
  try {
    const { search, tag, visibility, page = 1 } = req.query;
    const limit = 10; // Number of items per page
    const skip = (page - 1) * limit;
    let query = {};
    
    // Apply search filter if provided
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    // Apply tag filter if provided
    if (tag) {
      query.tags = tag;
    }
    
    // Apply visibility filter if provided
    if (visibility) {
      query.visibility = visibility;
    }
    
    // Count total documents for pagination
    const totalArtworks = await Artwork.countDocuments(query);
    const totalPages = Math.ceil(totalArtworks / limit);
    const currentPage = parseInt(page);
    
    // Get paginated artworks
    const artworks = await Artwork.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get all unique tags for the filter dropdown
    const allTags = await Artwork.distinct('tags');
    
    res.render('admin/artworks-list', {
      title: 'Manage Artworks',
      layout: 'layouts/admin',
      artworks,
      search: search || '',
      tag: tag || '',
      visibility: visibility || '',
      tags: allTags,
      totalPages,
      currentPage,
      totalArtworks
    });
  } catch (error) {
    console.error('Get artworks error:', error);
    req.flash('error_msg', 'An error occurred while loading artworks');
    res.redirect('/admin');
  }
};

// New artwork form
exports.getNewArtwork = (req, res) => {
  // Create an empty artwork object with default values
  const emptyArtwork = {
    title: '',
    description: '',
    medium: '',
    dimensions: '',
    year: new Date().getFullYear(),
    price: '',
    tags: [],
    visibility: 'hidden',
    featured: false,
    images: []
  };
  
  res.render('admin/artwork-form', {
    title: 'Add New Artwork',
    layout: 'layouts/admin',
    artwork: emptyArtwork
  });
};

// Create artwork
exports.createArtwork = async (req, res) => {
  try {
    const { title, description, year, tags, isVisible, videoType, videoEmbed } = req.body;
    
    // Validate input
    if (!title || !description || !year) {
      req.flash('error_msg', 'Please fill in all required fields');
      return res.redirect('/admin/artworks/new');
    }
    
    // Process tags
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    
    // Create new artwork
    const newArtwork = new Artwork({
      title,
      description: sanitizeHtml(description),
      year,
      tags: tagArray,
      visibility: isVisible ? 'public' : 'hidden',
      video: {
        type: videoType || 'none',
        embedUrl: videoEmbed || ''
      },
      images: []
    });
    
    // Process uploaded images
    if (req.files && req.files.length > 0) {
      // Create thumbnails directory if it doesn't exist
      const thumbnailDir = './public/uploads/thumbnails';
      fs.mkdirSync(thumbnailDir, { recursive: true });
      
      // Process each image
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const isMain = i === 0; // First image is main by default
        
        // Generate thumbnail
        const thumbnailFilename = `thumb-${path.basename(file.filename)}`;
        const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
        
        await sharp(file.path)
          .resize(300, 300, { fit: 'inside' })
          .toFile(path.join('public', 'uploads', 'thumbnails', thumbnailFilename));
        
        // Add image to artwork
        newArtwork.images.push({
          path: `/uploads/images/${file.filename}`,
          thumbnailPath: `/uploads/thumbnails/${thumbnailFilename}`,
          isMain
        });
      }
    }
    
    await newArtwork.save();
    
    req.flash('success_msg', 'Artwork added successfully');
    res.redirect('/admin/artworks');
  } catch (error) {
    console.error('Create artwork error:', error);
    req.flash('error_msg', 'An error occurred while creating the artwork');
    res.redirect('/admin/artworks/new');
  }
};

// Get single artwork
exports.getArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      req.flash('error_msg', 'Artwork not found');
      return res.redirect('/admin/artworks');
    }
    
    res.render('admin/artwork-form', {
      title: `Edit ${artwork.title}`,
      layout: 'layouts/admin',
      artwork
    });
  } catch (error) {
    console.error('Get artwork error:', error);
    req.flash('error_msg', 'An error occurred while loading the artwork');
    res.redirect('/admin/artworks');
  }
};

// Update artwork
exports.updateArtwork = async (req, res) => {
  try {
    const { title, description, year, tags, isVisible, videoType, videoEmbed } = req.body;
    
    // Find artwork
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      req.flash('error_msg', 'Artwork not found');
      return res.redirect('/admin/artworks');
    }
    
    // Update fields
    artwork.title = title;
    artwork.description = sanitizeHtml(description);
    artwork.year = year;
    artwork.tags = tags ? tags.split(',').map(tag => tag.trim()) : [];
    artwork.visibility = isVisible ? 'public' : 'draft';
    
    // Handle video updates
    artwork.video.type = videoType || 'none';
    
    // Handle video embed URL if provided
    if (videoType === 'embed') {
      artwork.video.embedUrl = videoEmbed || '';
    } else {
      artwork.video.embedUrl = '';
    }
    
    // Handle video file upload if provided
    if (req.files && req.files.videoFile && req.files.videoFile.length > 0) {
      const videoFile = req.files.videoFile[0];
      artwork.video.path = `/uploads/videos/${videoFile.filename}`;
    }
    
    // Remove video if requested
    if (req.body.removeVideo) {
      artwork.video.path = '';
    }
    
    // If video type is none, clear path and embedUrl
    if (videoType === 'none') {
      artwork.video.path = '';
      artwork.video.embedUrl = '';
    }
    
    // Process new images
    if (req.files && req.files.images && req.files.images.length > 0) {
      // Create thumbnails directory if it doesn't exist
      const thumbnailDir = './public/uploads/thumbnails';
      fs.mkdirSync(thumbnailDir, { recursive: true });
      
      // Process each image
      for (const file of req.files.images) {
        // Generate thumbnail
        const thumbnailFilename = `thumb-${path.basename(file.filename)}`;
        const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
        
        await sharp(file.path)
          .resize(300, 300, { fit: 'inside' })
          .toFile(path.join('public', 'uploads', 'thumbnails', thumbnailFilename));
        
        // Add image to artwork
        artwork.images.push({
          path: `/uploads/images/${file.filename}`,
          thumbnailPath: `/uploads/thumbnails/${thumbnailFilename}`,
          isMain: artwork.images.length === 0 // Set as main if no other images
        });
      }
    }
    
    // Make sure at least one image is set as main
    if (artwork.images.length > 0 && !artwork.images.some(img => img.isMain)) {
      artwork.images[0].isMain = true;
    }
    
    await artwork.save();
    
    req.flash('success_msg', 'Artwork updated successfully');
    res.redirect('/admin/artworks');
  } catch (error) {
    console.error('Update artwork error:', error);
    req.flash('error_msg', 'An error occurred while updating the artwork');
    res.redirect(`/admin/artworks/${req.params.id}`);
  }
};

// Delete artwork
exports.deleteArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      req.flash('error_msg', 'Artwork not found');
      return res.redirect('/admin/artworks');
    }
    
    // Delete image files
    for (const image of artwork.images) {
      try {
        // Delete main image
        if (image.path) {
          const imagePath = path.join('public', image.path);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
        
        // Delete thumbnail
        if (image.thumbnailPath) {
          const thumbnailPath = path.join('public', image.thumbnailPath);
          if (fs.existsSync(thumbnailPath)) {
            fs.unlinkSync(thumbnailPath);
          }
        }
      } catch (err) {
        console.error('Error deleting image file:', err);
      }
    }
    
    // Delete video file if uploaded
    if (artwork.video.type === 'upload' && artwork.video.path) {
      try {
        const videoPath = path.join('public', artwork.video.path);
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
        }
      } catch (err) {
        console.error('Error deleting video file:', err);
      }
    }
    
    // Delete artwork from database
    await artwork.deleteOne();
    
    req.flash('success_msg', 'Artwork deleted successfully');
    res.redirect('/admin/artworks');
  } catch (error) {
    console.error('Delete artwork error:', error);
    req.flash('error_msg', 'An error occurred while deleting the artwork');
    res.redirect('/admin/artworks');
  }
};

// Get all messages
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    
    res.render('admin/messages/index', {
      title: 'Messages',
      layout: 'layouts/admin',
      messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    req.flash('error_msg', 'An error occurred while loading messages');
    res.redirect('/admin');
  }
};

// Get single message
exports.getMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      req.flash('error_msg', 'Message not found');
      return res.redirect('/admin/messages');
    }
    
    // Mark as read
    if (!message.isRead) {
      message.isRead = true;
      await message.save();
    }
    
    res.render('admin/messages/view', {
      title: 'View Message',
      layout: 'layouts/admin',
      message
    });
  } catch (error) {
    console.error('Get message error:', error);
    req.flash('error_msg', 'An error occurred while loading the message');
    res.redirect('/admin/messages');
  }
};

// Mark message as read
exports.markMessageAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    message.isRead = !message.isRead; // Toggle read status
    await message.save();
    
    res.json({ success: true, isRead: message.isRead });
  } catch (error) {
    console.error('Mark message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      req.flash('error_msg', 'Message not found');
      return res.redirect('/admin/messages');
    }
    
    await message.deleteOne();
    
    req.flash('success_msg', 'Message deleted successfully');
    res.redirect('/admin/messages');
  } catch (error) {
    console.error('Delete message error:', error);
    req.flash('error_msg', 'An error occurred while deleting the message');
    res.redirect('/admin/messages');
  }
};

// Export messages to CSV
exports.exportMessages = async (req, res) => {
  try {
    const { messageIds } = req.body;
    
    // Find messages to export
    let messages;
    if (messageIds && messageIds.length > 0) {
      messages = await Message.find({ _id: { $in: messageIds } });
    } else {
      messages = await Message.find();
    }
    
    if (messages.length === 0) {
      req.flash('error_msg', 'No messages to export');
      return res.redirect('/admin/messages');
    }
    
    // Create CSV file
    const csvFilePath = path.join('public', 'uploads', 'messages-export.csv');
    const csvWriter = createObjectCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'name', title: 'Name' },
        { id: 'email', title: 'Email' },
        { id: 'subject', title: 'Subject' },
        { id: 'message', title: 'Message' },
        { id: 'isRead', title: 'Read' },
        { id: 'createdAt', title: 'Date' }
      ]
    });
    
    // Format data for CSV
    const records = messages.map(msg => ({
      name: msg.name,
      email: msg.email,
      subject: msg.subject || '',
      message: msg.message,
      isRead: msg.isRead ? 'Yes' : 'No',
      createdAt: msg.createdAt.toISOString().split('T')[0]
    }));
    
    await csvWriter.writeRecords(records);
    
    // Send file
    res.download(csvFilePath, 'messages-export.csv', err => {
      if (err) {
        console.error('Download error:', err);
        req.flash('error_msg', 'An error occurred while downloading the file');
        return res.redirect('/admin/messages');
      }
      
      // Delete file after download
      fs.unlinkSync(csvFilePath);
    });
  } catch (error) {
    console.error('Export messages error:', error);
    req.flash('error_msg', 'An error occurred while exporting messages');
    res.redirect('/admin/messages');
  }
};

// Get styling page
exports.getStyling = async (req, res) => {
  try {
    const siteStyles = await SiteStyling.findOne();
    
    res.render('admin/styling', {
      title: 'Site Styling',
      layout: 'layouts/admin',
      siteStyles
    });
  } catch (error) {
    console.error('Get styling error:', error);
    req.flash('error_msg', 'An error occurred while loading styling options');
    res.redirect('/admin');
  }
};

// Update styling
exports.updateStyling = async (req, res) => {
  try {
    const {
      primaryColor,
      secondaryColor,
      backgroundColor,
      fontFamily,
      baseFontSize,
      headingScale,
      buttonRadius,
      headerTextColor,
      footerTextColor
    } = req.body;
    
    // Find or create site styling
    let siteStyles = await SiteStyling.findOne();
    
    if (!siteStyles) {
      siteStyles = new SiteStyling();
    }
    
    // Update fields
    siteStyles.primaryColor = primaryColor;
    siteStyles.secondaryColor = secondaryColor;
    siteStyles.backgroundColor = backgroundColor;
    siteStyles.fontFamily = fontFamily;
    siteStyles.baseFontSize = baseFontSize;
    siteStyles.headingScale = headingScale;
    siteStyles.buttonRadius = buttonRadius;
    siteStyles.headerTextColor = headerTextColor;
    siteStyles.footerTextColor = footerTextColor;
    siteStyles.updatedAt = Date.now();
    
    // Process logo if uploaded
    if (req.file) {
      // Delete old logo if it exists and is not the default
      if (siteStyles.logoPath && siteStyles.logoPath !== '/images/default-logo.svg') {
        try {
          const oldLogoPath = path.join('public', siteStyles.logoPath);
          if (fs.existsSync(oldLogoPath)) {
            fs.unlinkSync(oldLogoPath);
          }
        } catch (err) {
          console.error('Error deleting old logo:', err);
        }
      }
      
      // Set new logo path
      siteStyles.logoPath = `/uploads/images/${req.file.filename}`;
    }
    
    await siteStyles.save();
    
    req.flash('success_msg', 'Site styling updated successfully');
    res.redirect('/admin/styling');
  } catch (error) {
    console.error('Update styling error:', error);
    req.flash('error_msg', 'An error occurred while updating styling');
    res.redirect('/admin/styling');
  }
};

// Reset styling to defaults
exports.resetStyling = async (req, res) => {
  try {
    // Find site styling
    const siteStyles = await SiteStyling.findOne();
    
    if (siteStyles) {
      // Delete custom logo if it exists
      if (siteStyles.logoPath && siteStyles.logoPath !== '/images/default-logo.svg') {
        try {
          const logoPath = path.join('public', siteStyles.logoPath);
          if (fs.existsSync(logoPath)) {
            fs.unlinkSync(logoPath);
          }
        } catch (err) {
          console.error('Error deleting logo:', err);
        }
      }
      
      // Delete the document
      await siteStyles.deleteOne();
    }
    
    // Create new document with defaults
    await new SiteStyling().save();
    
    req.flash('success_msg', 'Site styling reset to defaults');
    res.redirect('/admin/styling');
  } catch (error) {
    console.error('Reset styling error:', error);
    req.flash('error_msg', 'An error occurred while resetting styling');
    res.redirect('/admin/styling');
  }
};