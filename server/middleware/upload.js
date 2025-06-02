/**
 * File Upload Middleware
 * Handles profile pictures and receipt uploads
 * @module middleware/upload
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../config/db');

// Create upload directories if they don't exist
const createUploadDirs = async () => {
  const dirs = ['uploads/profiles', 'uploads/receipts'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error);
    }
  }
};

createUploadDirs();

// Configure storage for different file types
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let folder = 'uploads/';
    
    if (file.fieldname === 'profilePicture') {
      folder += 'profiles';
    } else if (file.fieldname === 'receipt') {
      folder += 'receipts';
    }
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    
    if (file.fieldname === 'profilePicture') {
      cb(null, `profile-${req.user.id}-${uniqueSuffix}${ext}`);
    } else {
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  }
});

// File filter for different upload types
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'profilePicture') {
    // Only allow images for profile pictures
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed for profile pictures'), false);
    }
  } else if (file.fieldname === 'receipt') {
    // Allow images and PDFs for receipts
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
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
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1 // Only 1 file at a time
  }
});

// Middleware to delete old profile picture
const deleteOldProfilePicture = async (req, res, next) => {
  if (req.file && req.file.fieldname === 'profilePicture') {
    try {
      // Get user's current profile picture from DB
      const user = await db.query(
        'SELECT preferences FROM users WHERE id = $1',
        [req.user.id]
      );
      
      const preferences = user.rows[0]?.preferences || {};
      
      if (preferences.profilePicture) {
        // Convert relative path to absolute path
        let oldPath;
        if (preferences.profilePicture.startsWith('/uploads/')) {
          // Remove leading slash and create absolute path
          oldPath = path.join(__dirname, '..', preferences.profilePicture.substring(1));
        } else {
          oldPath = path.join(__dirname, '..', preferences.profilePicture);
        }
        
        // Check if file exists before trying to delete
        try {
          await fs.access(oldPath);
          await fs.unlink(oldPath);
          console.log(`✅ [UPLOAD] Deleted old profile picture: ${oldPath}`);
        } catch (deleteError) {
          // File doesn't exist or can't be deleted - not a critical error
          console.log(`⚠️ [UPLOAD] Could not delete old profile picture: ${oldPath}`);
        }
      }
    } catch (error) {
      console.error('Error deleting old profile picture:', error);
    }
  }
  next();
};

// Export configured middleware
module.exports = {
  uploadProfilePicture: [
    upload.single('profilePicture'),
    deleteOldProfilePicture
  ],
  uploadReceipt: upload.single('receipt'),
  upload // Raw multer instance if needed
};