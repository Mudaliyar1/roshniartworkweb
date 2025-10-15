require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import routes
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

// Import middleware
const { isAuthenticated } = require('./middleware/auth');
const { injectSiteStyles } = require('./middleware/styles');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// const mongoose = require('mongoose'); // Remove this duplicate declaration

// Import models
const Media = require('./models/Media');
const MediaBackup = require('./models/MediaBackup');

// Import media utilities
const { autoRestoreMissingFiles, logSyncOperation } = require('./utils/mediaUtils');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    // Auto-restore media on server startup
    restoreMediaOnStartup();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Function to restore media from backup on startup
async function restoreMediaOnStartup() {
  try {
    console.log('🧠 Auto-Restore: Checking for missing media files...');
    
    // Use the new auto-restore function from mediaUtils
    const result = await autoRestoreMissingFiles();
    
    if (result.restored > 0) {
      console.log(`🧠 Auto-Restore: ${result.restored} media files restored successfully.`);
      await logSyncOperation('auto_restore', 'startup', result.restored, 'success', 'Auto-restore completed successfully');
    } else if (result.errors > 0) {
      console.warn(`⚠️ Auto-Restore: ${result.errors} files failed to restore.`);
      await logSyncOperation('auto_restore', 'startup', result.errors, 'warning', 'Auto-restore completed with errors');
    } else {
      console.log('✅ Auto-Restore: All media files are present. No restore needed.');
    }
    
    // Also check if we need to restore from old backup system for backwards compatibility
    const mediaCount = await Media.countDocuments();
    if (mediaCount === 0) {
      console.log('Media collection is empty. Attempting to restore from legacy backup...');
      const backupItems = await MediaBackup.find({});
      if (backupItems.length > 0) {
        const restoredMedia = backupItems.map(item => ({
          fileName: item.fileName,
          fileType: item.fileType,
          fileSize: item.fileSize,
          uploadDate: item.uploadDate,
          mediaData: item.mediaData,
          description: item.description,
          thumbnailPath: item.thumbnailPath,
        }));
        await Media.insertMany(restoredMedia);
        console.log(`🧠 Legacy Auto-Restore: ${restoredMedia.length} media items restored from legacy MongoDB backup successfully.`);
      }
    }
  } catch (error) {
    console.error('❌ Error during auto-restore:', error);
    await logSyncOperation('auto_restore', 'startup', 0, 'error', `Auto-restore failed: ${error.message}`);
  }
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:"],
      mediaSrc: ["'self'", "https://www.youtube.com", "https://player.vimeo.com"]
    }
  }
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Set up EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'layouts/main');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/svg', express.static(path.join(__dirname, 'public/svg')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Flash messages
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.messages = {
    success: req.flash('success_msg'),
    error: req.flash('error_msg')
  };
  res.locals.user = req.session.user || null;
  req.user = req.session.user || null; // Populate req.user
  next();
});

// Inject site styles
app.use(injectSiteStyles);

// Rate limiting for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Routes
app.use('/', publicRoutes);
app.use('/admin', isAuthenticated, adminRoutes);
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    title: '404 Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Server Error',
    message: 'Something went wrong on our end.'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing