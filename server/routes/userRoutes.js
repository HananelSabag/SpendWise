/**
 * User Routes - Production Ready
 * @module routes/userRoutes
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const userController = require('../controllers/userController');
const { uploadProfilePicture } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { emailVerificationLimiter, authLimiter } = require('../middleware/rateLimiter');

/**
 * Public routes
 */

/**
 * @route   POST /api/v1/users/register
 * @desc    Register a new user with email verification
 * @access  Public
 */
router.post('/register', 
  authLimiter,
  validate.userRegistration, 
  userController.register
);

/**
 * @route   GET /api/v1/users/verify-email/:token
 * @desc    Verify email with token
 * @access  Public
 */
router.get('/verify-email/:token', 
  userController.verifyEmail
);

/**
 * @route   POST /api/v1/users/resend-verification
 * @desc    Resend email verification link
 * @access  Public
 */
router.post('/resend-verification', 
  emailVerificationLimiter,
  validate.resendVerification,
  userController.resendVerificationEmail
);

/**
 * @route   POST /api/v1/users/login
 * @desc    User login (requires verified email)
 * @access  Public
 */
router.post('/login', 
  authLimiter,
  validate.userLogin,
  userController.login
);

/**
 * @route   POST /api/v1/users/refresh-token
 * @desc    Refresh JWT token
 * @access  Public
 */
router.post('/refresh-token', 
  userController.refreshToken
);

/**
 * @route   POST /api/v1/users/forgot-password
 * @desc    Request password reset token
 * @access  Public
 */
router.post('/forgot-password', 
  authLimiter,
  userController.forgotPassword
);

/**
 * @route   POST /api/v1/users/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', 
  authLimiter,
  userController.resetPassword
);

/**
 * Protected routes - require authentication
 */
router.use(auth);

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', 
  userController.getProfile
);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update profile (username, password, preferences)
 * @access  Private
 */
router.put('/profile', 
  validate.userRegistration,
  userController.updateProfile
);

/**
 * @route   PUT /api/v1/users/preferences
 * @desc    Update user preferences (legacy JSONB support)
 * @access  Private
 */
router.put('/preferences', 
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { preferences } = req.body;
      
      if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Preferences must be an object',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Validate preferences schema
      const validationErrors = validatePreferences(preferences);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PREFERENCES',
            message: 'Invalid preferences format',
            details: validationErrors,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      const User = require('../models/User');
      const updated = await User.updatePreferences(userId, preferences);
      
      res.json({ 
        success: true, 
        data: { preferences: updated },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   POST /api/v1/users/profile/picture
 * @desc    Upload profile picture
 * @access  Private
 */
router.post('/profile/picture', 
  uploadProfilePicture, 
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'MISSING_FILE',
            message: 'No file uploaded',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Update user preferences with file path
      const User = require('../models/User');
      const filePath = `/uploads/profiles/${req.file.filename}`;
      
      await User.updatePreferences(req.user.id, {
        profilePicture: filePath
      });

      res.json({
        success: true,
        data: {
          filename: req.file.filename,
          path: filePath,
          size: req.file.size
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      // Delete uploaded file on error
      if (req.file) {
        const fs = require('fs').promises;
        await fs.unlink(req.file.path).catch(() => {});
      }
      next(err);
    }
  }
);

/**
 * @route   POST /api/v1/users/logout
 * @desc    User logout
 * @access  Private
 */
router.post('/logout', 
  userController.logout
);

/**
 * Validate preferences object structure
 */
function validatePreferences(preferences) {
  const errors = [];
  const allowedKeys = ['profilePicture', 'notifications', 'dateFormat'];
  
  // Check for unknown keys
  Object.keys(preferences).forEach(key => {
    if (!allowedKeys.includes(key)) {
      errors.push(`Unknown preference key: ${key}`);
    }
  });
  
  // Validate specific fields
  if (preferences.profilePicture !== undefined && typeof preferences.profilePicture !== 'string') {
    errors.push('profilePicture must be a string');
  }
  
  if (preferences.notifications !== undefined && typeof preferences.notifications !== 'object') {
    errors.push('notifications must be an object');
  }
  
  if (preferences.dateFormat !== undefined && typeof preferences.dateFormat !== 'string') {
    errors.push('dateFormat must be a string');
  }
  
  return errors;
}

module.exports = router;