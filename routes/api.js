const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const apiController = require('../controllers/apiController');

// Protected API routes (admin only)
router.post('/artworks/reorder', isAuthenticated, apiController.reorderArtworkImages);
router.post('/artworks/:id/set-main-image', isAuthenticated, apiController.setMainImage);
router.delete('/artworks/:id/images/:imageIndex', isAuthenticated, apiController.deleteArtworkImage);

// Public API routes
router.get('/artworks', apiController.getArtworks);
router.get('/artworks/:slug', apiController.getArtworkBySlug);

module.exports = router;