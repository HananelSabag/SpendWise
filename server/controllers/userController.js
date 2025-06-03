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
const emailService = require('../services/emailService');

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
      const jwt = require('jsonwebtoken');
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
   * Forgot password - send reset token
   * @route POST /api/users/forgot-password
   */
  forgotPassword: asyncHandler(async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      throw { ...errorCodes.MISSING_REQUIRED, details: 'Email is required' };
    }

    try {
      const resetInfo = await User.createPasswordResetToken(email);
      
      if (process.env.NODE_ENV === 'development') {
        // Try to send email first
        const emailSent = await emailService.sendPasswordReset(email, resetInfo.token);
        
        if (emailSent) {
          logger.info('📧 Password reset email sent (DEV):', { email });
          return res.json({
            success: true,
            message: 'Password reset email sent successfully! Check your inbox.',
            data: {
              // In development, also show the reset URL for testing
              resetUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetInfo.token}`,
              note: 'Email sent! But here\'s the direct link for development testing.'
            }
          });
        } else {
          // Fallback to development mode if email service fails
          logger.warn('📧 Email service unavailable, using development fallback:', { email });
          return res.json({
            success: true,
            message: 'Email service not configured - Development Mode',
            data: { 
              token: resetInfo.token,
              resetUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetInfo.token}`,
              note: 'Email service not available. Use the URL above to reset password.'
            }
          });
        }
      } else {
        // Production mode - only try to send email
        const emailSent = await emailService.sendPasswordReset(email, resetInfo.token);
        
        if (!emailSent) {
          logger.error('📧 Failed to send password reset email in production');
          // In production, we still return success for security
        }
        
        // Always return success message for security (don't reveal if email exists)
        logger.info('📧 Password reset requested (PROD):', { email, emailSent });
        return res.json({
          success: true,
          message: 'If the email exists in our system, a reset link has been sent.'
        });
      }
    } catch (error) {
      logger.error('Forgot password error:', error);
      
      // Don't reveal if email exists for security
      res.json({
        success: true,
        message: 'If the email exists in our system, a reset link has been sent.'
      });
    }
  }),

  /**
   * Reset password with token
   * @route POST /api/users/reset-password
   */
  resetPassword: asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      throw { ...errorCodes.MISSING_REQUIRED, details: 'Token and new password are required' };
    }

    if (newPassword.length < 6) {
      throw { 
        ...errorCodes.VALIDATION_ERROR, 
        details: 'Password must be at least 6 characters' 
      };
    }

    await User.resetPassword(token, newPassword);
    
    logger.info('Password reset successful');

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
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