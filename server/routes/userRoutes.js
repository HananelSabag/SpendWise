/**
 * User Routes — auth, password/verification, and profile
 * @module routes/userRoutes
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const authController = require('../controllers/auth/authController');
const passwordController = require('../controllers/auth/passwordController');
const profileController = require('../controllers/auth/profileController');
const { uploadProfilePicture } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { emailVerificationLimiter, authLimiter } = require('../middleware/rateLimiter');
const rateLimit = require('express-rate-limit');
const { securityMiddleware } = require('../middleware/security'); // 🛡️ Enhanced security

// Per-email rate limiter for resend-verification (prevents spam targeting a specific address)
const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  keyGenerator: (req) => req.body?.email || req.ip,
  message: {
    error: {
      code: 'RESEND_LIMIT',
      message: 'Too many verification emails sent to this address, please try again later',
      retryAfter: 900
    }
  }
});
const { authLogger } = require('../middleware/routeLogger');
const logger = require('../utils/logger');

/**
 * 🚀 Public Auth Routes
 */

/**
 * @route   POST /api/v1/users/register
 * @desc    Register a new user with enhanced validation
 * @access  Public
 */
router.post('/register',
  securityMiddleware.auth,
  validate.userRegistration,
  authLogger('REGISTER'),
  authController.register
);

/**
 * @route   POST /api/v1/users/login
 * @desc    Login with email/password (optimized with caching)
 * @access  Public
 */
router.post('/login',
  securityMiddleware.auth,
  validate.userLogin,
  authLogger('LOGIN'),
  authController.login
);
/**
 * 🔑 Password Reset Flow
 */
router.post('/password-reset', securityMiddleware.auth, passwordController.requestPasswordReset);
router.get('/password-reset/validate/:token', authLimiter, passwordController.validatePasswordResetToken);
router.post('/password-reset/confirm', securityMiddleware.auth, passwordController.confirmPasswordReset);

/**
 * ✉️ Resend Verification
 */
router.post('/resend-verification', resendVerificationLimiter, passwordController.resendVerification);


/**
 * 🚀 Google OAuth Authentication
 * @route   POST /api/v1/users/auth/google
 * @desc    Login/Register with Google OAuth
 * @access  Public
 */
router.post('/auth/google',
  authLimiter,
  // Keep minimal validation (idToken length etc.) but do not require email (server extracts from token)
  validate.googleAuth,
  authController.googleAuth
);

/**
 * 🔄 Token Refresh
 * @route   POST /api/v1/users/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh-token',
  authLimiter,
  authController.refreshToken
);

/**
 * @route   POST /api/v1/users/verify-email
 * @desc    Verify email with token (enhanced security)
 * @access  Public
 */
router.post('/verify-email',
  emailVerificationLimiter,
  validate.emailVerification,
  passwordController.verifyEmail
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
  passwordController.verifyEmail
);

/**
 * 🚀 Protected Routes (with smart caching)
 */

/**
 * @route   POST /api/v1/users/logout
 * @desc    Logout user and cleanup session (graceful auth handling)
 * @access  Public (handles auth failures gracefully)
 */
// Deliberately NO auth middleware: the strict `auth` RESPONDS with 401 on a
// bad/expired token (it never calls next(error)), which used to block the
// logout handler exactly when users most need it. The global optionalAuth in
// index.js already sets req.user when the token is valid; logout must always
// succeed regardless.
router.post('/logout', authController.logout);

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile (cached for performance)
 * @access  Private
 */
router.get('/financial-cycle',
  auth,
  profileController.getFinancialCycle
);

router.get('/profile',
  auth,
  profileController.getProfile
);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile (with cache invalidation)
 * @access  Private
 */
router.put('/profile',
  auth,
  validate.profileUpdate,
  profileController.updateProfile
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
      const { UserCache } = require('../models/UserCache');
      const result = await db.query(
        'UPDATE users SET avatar = $1, profile_picture_url = $2, updated_at = NOW() WHERE id = $3 RETURNING id, avatar, profile_picture_url, onboarding_completed',
        [req.supabaseUpload.publicUrl, req.supabaseUpload.publicUrl, req.user.id]
      );

      // Invalidate user cache so the next request picks up the new avatar
      UserCache.invalidate(`user:${req.user.id}`);
      UserCache.invalidate(`${req.user.id}`);

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
      logger.error('❌ Profile picture upload route error:', error.message);
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
  passwordController.changePassword
);

/**
 * @route   POST /api/v1/users/set-password
 * @desc    Set password for OAuth users (first-time setup)
 * @access  Private
 */
router.post('/set-password',
  auth,
  validate.passwordSet,
  passwordController.setPassword
);

module.exports = router;
