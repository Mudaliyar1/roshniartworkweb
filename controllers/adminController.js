// --- ABOUT PAGE MANAGEMENT ---
const About = require('../models/About');
const Artwork = require('../models/Artwork');
const Comment = require('../models/Comment');
const Media = require('../models/Media'); // Import the Media model
const Backup = require('../models/Backup'); // Import the Backup model
const User = require('../models/User');
const Message = require('../models/Message');
const SiteStyling = require('../models/SiteStyling');
const sharp = require('sharp');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const sanitizeHtml = require('sanitize-html');
const { createObjectCsvWriter } = require('csv-writer');

const uploadDir = path.join(__dirname, '../public/uploads');

// Show About edit form
exports.getEditAbout = async (req, res) => {
  let about = await About.findOne();
  if (!about) about = new About();
  res.render('admin/about-form', {
    title: 'Edit About Page',
    layout: 'layouts/admin',
    about
  });
};

// Update About info (with image upload)
exports.updateAbout = async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) about = new About();
    about.bio = req.body.bio || '';
    about.journey = req.body.journey || '';
    about.philosophy = req.body.philosophy || '';
    about.inspiration = req.body.inspiration || '';
    about.mission = req.body.mission || '';
    about.social = {
      instagram: req.body.instagram || '',
      facebook: req.body.facebook || '',
      twitter: req.body.twitter || '',
      youtube: req.body.youtube || ''
    };
    // Debug: log file info
    console.log('About update: req.file =', req.file);
    // Handle profile image upload
    if (req.file && req.file.fieldname === 'profileImage') {
      about.profileImage = '/uploads/images/' + req.file.filename;
      console.log('About update: profileImage set to', about.profileImage);
    } else {
      console.log('About update: No new profile image uploaded.');
    }
    about.updatedAt = Date.now();
    await about.save();
    console.log('About update: Saved about document:', about);
    req.flash('success_msg', 'About page updated successfully');
    res.redirect('/admin/about');
  } catch (error) {
    console.error('Update about error:', error);
    req.flash('error_msg', 'An error occurred while updating About page');
    res.redirect('/admin/about');
  }
};
// --- ADMIN PROFILE MANAGEMENT ---

// List all admins
exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ isAdmin: true });
    res.render('admin/admins-list', {
      title: 'Admin Management',
      layout: 'layouts/admin',
      admins
    });
  } catch (error) {
    console.error('Get admins error:', error);
    req.flash('error_msg', 'An error occurred while loading admins');
    res.redirect('/admin');
  }
};

// Show add admin form
exports.getAddAdmin = (req, res) => {
  res.render('admin/admin-form', {
    title: 'Add Admin',
    layout: 'layouts/admin',
    admin: {},
    editMode: false
  });
};

// Create new admin
exports.createAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      req.flash('error_msg', 'Please fill in all fields');
      return res.redirect('/admin/admins/new');
    }
    const existing = await User.findOne({ email });
    if (existing) {
      req.flash('error_msg', 'Email already exists');
      return res.redirect('/admin/admins/new');
    }
    const newAdmin = new User({ email, password, isAdmin: true });
    await newAdmin.save();
    req.flash('success_msg', 'Admin created successfully');
    res.redirect('/admin/admins');
  } catch (error) {
    console.error('Create admin error:', error);
    req.flash('error_msg', 'An error occurred while creating admin');
    res.redirect('/admin/admins/new');
  }
};

// Show edit admin form
exports.getEditAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin || !admin.isAdmin) {
      req.flash('error_msg', 'Admin not found');
      return res.redirect('/admin/admins');
    }
    res.render('admin/admin-form', {
      title: 'Edit Admin',
      layout: 'layouts/admin',
      admin,
      editMode: true
    });
  } catch (error) {
    console.error('Get edit admin error:', error);
    req.flash('error_msg', 'An error occurred while loading admin');
    res.redirect('/admin/admins');
  }
};

// Update admin
exports.updateAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findById(req.params.id);
    if (!admin || !admin.isAdmin) {
      req.flash('error_msg', 'Admin not found');
      return res.redirect('/admin/admins');
    }
    admin.email = email;
    if (password) admin.password = password;
    await admin.save();
    req.flash('success_msg', 'Admin updated successfully');
    res.redirect('/admin/admins');
  } catch (error) {
    console.error('Update admin error:', error);
    req.flash('error_msg', 'An error occurred while updating admin');
    res.redirect('/admin/admins');
  }
};

// Delete admin
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin || !admin.isAdmin) {
      req.flash('error_msg', 'Admin not found');
      return res.redirect('/admin/admins');
    }
    await admin.deleteOne();
    req.flash('success_msg', 'Admin deleted successfully');
    res.redirect('/admin/admins');
  } catch (error) {
    console.error('Delete admin error:', error);
    req.flash('error_msg', 'An error occurred while deleting admin');
    res.redirect('/admin/admins');
  }
};

// Dashboard
exports.getDashboard = async (req, res) => {
  try {
    console.log('Loading dashboard stats...');
    
    // Get stats for dashboard with error handling for each query
    let artworkCount = 0;
    let totalMessages = 0;
    let unreadMessageCount = 0;
    let mediaCount = 0;
    let recentArtworks = [];
    let recentMessages = [];
    
    try {
      artworkCount = await Artwork.countDocuments();
      console.log('Artwork count:', artworkCount);
    } catch (err) {
      console.error('Error counting artworks:', err);
      artworkCount = 0;
    }
    
    try {
      totalMessages = await Message.countDocuments();
      unreadMessageCount = await Message.countDocuments({ isRead: false });
      console.log('Message count:', totalMessages, 'Unread:', unreadMessageCount);
    } catch (err) {
      console.error('Error counting messages:', err);
      totalMessages = 0;
      unreadMessageCount = 0;
    }
    
    try {
      // Count media files (images and videos)
      const artworks = await Artwork.find().select('images video').populate('images.mediaId').populate('video.mediaId');
      artworks.forEach(artwork => {
        if (artwork.images && Array.isArray(artwork.images)) {
          mediaCount += artwork.images.length;
        }
        if (artwork.video && (artwork.video.type === 'file' || artwork.video.type === 'upload')) {
          mediaCount += 1;
        }
      });
      console.log('Media count:', mediaCount);
    } catch (err) {
      console.error('Error counting media:', err);
      mediaCount = 0;
    }
    
    try {
      // Get recent artworks
      recentArtworks = await Artwork.find()
        .select('title createdAt isVisible images')
        .sort({ createdAt: -1 })
        .limit(5);
      console.log('Recent artworks:', recentArtworks.length);
    } catch (err) {
      console.error('Error fetching recent artworks:', err);
      recentArtworks = [];
    }
    
    try {
      // Get recent messages
      recentMessages = await Message.find()
        .select('name email subject message isRead createdAt')
        .sort({ createdAt: -1 })
        .limit(5);
      console.log('Recent messages:', recentMessages.length);
    } catch (err) {
      console.error('Error fetching recent messages:', err);
      recentMessages = [];
    }
    
    const dashboardData = {
      title: 'Admin Dashboard',
      layout: 'layouts/admin',
      stats: {
        artworkCount: Number(artworkCount) || 0,
        messageCount: Number(totalMessages) || 0,
        unreadMessageCount: Number(unreadMessageCount) || 0,
        mediaCount: Number(mediaCount) || 0
      },
      recentArtworks: recentArtworks || [],
      recentMessages: recentMessages || []
    };
    
    console.log('Dashboard stats:', dashboardData.stats);
    res.render('admin/dashboard', dashboardData);
    
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error_msg', 'An error occurred while loading the dashboard');
    
    // Still render the dashboard with default values
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      layout: 'layouts/admin',
      stats: {
        artworkCount: 0,
        messageCount: 0,
        unreadMessageCount: 0,
        mediaCount: 0
      },
      recentArtworks: [],
      recentMessages: []
    });
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
      .populate('comments')
      .populate('likes')
      .populate('images.mediaId')
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
    
    // Process uploaded images (support multer.fields)
    if (req.files && req.files.images && req.files.images.length > 0) {
      for (let i = 0; i < req.files.images.length; i++) {
        const file = req.files.images[i];
        const isMain = i === 0; // First image is main by default

        const thumbnailDir = './public/uploads/thumbnails';
        if (!fs.existsSync(thumbnailDir)) {
          fs.mkdirSync(thumbnailDir, { recursive: true });
        }

        const thumbnailFilename = `thumb-${file.filename}`;
        await sharp(file.path)
          .resize(300, 300, { fit: 'inside' })
          .toFile(path.join('public', 'uploads', 'thumbnails', thumbnailFilename));
        const thumbnailFilePath = `/uploads/thumbnails/${thumbnailFilename}`;

        const newMedia = new Media({
          fileName: file.originalname,
          originalName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          filePath: `/uploads/${file.filename}`, // Use file.filename directly for consistency
          thumbnailPath: thumbnailFilePath, // Set thumbnailPath here
          description: req.body[`imageDescription-${i}`] || '',
        });
        await newMedia.save(); // Save newMedia after thumbnailPath is set

        newArtwork.images.push({
          mediaId: newMedia._id,
          isMain,
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
    const artwork = await Artwork.findById(req.params.id).populate('images.mediaId');
    
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
    
    // Validate description
    if (!description || description.trim() === '') {
      req.flash('error_msg', 'Description is required.');
      return res.redirect(`/admin/artworks/${req.params.id}`);
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
      for (let i = 0; i < req.files.images.length; i++) {
        const file = req.files.images[i];
        const isMain = req.body[`mainImage-${i}`] === 'on';

        const thumbnailDir = './public/uploads/thumbnails';
        if (!fs.existsSync(thumbnailDir)) {
          fs.mkdirSync(thumbnailDir, { recursive: true });
        }

        const thumbnailFilename = `thumb-${file.filename}`;
        await sharp(file.path)
          .resize(300, 300, { fit: 'inside' })
          .toFile(path.join('public', 'uploads', 'thumbnails', thumbnailFilename));
        const thumbnailFilePath = `/uploads/thumbnails/${thumbnailFilename}`;

        const newMedia = new Media({
          fileName: file.originalname,
          originalName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          filePath: `/uploads/${file.filename}`,
          thumbnailPath: thumbnailFilePath,
          description: req.body[`imageDescription-${i}`] || '',
        });
        await newMedia.save();

        artwork.images.push({
          mediaId: newMedia._id,
          isMain,
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
    console.log('Retrieved messages from database:', messages.length, 'messages found');
    
    // Process messages to ensure proper ID serialization
    const processedMessages = messages.map(message => {
      const messageObj = message.toObject(); // Convert to plain object
      messageObj._id = message._id.toString(); // Ensure _id is a string
      console.log('Processed message:', {
        id: messageObj._id,
        name: messageObj.name,
        idType: typeof messageObj._id
      });
      return messageObj;
    }).filter(message => {
      // Filter out any messages with invalid IDs
      if (!message._id || message._id === 'undefined' || message._id === 'null') {
        console.warn('Found message with invalid ID:', message);
        return false;
      }
      return true;
    });
    
    if (processedMessages.length > 0) {
      console.log('Sample processed message:', {
        id: processedMessages[0]._id,
        name: processedMessages[0].name,
        email: processedMessages[0].email,
        createdAt: processedMessages[0].createdAt,
        idType: typeof processedMessages[0]._id
      });
    }
    
    if (processedMessages.length !== messages.length) {
      console.warn(`Filtered out ${messages.length - processedMessages.length} messages with invalid IDs`);
    }
    
    res.render('admin/messages/index', {
      title: 'Messages',
      layout: 'layouts/admin',
      messages: processedMessages
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

// Get delete message confirmation page
exports.getDeleteMessage = async (req, res) => {
  try {
    console.log('Getting delete confirmation page for message ID:', req.params.id);
    
    // Validate the message ID format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('Invalid message ID format:', req.params.id);
      req.flash('error_msg', 'Invalid message ID');
      return res.redirect('/admin/messages');
    }
    
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      console.error('Message not found with ID:', req.params.id);
      req.flash('error_msg', 'Message not found');
      return res.redirect('/admin/messages');
    }
    
    console.log('Rendering delete confirmation page for message:', message.name);
    res.render('admin/messages/delete', {
      title: `Delete Message from ${message.name}`,
      layout: 'layouts/admin',
      message: message
    });
  } catch (error) {
    console.error('Get delete message error:', error);
    req.flash('error_msg', 'An error occurred while loading the delete confirmation page');
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

// Toggle message read status (form submission)
exports.toggleMessageRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      req.flash('error_msg', 'Message not found');
      return res.redirect('/admin/messages');
    }
    
    message.isRead = !message.isRead; // Toggle read status
    await message.save();
    
    const statusText = message.isRead ? 'read' : 'unread';
    req.flash('success_msg', `Message marked as ${statusText}`);
    res.redirect(`/admin/messages/${message._id}`);
  } catch (error) {
    console.error('Toggle message read error:', error);
    req.flash('error_msg', 'An error occurred while updating the message');
    res.redirect('/admin/messages');
  }
};

// Delete message (form submission)
exports.deleteMessageForm = async (req, res) => {
  try {
    console.log('DeleteMessageForm called with id:', req.params.id);
    console.log('Full request params:', req.params);
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    
    // Validate the message ID
    if (!req.params.id || req.params.id === 'undefined' || req.params.id === 'null') {
      console.error('Invalid message ID received:', req.params.id);
      req.flash('error_msg', 'Invalid message ID. Please try again.');
      return res.redirect('/admin/messages');
    }

    // Check if the ID is a valid MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('Invalid MongoDB ObjectId format:', req.params.id);
      req.flash('error_msg', 'Invalid message ID format. Please try again.');
      return res.redirect('/admin/messages');
    }
    
    const message = await Message.findById(req.params.id);
    if (!message) {
      console.error('Message not found with ID:', req.params.id);
      req.flash('error_msg', 'Message not found. It may have already been deleted.');
      return res.redirect('/admin/messages');
    }
    
    console.log('Found message to delete:', { id: message._id, name: message.name, email: message.email });
    await message.deleteOne();
    console.log('Message deleted successfully');
    
    req.flash('success_msg', 'Message deleted successfully');
    res.redirect('/admin/messages');
  } catch (error) {
    console.error('Delete message form error:', error);
    console.error('Error stack:', error.stack);
    req.flash('error_msg', 'An error occurred while deleting the message. Please try again or contact support.');
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

// Get artwork comments
// Function to generate a random username (server-side)
function generateRandomUsername() {
  const adjectives = ['Happy', 'Creative', 'Artistic', 'Vibrant', 'Inspired', 'Dreamy', 'Colorful', 'Unique', 'Bold', 'Gentle'];
  const nouns = ['Artist', 'Viewer', 'Lover', 'Explorer', 'Critic', 'Fan', 'Soul', 'Mind', 'Spirit', 'Creator'];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);
  return `${randomAdjective}${randomNoun}${randomNumber}`;
}

exports.getArtworkComments = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      req.flash('error', 'Artwork not found.');
      return res.redirect('/admin/artworks');
    }
    const comments = await Comment.find({ artwork: req.params.id }).populate('user', 'username');

    comments.forEach(comment => {
      if (comment.user && comment.user.username) {
        comment.displayUsername = comment.user.username;
      } else {
        comment.displayUsername = generateRandomUsername();
      }
    });

    res.render('admin/artwork-comments', {
      title: `Comments for ${artwork.title}`,
      layout: 'layouts/admin',
      artwork,
      comments,
      currentRoute: '/admin/artworks'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error fetching artwork comments.');
    res.redirect('/admin/artworks');
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    const artworkId = comment.artwork;
    if (!comment) {
      req.flash('error', 'Comment not found.');
      return res.redirect('back');
    }

    await Comment.deleteOne({ _id: req.params.id });
    await Artwork.findByIdAndUpdate(artworkId, { $pull: { comments: comment._id } });

    req.flash('success', 'Comment deleted successfully.');
    res.redirect(`/admin/artworks/${artworkId}/comments`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error deleting comment.');
    res.redirect('back');
  }
};

// Create Media Backup
async function createMediaBackupLogic() {
  try {
    const mediaItems = await Media.find({});
    if (mediaItems.length === 0) {
      console.log('No media items to backup.');
      return { success: false, message: 'No media items to backup.' };
    }

    const backup = new Backup({
      backupDate: new Date(),
      mediaItems: mediaItems.filter(item => 
        item.originalMediaId && item.fileName && item.originalName && item.fileType && item.fileSize && item.filePath
      ).map(item => ({
        originalMediaId: item._id,
        fileName: item.fileName,
        originalName: item.originalName,
        fileType: item.fileType,
        fileSize: item.fileSize,
        filePath: item.filePath,
        description: item.description,
        thumbnailPath: item.thumbnailPath,
      })),
    });
    await backup.save();
    console.log('Media backup created successfully.');
    return { success: true, message: 'Media backup created successfully.' };
  } catch (error) {
    console.error('Error creating media backup:', error);
    return { success: false, message: 'Error creating media backup.' };
  }
}

exports.createMediaBackup = async (req, res) => {
  const result = await createMediaBackupLogic();
  if (result.success) {
    req.flash('success', result.message);
  } else {
    req.flash('error', result.message);
  }
  res.redirect('/admin/media');
};

// Get Media Management Page
exports.getMediaManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch standalone media
    const standaloneMedia = await Media.find().sort({ uploadDate: -1 });

    // Fetch media from artworks
    const artworks = await Artwork.find().select('images video');
    let artworkMedia = [];

    artworks.forEach(artwork => {
      if (artwork.images && Array.isArray(artwork.images)) {
        artwork.images.forEach(image => {
          const mediaPath = image.path || image.filePath;
          if (mediaPath) {
            artworkMedia.push({
              _id: image.mediaId || new mongoose.Types.ObjectId(), // Use existing mediaId or generate new one
              fileName: mediaPath.split('/').pop(),
              fileType: 'image/' + mediaPath.split('.').pop(), // Infer type from extension
              filePath: mediaPath, // Use path or filePath
              description: image.description || 'Artwork Image',
              uploadDate: artwork.createdAt,
              isArtworkMedia: true,
              artworkId: artwork._id
            });
          }
        });
      }
      if (artwork.video && (artwork.video.type === 'file' || artwork.video.type === 'upload')) {
        artworkMedia.push({
          _id: artwork.video.mediaId || new mongoose.Types.ObjectId(),
          fileName: artwork.video.path.split('/').pop(),
          fileType: artwork.video.fileType,
          filePath: artwork.video.path,
          description: artwork.video.description || 'Artwork Video',
          uploadDate: artwork.createdAt,
          isArtworkMedia: true,
          artworkId: artwork._id,
        });
      }
    });

    // Combine all media and sort by uploadDate
    let allMedia = [...standaloneMedia, ...artworkMedia];
    allMedia.sort((a, b) => b.uploadDate - a.uploadDate);

    const totalMedia = allMedia.length;
    const totalPages = Math.ceil(totalMedia / limit);
    const paginatedMedia = allMedia.slice(skip, skip + limit);

    const lastBackup = await Backup.findOne().sort({ backupDate: -1 });

    res.render('admin/media-management', {
      title: 'Media Management',
      media: paginatedMedia,
      currentPage: page,
      totalPages,
      totalMedia,
      limit,
      lastBackup,
      messages: req.flash(),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error fetching media management data.');
    res.redirect('/admin');
  }
};

exports.getBackupHistory = async (req, res) => {
  try {
    const backups = await Backup.find().sort({ backupDate: -1 });
    res.render('admin/backup-history', { backups, messages: req.flash() });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error fetching backup history.');
    res.redirect('/admin/media');
  }
};

// Upload Media
// const { createMediaBackup } = require('./adminController'); // Import createMediaBackup - REMOVE THIS LINE
let uploadCount = 0; // Initialize upload counter
const AUTO_BACKUP_THRESHOLD = 5; // Trigger backup after 5 uploads

exports.uploadMedia = async (req, res) => {
    try {
      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      if (!req.files || req.files.length === 0) {
        req.flash('error', 'No files selected for upload.');
        return res.redirect('/admin/media');
      }
  
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg'];
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
  
      const uploadedMedia = [];
      for (const file of req.files) {
        // File type validation
        if (!allowedMimeTypes.includes(file.mimetype)) {
          req.flash('error', `File type not allowed: ${file.originalname}. Only images (JPEG, PNG, GIF) and videos (MP4, WebM, Ogg) are permitted.`);
          return res.redirect('/admin/media');
        }
  
        // File size validation
        if (file.size > MAX_FILE_SIZE) {
          req.flash('error', `File too large: ${file.originalname}. Maximum size is 50MB.`);
          return res.redirect('/admin/media');
        }
  
        // Generate a unique filename
        const uniqueFilename = `${Date.now()}-${file.originalname}`;
        const filePath = path.join(uploadDir, uniqueFilename);

        // Save the file to the file system
        await fs.promises.writeFile(filePath, file.buffer);

        // Duplicate upload check (based on file name and size) - now checks against the new unique filename
        const existingMedia = await Media.findOne({ fileName: uniqueFilename, fileSize: file.size });
        if (existingMedia) {
          // If duplicate, remove the newly saved file
          await fs.promises.unlink(filePath);
          req.flash('error', `Duplicate file detected: ${file.originalname}. A file with the same content already exists.`);
          return res.redirect('/admin/media');
        }
  
        const newMedia = new Media({
          fileName: uniqueFilename,
          originalName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          filePath: `/uploads/${uniqueFilename}`, // Store the relative path
          description: req.body.description || '',
        });

        // Generate thumbnail for images
        if (file.mimetype.startsWith('image/')) {
          const thumbnailDir = './public/uploads/thumbnails';
          if (!fs.existsSync(thumbnailDir)) {
            fs.mkdirSync(thumbnailDir, { recursive: true });
          }
          const thumbnailFilename = `thumb-${uniqueFilename}`;
          await sharp(file.buffer)
            .resize(300, 300, { fit: 'inside' })
            .toFile(path.join('public', 'uploads', 'thumbnails', thumbnailFilename));
          newMedia.thumbnailPath = `/uploads/thumbnails/${thumbnailFilename}`;
        }
        
        await newMedia.save();
        uploadedMedia.push(newMedia);
      }
  
      uploadCount += uploadedMedia.length;
      if (uploadCount >= AUTO_BACKUP_THRESHOLD) {
        const backupResult = await createMediaBackupLogic(); // Trigger backup
        if (backupResult.success) {
          uploadCount = 0; // Reset counter
          req.flash('info', 'Automatic media backup created.');
        } else {
          req.flash('error', `Automatic backup failed: ${backupResult.message}`);
        }
      }
  
      req.flash('success', `${uploadedMedia.length} media item(s) uploaded successfully.`);
      res.redirect('/admin/media');
    } catch (error) {
      console.error('Error uploading media:', error);
      req.flash('error', 'Error uploading media.');
      res.redirect('/admin/media');
    }
};

// Delete Media
exports.deleteMedia = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedMedia = await Media.findByIdAndDelete(id);
  
      if (!deletedMedia) {
        req.flash('error', 'Media not found.');
        return res.redirect('/admin/media');
      }
  
      req.flash('success', 'Media deleted successfully.');
      res.redirect('/admin/media');
    } catch (error) {
      console.error('Error deleting media:', error);
      req.flash('error', 'Error deleting media.');
      res.redirect('/admin/media');
    }
};

exports.restoreMediaBackup = async (req, res) => {
    try {
      const { id } = req.params;
      const backup = await Backup.findById(id);
  
      if (!backup) {
        req.flash('error', 'Backup not found.');
        return res.redirect('/admin/media/backup-history');
      }
  
      // Clear current media collection
      await Media.deleteMany({});
  
      // Restore media from backup
      for (const mediaItem of backup.mediaItems) {
        // Create a new Media document from the backup data
        const newMedia = new Media({
          fileName: mediaItem.fileName,
          fileType: mediaItem.fileType,
          fileSize: mediaItem.fileSize,
          mediaData: mediaItem.mediaData,
          description: mediaItem.description,
          uploadDate: mediaItem.uploadDate, // Preserve original upload date
        });
        await newMedia.save();
      }
  
      req.flash('success', 'Media restored successfully from backup.');
      res.redirect('/admin/media');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Error restoring media from backup.');
      res.redirect('/admin/media/backup-history');
    }
};

// ...

// Regenerate thumbnails for existing images
exports.regenerateThumbnails = async (req, res) => {
  try {
    const artworks = await Artwork.find().populate('images.mediaId');
    let updatedCount = 0;

    for (const artwork of artworks) {
      for (const image of artwork.images) {
        if (image.mediaId) {
          console.log(`Processing Media ID: ${image.mediaId._id}`);
          console.log(`  File Path: ${image.mediaId.filePath}`);
          console.log(`  Thumbnail Path: ${image.mediaId.thumbnailPath}`);

          if (!image.mediaId.thumbnailPath) {
            // Check if the original file exists
            const originalFilePath = path.join(__dirname, '../public', image.mediaId.filePath);
            if (fs.existsSync(originalFilePath)) {
              const thumbnailDir = path.join(__dirname, '../public/uploads/thumbnails');
              if (!fs.existsSync(thumbnailDir)) {
                fs.mkdirSync(thumbnailDir, { recursive: true });
              }

              const uniqueFilename = image.mediaId.fileName;
              const thumbnailFilename = `thumb-${uniqueFilename}`;
              const thumbnailFullPath = path.join(thumbnailDir, thumbnailFilename);

              await sharp(originalFilePath)
                .resize(300, 300, { fit: 'inside' })
                .toFile(thumbnailFullPath);

              image.mediaId.thumbnailPath = `/uploads/thumbnails/${thumbnailFilename}`;
              await image.mediaId.save();
              await artwork.save();
              updatedCount++;
            } else {
              console.warn(`Original file not found for mediaId ${image.mediaId._id}: ${originalFilePath}`);
            }
          }
        }
      }
    }

    req.flash('success_msg', `Successfully regenerated ${updatedCount} thumbnails.`);
    res.redirect('/admin/media');
  } catch (error) {
    console.error('Error regenerating thumbnails:', error);
    req.flash('error_msg', 'Error regenerating thumbnails.');
    res.redirect('/admin/media');
  }
};