const Artwork = require('../models/Artwork');
const Message = require('../models/Message');
const sanitizeHtml = require('sanitize-html');

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
exports.getAboutPage = (req, res) => {
  res.render('about', {
    title: 'About',
    about: {
      profileImage: '/uploads/images/profile-placeholder.jpg',
      instagram: '',
      youtube: '',
      facebook: '',
      twitter: '',
      content: null
    }
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
    });
    
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
      baseUrl: `${req.protocol}://${req.get('host')}`
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
    const { name, email, subject, message } = req.body;
    
    // Validate input
    if (!name || !email || !message) {
      req.flash('error_msg', 'Please fill in all required fields');
      return res.redirect('/contact');
    }
    
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
      name,
      email,
      subject: sanitizedSubject,
      message: sanitizedMessage
    });
    
    await newMessage.save();
    
    req.flash('success_msg', 'Your message has been sent successfully');
    res.redirect('/contact');
  } catch (error) {
    console.error('Contact form error:', error);
    req.flash('error_msg', 'An error occurred while sending your message');
    res.redirect('/contact');
  }
};