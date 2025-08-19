/**
 * 🔐 AUTHENTICATION STATUS SERVICE
 * Simple, bulletproof authentication detection
 * @version 1.0.0 - CLEAN SLATE
 */

const db = require('../config/db');
const logger = require('../utils/logger');

class AuthStatusService {
  /**
   * Get user's authentication status - BULLETPROOF
   * @param {number} userId - User ID
   * @returns {Object} - { authType, hasPassword, hasGoogle, email }
   */
  static async getUserAuthStatus(userId) {
    try {
      // 🎯 DIRECT DATABASE QUERY - No cache, no complex logic
      const query = `
        SELECT 
          id,
          email,
          password_hash IS NOT NULL AND LENGTH(password_hash) > 0 as has_password,
          google_id IS NOT NULL AND LENGTH(google_id) > 0 as has_google,
          oauth_provider,
          google_id
        FROM users 
        WHERE id = $1 AND is_active = true
      `;

      const result = await db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      
      // 🎯 SIMPLE LOGIC - No room for error
      const hasPassword = user.has_password;
      const hasGoogle = user.has_google;
      
      let authType;
      if (hasPassword && hasGoogle) {
        authType = 'HYBRID';
      } else if (hasPassword && !hasGoogle) {
        authType = 'PASSWORD_ONLY';
      } else if (!hasPassword && hasGoogle) {
        authType = 'GOOGLE_ONLY';
      } else {
        authType = 'UNKNOWN';
      }

      const status = {
        userId: user.id,
        email: user.email,
        authType,
        hasPassword,
        hasGoogle,
        oauth_provider: user.oauth_provider,
        google_id: user.google_id,
        // Helper booleans for UI
        isHybrid: authType === 'HYBRID',
        isGoogleOnly: authType === 'GOOGLE_ONLY',
        isPasswordOnly: authType === 'PASSWORD_ONLY',
        needsPassword: authType === 'GOOGLE_ONLY',
        canLinkGoogle: authType === 'PASSWORD_ONLY'
      };

      logger.debug('✅ AuthStatusService - Status retrieved:', {
        userId,
        authType,
        hasPassword,
        hasGoogle
      });

      return status;
    } catch (error) {
      logger.error('❌ AuthStatusService failed:', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Verify authentication status is consistent
   * @param {number} userId - User ID
   * @returns {Object} - Verification result
   */
  static async verifyAuthStatus(userId) {
    try {
      const status = await this.getUserAuthStatus(userId);
      
      // Basic consistency checks
      const checks = {
        hybridConsistent: status.isHybrid === (status.hasPassword && status.hasGoogle),
        googleOnlyConsistent: status.isGoogleOnly === (!status.hasPassword && status.hasGoogle),
        passwordOnlyConsistent: status.isPasswordOnly === (status.hasPassword && !status.hasGoogle),
        authTypeValid: ['HYBRID', 'GOOGLE_ONLY', 'PASSWORD_ONLY', 'UNKNOWN'].includes(status.authType)
      };

      const allPassed = Object.values(checks).every(check => check === true);

      return {
        status,
        verification: {
          passed: allPassed,
          checks
        }
      };
    } catch (error) {
      return {
        status: null,
        verification: {
          passed: false,
          error: error.message
        }
      };
    }
  }
}

module.exports = AuthStatusService;
