const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const userController = require('../controllers/userController');
const { uploadProfilePicture } = require('../middleware/upload');
const validate = require('../middleware/validate');

/**
 * @route   POST /api/v1/users/register
 * @desc    Register a new user
 */
router.post('/register', 
  validate.user, 
  userController.register
);

/**
 * @route   POST /api/v1/users/login
 * @desc    User login
 */
router.post('/login', 
  validate.user,  // Keep only essential middleware
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
 */
router.post('/logout', 
  userController.logout
);

module.exports = router;