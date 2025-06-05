const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const userController = require('../controllers/userController');
const { uploadProfilePicture } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { emailVerificationLimiter } = require('../middleware/rateLimiter'); // NEW: Import rate limiter

/**
 * @route   POST /api/v1/users/register
 * @desc    Register a new user - UPDATED: Now with email verification
 */
router.post('/register', 
  validate.user, 
  userController.register
);

/**
 * NEW: Email verification endpoint
 * @route   GET /api/v1/users/verify-email/:token
 * @desc    Verify email with token
 */
router.get('/verify-email/:token', 
  userController.verifyEmail
);

/**
 * NEW: Resend verification email
 * @route   POST /api/v1/users/resend-verification
 * @desc    Resend email verification link
 */
router.post('/resend-verification', 
  emailVerificationLimiter, // NEW: Add rate limiting (3 requests per 5 minutes)
  validate.resendVerification, // NEW: Add validation
  userController.resendVerificationEmail
);

/**
 * @route   POST /api/v1/users/login
 * @desc    User login - UPDATED: Now checks email verification
 */
router.post('/login', 
  validate.user,
  userController.login
);

/**
 * @route   POST /api/v1/users/refresh-token
 * @desc    Refresh JWT token
 */
router.post('/refresh-token', 
  userController.refreshToken
);

/**
 * @route   POST /api/v1/users/forgot-password
 * @desc    Request password reset token
 */
router.post('/forgot-password', 
  userController.forgotPassword
);

/**
 * @route   POST /api/v1/users/reset-password
 * @desc    Reset password with token
 */
router.post('/reset-password', 
  userController.resetPassword
);

/**
 * @route   POST /api/v1/users/test-email
 * @desc    Test email service (Development only) - MOVED TO PUBLIC ROUTES
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test-email', async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          error: {
            code: 'MISSING_EMAIL',
            message: 'Email is required for testing'
          }
        });
      }
      
      const emailService = require('../services/emailService');
      await emailService.sendTestEmail(email);
      
      res.json({
        success: true,
        message: 'Test email sent successfully!',
        data: { email }
      });
    } catch (err) {
      next(err);
    }
  });

  // Add debug route to check user data
  router.post('/debug-user', async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          error: {
            code: 'MISSING_EMAIL',
            message: 'Email is required for debugging'
          }
        });
      }
      
      const User = require('../models/User');
      const userData = await User.debugFindByEmail(email);
      
      res.json({
        success: true,
        data: { 
          found: !!userData,
          user: userData ? {
            id: userData.id,
            email: userData.email,
            username: userData.username,
            hasPassword: !!userData.password_hash,
            passwordLength: userData.password_hash?.length,
            created_at: userData.created_at
          } : null
        }
      });
    } catch (err) {
      next(err);
    }
  });
}

/**
 * Protected routes
 */
router.use(auth);

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
 */
router.get('/profile', 
  userController.getProfile
);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update profile
 */
router.put('/profile', 
  validate.user,
  userController.updateProfile
);

/**
 * @route   PUT /api/v1/users/preferences
 * @desc    Update user preferences
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
 * Validate preferences object structure
 */
function validatePreferences(preferences) {
  const errors = [];
  const allowedKeys = ['profilePicture', 'theme', 'notifications', 'currency', 'language', 'dateFormat'];
  
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
  
  if (preferences.theme !== undefined && !['light', 'dark'].includes(preferences.theme)) {
    errors.push('theme must be either "light" or "dark"');
  }
  
  if (preferences.notifications !== undefined && typeof preferences.notifications !== 'object') {
    errors.push('notifications must be an object');
  }
  
  if (preferences.currency !== undefined && typeof preferences.currency !== 'string') {
    errors.push('currency must be a string');
  }
  
  if (preferences.language !== undefined && typeof preferences.language !== 'string') {
    errors.push('language must be a string');
  }
  
  if (preferences.dateFormat !== undefined && typeof preferences.dateFormat !== 'string') {
    errors.push('dateFormat must be a string');
  }
  
  return errors;
}

/**
 * @route   POST /api/v1/users/profile/picture
 * @desc    Upload profile picture
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
      
      console.log(`📸 [PROFILE-UPLOAD] Saving profile picture: ${filePath} for user ${req.user.id}`);
      
      await User.updatePreferences(req.user.id, {
        profilePicture: filePath
      });

      console.log(`✅ [PROFILE-UPLOAD] Profile picture updated successfully for user ${req.user.id}`);

      const response = {
        success: true,
        data: {
          filename: req.file.filename,
          path: filePath,
          size: req.file.size,
          fullUrl: `${req.protocol}://${req.get('host')}${filePath}`
        },
        timestamp: new Date().toISOString()
      };
      
      // Include warning if old profile picture couldn't be deleted
      if (req.profilePictureDeletionWarning) {
        response.warning = req.profilePictureDeletionWarning;
      }

      res.json(response);
    } catch (err) {
      console.error(`❌ [PROFILE-UPLOAD] Error uploading profile picture:`, err);
      
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
 */
router.post('/logout', 
  userController.logout
);

/**
 * NEW: Email service health check (Development/Admin)
 * @route   GET /api/v1/users/email-health
 * @desc    Check email service status
 */
router.get('/email-health', 
  auth, // Require authentication
  async (req, res, next) => {
    try {
      const emailService = require('../services/emailService');
      
      // Simple health check without actually sending emails
      const isConfigured = emailService.isConfigured();
      
      res.json({
        success: true,
        data: {
          emailService: {
            configured: isConfigured,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;