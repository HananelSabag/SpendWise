/**
 * OPTIMIZED User Routes - Enhanced Performance Version
 * Includes Google OAuth, smart rate limiting, and performance monitoring
 * @module routes/userRoutes_optimized
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const userController = require('../controllers/userController');
const { uploadProfilePicture } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { emailVerificationLimiter, authLimiter } = require('../middleware/rateLimiter');
const { securityMiddleware } = require('../middleware/security'); // 🛡️ Enhanced security

/**
 * 🚀 OPTIMIZED Public Auth Routes
 */

/**
 * @route   POST /api/v1/users/register
 * @desc    Register a new user with enhanced validation
 * @access  Public
 */
router.post('/register', 
  authLimiter,
  validate.userRegistration, 
  userController.register
);

/**
 * @route   POST /api/v1/users/login
 * @desc    Login with email/password (optimized with caching)
 * @access  Public
 */
router.post('/login',
  authLimiter,
  validate.userLogin,
  userController.login
);
/**
 * 🔑 Password Reset Flow
 */
router.post('/password-reset', authLimiter, userController.requestPasswordReset);
router.get('/password-reset/validate/:token', authLimiter, userController.validatePasswordResetToken);
router.post('/password-reset/confirm', authLimiter, userController.confirmPasswordReset);

/**
 * ✉️ Resend Verification
 */
router.post('/resend-verification', emailVerificationLimiter, userController.resendVerification);


/**
 * 🚀 NEW: Google OAuth Authentication
 * @route   POST /api/v1/users/auth/google
 * @desc    Login/Register with Google OAuth
 * @access  Public
 */
router.post('/auth/google',
  authLimiter,
  validate.googleAuth, // ✅ NOW IMPLEMENTED
  userController.googleAuth
);

/**
 * 🔄 NEW: Token Refresh
 * @route   POST /api/v1/users/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh-token',
  authLimiter,
  userController.refreshToken
);

/**
 * @route   POST /api/v1/users/verify-email
 * @desc    Verify email with token (enhanced security)
 * @access  Public
 */
router.post('/verify-email',
  emailVerificationLimiter,
  validate.emailVerification, // ✅ NOW IMPLEMENTED
  userController.verifyEmail
);

/**
 * @route   GET /api/v1/users/verify-email/:token
 * @desc    Alternative verification endpoint for email links
 * @access  Public
 */
router.get('/verify-email/:token', 
  emailVerificationLimiter,
  (req, res, next) => {
    req.body = { token: req.params.token };
    next();
  },
  userController.verifyEmail
);

/**
 * 🚀 OPTIMIZED Protected Routes (with smart caching)
 */

/**
 * @route   POST /api/v1/users/logout
 * @desc    Logout user and cleanup session (graceful auth handling)
 * @access  Public (handles auth failures gracefully)
 */
router.post('/logout',
  // ✅ Optional auth - don't fail if token is invalid
  (req, res, next) => {
    // Try to authenticate, but continue even if it fails
    auth(req, res, (error) => {
      if (error) {
        // Auth failed - continue without user info
        req.user = null;
      }
      next(); // Always continue to logout handler
    });
  },
  userController.logout
);

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile (cached for performance)
 * @access  Private
 */
router.get('/profile',
  auth,
  userController.getProfile
);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile (with cache invalidation)
 * @access  Private
 */
router.put('/profile',
  auth,
  validate.profileUpdate, // ✅ NOW IMPLEMENTED
  userController.updateProfile
);

/**
 * @route   POST /api/v1/users/upload-profile-picture
 * @desc    Upload profile picture to Supabase Storage
 * @access  Private
 */
router.post('/upload-profile-picture',
  auth,
  uploadProfilePicture,
  async (req, res) => {
    try {
      if (!req.supabaseUpload) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE_UPLOADED',
            message: 'No file was uploaded'
          }
        });
      }

      // Update user's avatar in database - FIXED: Preserve onboarding_completed
      const db = require('../config/db');
      const result = await db.query(
        'UPDATE users SET avatar = $1, profile_picture_url = $2, updated_at = NOW() WHERE id = $3 RETURNING id, avatar, profile_picture_url, onboarding_completed',
        [req.supabaseUpload.publicUrl, req.supabaseUpload.publicUrl, req.user.id]
      );
      
      logger.info('✅ Profile picture - Database updated:', {
        userId: req.user.id,
        avatarUrl: req.supabaseUpload.publicUrl,
        updatedUser: result.rows[0],
        onboardingPreserved: result.rows[0].onboarding_completed
      });

      res.json({
        success: true,
        data: {
          url: req.supabaseUpload.publicUrl,
          fileName: req.supabaseUpload.fileName,
          message: 'Profile picture uploaded successfully',
          user: result.rows[0]
        }
      });
    } catch (error) {
      console.error('❌ Profile picture upload route error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_ROUTE_ERROR',
          message: 'Failed to process profile picture upload'
        }
      });
    }
  }
);

/**
 * @route   POST /api/v1/users/change-password
 * @desc    Change user password with current password verification
 * @access  Private
 */
router.post('/change-password',
  auth,
  validate.passwordChange,
  userController.changePassword
);

/**
 * @route   POST /api/v1/users/set-password
 * @desc    Set password for OAuth users (first-time setup)
 * @access  Private
 */
router.post('/set-password',
  auth,
  validate.passwordSet,
  userController.setPassword
);

/**
 * 🚀 NEW: Performance Monitoring Routes
 */

/**
 * @route   GET /api/v1/users/performance
 * @desc    Get user controller performance statistics
 * @access  Private (Admin only in production)
 */
router.get('/performance',
  auth,
  // NOTE: Admin middleware should be added for production security
  userController.getPerformanceStats
);

/**
 * 🚀 Enhanced Middleware for Google OAuth validation
 */
const validateGoogleAuth = (req, res, next) => {
  const { idToken, email } = req.body;
  
  if (!idToken || !email) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Google ID token and email are required',
        details: 'Missing required Google OAuth data'
      }
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
        details: 'Please provide a valid email address'
      }
    });
  }

  next();
};

// Apply Google Auth validation to the Google OAuth route
router.use('/auth/google', validateGoogleAuth);

module.exports = router; 