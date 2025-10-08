const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = require('../middleware/upload');

// Admin dashboard
router.get('/', adminController.getDashboard);

// Artwork management
router.get('/artworks', adminController.getArtworks);
router.get('/artworks/new', adminController.getNewArtwork);
router.post('/artworks', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videoFile', maxCount: 1 }
]), adminController.createArtwork);
router.get('/artworks/:id', adminController.getArtwork);
router.get('/artworks/:id/edit', adminController.getArtwork);
router.put('/artworks/:id', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videoFile', maxCount: 1 }
]), adminController.updateArtwork);
router.delete('/artworks/:id', adminController.deleteArtwork);

// Message management
router.get('/messages', adminController.getMessages);
router.get('/messages/:id', adminController.getMessage);
router.put('/messages/:id/read', adminController.markMessageAsRead);
router.delete('/messages/:id', adminController.deleteMessage);
router.post('/messages/export', adminController.exportMessages);

// Site styling
router.get('/styling', adminController.getStyling);
router.post('/styling', upload.single('logo'), adminController.updateStyling);
router.post('/styling/reset', adminController.resetStyling);

module.exports = router;