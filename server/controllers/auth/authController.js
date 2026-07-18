/**
 * Auth Controller — identity & session lifecycle
 * register, login, token refresh, Google OAuth, logout
 * @module controllers/auth/authController
 */

const { User } = require('../../models/User');
const { OAuth2Client } = require('google-auth-library');
const { verifyToken } = require('../../middleware/auth');
const { normalizeUserData } = require('../../utils/userNormalizer');
const errorCodes = require('../../utils/errorCodes');
const { asyncHandler } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');
const emailService = require('../../services/emailService');
const { generateVerificationToken } = require('../../utils/tokenGenerator');
const db = require('../../config/db');
const { digest, issueSession, rotateSession, revokeSession } = require('../../services/authSessionService');

async function assertUserMayAuthenticate(user) {
  if (!user?.is_active) throw { ...errorCodes.ACCOUNT_DEACTIVATED };

  try {
    const result = await db.query(
      `SELECT restriction_type, reason, expires_at
         FROM user_restrictions
        WHERE user_id = $1 AND is_active = true
          AND (expires_at IS NULL OR expires_at > NOW())`,
      [user.id],
      'auth_login_restrictions'
    );
    const blocked = result.rows.find((item) => item.restriction_type === 'blocked');
    if (blocked) {
      throw {
        code: 'USER_BLOCKED',
        message: 'Your account has been temporarily blocked.',
        reason: blocked.reason,
        expires_at: blocked.expires_at,
        status: 403
      };
    }
  } catch (error) {
    if (error.code === 'USER_BLOCKED') throw error;
    throw { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable', status: 503 };
  }
}

const authController = {
  /**
   * 🚀 Register with enhanced validation and performance tracking
   * @route POST /api/v1/users/register
   */
  register: asyncHandler(async (req, res) => {
    const start = Date.now();
    const { email, username, password, firstName, lastName } = req.body;

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
      const user = await User.create(email, username, password, { firstName, lastName });

      // Generate verification token
      const verificationToken = generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store verification token
      await db.query(`
        INSERT INTO email_verification_tokens (user_id, token, expires_at)
        VALUES ($1, $2, $3)
      `, [user.id, digest(verificationToken), expiresAt], 'create_verification_token');

      // Respect email_verification_required: if false, auto-verify
      let requireVerification = true;
      try {
        const ev = await db.query(
          `SELECT setting_value FROM system_settings WHERE setting_key = 'email_verification_required' LIMIT 1`
        );
        requireVerification = ev.rows[0]?.setting_value !== false && ev.rows[0]?.setting_value !== 'false';
      } catch (_) {}

      if (requireVerification) {
        logger.info(`📨 Sending verification email to user ${user.id}`);
        // Send verification email (async - don't wait, errors logged inside emailService._send)
        emailService.sendVerificationEmail(user.email, user.first_name || user.username, verificationToken)
          .then(sent => {
            if (!sent) logger.warn(`⚠️  Verification email not sent for user ${user.id} — see email service error above`);
          })
          .catch(error => {
            logger.error(`❌ Unexpected error sending verification email for user ${user.id}: ${error.message}`);
          });
      } else {
        logger.info(`⚡ email_verification_required=false — auto-verifying user ${user.id}`);
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
            email_verified: requireVerification ? user.email_verified : true
          },
          message: requireVerification
            ? 'Registration successful. Please check your email for verification.'
            : 'Registration successful.'
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
   * 🚀 Login with enhanced security and performance tracking
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

      await assertUserMayAuthenticate(user);
      const { accessToken, refreshToken } = await issueSession(user, req);

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
        error: error.message || error.code,
        errorCode: error.code,
        duration: `${duration}ms`
      });

      // ✅ Handle all auth-related errors with proper codes
      if (error.message === 'Invalid credentials' || error.message === 'Invalid email or password') {
        throw { ...errorCodes.INVALID_CREDENTIALS };
      }

      // Pass through errors that already have proper error codes
      if (error.code && ['EMAIL_NOT_VERIFIED', 'GOOGLE_ONLY_USER', 'PASSWORD_NOT_SET', 'ACCOUNT_DEACTIVATED', 'ACCOUNT_LOCKED'].includes(error.code)) {
        throw error;
      }

      throw error;
    }
  }),

  /**
   * 🔄 Token Refresh Endpoint
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
      // Verify refresh token — STRICTLY against the refresh secret. Falling
      // back to JWT_SECRET would let a (short-lived) ACCESS token be replayed
      // here to mint fresh tokens. index.js refuses to boot without
      // JWT_REFRESH_SECRET, so there is no legitimate fallback case.
      const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
      if (decoded.typ && decoded.typ !== 'refresh') {
        throw { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token type', status: 401 };
      }
      const userId = decoded.userId;

      // Get fresh user data
      const user = await User.findById(userId);
      if (!user) {
        throw {
          code: 'SESSION_REVOKED',
          message: 'This session is no longer valid.',
          status: 401
        };
      }

      if (Number(decoded.ver || 0) !== Number(user.auth_token_version || 0)) {
        throw { code: 'SESSION_REVOKED', message: 'This session has been revoked.', status: 401 };
      }

      if (!user.is_active) {
        throw {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Account is deactivated',
          status: 403
        };
      }

      // Check if user is blocked — must happen before issuing new tokens
      try {
        const restrictionsResult = await db.query(
          `SELECT restriction_type, reason FROM user_restrictions
           WHERE user_id = $1 AND is_active = true
             AND (expires_at IS NULL OR expires_at > NOW())`,
          [userId]
        );
        const activeRestrictions = restrictionsResult.rows || [];
        const isBlocked = activeRestrictions.some(r => r.restriction_type === 'blocked');
        if (isBlocked) {
          const blockInfo = activeRestrictions.find(r => r.restriction_type === 'blocked');
          throw {
            code: 'USER_BLOCKED',
            message: 'Your account has been temporarily blocked.',
            reason: blockInfo?.reason,
            status: 403
          };
        }
      } catch (restrictionErr) {
        if (restrictionErr.code === 'USER_BLOCKED') throw restrictionErr;
        // DB error on restrictions check — fail closed, deny token
        throw { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable', status: 503 };
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = await rotateSession(
        refreshToken,
        user,
        decoded,
        req
      );

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
   * 🚀 Google OAuth login/register
   * @route POST /api/v1/users/auth/google
   */
  googleAuth: asyncHandler(async (req, res) => {
    const start = Date.now();
    const { idToken } = req.body;
    let email = '';

    if (!idToken) {
      throw {
        ...errorCodes.VALIDATION_ERROR,
        details: 'Google ID token is required'
      };
    }

    // ✅ Verify Google ID token server-side
    try {
      const clientIdPrimary = process.env.GOOGLE_CLIENT_ID;
      if (!clientIdPrimary) {
        throw { ...errorCodes.SERVER_ERROR, details: 'Server GOOGLE_CLIENT_ID is not configured' };
      }

      const googleSetting = await db.query(
        `SELECT setting_value FROM system_settings WHERE setting_key = 'google_oauth_enabled' LIMIT 1`,
        [],
        'google_oauth_setting'
      );
      if (googleSetting.rows[0]?.setting_value === false || googleSetting.rows[0]?.setting_value === 'false') {
        throw { code: 'GOOGLE_AUTH_DISABLED', message: 'Google sign-in is currently disabled.', status: 403 };
      }

      const oauthClient = new OAuth2Client(clientIdPrimary);
      const ticket = await oauthClient.verifyIdToken({
        idToken,
        audience: clientIdPrimary
      });

      const payload = ticket.getPayload();
      email = (payload?.email || '').trim().toLowerCase();
      const name = payload?.name || '';
      const picture = payload?.picture || '';

      if (!email || payload?.email_verified !== true || !payload?.sub) {
        throw { ...errorCodes.VALIDATION_ERROR, details: 'Email not present in verified Google token' };
      }

      logger.info('🔐 Google OAuth attempt', { email, name });

      const googleUserId = payload?.sub || null;

      // Check if user exists
      let user = await User.findByEmail(email);

      if (!user) {
        // ✅ FIXED: New Google user - create WITHOUT password hash
        logger.info('🆕 Creating new Google-only user (NO PASSWORD)', { email });
        const usernameBase = (name || email.split('@')[0])
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '')
          .slice(0, 38) || 'user';
        const username = `${usernameBase}_${googleUserId.slice(0, 8)}`;

        user = await User.createGoogleOnlyUser(email, username, {
          google_id: googleUserId,
          picture: picture,
          first_name: name?.split(' ')[0] || '',
          last_name: name?.split(' ').slice(1).join(' ') || ''
        });
        // createGoogleOnlyUser already returns the full row (RETURNING *) plus
        // computed fields — no need to re-fetch it.

        logger.info('✅ New Google user created', {
          userId: user.id,
          email,
          username
        });
      } else {
        // ✅ EDGE CASE: Existing user signing in with Google
        if (!user.is_active) throw { ...errorCodes.ACCOUNT_DEACTIVATED };
        const hadGoogleAuth = !!user.google_id;
        const hadRegularAuth = !!user.password_hash;

        logger.info('🔍 Existing user Google login', {
          email,
          hadGoogleAuth,
          hadRegularAuth,
          authMethod: hadGoogleAuth ? 'google' : hadRegularAuth ? 'regular' : 'unknown'
        });

        // Update existing user with Google info if not already set
        if (user.google_id && user.google_id !== googleUserId) {
          throw {
            code: 'GOOGLE_ACCOUNT_MISMATCH',
            message: 'This email is linked to a different Google account.',
            status: 409
          };
        }

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
          // User.update() already returns the fully-updated, normalized row —
          // capture it directly instead of a redundant findById round-trip.
          user = await User.update(user.id, updateData);
        }

        logger.info('✅ Existing user authenticated via Google', {
          userId: user.id,
          email,
          linkedGoogle: !hadGoogleAuth && updateData.google_id,
          updatedFields: Object.keys(updateData)
        });
      }

      // Generate JWT tokens
      await assertUserMayAuthenticate(user);
      const { accessToken, refreshToken } = await issueSession(user, req);

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

  linkGoogle: asyncHandler(async (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw { ...errorCodes.SERVER_ERROR, details: 'Server GOOGLE_CLIENT_ID is not configured' };
    const googleSetting = await db.query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'google_oauth_enabled' LIMIT 1`,
      [],
      'google_oauth_link_setting'
    );
    if (googleSetting.rows[0]?.setting_value === false || googleSetting.rows[0]?.setting_value === 'false') {
      throw { code: 'GOOGLE_AUTH_DISABLED', message: 'Google sign-in is currently disabled.', status: 403 };
    }

    const oauthClient = new OAuth2Client(clientId);
    const ticket = await oauthClient.verifyIdToken({ idToken: req.body.idToken, audience: clientId });
    const payload = ticket.getPayload();
    const email = (payload?.email || '').trim().toLowerCase();
    if (!payload?.sub || payload?.email_verified !== true || email !== req.user.email.toLowerCase()) {
      throw {
        code: 'GOOGLE_EMAIL_MISMATCH',
        message: 'Choose the Google account with the same email as your SpendWise account.',
        status: 409
      };
    }

    const user = await User.findById(req.user.id);
    if (!user) throw { ...errorCodes.NOT_FOUND, details: 'User not found' };
    if (user.google_id && user.google_id !== payload.sub) {
      throw { code: 'GOOGLE_ACCOUNT_MISMATCH', message: 'A different Google account is already linked.', status: 409 };
    }

    const updated = await User.update(user.id, {
      google_id: payload.sub,
      oauth_provider: 'google',
      oauth_provider_id: payload.sub,
      email_verified: true,
      ...(!user.profile_picture_url && payload.picture
        ? { profile_picture_url: payload.picture, avatar: payload.picture }
        : {})
    });

    res.json({ success: true, data: normalizeUserData(updated) });
  }),

  /**
   * 🚀 Logout with token cleanup
   * @route POST /api/v1/users/logout
   */
  logout: asyncHandler(async (req, res) => {
    const start = Date.now();

    try {
      await revokeSession(req.body?.refreshToken, 'logout');
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

module.exports = authController;
