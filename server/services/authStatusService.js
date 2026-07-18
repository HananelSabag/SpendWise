const db = require('../config/db');

class AuthStatusService {
  static async getUserAuthStatus(userId) {
    const result = await db.query(
      `SELECT id, email,
              password_hash IS NOT NULL AND LENGTH(password_hash) > 0 AS has_password,
              google_id IS NOT NULL AND LENGTH(google_id) > 0 AS has_google,
              oauth_provider
         FROM users
        WHERE id = $1 AND is_active = true`,
      [userId],
      'auth_status'
    );
    if (result.rows.length === 0) {
      throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND', status: 404 });
    }

    const user = result.rows[0];
    const hasPassword = user.has_password;
    const hasGoogle = user.has_google;
    const authType = hasPassword && hasGoogle
      ? 'HYBRID'
      : hasPassword
        ? 'PASSWORD_ONLY'
        : hasGoogle
          ? 'GOOGLE_ONLY'
          : 'UNKNOWN';

    return {
      userId: user.id,
      email: user.email,
      authType,
      hasPassword,
      hasGoogle,
      oauth_provider: user.oauth_provider,
      isHybrid: authType === 'HYBRID',
      isGoogleOnly: authType === 'GOOGLE_ONLY',
      isPasswordOnly: authType === 'PASSWORD_ONLY',
      needsPassword: authType === 'GOOGLE_ONLY',
      canLinkGoogle: authType === 'PASSWORD_ONLY'
    };
  }
}

module.exports = AuthStatusService;
