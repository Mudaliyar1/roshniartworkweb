const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { isAlreadyAuthenticated } = require('../middleware/auth');
const publicController = require('../controllers/publicController');
const authController = require('../controllers/authController');

// Rate limiting for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Public pages
router.get('/', publicController.getHomePage);
router.get('/about', publicController.getAboutPage);
router.get('/gallery', publicController.getGalleryPage);
router.get('/gallery/:slug', publicController.getArtworkDetail);
router.get('/contact', publicController.getContactPage);
router.post('/contact', contactLimiter, publicController.submitContactForm);

// Authentication routes
router.get('/login', isAlreadyAuthenticated, authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);

module.exports = router;