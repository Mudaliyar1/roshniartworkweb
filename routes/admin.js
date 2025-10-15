
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = require('../middleware/upload');
const { isAuthenticated, isAdmin, authMiddleware } = require('../middleware/auth');

// About page management
router.get('/about', isAuthenticated, isAdmin, adminController.getEditAbout);
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

// Comment management
router.get('/artworks/:id/comments', adminController.getArtworkComments);
router.delete('/comments/delete/:id', adminController.deleteComment);

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

// Media Management Routes
router.get('/media', isAuthenticated, isAdmin, adminController.getMediaManagement);
router.post('/media/upload', isAuthenticated, isAdmin, upload.array('mediaFiles'), adminController.uploadMedia);
router.post('/media/backup', isAuthenticated, isAdmin, adminController.createMediaBackup);
router.delete('/media/:id', isAuthenticated, isAdmin, adminController.deleteMedia);
router.get('/media/backup-history', isAuthenticated, isAdmin, adminController.getBackupHistory);
router.post('/media/restore/:id', isAuthenticated, isAdmin, adminController.restoreMediaBackup);

// New Media Storage Management Routes
router.post('/media/restore', isAuthenticated, isAdmin, adminController.restoreAllMedia);
router.get('/media/sync-logs', isAuthenticated, isAdmin, adminController.getSyncLogs);
router.post('/media/auto-restore/toggle', isAuthenticated, isAdmin, adminController.toggleAutoRestore);
router.post('/media/delete-all', isAuthenticated, isAdmin, adminController.deleteAllMedia);

// Site styling

// Temporary route to regenerate thumbnails
router.get('/regenerate-thumbnails', isAuthenticated, adminController.regenerateThumbnails);

module.exports = router;