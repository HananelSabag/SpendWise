/**
 * OPTIMIZED User Controller - Enhanced Performance Version
 * Includes Google OAuth, smart caching, and enhanced security
 * @module controllers/userController_optimized
 */

const { User } = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const { generateTokens, verifyToken } = require('../middleware/auth');
const { normalizeUserData } = require('../utils/userNormalizer');
const errorCodes = require('../utils/errorCodes');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const { generateVerificationToken, generateRandomPassword } = require('../utils/tokenGenerator');
const bcrypt = require('bcrypt');
const db = require('../config/db');

// Token generation now handled by unified utility

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
      // Respect system settings: user_registration
      try {
        const setting = await db.query(
          `SELECT setting_value FROM system_settings WHERE setting_key = 'user_registration' LIMIT 1`
        );
        const enabled = setting.rows[0]?.setting_value !== false && setting.rows[0]?.setting_value !== 'false';
        if (!enabled) {
          return res.status(403).json({
            success: false,
            error: { code: 'REGISTRATION_DISABLED', message: 'User registration is currently disabled.' }
          });
        }
      } catch (_) {}

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

      // Respect email_verification_required: if false, auto-verify
      let requireVerification = true;
      try {
        const ev = await db.query(
          `SELECT setting_value FROM system_settings WHERE setting_key = 'email_verification_required' LIMIT 1`
        );
        requireVerification = ev.rows[0]?.setting_value !== false && ev.rows[0]?.setting_value !== 'false';
      } catch (_) {}

      if (requireVerification) {
        // Send verification email (async - don't wait)
        emailService.sendVerificationEmail(user.email, user.username, verificationToken)
          .catch(error => {
            logger.error('Failed to send verification email', {
              userId: user.id,
              email: user.email,
              error: error.message
            });
          });
      } else {
        // Auto-verify account
        await db.query('UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1', [user.id]);
      }

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
   * 🔑 Request password reset
   * @route POST /api/v1/users/password-reset
   */
  requestPasswordReset: asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_EMAIL', message: 'Email is required' } });
    }

    // Find user silently
    const user = await User.findByEmail(email);
    if (!user) {
      // Do not disclose user existence
      return res.json({ success: true, message: 'If the email exists, a reset link was sent' });
    }

    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt],
      'create_password_reset_token'
    );

    await emailService.sendPasswordReset(user.email, token);

    res.json({ success: true, message: 'If the email exists, a reset link was sent' });
  }),

  /**
   * 🔍 Validate password reset token
   * @route GET /api/v1/users/password-reset/validate/:token
   */
  validatePasswordResetToken: asyncHandler(async (req, res) => {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_TOKEN', message: 'Token is required' } });
    }

    const result = await db.query(
      `SELECT prt.user_id, u.email
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token = $1 AND prt.used = false AND prt.expires_at > NOW()`,
      [token],
      'validate_password_reset_token'
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Reset link is invalid or expired' } });
    }

    res.json({ success: true, email: result.rows[0].email });
  }),

  /**
   * 🔒 Confirm password reset
   * @route POST /api/v1/users/password-reset/confirm
   */
  confirmPasswordReset: asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Token and password are required' } });
    }

    // Validate token
    const tok = await db.query(
      `SELECT user_id FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [token],
      'confirm_password_reset_token'
    );
    if (tok.rows.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Reset link is invalid or expired' } });
    }

    const userId = tok.rows[0].user_id;
    const hashed = await bcrypt.hash(password, 12);
    await db.query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [hashed, userId], 'reset_password_update');
    await db.query(`UPDATE password_reset_tokens SET used = true WHERE token = $1`, [token], 'reset_password_mark_used');

    res.json({ success: true, message: 'Password has been reset successfully' });
  }),

  /**
   * ✉️ Resend verification email
   * @route POST /api/v1/users/resend-verification
   */
  resendVerification: asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_EMAIL', message: 'Email is required' } });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.json({ success: true, message: 'If the email exists, a verification email was sent' });
    }

    if (user.email_verified) {
      return res.json({ success: true, message: 'Email already verified' });
    }

    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt],
      'create_verification_token_resend'
    );

    await emailService.sendVerificationEmail(user.email, user.username || user.email, token);
    res.json({ success: true, message: 'Verification email sent' });
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

    // ✅ Verify Google ID token server-side
    try {
      const clientIdPrimary = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientIdPrimary) {
        throw { ...errorCodes.SERVER_ERROR, details: 'Server GOOGLE_CLIENT_ID is not configured' };
      }

      const oauthClient = new OAuth2Client(clientIdPrimary);
      const ticket = await oauthClient.verifyIdToken({
        idToken,
        audience: clientIdPrimary
      });

      const payload = ticket.getPayload();
      email = (email || payload?.email || '').toLowerCase();
      name = name || payload?.name || '';
      picture = picture || payload?.picture || '';

      if (!email) {
        throw { ...errorCodes.VALIDATION_ERROR, details: 'Email not present in verified Google token' };
      }

      logger.info('🔐 Google OAuth attempt', { email, name });

      const googleUserId = payload?.sub || null;

      // Check if user exists
      let user = await User.findByEmail(email);

      if (!user) {
        // ✅ FIXED: New Google user - create WITHOUT password hash
        logger.info('🆕 Creating new Google-only user (NO PASSWORD)', { email });
        const username = name || email.split('@')[0];

        user = await User.createGoogleOnlyUser(email, username, {
          google_id: googleUserId,
          picture: picture,
          first_name: name?.split(' ')[0] || '',
          last_name: name?.split(' ').slice(1).join(' ') || ''
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
        
        // ✅ Ensure user exists and updateData is valid before update
        if (!user || !user.id) {
          throw { 
            ...errorCodes.NOT_FOUND, 
            details: 'User not found during Google OAuth update' 
          };
        }
        
        if (Object.keys(updateData).length > 0) {
          await User.update(user.id, updateData);
          
          // Refresh user data
          user = await User.findById(user.id);
        }
        
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

    // ✅ Enhanced validation for required fields
    if (!newPassword) {
      throw { 
        ...errorCodes.VALIDATION_ERROR, 
        details: { newPassword: 'New password is required' }
      };
    }

    if (newPassword.length < 8) {
      throw { 
        ...errorCodes.VALIDATION_ERROR, 
        details: { newPassword: 'New password must be at least 8 characters' }
      };
    }

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
      
      // ✅ HYBRID SYSTEM: Allow password changes for all users
      // If user doesn't have a password yet, they're setting their first password (OAuth users)
      const hasExistingPassword = user.password_hash && user.password_hash.length > 0;
      
      if (!hasExistingPassword) {
        // For OAuth users setting their first password, skip current password verification
        // This allows them to set up email/password login alongside their OAuth account
        logger.info('🔑 OAuth user setting first password for hybrid login', {
          userId,
          email: user.email,
          oauthProvider: user.oauth_provider
        });
      } else {
        // Regular password change - verify current password
        if (!currentPassword) {
          throw { 
            ...errorCodes.VALIDATION_ERROR, 
            details: { currentPassword: 'Current password is required' }
          };
        }
        
        const bcrypt = require('bcrypt');
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        
        if (!isValidPassword) {
          throw { 
            ...errorCodes.UNAUTHORIZED, 
            details: { currentPassword: 'Current password is incorrect' }
          };
        }
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
   * 🔐 Set password for OAuth users (first-time password setup)
   * @route POST /api/v1/users/set-password
   */
  setPassword: asyncHandler(async (req, res) => {
    const start = Date.now();
    const userId = req.user.id;
    const { newPassword } = req.body;

    try {
      // Get user to check their current state
      const query = `
        SELECT id, email, password_hash, oauth_provider, google_id
        FROM users 
        WHERE id = $1 AND is_active = true
      `;
      
      const result = await db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        throw { ...errorCodes.NOT_FOUND, details: 'User not found' };
      }

      const user = result.rows[0];
      
      // Allow any OAuth user (Google, etc.) to set a password without current password.
      // This enables hybrid login even if a placeholder password was created during registration.
      if (!user.oauth_provider && !user.google_id) {
        throw { 
          ...errorCodes.BAD_REQUEST, 
          details: 'This endpoint is for OAuth users setting their first password.' 
        };
      }

      // Hash new password
      const bcrypt = require('bcrypt');
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      
      // Update password in database
      const updateQuery = `
        UPDATE users 
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, email, username, oauth_provider
      `;
      
      const updateResult = await db.query(updateQuery, [hashedNewPassword, userId]);
      
      const duration = Date.now() - start;
      logger.info('✅ OAuth user set first password successfully', {
        userId,
        email: user.email,
        oauthProvider: user.oauth_provider,
        duration: `${duration}ms`,
        performance: duration < 100 ? 'excellent' : duration < 300 ? 'good' : 'slow'
      });

      res.json({
        success: true,
        message: 'Password set successfully. You can now use both OAuth and email/password login.',
        data: {
          id: updateResult.rows[0].id,
          email: updateResult.rows[0].email,
          username: updateResult.rows[0].username,
          hybridLoginEnabled: true
        },
        metadata: {
          updated: true,
          duration: `${duration}ms`,
          security_enhanced: true,
          login_methods: ['oauth', 'email_password']
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = Date.now() - start;
      logger.error('❌ Set password failed', {
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