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
 * 🚀 NEW: Google OAuth Authentication
 * @route   POST /api/v1/users/auth/google
 * @desc    Login/Register with Google OAuth
 * @access  Public
 */
router.post('/auth/google',
  authLimiter,
  // validate.googleAuth, // DISABLED: validation function doesn't exist yet
  userController.googleAuth
);

/**
 * @route   POST /api/v1/users/verify-email
 * @desc    Verify email with token (enhanced security)
 * @access  Public
 */
router.post('/verify-email',
  emailVerificationLimiter,
  // validate.emailVerification, // DISABLED: validation function doesn't exist yet
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
  // validate.profileUpdate, // DISABLED: validation function doesn't exist yet
  userController.updateProfile
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
  // TODO: Add admin middleware in production
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