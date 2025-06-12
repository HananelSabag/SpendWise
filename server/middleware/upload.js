/**
 * File Upload Middleware
 * Handles profile pictures and receipt uploads
 * @module middleware/upload
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../config/db');
const crypto = require('crypto'); // Added for secure filename generation

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
    const uniqueSuffix = crypto.randomBytes(16).toString('hex'); // More secure than timestamp + random
    const ext = path.extname(file.originalname).toLowerCase(); // Normalize extension
    
    // Sanitize filename to prevent path traversal
    const safeFieldname = file.fieldname.replace(/[^a-zA-Z0-9]/g, '');
    
    if (file.fieldname === 'profilePicture') {
      cb(null, `profile-${req.user.id}-${uniqueSuffix}${ext}`);
    } else {
      cb(null, `${safeFieldname}-${uniqueSuffix}${ext}`);
    }
  }
});

// File filter for different upload types
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'profilePicture') {
    // Only allow images for profile pictures
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      // Additional check for file extension
      const ext = path.extname(file.originalname).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
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
      const ext = path.extname(file.originalname).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.pdf'].includes(ext)) {
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
    fileSize: parseInt(process.env.UPLOAD_SIZE_LIMIT) || 5 * 1024 * 1024, // Use env variable
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
        let oldPath;
        
        // Handle both full URLs and relative paths
        if (preferences.profilePicture.includes('/uploads/')) {
          // Extract just the filename from URL or path
          const urlParts = preferences.profilePicture.split('/uploads/');
          if (urlParts.length > 1) {
            const relativePath = urlParts[1];
            oldPath = path.join(__dirname, '..', 'uploads', relativePath);
          }
        } else if (!preferences.profilePicture.startsWith('http')) {
          // Handle relative paths without /uploads/ prefix
          oldPath = path.join(__dirname, '..', 'uploads', 'profiles', preferences.profilePicture);
        }
        
        if (oldPath) {
          // Verify the path is within uploads directory (security check)
          const uploadsDir = path.join(__dirname, '..', 'uploads');
          const normalizedOldPath = path.normalize(oldPath);
          
          if (normalizedOldPath.startsWith(uploadsDir)) {
            try {
              await fs.access(normalizedOldPath);
              await fs.unlink(normalizedOldPath);
              console.log(`✅ [UPLOAD] Deleted old profile picture`);
            } catch (deleteError) {
              console.log(`ℹ️ [UPLOAD] Previous profile picture not found or already deleted`);
            }
          } else {
            console.error('❌ [UPLOAD] Invalid file path detected');
          }
        }
      }
    } catch (error) {
      console.error('❌ [UPLOAD] Error in deleteOldProfilePicture middleware:', error.message);
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