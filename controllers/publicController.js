const Artwork = require('../models/Artwork');
const Message = require('../models/Message');
const sanitizeHtml = require('sanitize-html');
const About = require('../models/About');
const User = require('../models/User');

// Home page
exports.getHomePage = async (req, res) => {
  try {
    // Get featured artworks (public and most recent)
    const featuredArtworks = await Artwork.find({ visibility: 'public' })
      .sort({ createdAt: -1 })
      .limit(6);
    
    res.render('index', {
      title: 'Home',
      featuredArtworks
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'An error occurred while loading the home page'
    });
  }
};

// About page
exports.getAboutPage = async (req, res) => {
  let about = await About.findOne();
  res.render('about', {
    title: 'About Roshni',
    layout: 'layouts/main',
    about
  });
};

// Gallery page
exports.getGalleryPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    
    // Filter options - show both public and hidden artworks
    const filter = { visibility: { $in: ['public', 'hidden'] } };
    
    if (req.query.tag) {
      filter.tags = req.query.tag;
    }
    
    if (req.query.year) {
      filter.year = req.query.year;
    }
    
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }
    
    // Get artworks
    const artworks = await Artwork.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Artwork.countDocuments(filter);
    
    // Get all tags and years for filters - include both public and hidden
    const tags = await Artwork.distinct('tags', { visibility: { $in: ['public', 'hidden'] } });
    const years = await Artwork.distinct('year', { visibility: { $in: ['public', 'hidden'] } });
    
    res.render('gallery', {
      title: 'Gallery',
      artworks,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      tags,
      years,
      search: req.query.search || '',
      tag: req.query.tag || '',
      year: req.query.year || '',
      filter: {
        tag: req.query.tag || '',
        year: req.query.year || '',
        search: req.query.search || ''
      }
    });
  } catch (error) {
    console.error('Gallery page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'An error occurred while loading the gallery'
    });
  }
};

// Artwork detail
exports.getArtworkDetail = async (req, res) => {
  try {
    const artwork = await Artwork.findOne({
      slug: req.params.slug,
      visibility: 'public'
    }).populate('comments').populate('likes');
    
    if (!artwork) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'The artwork you are looking for does not exist'
      });
    }
    
    // Find related artworks (same category or medium)
    const relatedArtworks = await Artwork.find({
      _id: { $ne: artwork._id },
      visibility: 'public',
      $or: [
        { category: artwork.category },
        { medium: artwork.medium }
      ]
    }).limit(3);
    
    res.render('artwork-detail', {
      title: artwork.title,
      artwork,
      relatedArtworks,
      baseUrl: `${req.protocol}://${req.get('host')}`,
      user: req.user
    });
  } catch (error) {
    console.error('Artwork detail error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'An error occurred while loading the artwork'
    });
  }
};

// Contact page
exports.getContactPage = (req, res) => {
  res.render('contact', {
    title: 'Contact'
  });
};

// Submit contact form
exports.submitContactForm = async (req, res) => {
  try {
    console.log('Contact form submission received:', req.body);
    
    const { name, email, subject, message } = req.body;
    
    // Validate input
    if (!name || !email || !message) {
      console.log('Validation failed: missing required fields');
      req.flash('error_msg', 'Please fill in all required fields');
      return res.redirect('/contact');
    }
    
    console.log('Validation passed, creating message...');
    
    // Sanitize input
    const sanitizedMessage = sanitizeHtml(message, {
      allowedTags: [],
      allowedAttributes: {}
    });
    
    const sanitizedSubject = subject ? sanitizeHtml(subject, {
      allowedTags: [],
      allowedAttributes: {}
    }) : '';
    
    // Create new message
    const newMessage = new Message({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: sanitizedSubject,
      message: sanitizedMessage
    });
    
    console.log('About to save message:', {
      name: newMessage.name,
      email: newMessage.email,
      subject: newMessage.subject,
      messageLength: newMessage.message.length
    });
    
    const savedMessage = await newMessage.save();
    console.log('Message saved successfully with ID:', savedMessage._id);
    
    // Verify the message was saved by querying it back
    const verifyMessage = await Message.findById(savedMessage._id);
    console.log('Verification - message exists in DB:', !!verifyMessage);
    
    // Count total messages in database
    const totalMessages = await Message.countDocuments();
    console.log('Total messages in database:', totalMessages);
    
    req.flash('success_msg', 'Your message has been sent successfully! We will get back to you soon.');
    res.redirect('/contact');
  } catch (error) {
    console.error('Contact form error:', error);
    console.error('Error stack:', error.stack);
    req.flash('error_msg', 'An error occurred while sending your message. Please try again.');
    res.redirect('/contact');
  }
};