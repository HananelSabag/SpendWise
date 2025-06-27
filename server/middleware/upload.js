/**
 * File Upload Middleware - UPDATED FOR SUPABASE STORAGE
 * Handles profile pictures and receipt uploads using Supabase Storage
 * @module middleware/upload
 */

const multer = require('multer');
const supabaseStorage = require('../services/supabaseStorage');

// Use memory storage instead of disk storage (for Supabase upload)
const storage = multer.memoryStorage();

// File filter for different upload types
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'profilePicture') {
    // Only allow images for profile pictures
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      // Additional check for file extension
      const ext = file.originalname.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file extension'), false);
      }
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed for profile pictures'), false);
    }
  } else if (file.fieldname === 'receipt') {
    // Allow images and PDFs for receipts
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    
    if (allowedTypes.includes(file.mimetype)) {
      const ext = file.originalname.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file extension'), false);
      }
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed for receipts'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_SIZE_LIMIT) || 10 * 1024 * 1024, // 10MB
    files: 1 // Only 1 file at a time
  }
});

// Middleware to delete old profile picture from Supabase
const deleteOldProfilePicture = async (req, res, next) => {
  if (req.file && req.file.fieldname === 'profilePicture') {
    try {
      // Get user's current profile picture from DB
      const db = require('../config/db');
      const user = await db.query(
        'SELECT preferences FROM users WHERE id = $1',
        [req.user.id]
      );
      
      const preferences = user.rows[0]?.preferences || {};
      
      if (preferences.profilePicture) {
        // Extract filename from Supabase URL
        const fileName = supabaseStorage.extractFileNameFromUrl(preferences.profilePicture);
        
        if (fileName) {
          await supabaseStorage.deleteProfilePicture(fileName);
          console.log(`✅ [SUPABASE STORAGE] Deleted old profile picture: ${fileName}`);
        }
      }
    } catch (error) {
      console.error('❌ [SUPABASE STORAGE] Error in deleteOldProfilePicture middleware:', error.message);
    }
  }
  next();
};

// Upload to Supabase Storage middleware
const uploadToSupabase = async (req, res, next) => {
  if (req.file && req.file.fieldname === 'profilePicture') {
    try {
      const uploadResult = await supabaseStorage.uploadProfilePicture(req.file, req.user.id);
      
      // Add Supabase result to request for route handler
      req.supabaseUpload = uploadResult;
      
      console.log('✅ [SUPABASE STORAGE] File uploaded successfully:', uploadResult);
      next();
    } catch (error) {
      console.error('❌ [SUPABASE STORAGE] Upload failed:', error);
      return res.status(500).json({
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to upload file to storage',
          details: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  } else {
    next();
  }
};

// Export configured middleware
module.exports = {
  uploadProfilePicture: [
    upload.single('profilePicture'),
    deleteOldProfilePicture,
    uploadToSupabase
  ],
  uploadReceipt: upload.single('receipt'),
  upload // Raw multer instance if needed
};