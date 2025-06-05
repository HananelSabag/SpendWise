/**
 * User Controller - Updated for new error handling and email verification
 * Handles all user-related HTTP requests
 * @module controllers/userController
 */

const User = require('../models/User');
const { generateTokens, refreshToken } = require('../middleware/auth');
const errorCodes = require('../utils/errorCodes');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const crypto = require('crypto'); // NEW: For verification tokens

// NEW: Helper function to generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const userController = {
  /**
   * Register a new user - UPDATED: Now includes email verification
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

    // NEW: Check if user exists but unverified
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      if (!existingUser.email_verified) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Email already registered but not verified. Please check your email or request a new verification link.',
            requiresVerification: true,
            email: existingUser.email
          }
        });
      }
      throw { ...errorCodes.VALIDATION_ERROR, details: 'User already exists' };
    }

    // Create user (email_verified defaults to false)
    const newUser = await User.create(email, username, password);
    
    // NEW: Generate and save verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await User.saveVerificationToken(newUser.id, verificationToken, expiresAt);

    // NEW: Send verification email
    try {
      await emailService.sendVerificationEmail(email, username, verificationToken);
      logger.info('📧 Verification email sent:', { email, userId: newUser.id });
    } catch (emailError) {
      logger.error('📧 Failed to send verification email:', emailError);
      // Continue with registration even if email fails
    }
    
    logger.info('New user registered (unverified):', { userId: newUser.id, email });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      data: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        requiresVerification: true
      }
    });
  }),

  /**
   * Login user - UPDATED: Now checks email verification
   * @route POST /api/users/login
   */
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    console.log(`🔑 [LOGIN-CONTROLLER] Login attempt for email: ${email}`);
    
    if (!email || !password) {
      console.log(`❌ [LOGIN-CONTROLLER] Missing credentials - email: ${!!email}, password: ${!!password}`);
      return res.status(400).json({
        error: {
          code: 'MISSING_REQUIRED',
          message: 'Email and password are required'
        }
      });
    }

    try {
      // Verify credentials
      console.log(`🔍 [LOGIN-CONTROLLER] Verifying password for: ${email}`);
      const user = await User.verifyPassword(email, password);
      
      if (!user) {
        console.log(`❌ [LOGIN-CONTROLLER] Authentication failed for: ${email}`);
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      // NEW: Check if email is verified
      if (!user.email_verified) {
        console.log(`❌ [LOGIN-CONTROLLER] Email not verified for: ${email}`);
        return res.status(403).json({
          error: {
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Please verify your email before logging in. Check your inbox or request a new verification email.',
            requiresVerification: true,
            email: user.email
          }
        });
      }

      console.log(`✅ [LOGIN-CONTROLLER] Authentication successful for: ${email}, userId: ${user.id}`);

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);
      console.log(`🎫 [LOGIN-CONTROLLER] Tokens generated for userId: ${user.id}`);

      logger.info('User logged in:', { userId: user.id });

      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            email_verified: user.email_verified
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error(`💥 [LOGIN-CONTROLLER] Login error for ${email}:`, error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Login failed due to server error'
        }
      });
    }
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
              resetUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetInfo.token}`,
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
  }),

  /**
   * NEW: Verify email with token
   * @route GET /api/users/verify-email/:token
   */
  verifyEmail: asyncHandler(async (req, res) => {
    const { token } = req.params;

    if (!token) {
      throw { ...errorCodes.MISSING_REQUIRED, details: 'Verification token is required' };
    }

    // Find and validate token
    const verificationData = await User.findVerificationToken(token);

    if (!verificationData) {
      throw { ...errorCodes.NOT_FOUND, message: 'Invalid or expired verification token' };
    }

    if (new Date(verificationData.expires_at) < new Date()) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Verification token has expired' };
    }

    if (verificationData.used) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Verification token has already been used' };
    }

    // Mark user as verified and token as used
    await User.verifyEmail(verificationData.user_id);
    await User.markVerificationTokenAsUsed(token);

    // Get user details for response
    const user = await User.findById(verificationData.user_id);

    // Generate auth tokens for immediate login
    const { accessToken, refreshToken } = generateTokens(user);

    logger.info('Email verified successfully:', { userId: verificationData.user_id });

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          email_verified: true
        },
        accessToken,
        refreshToken
      }
    });
  }),

  /**
   * NEW: Resend verification email
   * @route POST /api/users/resend-verification
   */
  resendVerificationEmail: asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw { ...errorCodes.MISSING_REQUIRED, details: 'Email is required' };
    }

    // Find user by email
    const user = await User.findByEmail(email);

    if (!user) {
      throw { ...errorCodes.NOT_FOUND, message: 'User not found' };
    }

    // Check if already verified
    if (user.email_verified) {
      throw { ...errorCodes.VALIDATION_ERROR, details: 'Email is already verified' };
    }

    // Check for recent verification tokens (prevent spam)
    const recentToken = await User.getRecentVerificationToken(user.id);
    if (recentToken) {
      const timeSinceLastToken = Date.now() - new Date(recentToken.created_at).getTime();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (timeSinceLastToken < fiveMinutes) {
        const waitTime = Math.ceil((fiveMinutes - timeSinceLastToken) / 1000 / 60);
        throw { 
          ...errorCodes.VALIDATION_ERROR, 
          details: `Please wait ${waitTime} more minutes before requesting another verification email` 
        };
      }
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save new token
    await User.saveVerificationToken(user.id, verificationToken, expiresAt);

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, user.username, verificationToken);
      logger.info('📧 Verification email resent:', { email });
      
      res.json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (emailError) {
      logger.error('📧 Failed to send verification email:', emailError);
      throw { ...errorCodes.INTERNAL_ERROR, message: 'Failed to send verification email' };
    }
  }),
};

module.exports = userController;