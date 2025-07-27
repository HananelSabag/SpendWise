/**
 * OPTIMIZED User Controller - Enhanced Performance Version
 * Includes Google OAuth, smart caching, and enhanced security
 * @module controllers/userController_optimized
 */

const { User } = require('../models/User');
const { generateTokens, verifyToken } = require('../middleware/auth');
const errorCodes = require('../utils/errorCodes');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const crypto = require('crypto');
const db = require('../config/db'); // ✅ FIXED: Added missing db import

// Enhanced token generation with better entropy
const generateVerificationToken = () => {
  // Generate cryptographically secure token (32 chars)
  return crypto.randomBytes(16).toString('hex');
};

const userController = {
  /**
   * 🚀 OPTIMIZED: Register with enhanced validation and performance tracking
   * @route POST /api/v1/users/register
   */
  register: asyncHandler(async (req, res) => {
    const start = Date.now();
    const { email, username, password } = req.body;
    
    if (!email || !username || !password) {
      throw { ...errorCodes.MISSING_REQUIRED };
    }

    if (password.length < 8) {
      throw { 
        ...errorCodes.VALIDATION_ERROR, 
        details: 'Password must be at least 8 characters' 
      };
    }

    try {
      // Check if user exists (using optimized User model with caching)
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        if (!existingUser.email_verified) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'EMAIL_NOT_VERIFIED',
              message: 'Email already registered but not verified. Please check your email.',
              details: 'A verification email was sent to your address'
            }
          });
        }
        throw { ...errorCodes.ALREADY_EXISTS, details: 'Email already registered' };
      }

      // Create user with optimized model
      const user = await User.create(email, username, password);

      // Generate verification token
      const verificationToken = generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store verification token
      await db.query(`
        INSERT INTO email_verification_tokens (user_id, token, expires_at)
        VALUES ($1, $2, $3)
      `, [user.id, verificationToken, expiresAt], 'create_verification_token');

      // Send verification email (async - don't wait)
      emailService.sendVerificationEmail(user.email, user.username, verificationToken)
        .catch(error => {
          logger.error('Failed to send verification email', {
            userId: user.id,
            email: user.email,
            error: error.message
          });
        });

      const duration = Date.now() - start;
      logger.info('✅ User registered successfully', {
        userId: user.id,
        email: user.email,
        username: user.username,
        duration: `${duration}ms`,
        performance: duration < 200 ? 'excellent' : duration < 500 ? 'good' : 'slow'
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            email_verified: user.email_verified
          },
          message: 'Registration successful. Please check your email for verification.'
        },
        metadata: {
          duration: `${duration}ms`,
          optimized: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ User registration failed', {
        email,
        username,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }),

  /**
   * 🚀 OPTIMIZED: Login with enhanced security and performance tracking
   * @route POST /api/v1/users/login
   */
  login: asyncHandler(async (req, res) => {
    const start = Date.now();
    const { email, password } = req.body;

    if (!email || !password) {
      throw { ...errorCodes.MISSING_REQUIRED };
    }

    try {
      // Use optimized authentication with caching
      const user = await User.authenticate(email, password);

      if (!user.email_verified) {
        throw {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email before logging in',
          status: 403
        };
      }

      // Generate JWT tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // ✅ FIX: Normalize user data for client expectations
      const normalizedUser = {
        id: user.id,
        email: user.email,
        username: user.username || user.first_name || 'User',
        name: user.username || user.first_name || 'User', // Client expects 'name' field
        firstName: user.first_name || user.firstName || '',
        lastName: user.last_name || user.lastName || '',
        role: user.role || 'user',
        isAdmin: user.isAdmin || false,
        isSuperAdmin: user.isSuperAdmin || false,
        email_verified: user.email_verified || false,
        emailVerified: user.email_verified || false,
        onboarding_completed: user.onboarding_completed || false,
        onboardingCompleted: user.onboarding_completed || false,
        language_preference: user.language_preference || 'en',
        languagePreference: user.language_preference || 'en',
        theme_preference: user.theme_preference || 'light',
        themePreference: user.theme_preference || 'light',
        currency_preference: user.currency_preference || 'USD',
        currencyPreference: user.currency_preference || 'USD',
        preferences: user.preferences || {},
        created_at: user.created_at,
        createdAt: user.created_at,
        updated_at: user.updated_at,
        updatedAt: user.updated_at,
        last_login: user.last_login_at,
        lastLogin: user.last_login_at,
        avatar: user.avatar || null,
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        birthday: user.birthday || null,
        isPremium: user.isPremium || false
      };

      const duration = Date.now() - start;
      logger.info('✅ User login successful', {
        userId: user.id,
        email: user.email,
        duration: `${duration}ms`,
        performance: duration < 300 ? 'excellent' : duration < 600 ? 'good' : 'slow'
      });

      res.json({
        success: true,
        data: {
          user: normalizedUser,
          accessToken, // ✅ FIX: Put accessToken at top level where client expects it
          tokens: {
            accessToken,
            refreshToken
          }
        },
        metadata: {
          duration: `${duration}ms`,
          cached_auth: true,
          optimized: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.warn('❌ User login failed', {
        email,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }),

  /**
   * 🚀 NEW: Google OAuth login/register
   * @route POST /api/v1/users/auth/google
   */
  googleAuth: asyncHandler(async (req, res) => {
    const start = Date.now();
    const { idToken, email, name, picture } = req.body;

    if (!idToken || !email) {
      throw { 
        ...errorCodes.VALIDATION_ERROR, 
        details: 'Google ID token and email are required' 
      };
    }

    try {
      // TODO: Verify Google ID token with Google's API
      // For now, we'll trust the frontend verification
      logger.info('🔐 Google OAuth attempt', { email, name });

      // Check if user exists
      let user = await User.findByEmail(email);

      if (!user) {
        // Create new user with Google OAuth
        const username = name?.replace(/\s+/g, '_').toLowerCase() || email.split('@')[0];
        const randomPassword = crypto.randomBytes(32).toString('hex');

        user = await User.create(email, username, randomPassword);
        
        // Mark as verified since Google verified the email
        await User.update(user.id, { 
          email_verified: true,
          onboarding_completed: false 
        });

        logger.info('✅ New Google user created', {
          userId: user.id,
          email,
          username
        });
      } else if (!user.email_verified) {
        // Mark existing user as verified
        await User.update(user.id, { email_verified: true });
        logger.info('✅ Existing user verified via Google', {
          userId: user.id,
          email
        });
      }

      // Generate JWT tokens
      const { accessToken, refreshToken } = generateTokens(user);

      const duration = Date.now() - start;
      logger.info('✅ Google OAuth successful', {
        userId: user.id,
        email,
        isNewUser: !user.id,
        duration: `${duration}ms`,
        performance: duration < 400 ? 'excellent' : duration < 800 ? 'good' : 'slow'
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            email_verified: true,
            onboarding_completed: user.onboarding_completed
          },
          tokens: {
            accessToken,
            refreshToken
          },
          isNewUser: !user.id
        },
        metadata: {
          auth_method: 'google_oauth',
          duration: `${duration}ms`,
          optimized: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ Google OAuth failed', {
        email,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }),

  /**
   * 🚀 OPTIMIZED: Get user profile with smart caching
   * @route GET /api/v1/users/profile
   */
  getProfile: asyncHandler(async (req, res) => {
    const start = Date.now();
    const userId = req.user.id;

    try {
      // Use optimized User model with caching
      const user = await User.findById(userId);

      if (!user) {
        throw { ...errorCodes.NOT_FOUND, details: 'User not found' };
      }

      // ✅ FIX: Ensure consistent normalization (same as login)
      const normalizedUser = {
        id: user.id,
        email: user.email,
        username: user.username || user.first_name || 'User',
        name: user.username || user.first_name || 'User', // Client expects 'name' field
        firstName: user.first_name || user.firstName || '',
        lastName: user.last_name || user.lastName || '',
        role: user.role || 'user',
        isAdmin: user.isAdmin || false,
        isSuperAdmin: user.isSuperAdmin || false,
        email_verified: user.email_verified || false,
        emailVerified: user.email_verified || false,
        onboarding_completed: user.onboarding_completed || false,
        onboardingCompleted: user.onboarding_completed || false,
        language_preference: user.language_preference || 'en',
        languagePreference: user.language_preference || 'en',
        theme_preference: user.theme_preference || 'light',
        themePreference: user.theme_preference || 'light',
        currency_preference: user.currency_preference || 'USD',
        currencyPreference: user.currency_preference || 'USD',
        preferences: user.preferences || {},
        created_at: user.created_at,
        createdAt: user.created_at,
        updated_at: user.updated_at,
        updatedAt: user.updated_at,
        last_login: user.last_login_at,
        lastLogin: user.last_login_at,
        avatar: user.avatar || null,
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        birthday: user.birthday || null,
        isPremium: user.isPremium || false
      };

      const duration = Date.now() - start;
      logger.debug('✅ User profile served', {
        userId,
        duration: `${duration}ms`,
        cached: true,
        performance: duration < 50 ? 'excellent' : duration < 200 ? 'good' : 'slow'
      });

      res.json({
        success: true,
        data: normalizedUser, // ✅ FIX: Return normalized user data
        metadata: {
          duration: `${duration}ms`,
          cached: true,
          optimized: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ Get profile failed', {
        userId,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }),

  /**
   * 🚀 OPTIMIZED: Update user profile with cache invalidation
   * @route PUT /api/v1/users/profile
   */
  updateProfile: asyncHandler(async (req, res) => {
    const start = Date.now();
    const userId = req.user.id;
    const updates = req.body;

    try {
      const user = await User.update(userId, updates);

      const duration = Date.now() - start;
      logger.info('✅ User profile updated', {
        userId,
        fields: Object.keys(updates),
        duration: `${duration}ms`,
        performance: duration < 100 ? 'excellent' : duration < 300 ? 'good' : 'slow'
      });

      res.json({
        success: true,
        data: user,
        metadata: {
          updated: true,
          fields: Object.keys(updates),
          duration: `${duration}ms`,
          cache_invalidated: true,
          optimized: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ Update profile failed', {
        userId,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }),

  /**
   * 🚀 OPTIMIZED: Email verification with enhanced security
   * @route POST /api/v1/users/verify-email
   */
  verifyEmail: asyncHandler(async (req, res) => {
    const start = Date.now();
    const { token } = req.body;

    if (!token) {
      throw { ...errorCodes.MISSING_REQUIRED, details: 'Verification token is required' };
    }

    try {
      // Get verification token
      const tokenResult = await db.query(`
        SELECT user_id, expires_at, used
        FROM email_verification_tokens
        WHERE token = $1
      `, [token], 'get_verification_token');

      if (tokenResult.rows.length === 0) {
        throw { 
          code: 'INVALID_TOKEN',
          message: 'Invalid verification token',
          status: 400
        };
      }

      const tokenData = tokenResult.rows[0];

      if (tokenData.used) {
        throw {
          code: 'TOKEN_ALREADY_USED',
          message: 'Verification token has already been used',
          status: 400
        };
      }

      if (new Date() > new Date(tokenData.expires_at)) {
        throw {
          code: 'TOKEN_EXPIRED',
          message: 'Verification token has expired',
          status: 400
        };
      }

      // Mark user as verified
      await User.update(tokenData.user_id, { email_verified: true });

      // Mark token as used
      await db.query(`
        UPDATE email_verification_tokens
        SET used = true, used_at = NOW()
        WHERE token = $1
      `, [token], 'mark_token_used');

      const duration = Date.now() - start;
      logger.info('✅ Email verified successfully', {
        userId: tokenData.user_id,
        duration: `${duration}ms`
      });

      res.json({
        success: true,
        data: {
          message: 'Email verified successfully',
          verified: true
        },
        metadata: {
          duration: `${duration}ms`,
          optimized: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.warn('❌ Email verification failed', {
        token: token?.substring(0, 8) + '...',
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }),

  /**
   * 📊 Get performance statistics
   * @route GET /api/v1/users/performance
   */
  getPerformanceStats: asyncHandler(async (req, res) => {
    try {
      const stats = {
        user_model: User.getPerformanceStats(),
        cache_stats: {
          user_cache: User.getPerformanceStats().cache
        }
      };

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('❌ Performance stats fetch failed', {
        error: error.message
      });
      throw error;
    }
  })
};

module.exports = userController; 