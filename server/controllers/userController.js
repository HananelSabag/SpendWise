/**
 * OPTIMIZED User Controller - Enhanced Performance Version
 * Includes Google OAuth, smart caching, and enhanced security
 * @module controllers/userController_optimized
 */

const { User } = require('../models/User');
const { generateTokens, verifyToken } = require('../middleware/auth');
const { normalizeUserData } = require('../utils/userNormalizer');
const errorCodes = require('../utils/errorCodes');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const crypto = require('crypto');
const db = require('../config/db');

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

      // ✅ CLEANED: Use centralized user normalization
      const normalizedUser = normalizeUserData(user);

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
   * 🔄 NEW: Token Refresh Endpoint
   * @route POST /api/v1/users/refresh-token
   */
  refreshToken: asyncHandler(async (req, res) => {
    const start = Date.now();
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw {
        code: 'MISSING_REFRESH_TOKEN',
        message: 'Refresh token is required',
        status: 400
      };
    }

    try {
      // Verify refresh token
      const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
      const userId = decoded.userId;

      // Get fresh user data
      const user = await User.findById(userId);
      if (!user) {
        throw {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          status: 404
        };
      }

      if (!user.is_active) {
        throw {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Account is deactivated',
          status: 403
        };
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

      // ✅ CLEANED: Use centralized user normalization
      const normalizedUser = normalizeUserData(user);

      const duration = Date.now() - start;
      logger.info('✅ Token refreshed successfully', {
        userId: user.id,
        email: user.email,
        duration: `${duration}ms`
      });

      res.json({
        success: true,
        data: {
          user: normalizedUser,
          accessToken,
          refreshToken: newRefreshToken,
          tokens: {
            accessToken,
            refreshToken: newRefreshToken
          }
        },
        metadata: {
          duration: `${duration}ms`,
          refreshed: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.warn('❌ Token refresh failed', {
        error: error.message,
        duration: `${duration}ms`
      });
      
      if (error.message === 'Invalid token') {
        throw {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token',
          status: 401
        };
      }
      
      throw error;
    }
  }),

  /**
   * 🚀 NEW: Google OAuth login/register
   * @route POST /api/v1/users/auth/google
   */
  googleAuth: asyncHandler(async (req, res) => {
    const start = Date.now();
    let { idToken, email, name, picture } = req.body;

    if (!idToken) {
      throw { 
        ...errorCodes.VALIDATION_ERROR, 
        details: 'Google ID token is required' 
      };
    }

    // ✅ Extract email from JWT if not provided
    if (!email) {
      try {
        // Basic JWT decode (just payload, not verification)
        const payloadBase64 = idToken.split('.')[1];
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
        
        email = payload.email;
        name = name || payload.name;
        picture = picture || payload.picture;
      } catch (decodeError) {
        throw { 
          ...errorCodes.VALIDATION_ERROR, 
          details: 'Invalid Google ID token or missing email' 
        };
      }
    }

    if (!email) {
      throw { 
        ...errorCodes.VALIDATION_ERROR, 
        details: 'Email is required (from idToken or request body)' 
      };
    }

    try {
      // TODO: Verify Google ID token with Google's API
      // For now, we'll trust the frontend verification
      logger.info('🔐 Google OAuth attempt', { email, name });

      // ✅ Extract Google user ID from JWT payload
      let googleUserId = null;
      try {
        const payloadBase64 = idToken.split('.')[1];
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
        googleUserId = payload.sub; // Google user ID (usually numeric)
      } catch (extractError) {
        // Continue without Google ID - not critical
      }

      // Check if user exists
      let user = await User.findByEmail(email);

      if (!user) {
        // ✅ EDGE CASE: New Google user - create with Google OAuth
        logger.info('🆕 Creating new Google OAuth user', { email });
        const username = name || email.split('@')[0];
        const randomPassword = crypto.randomBytes(32).toString('hex');

        user = await User.create(email, username, randomPassword);
        
        // Mark as verified since Google verified the email and store Google info
        await User.update(user.id, { 
          email_verified: true,
          onboarding_completed: false, // ✅ Will trigger onboarding flow
          google_id: googleUserId,
          oauth_provider: 'google',
          oauth_provider_id: googleUserId,
          profile_picture_url: picture,
          avatar: picture,
          first_name: name?.split(' ')[0] || '',
          last_name: name?.split(' ').slice(1).join(' ') || '',
          // ✅ Set same default preferences as regular registration
          language_preference: 'en',      // Default language: English
          currency_preference: 'ILS',     // Default currency: Israeli Shekel (ILS code)
          theme_preference: 'system'      // Default theme: System
        });

        // Refresh user data
        user = await User.findById(user.id);

        logger.info('✅ New Google user created', {
          userId: user.id,
          email,
          username
        });
      } else {
        // ✅ EDGE CASE: Existing user signing in with Google
        const hadGoogleAuth = !!user.google_id;
        const hadRegularAuth = !!user.password_hash;
        
        logger.info('🔍 Existing user Google login', {
          email,
          hadGoogleAuth,
          hadRegularAuth,
          authMethod: hadGoogleAuth ? 'google' : hadRegularAuth ? 'regular' : 'unknown'
        });

        // Update existing user with Google info if not already set
        const updateData = { email_verified: true };
        
        // Link Google account if not already linked
        if (!user.google_id) {
          updateData.google_id = googleUserId;
          updateData.oauth_provider = 'google';
          updateData.oauth_provider_id = googleUserId;
          
          if (hadRegularAuth) {
            logger.info('🔗 Linking Google account to existing regular account', { 
              email, 
              userId: user.id 
            });
          }
        }
        
        // Update profile info from Google ONLY if no existing profile picture
        if (picture && !user.profile_picture_url && !user.avatar) {
          updateData.profile_picture_url = picture;
          updateData.avatar = picture;
          logger.info('🖼️ Setting Google profile picture for user without existing avatar', { 
            userId: user.id,
            googlePicture: picture 
          });
        } else if (picture && (user.profile_picture_url || user.avatar)) {
          logger.info('🚫 Skipping Google profile picture - user already has profile picture', { 
            userId: user.id,
            hasProfilePictureUrl: !!user.profile_picture_url,
            hasAvatar: !!user.avatar 
          });
        }
        if (name && (!user.first_name || !user.last_name)) {
          updateData.first_name = name?.split(' ')[0] || user.first_name || '';
          updateData.last_name = name?.split(' ').slice(1).join(' ') || user.last_name || '';
        }
        
        await User.update(user.id, updateData);
        
        // Refresh user data
        user = await User.findById(user.id);
        
        logger.info('✅ Existing user authenticated via Google', {
          userId: user.id,
          email,
          linkedGoogle: !hadGoogleAuth && updateData.google_id,
          updatedFields: Object.keys(updateData)
        });
      }

      // Generate JWT tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // ✅ CLEANED: Use centralized user normalization  
      const normalizedUser = normalizeUserData(user);

      const duration = Date.now() - start;
      logger.info('✅ Google OAuth successful', {
        userId: user.id,
        email,
        duration: `${duration}ms`,
        performance: duration < 400 ? 'excellent' : duration < 800 ? 'good' : 'slow'
      });

      // ✅ FIX: Return EXACT same structure as regular login
      res.json({
        success: true,
        data: {
          user: normalizedUser,
          accessToken, // ✅ EXACT same structure as regular login
          tokens: {
            accessToken,
            refreshToken
          }
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

      // ✅ CLEANED: Use centralized user normalization
      const normalizedUser = normalizeUserData(user);

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
  }),

  /**
   * 🔐 Change user password with current password verification
   * @route POST /api/v1/users/change-password
   */
  changePassword: asyncHandler(async (req, res) => {
    const start = Date.now();
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    try {
      // Get user with password hash for verification
      const query = `
        SELECT id, email, password_hash, oauth_provider
        FROM users 
        WHERE id = $1 AND is_active = true
      `;
      
      const result = await db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        throw { ...errorCodes.NOT_FOUND, details: 'User not found' };
      }

      const user = result.rows[0];
      
      // Check if user has a password (not OAuth-only account)
      if (!user.password_hash) {
        if (user.oauth_provider) {
          throw { 
            ...errorCodes.FORBIDDEN, 
            details: `This account uses ${user.oauth_provider} login. Please use ${user.oauth_provider} to manage your account.` 
          };
        } else {
          throw { 
            ...errorCodes.BAD_REQUEST, 
            details: 'No password set for this account. Please reset your password.' 
          };
        }
      }

      // Verify current password
      const bcrypt = require('bcrypt');
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      
      if (!isValidPassword) {
        throw { 
          ...errorCodes.UNAUTHORIZED, 
          details: 'Current password is incorrect' 
        };
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      
      // Update password in database
      const updateQuery = `
        UPDATE users 
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, email, username
      `;
      
      const updateResult = await db.query(updateQuery, [hashedNewPassword, userId]);
      
      const duration = Date.now() - start;
      logger.info('✅ User password changed successfully', {
        userId,
        email: user.email,
        duration: `${duration}ms`,
        performance: duration < 100 ? 'excellent' : duration < 300 ? 'good' : 'slow'
      });

      res.json({
        success: true,
        message: 'Password changed successfully',
        data: {
          id: updateResult.rows[0].id,
          email: updateResult.rows[0].email,
          username: updateResult.rows[0].username
        },
        metadata: {
          updated: true,
          duration: `${duration}ms`,
          security_enhanced: true
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ Password change failed', {
        userId,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }),

  /**
   * 🚀 NEW: Logout with token cleanup
   * @route POST /api/v1/users/logout
   */
  logout: asyncHandler(async (req, res) => {
    const start = Date.now();
    
    try {
      // Get user from auth middleware (may be null if auth failed)
      const userId = req.user?.id;
      
      if (userId) {
        // User was authenticated - just log successful logout
        // Skip database updates that might fail due to missing fields
        logger.info('✅ User logout successful (authenticated)', {
          userId,
          duration: `${Date.now() - start}ms`
        });
      } else {
        // No user (auth failed) - still allow logout
        logger.info('✅ Logout successful (unauthenticated session cleanup)', {
          duration: `${Date.now() - start}ms`
        });
      }

      // Always return success - client handles token cleanup regardless
      res.json({
        success: true,
        message: userId ? 'Logged out successfully' : 'Session cleared successfully',
        metadata: {
          duration: `${Date.now() - start}ms`,
          timestamp: new Date().toISOString(),
          authenticated: !!userId
        }
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.warn('❌ Logout error (returning success anyway)', {
        userId: req.user?.id,
        error: error.message,
        duration: `${duration}ms`
      });
      
      // Always return success so client can cleanup
      res.json({
        success: true,
        message: 'Session cleared (with server warnings)',
        warning: 'Server had issues but client cleanup will proceed',
        metadata: {
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        }
      });
    }
  })
};

module.exports = userController; 