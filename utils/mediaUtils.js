const fs = require('fs').promises;
const path = require('path');
const Media = require('../models/Media');
const SyncLog = require('../models/SyncLog');
const sharp = require('sharp');

/**
 * Media utility functions for backup, restore, and synchronization
 */

/**
 * Store file binary data in MongoDB
 * @param {Object} media - Media document
 * @param {Buffer} fileBuffer - File buffer data
 * @param {Buffer} thumbnailBuffer - Thumbnail buffer data (optional)
 * @returns {Promise<Object>} - Result object
 */
async function storeFileInDB(media, fileBuffer, thumbnailBuffer = null) {
  try {
    // Validate file buffer
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('File buffer is empty or invalid');
    }

    // Update media document with binary data
    media.fileData = fileBuffer;
    if (thumbnailBuffer && thumbnailBuffer.length > 0) {
      media.thumbnailData = thumbnailBuffer;
    }
    media.isStoredInDB = true;
    media.lastSynced = new Date();
    
    await media.save();

    // Log the backup operation
    await logSyncOperation(media, 'backup', 'success', 'File stored in database');

    return {
      success: true,
      message: 'File successfully stored in database',
      fileSize: fileBuffer.length
    };
  } catch (error) {
    await logSyncOperation(media, 'backup', 'failed', error.message);
    return {
      success: false,
      message: `Failed to store file in database: ${error.message}`
    };
  }
}

/**
 * Restore file from MongoDB to filesystem
 * @param {Object} media - Media document
 * @returns {Promise<Object>} - Result object
 */
async function restoreFileFromDB(media) {
  try {
    // Check if binary data exists in database
    if (!media.fileData || media.fileData.length === 0) {
      return {
        success: false,
        message: 'No binary data found in database for this file'
      };
    }

    // Ensure upload directories exist
    const uploadDir = path.join(__dirname, '../public/uploads');
    const thumbnailDir = path.join(__dirname, '../public/uploads/thumbnails');
    
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.mkdir(thumbnailDir, { recursive: true });

    // Write main file to filesystem
    const mainFilePath = path.join(uploadDir, path.basename(media.filePath));
    await fs.writeFile(mainFilePath, media.fileData);

    // Write thumbnail if it exists
    if (media.thumbnailData && media.thumbnailData.length > 0) {
      const thumbnailFileName = `thumb-${path.basename(media.filePath)}`;
      const thumbnailFilePath = path.join(thumbnailDir, thumbnailFileName);
      await fs.writeFile(thumbnailFilePath, media.thumbnailData);
      
      // Update thumbnail path in media document
      media.thumbnailPath = `/uploads/thumbnails/${thumbnailFileName}`;
    }

    // Update last synced timestamp
    media.lastSynced = new Date();
    await media.save();

    // Log the restore operation
    await logSyncOperation(media, 'restore', 'success', 'File restored from database');

    return {
      success: true,
      message: 'File successfully restored from database',
      filePath: mainFilePath
    };
  } catch (error) {
    await logSyncOperation(media, 'restore', 'failed', error.message);
    return {
      success: false,
      message: `Failed to restore file from database: ${error.message}`
    };
  }
}

/**
 * Check if file exists on filesystem
 * @param {string} filePath - Relative file path
 * @returns {Promise<boolean>} - True if file exists
 */
async function fileExistsOnDisk(filePath) {
  try {
    const fullPath = path.join(__dirname, '../public', filePath);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Log synchronization operation
 * @param {Object} media - Media document
 * @param {string} operation - Operation type (backup, restore, sync)
 * @param {string} status - Operation status (success, failed, skipped)
 * @param {string} message - Operation message
 * @param {string} errorDetails - Error details (optional)
 */
async function logSyncOperation(media, operation, status, message = '', errorDetails = null) {
  try {
    const log = new SyncLog({
      fileName: media.fileName,
      fileType: media.fileType || 'unknown',
      fileSize: media.fileSize,
      operation,
      status,
      message,
      errorDetails,
      environment: process.env.NODE_ENV || 'local'
    });
    
    await log.save();
  } catch (error) {
    console.error('Failed to log sync operation:', error);
  }
}

/**
 * Sync all media files - backup files to database or restore from database
 * @param {string} mode - Sync mode ('backup' or 'restore')
 * @returns {Promise<Object>} - Sync results
 */
async function syncAllMedia(mode = 'backup') {
  try {
    const mediaItems = await Media.find({});
    const results = {
      total: mediaItems.length,
      processed: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    for (const media of mediaItems) {
      try {
        if (mode === 'backup') {
          // Backup mode: Store files from filesystem to database
          const fileExists = await fileExistsOnDisk(media.filePath);
          if (!fileExists) {
            await logSyncOperation(media, 'backup', 'skipped', 'File not found on disk');
            results.skipped++;
            continue;
          }

          // Read file from disk and store in database
          const filePath = path.join(__dirname, '../public', media.filePath);
          const fileBuffer = await fs.readFile(filePath);
          
          let thumbnailBuffer = null;
          if (media.thumbnailPath) {
            const thumbnailExists = await fileExistsOnDisk(media.thumbnailPath);
            if (thumbnailExists) {
              const thumbnailPath = path.join(__dirname, '../public', media.thumbnailPath);
              thumbnailBuffer = await fs.readFile(thumbnailPath);
            }
          }

          const result = await storeFileInDB(media, fileBuffer, thumbnailBuffer);
          if (result.success) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push({ file: media.fileName, error: result.message });
          }

        } else if (mode === 'restore') {
          // Restore mode: Restore files from database to filesystem
          if (!media.fileData || media.fileData.length === 0) {
            await logSyncOperation(media, 'restore', 'skipped', 'No binary data in database');
            results.skipped++;
            continue;
          }

          const result = await restoreFileFromDB(media);
          if (result.success) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push({ file: media.fileName, error: result.message });
          }
        }

        results.processed++;

      } catch (error) {
        results.failed++;
        results.errors.push({ file: media.fileName, error: error.message });
        await logSyncOperation(media, mode, 'failed', error.message);
      }
    }

    return results;
  } catch (error) {
    return {
      total: 0,
      processed: 0,
      success: 0,
      failed: 1,
      skipped: 0,
      errors: [{ error: error.message }]
    };
  }
}

/**
 * Auto-restore missing files on server startup
 * @returns {Promise<Object>} - Restoration results
 */
async function autoRestoreMissingFiles() {
  try {
    console.log('🔍 Checking for missing media files...');
    
    const mediaItems = await Media.find({});
    const results = {
      total: mediaItems.length,
      missing: 0,
      restored: 0,
      failed: 0,
      errors: []
    };

    for (const media of mediaItems) {
      try {
        // Check if main file exists
        const mainFileExists = await fileExistsOnDisk(media.filePath);
        const thumbnailFileExists = media.thumbnailPath ? await fileExistsOnDisk(media.thumbnailPath) : true;

        if (!mainFileExists || !thumbnailFileExists) {
          results.missing++;
          
          if (media.fileData && media.fileData.length > 0) {
            // File is missing but we have binary data in database
            const result = await restoreFileFromDB(media);
            if (result.success) {
              results.restored++;
              console.log(`✅ Restored: ${media.fileName}`);
            } else {
              results.failed++;
              results.errors.push({ file: media.fileName, error: result.message });
              console.log(`❌ Failed to restore: ${media.fileName} - ${result.message}`);
            }
          } else {
            // File is missing and no binary data in database
            results.errors.push({ file: media.fileName, error: 'File missing and no binary data in database' });
            console.log(`⚠️  Missing file with no backup: ${media.fileName}`);
          }
        }
      } catch (error) {
        results.errors.push({ file: media.fileName, error: error.message });
        console.log(`❌ Error checking ${media.fileName}: ${error.message}`);
      }
    }

    console.log(`📊 Auto-restore complete: ${results.restored} files restored, ${results.missing} missing, ${results.failed} failed`);
    return results;
  } catch (error) {
    console.error('❌ Auto-restore error:', error);
    return {
      total: 0,
      missing: 0,
      restored: 0,
      failed: 1,
      errors: [{ error: error.message }]
    };
  }
}

/**
 * Get sync log entries
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of sync logs
 */
async function getSyncLogs(options = {}) {
  try {
    const { limit = 50, skip = 0, operation, status, fileName } = options;
    
    const query = {};
    if (operation) query.operation = operation;
    if (status) query.status = status;
    if (fileName) query.fileName = new RegExp(fileName, 'i');

    return await SyncLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    return [];
  }
}

/**
 * Clear old sync logs (older than 30 days)
 * @returns {Promise<Object>} - Cleanup results
 */
async function clearOldSyncLogs() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await SyncLog.deleteMany({
      timestamp: { $lt: thirtyDaysAgo }
    });

    return {
      success: true,
      deletedCount: result.deletedCount,
      message: `Cleared ${result.deletedCount} old sync log entries`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to clear old sync logs: ${error.message}`
    };
  }
}

module.exports = {
  storeFileInDB,
  restoreFileFromDB,
  fileExistsOnDisk,
  logSyncOperation,
  syncAllMedia,
  autoRestoreMissingFiles,
  getSyncLogs,
  clearOldSyncLogs
};