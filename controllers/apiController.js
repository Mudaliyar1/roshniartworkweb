const Artwork = require('../models/Artwork');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const User = require('../models/User');

// Reorder artwork images
exports.reorderArtworkImages = async (req, res) => {
  try {
    const { artworkId, imageOrder } = req.body;
    
    if (!artworkId || !imageOrder || !Array.isArray(imageOrder)) {
      return res.status(400).json({ success: false, message: 'Invalid request data' });
    }
    
    const artwork = await Artwork.findById(artworkId);
    
    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }
    
    // Create new images array based on order
    const newImagesOrder = [];
    for (const index of imageOrder) {
      if (artwork.images[index]) {
        newImagesOrder.push(artwork.images[index]);
      }
    }
    
    // Update artwork with new order
    artwork.images = newImagesOrder;
    await artwork.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Reorder images error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Set main image
exports.setMainImage = async (req, res) => {
  try {
    const { imageIndex } = req.body;
    const artworkId = req.params.id;
    
    if (imageIndex === undefined) {
      return res.status(400).json({ success: false, message: 'Image index is required' });
    }
    
    const artwork = await Artwork.findById(artworkId);
    
    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }
    
    // Reset all images to not main
    artwork.images.forEach(image => {
      image.isMain = false;
    });
    
    // Set selected image as main
    if (artwork.images[imageIndex]) {
      artwork.images[imageIndex].isMain = true;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid image index' });
    }
    
    await artwork.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Set main image error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete artwork image
exports.deleteArtworkImage = async (req, res) => {
  try {
    const { id, imageIndex } = req.params;
    
    const artwork = await Artwork.findById(id);
    
    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }
    
    // Check if image exists
    if (!artwork.images[imageIndex]) {
      return res.status(400).json({ success: false, message: 'Invalid image index' });
    }
    
    // Check if it's the only image
    if (artwork.images.length === 1) {
      return res.status(400).json({ success: false, message: 'Cannot delete the only image' });
    }
    
    // Check if it's the main image
    const isMain = artwork.images[imageIndex].isMain;
    
    // Remove image
    artwork.images.splice(imageIndex, 1);
    
    // If removed image was main, set first image as main
    if (isMain && artwork.images.length > 0) {
      artwork.images[0].isMain = true;
    }
    
    await artwork.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get artworks (public API)
exports.getArtworks = async (req, res) => {
  try {
    const { tag, year, limit = 12, page = 1 } = req.query;
    
    // Build filter
    const filter = { visibility: 'public' };
    
    if (tag) {
      filter.tags = tag;
    }
    
    if (year) {
      filter.year = year;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get artworks
    const artworks = await Artwork.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Artwork.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        artworks,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get artworks API error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get artwork by slug (public API)
exports.getArtworkBySlug = async (req, res) => {
  try {
    const artwork = await Artwork.findOne({
      slug: req.params.slug,
      visibility: 'public'
    });
    
    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }
    
    res.json({
      success: true,
      data: artwork
    });
  } catch (error) {
    console.error('Get artwork API error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Add a comment to an artwork
exports.addComment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Please log in to comment.' });
    }
    const { text } = req.body;
    const { id } = req.params;
    const userId = req.user.id;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Comment text is required.' });
    }

    const artwork = await Artwork.findById(id);
    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found.' });
    }

    const newComment = new Comment({
      artwork: id,
      user: req.user.id, // Assuming user is authenticated and req.user is available
      text
    });
    await newComment.save();

    artwork.comments.push(newComment._id);
    await artwork.save();

    res.status(201).json({ success: true, message: 'Comment added successfully.', comment: newComment });
  } catch (error) {
    console.error('Add comment API error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Get comments for an artwork
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await Comment.find({ artwork: id }).populate('user', 'username').sort({ createdAt: -1 });
    res.json({ success: true, comments });
  } catch (error) {
    console.error('Get comments API error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Toggle like on an artwork
exports.toggleLike = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Please log in to like artworks.' });
    }
    const { id } = req.params;
    const userId = req.user.id; // Assuming user is authenticated

    const artwork = await Artwork.findById(id);
    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found.' });
    }

    const existingLike = await Like.findOne({ artwork: id, user: userId });

    if (existingLike) {
      // Unlike
      await Like.deleteOne({ _id: existingLike._id });
      artwork.likes.pull(existingLike._id);
      await artwork.save();
      res.json({ success: true, message: 'Artwork unliked.', liked: false });
    } else {
      // Like
      const newLike = new Like({
        artwork: id,
        user: userId
      });
      await newLike.save();
      artwork.likes.push(newLike._id);
      await artwork.save();
      res.status(201).json({ success: true, message: 'Artwork liked.', liked: true });
    }
  } catch (error) {
    console.error('Toggle like API error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Get like count for an artwork
exports.getLikeCount = async (req, res) => {
  try {
    const { id } = req.params;
    const likeCount = await Like.countDocuments({ artwork: id });
    res.json({ success: true, count: likeCount });
  } catch (error) {
    console.error('Get like count API error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Get like status for a user on an artwork
exports.getLikeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id; // Assuming user is authenticated

    const liked = await Like.exists({ artwork: id, user: userId });
    res.json({ success: true, liked: !!liked });
  } catch (error) {
    console.error('Get like status API error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};