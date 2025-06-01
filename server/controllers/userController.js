/**
 * User Controller - Updated for new error handling
 * Handles all user-related HTTP requests
 * @module controllers/userController
 */

const User = require('../models/User');
const { generateTokens, refreshToken } = require('../middleware/auth');
const errorCodes = require('../utils/errorCodes');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const userController = {
  /**
   * Register a new user
   * @route POST /api/users/register
   */
  register: asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;
    
    // Validation
    if (!email || !username || !password) {
      throw { ...errorCodes.MISSING_REQUIRED };
    }

    if (password.length < 6) {
      throw { 
        ...errorCodes.VALIDATION_ERROR, 
        details: 'Password must be at least 6 characters' 
      };
    }

    // Create user
    const newUser = await User.create(email, username, password);
    
    logger.info('New user registered:', { userId: newUser.id, email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username
      }
    });
  }),

  /**
   * Login user
   * @route POST /api/users/login
   */
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'MISSING_REQUIRED',
          message: 'Email and password are required'
        }
      });
    }

    // Verify credentials
    const user = await User.verifyPassword(email, password);
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    logger.info('User logged in:', { userId: user.id });

    // Make sure we return here to prevent any further execution
    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        },
        accessToken,
        refreshToken
      }
    });
  }),

  /**
   * Get user profile
   * @route GET /api/users/profile
   */
  getProfile: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      throw { ...errorCodes.NOT_FOUND, message: 'User not found' };
    }

    res.json({
      success: true,
      data: user
    });
  }),

  /**
   * Update user profile
   * @route PUT /api/users/profile
   */
  updateProfile: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { username, currentPassword, newPassword } = req.body;

    // Validate password change if requested
    if (newPassword && !currentPassword) {
      throw { 
        ...errorCodes.VALIDATION_ERROR, 
        details: 'Current password required to set new password' 
      };
    }

    if (newPassword && newPassword.length < 6) {
      throw { 
        ...errorCodes.VALIDATION_ERROR, 
        details: 'New password must be at least 6 characters' 
      };
    }

    const updatedUser = await User.updateProfile(userId, {
      username,
      currentPassword,
      newPassword
    });

    logger.info('User profile updated:', { userId });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  }),

refreshToken: asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw { ...errorCodes.MISSING_REQUIRED, details: 'Refresh token required' };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const accessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    res.json({ 
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    throw { ...errorCodes.INVALID_TOKEN };
  }
}),
  /**
   * Logout user
   * @route POST /api/users/logout
   */
  logout: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    logger.info('User logged out:', { userId });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  })
};

module.exports = userController;