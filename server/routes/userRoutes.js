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
 * @route   GET /api/v1/users/verify-email-debug/:token
 * @desc    Debug email verification - helps troubleshoot iPhone issues
 * @access  Public
 */
router.get('/verify-email-debug/:token', (req, res) => {
  const { token } = req.params;
  const userAgent = req.get('User-Agent') || '';
  const origin = req.get('Origin') || '';
  const referer = req.get('Referer') || '';
  
  // Enhanced iPhone/iOS detection
  const isIPhone = /iPhone|iPad|iPod/i.test(userAgent);
  const isGmailApp = /Gmail/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS/i.test(userAgent);
  const isIOSMail = /MobileMail/i.test(userAgent);
  
  // Token validation
  const isValidFormat = /^[A-Za-z0-9]{20}$/.test(token);
  
  res.json({
    success: true,
    debug: {
      token: token ? `${token.substring(0, 8)}...` : 'missing',
      tokenLength: token ? token.length : 0,
      tokenFormat: isValidFormat ? 'Valid' : 'Invalid',
      userAgent: userAgent,
      origin: origin,
      referer: referer,
      isIPhone: isIPhone,
      isGmailApp: isGmailApp,
      isSafari: isSafari,
      isIOSMail: isIOSMail,
      timestamp: new Date().toISOString(),
      expectedVerificationUrl: `${process.env.CLIENT_URL}/verify-email/${token}`,
      serverUrl: process.env.SERVER_URL || 'Not set',
      clientUrl: process.env.CLIENT_URL || 'Not set'
    },
    troubleshooting: isIPhone ? {
      detected: 'iPhone/iOS device detected',
      recommendations: [
        '1. If using Gmail app: Copy the verification link and paste it in Safari',
        '2. If using iOS Mail app: Try long-pressing the link and selecting "Open in Safari"',
        '3. Make sure you have good internet connection',
        '4. Try clearing Safari cache if the issue persists',
        '5. Avoid using email app browsers - use Safari directly'
      ],
      possibleIssues: isGmailApp ? [
        'Gmail app on iPhone sometimes modifies verification links',
        'Gmail app WebView has different security restrictions',
        'Link clicking in Gmail app may not preserve full URL',
        'Recommendation: Always copy-paste verification links on iPhone'
      ] : [
        'iOS email apps sometimes block external links',
        'iOS Safari might have strict security settings',
        'Network connectivity issues on mobile',
        'Cached DNS or routing issues'
      ],
      solution: isGmailApp 
        ? 'SOLUTION: Copy the verification link from Gmail and paste it directly in Safari browser'
        : 'SOLUTION: Copy the verification link and open it in Safari browser'
    } : {
      detected: 'Non-iPhone device',
      message: 'This debug info is specifically designed for iPhone troubleshooting',
      generalTips: [
        'Ensure you have a stable internet connection',
        'Try refreshing the page if verification fails',
        'Contact support if issues persist'
      ]
    },
    nextSteps: {
      verificationEndpoint: `/api/v1/users/verify-email/${token}`,
      clientRoute: `/verify-email/${token}`,
      fullVerificationUrl: `${process.env.CLIENT_URL}/verify-email/${token}`,
      instructions: isIPhone && isGmailApp 
        ? 'Copy the fullVerificationUrl above and paste it in Safari browser'
        : 'Click the verification button in your email or use the fullVerificationUrl above'
    },
    message: 'Debug endpoint for email verification issues'
  });
});

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
      if (!req.file || !req.supabaseUpload) {
        return res.status(400).json({
          error: {
            code: 'MISSING_FILE',
            message: 'No file uploaded or upload failed',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Store Supabase public URL in database
      const User = require('../models/User');
      await User.updatePreferences(req.user.id, {
        profilePicture: req.supabaseUpload.publicUrl
      });

      res.json({
        success: true,
        data: {
          filename: req.supabaseUpload.fileName,
          url: req.supabaseUpload.publicUrl,
          size: req.supabaseUpload.size,
          storage: 'supabase'
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('❌ [PROFILE PICTURE] Route error:', err);
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