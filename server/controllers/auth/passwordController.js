/**
 * Password Controller — reset flow, verification, and password changes
 * @module controllers/auth/passwordController
 */

const { User } = require('../../models/User');
const { UserCache } = require('../../models/UserCache');
const errorCodes = require('../../utils/errorCodes');
const { asyncHandler } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');
const emailService = require('../../services/emailService');
const { generateVerificationToken } = require('../../utils/tokenGenerator');
const bcrypt = require('bcrypt');
const db = require('../../config/db');
const { digest, issueSession, revokeAllForUser } = require('../../services/authSessionService');
const { clearUserCache } = require('../../middleware/auth');

const isStrongPassword = (password) => (
  typeof password === 'string' &&
  password.length >= 8 &&
  password.length <= 128 &&
  /[A-Za-z]/.test(password) &&
  /[0-9]/.test(password)
);

async function updatePasswordAndRevokeOtherSessions(userId, passwordHash, reason, returning) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE users
          SET password_hash = $1,
              auth_token_version = auth_token_version + 1,
              updated_at = NOW()
        WHERE id = $2 AND is_active = true
        RETURNING ${returning}`,
      [passwordHash, userId]
    );
    if (result.rowCount !== 1) throw { ...errorCodes.NOT_FOUND, details: 'User not found' };
    await revokeAllForUser(userId, reason, null, client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

const passwordController = {
  /**
   * 🔑 Request password reset
   * @route POST /api/v1/users/password-reset
   */
  requestPasswordReset: asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_EMAIL', message: 'Email is required' } });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_EMAIL', message: 'Invalid email format' } });
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
      `UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false`,
      [user.id],
      'invalidate_password_reset_tokens'
    );
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, digest(token), expiresAt],
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
       WHERE (prt.token = $1 OR prt.token = $2)
         AND prt.used = false AND prt.expires_at > NOW()`,
      [token, digest(token)],
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
    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, error: { code: 'WEAK_PASSWORD', message: 'Password must be 8-128 characters and include at least one letter and one number' } });
    }

    const hashed = await bcrypt.hash(password, 12);
    const client = await db.getClient();
    let userId;
    try {
      await client.query('BEGIN');
      const tok = await client.query(
        `UPDATE password_reset_tokens
            SET used = true
          WHERE (token = $1 OR token = $2)
            AND used = false AND expires_at > NOW()
          RETURNING user_id`,
        [token, digest(token)]
      );
      if (tok.rows.length === 0) {
        throw Object.assign(new Error('Reset link is invalid or expired'), { code: 'TOKEN_EXPIRED', status: 400 });
      }
      userId = tok.rows[0].user_id;
      const updatedUser = await client.query(
        `UPDATE users
            SET password_hash = $1,
                auth_token_version = auth_token_version + 1,
                updated_at = NOW()
          WHERE id = $2 AND is_active = true`,
        [hashed, userId]
      );
      if (updatedUser.rowCount !== 1) {
        throw Object.assign(new Error('Reset link is invalid or expired'), { code: 'TOKEN_EXPIRED', status: 400 });
      }
      await client.query(
        `UPDATE auth_sessions
            SET revoked_at = COALESCE(revoked_at, NOW()),
                revoked_reason = COALESCE(revoked_reason, 'password_reset')
          WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
    UserCache.invalidate(String(userId));
    clearUserCache(userId);

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
      `UPDATE email_verification_tokens SET used = true, used_at = NOW()
        WHERE user_id = $1 AND used = false`,
      [user.id],
      'invalidate_verification_tokens'
    );
    await db.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, digest(token), expiresAt],
      'create_verification_token_resend'
    );

    await emailService.sendVerificationEmail(user.email, user.username || user.email, token);
    res.json({ success: true, message: 'Verification email sent' });
  }),

  /**
   * 🚀 Email verification with enhanced security
   * @route POST /api/v1/users/verify-email
   */
  verifyEmail: asyncHandler(async (req, res) => {
    const start = Date.now();
    const { token } = req.body;

    if (!token) {
      throw { ...errorCodes.MISSING_REQUIRED, details: 'Verification token is required' };
    }

    try {
      const client = await db.getClient();
      let tokenData;
      try {
        await client.query('BEGIN');
        const tokenResult = await client.query(`
          UPDATE email_verification_tokens
             SET used = true, used_at = NOW()
           WHERE (token = $1 OR token = $2)
             AND used = false AND expires_at > NOW()
           RETURNING user_id
        `, [token, digest(token)]);

        if (tokenResult.rows.length === 0) {
          throw Object.assign(new Error('Verification token is invalid, expired, or already used'), {
            code: 'INVALID_TOKEN', status: 400
          });
        }
        tokenData = tokenResult.rows[0];
        const updatedUser = await client.query(
          `UPDATE users SET email_verified = true, updated_at = NOW()
            WHERE id = $1 AND is_active = true`,
          [tokenData.user_id]
        );
        if (updatedUser.rowCount !== 1) {
          throw Object.assign(new Error('Verification token is invalid'), { code: 'INVALID_TOKEN', status: 400 });
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
      UserCache.invalidate(String(tokenData.user_id));
      clearUserCache(tokenData.user_id);

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
        error: error.message,
        duration: `${duration}ms`
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

    if (!isStrongPassword(newPassword)) {
      throw {
        ...errorCodes.VALIDATION_ERROR,
        details: { newPassword: 'Password must be 8-128 characters and include at least one letter and one number' }
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

      const updateResult = await updatePasswordAndRevokeOtherSessions(
        userId,
        hashedNewPassword,
        'password_changed',
        'id, email, username, auth_token_version'
      );
      clearUserCache(userId);
      const tokens = await issueSession({ ...req.user, ...updateResult.rows[0] }, req);

      // ✅ CRITICAL: Invalidate ALL cache after password change - Ensures fresh data on next login
      UserCache.invalidate(userId);
      UserCache.invalidate(`user:${userId}`);
      UserCache.invalidate(`email:${user.email.toLowerCase()}`);
      UserCache.invalidate(`user:email:${user.email.toLowerCase()}`);

      // Log the password change for debugging
      logger.info('🔐 PASSWORD CHANGED - Cache cleared completely', {
        userId,
        email: user.email,
        sessionsRevoked: true
      });

      const duration = Date.now() - start;
      logger.info('✅ User password changed successfully - CACHE INVALIDATED', {
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
          username: updateResult.rows[0].username,
          tokens
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

    // ✅ ENHANCED: Debug logging for setPassword calls
    logger.info('🔐 setPassword API called', {
      userId,
      userEmail: req.user?.email || 'unknown',
      hasNewPassword: !!newPassword,
      newPasswordLength: newPassword ? newPassword.length : 0,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

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

      if (user.password_hash && user.password_hash.length > 0) {
        throw {
          code: 'PASSWORD_ALREADY_SET',
          message: 'A password is already set. Use change password instead.',
          status: 409
        };
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      const updateResult = await updatePasswordAndRevokeOtherSessions(
        userId,
        hashedNewPassword,
        'password_set',
        'id, email, username, oauth_provider, auth_token_version'
      );
      clearUserCache(userId);
      const tokens = await issueSession({ ...req.user, ...updateResult.rows[0] }, req);

      // ✅ CRITICAL: Invalidate ALL cache after password update - This fixes the authentication issue!
      UserCache.invalidate(userId);
      UserCache.invalidate(`user:${userId}`);
      UserCache.invalidate(`email:${user.email.toLowerCase()}`);
      UserCache.invalidate(`user:email:${user.email.toLowerCase()}`);

      // Log the password update for debugging
      logger.info('🔐 PASSWORD SET - Cache cleared completely', {
        userId,
        email: user.email,
        sessionsRevoked: true
      });

      const duration = Date.now() - start;
      logger.info('✅ OAuth user set first password successfully - CACHE INVALIDATED', {
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
          hybridLoginEnabled: true,
          tokens
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
  })
};

module.exports = passwordController;
