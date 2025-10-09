
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = require('../middleware/upload');

// About page management
router.get('/about', adminController.getEditAbout);
router.post('/about', upload.single('profileImage'), adminController.updateAbout);

// Admin dashboard
router.get('/', adminController.getDashboard);

// Artwork management
router.get('/artworks', adminController.getArtworks);
router.get('/artworks/new', adminController.getNewArtwork);
router.post('/artworks', upload.fields([
  { name: 'images', maxCount: 50 },
  { name: 'videoFile', maxCount: 1 }
]), adminController.createArtwork);
router.get('/artworks/:id', adminController.getArtwork);
router.get('/artworks/:id/edit', adminController.getArtwork);
router.put('/artworks/:id', upload.fields([
  { name: 'images', maxCount: 50 },
  { name: 'videoFile', maxCount: 1 }
]), adminController.updateArtwork);
router.delete('/artworks/:id', adminController.deleteArtwork);

// Message management
router.get('/admins', adminController.getAdmins);
router.get('/admins/new', adminController.getAddAdmin);
router.post('/admins', adminController.createAdmin);
router.get('/admins/:id/edit', adminController.getEditAdmin);
router.post('/admins/:id/edit', adminController.updateAdmin);
router.post('/admins/:id/delete', adminController.deleteAdmin);
router.get('/messages', adminController.getMessages);
router.get('/messages/:id', adminController.getMessage);
router.get('/messages/:id/delete', adminController.getDeleteMessage);
router.put('/messages/:id/read', adminController.markMessageAsRead);
router.post('/messages/:id/toggle-read', adminController.toggleMessageRead);
router.delete('/messages/:id', adminController.deleteMessage);

router.post('/messages/:id/delete', adminController.deleteMessageForm);
router.post('/messages/export', adminController.exportMessages);

// Site styling

module.exports = router;