/**
 * User Controller - Production Ready
 * Handles all user-related HTTP requests with email verification
 * @module controllers/userController
 */

const User = require('../models/User');
const { generateTokens, verifyToken } = require('../middleware/auth');
const errorCodes = require('../utils/errorCodes');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const crypto = require('crypto');

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Register a new user with email verification
 * @route POST /api/v1/users/register
 */
const register = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  
  if (!email || !username || !password) {
    throw { ...errorCodes.MISSING_REQUIRED };
  }

  if (password.length < 6) {
    throw { 
      ...errorCodes.VALIDATION_ERROR, 
      details: 'Password must be at least 6 characters' 
    };
  }

  // Check if user exists but unverified
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

  const newUser = await User.create(email, username, password);
  
  // Generate and save verification token
  const verificationToken = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await User.saveVerificationToken(newUser.id, verificationToken, expiresAt);

  // Send verification email
  try {
    await emailService.sendVerificationEmail(email, username, verificationToken);
    logger.info('Verification email sent', { email, userId: newUser.id });
  } catch (emailError) {
    logger.error('Failed to send verification email', { 
      email, 
      userId: newUser.id,
      error: emailError.message 
    });
  }
  
  logger.info('User registered (unverified)', { userId: newUser.id, email });

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
});

/**
 * Login user with email verification check
 * @route POST /api/v1/users/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      error: {
        code: 'MISSING_REQUIRED',
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      }
    });
  }

  try {
    const user = await User.verifyPassword(email, password);
    
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email before logging in. Check your inbox or request a new verification email.',
          requiresVerification: true,
          email: user.email,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    logger.info('User logged in', { userId: user.id, email });

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          email_verified: user.email_verified,
          language_preference: user.language_preference,
          theme_preference: user.theme_preference,
          currency_preference: user.currency_preference
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Login error', { email, error: error.message });
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Login failed due to server error',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * Get user profile
 * @route GET /api/v1/users/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);
  
  if (!user) {
    throw { ...errorCodes.NOT_FOUND, message: 'User not found' };
  }

  // Ensure profile picture URL is complete
  if (user.preferences && user.preferences.profilePicture) {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.API_URL || `${req.protocol}://${req.get('host')}`
      : 'http://localhost:5000';
    
    // Always construct full URL from relative path
    if (user.preferences.profilePicture.startsWith('/uploads/')) {
      user.preferences.profilePicture = `${baseUrl}${user.preferences.profilePicture}`;
    } else if (user.preferences.profilePicture.startsWith('uploads/')) {
      user.preferences.profilePicture = `${baseUrl}/${user.preferences.profilePicture}`;
    } else if (!user.preferences.profilePicture.startsWith('http')) {
      // Handle any other relative path format
      user.preferences.profilePicture = `${baseUrl}/${user.preferences.profilePicture}`;
    }
  }

  res.json({
    success: true,
    data: user
  });
});

/**
 * Update user profile including preferences
 * @route PUT /api/v1/users/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { 
    email,
    username, 
    currentPassword, 
    newPassword,
    language_preference,
    theme_preference,
    currency_preference
  } = req.body;

  // ✅ רק validation לשינוי סיסמה
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

  // ✅ לא דורש email/username להעדפות
  const updatedUser = await User.updateProfile(userId, {
    email,
    username,
    currentPassword,
    newPassword,
    language_preference,
    theme_preference,
    currency_preference
  });

  logger.info('User profile updated', { userId });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser
  });
});

/**
 * Update legacy preferences (JSONB)
 * @route PUT /api/v1/users/preferences
 */
const updatePreferences = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const preferences = req.body;

  const updatedPreferences = await User.updatePreferences(userId, preferences);

  logger.info('User preferences updated', { userId });

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: { preferences: updatedPreferences }
  });
});

/**
 * Refresh JWT token
 * @route POST /api/v1/users/refresh-token
 */
const refreshUserToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw { ...errorCodes.MISSING_REQUIRED, details: 'Refresh token required' };
  }

  try {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    const decoded = verifyToken(token, refreshSecret);
    
    // Verify user still exists and get fresh data
    const user = await User.findById(decoded.id);
    if (!user || !user.email_verified) {
      throw { ...errorCodes.INVALID_TOKEN, message: 'User not found or not verified' };
    }
    
    // Generate new access token only
    const jwt = require('jsonwebtoken');
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
        issuer: 'spendwise-server',
        audience: 'spendwise-client'
      }
    );
    
    res.json({ 
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    logger.warn('Token refresh failed', { error: error.message });
    throw { ...errorCodes.INVALID_TOKEN };
  }
});

/**
 * Forgot password - send reset token
 * @route POST /api/v1/users/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    throw { ...errorCodes.MISSING_REQUIRED, details: 'Email is required' };
  }

  try {
    const resetInfo = await User.createPasswordResetToken(email);
    
    // Always send same response in production
    if (process.env.NODE_ENV === 'production') {
      const emailSent = await emailService.sendPasswordReset(email, resetInfo.token);
      
      if (!emailSent) {
        logger.error('Failed to send password reset email in production', { email });
      }
      
      logger.info('Password reset requested', { email, emailSent });
      
      // Always return same response to prevent email enumeration
      return res.json({
        success: true,
        message: 'If the email exists in our system, a reset link has been sent.'
      });
    } else {
      // Development mode - more helpful response
      const emailSent = await emailService.sendPasswordReset(email, resetInfo.token);
      
      if (emailSent) {
        logger.info('Password reset email sent', { email });
        return res.json({
          success: true,
          message: 'Password reset email sent successfully! Check your inbox.'
        });
      } else {
        logger.warn('Email service unavailable, using development fallback', { email });
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
    }
  } catch (error) {
    logger.error('Forgot password error', { email, error: error.message });
    
    // Always return same response in production
    res.json({
      success: true,
      message: 'If the email exists in our system, a reset link has been sent.'
    });
  }
});

/**
 * Reset password with token
 * @route POST /api/v1/users/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
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
});

/**
 * Logout user
 * @route POST /api/v1/users/logout
 */
const logout = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  logger.info('User logged out', { userId });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * Verify email with token
 * @route GET /api/v1/users/verify-email/:token
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw { ...errorCodes.MISSING_REQUIRED, details: 'Verification token is required' };
  }

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

  const user = await User.findById(verificationData.user_id);

  // Generate auth tokens for immediate login
  const { accessToken, refreshToken } = generateTokens(user);

  logger.info('Email verified successfully', { userId: verificationData.user_id });

  res.json({
    success: true,
    message: 'Email verified successfully! You can now log in.',
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        email_verified: true,
        language_preference: user.language_preference,
        theme_preference: user.theme_preference,
        currency_preference: user.currency_preference
      },
      accessToken,
      refreshToken
    }
  });
});

/**
 * Resend verification email
 * @route POST /api/v1/users/resend-verification
 */
const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw { ...errorCodes.MISSING_REQUIRED, details: 'Email is required' };
  }

  const user = await User.findByEmail(email);

  if (!user) {
    throw { ...errorCodes.NOT_FOUND, message: 'User not found' };
  }

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

  await User.saveVerificationToken(user.id, verificationToken, expiresAt);

  // Send verification email
  try {
    await emailService.sendVerificationEmail(user.email, user.username, verificationToken);
    logger.info('Verification email resent', { email });
    
    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (emailError) {
    logger.error('Failed to send verification email', { 
      email, 
      error: emailError.message 
    });
    throw { ...errorCodes.INTERNAL_ERROR, message: 'Failed to send verification email' };
  }
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  updatePreferences,
  refreshToken: refreshUserToken,
  forgotPassword,
  resetPassword,
  logout,
  verifyEmail,
  resendVerificationEmail
};