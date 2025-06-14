/**
 * User Model - Production Ready
 * Handles all user-related database operations
 * @module models/User
 */

const db = require('../config/db');
const bcrypt = require('bcrypt');
const errorCodes = require('../utils/errorCodes');
const logger = require('../utils/logger');

class User {
  /**
   * Create a new user
   * @param {string} email - User's email
   * @param {string} username - User's username
   * @param {string} password - Plain text password
   * @returns {Promise<Object>} Created user (without password)
   */
  static async create(email, username, password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Normalize email to lowercase to prevent case sensitivity issues
      const normalizedEmail = email.toLowerCase().trim();
      
      const query = `
        INSERT INTO users (
          email, 
          username, 
          password_hash, 
          email_verified,
          language_preference,
          theme_preference,
          currency_preference,
          onboarding_completed
        )
        VALUES ($1, $2, $3, false, 'en', 'light', 'USD', false)
        RETURNING 
          id, email, username, created_at, 
          language_preference, theme_preference, currency_preference,
          preferences, email_verified, onboarding_completed;
      `;
      
      const result = await db.query(query, [normalizedEmail, username, hashedPassword]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw {
          ...errorCodes.ALREADY_EXISTS,
          details: 'Email already registered'
        };
      }
      throw error;
    }
  }

  /**
   * Find user by email (case-insensitive)
   * @param {string} email - User's email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    // Normalize email to lowercase for case-insensitive lookup
    const normalizedEmail = email.toLowerCase().trim();
    
    const query = `
      SELECT 
        id, email, username, password_hash, 
        language_preference, theme_preference, currency_preference,
        preferences, last_login, email_verified, onboarding_completed
      FROM users 
      WHERE LOWER(email) = $1;
    `;
    
    const result = await db.query(query, [normalizedEmail]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   * @param {number} id - User's ID
   * @returns {Promise<Object|null>} User object (without password)
   */
  static async findById(id) {
    const query = `
      SELECT 
        id, email, username, 
        language_preference, theme_preference, currency_preference,
        preferences, created_at, last_login, email_verified, onboarding_completed
      FROM users 
      WHERE id = $1;
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Verify user's password (case-insensitive email lookup)
   * @param {string} email - User's email
   * @param {string} password - Password to verify
   * @returns {Promise<Object|null>} User object if verified
   */
  static async verifyPassword(email, password) {
    try {
      // Use case-insensitive email lookup
      const user = await this.findByEmail(email);
      
      if (!user) {
        return null;
      }
      
      const valid = await bcrypt.compare(password, user.password_hash);
      
      if (!valid) {
        return null;
      }

      // Update last login
      await db.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      // Return user without password
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Password verification error:', { error: error.message }); // Don't log email
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {number} userId - User's ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated user
   */
  static async updateProfile(userId, data) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { 
        username, 
        currentPassword, 
        newPassword,
        language_preference,
        theme_preference,
        currency_preference
      } = data;

      const updates = [];
      const values = [];
      let paramCount = 1;

      // Handle username update
      if (username) {
        updates.push(`username = $${paramCount}`);
        values.push(username);
        paramCount++;
      }

      // Handle preference updates
      if (language_preference) {
        updates.push(`language_preference = $${paramCount}`);
        values.push(language_preference);
        paramCount++;
      }

      if (theme_preference) {
        updates.push(`theme_preference = $${paramCount}`);
        values.push(theme_preference);
        paramCount++;
      }

      if (currency_preference) {
        updates.push(`currency_preference = $${paramCount}`);
        values.push(currency_preference);
        paramCount++;
      }

      // Handle password update
      if (newPassword) {
        const user = await client.query(
          'SELECT password_hash FROM users WHERE id = $1',
          [userId]
        );

        if (!user.rows[0]) {
          throw { ...errorCodes.NOT_FOUND };
        }

        const validPassword = await bcrypt.compare(
          currentPassword,
          user.rows[0].password_hash
        );

        if (!validPassword) {
          throw {
            ...errorCodes.VALIDATION_ERROR,
            details: 'Current password is incorrect'
          };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updates.push(`password_hash = $${paramCount}`);
        values.push(hashedPassword);
        paramCount++;
      }

      if (updates.length === 0) {
        throw {
          ...errorCodes.VALIDATION_ERROR,
          details: 'No valid updates provided'
        };
      }

      // Execute update
      const query = `
        UPDATE users 
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING 
          id, username, email, 
          language_preference, theme_preference, currency_preference,
          preferences, created_at, updated_at
      `;
      
      values.push(userId);
      
      const result = await client.query(query, values);
      
      await client.query('COMMIT');
      
      if (!result.rows[0]) {
        throw { ...errorCodes.NOT_FOUND };
      }

      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update user preferences (legacy JSONB support)
   * @param {number} userId - User's ID
   * @param {Object} preferences - Preferences to merge
   * @returns {Promise<Object>} Updated preferences
   */
  static async updatePreferences(userId, preferences) {
    try {
      // Get existing preferences
      const existingQuery = 'SELECT preferences FROM users WHERE id = $1';
      const existingResult = await db.query(existingQuery, [userId]);
      
      if (existingResult.rows.length === 0) {
        throw { ...errorCodes.NOT_FOUND, message: 'User not found' };
      }
      
      const existingPreferences = existingResult.rows[0].preferences || {};
      const mergedPreferences = { ...existingPreferences, ...preferences };
      
      // Update preferences
      const updateQuery = `
        UPDATE users 
        SET preferences = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING preferences;
      `;
      
      const result = await db.query(updateQuery, [JSON.stringify(mergedPreferences), userId]);
      return result.rows[0]?.preferences || {};
    } catch (error) {
      logger.error('Error updating preferences:', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Create password reset token
   * @param {string} email - User's email
   * @returns {Promise<Object>} Reset token info
   */
  static async createPasswordResetToken(email) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw { ...errorCodes.NOT_FOUND, message: 'User not found' };
    }

    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    const query = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING token, expires_at;
    `;

    const result = await db.query(query, [user.id, token, expiresAt]);
    return { ...result.rows[0], email: user.email };
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  static async resetPassword(token, newPassword) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validate token
      const tokenQuery = `
        SELECT rt.user_id, rt.expires_at, rt.used
        FROM password_reset_tokens rt
        WHERE rt.token = $1 AND rt.used = false AND rt.expires_at > NOW()
      `;
      
      const tokenResult = await client.query(tokenQuery, [token]);
      
      if (tokenResult.rows.length === 0) {
        throw { ...errorCodes.INVALID_TOKEN, message: 'Invalid or expired reset token' };
      }

      const { user_id } = tokenResult.rows[0];

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, user_id]
      );

      // Mark token as used
      await client.query(
        'UPDATE password_reset_tokens SET used = true WHERE token = $1',
        [token]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Save email verification token
   * @param {number} userId - User's ID
   * @param {string} token - Verification token
   * @param {Date} expiresAt - Token expiration date
   * @returns {Promise<number>} Token ID
   */
  static async saveVerificationToken(userId, token, expiresAt) {
    try {
      const query = `
        INSERT INTO email_verification_tokens (user_id, token, expires_at)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      
      const result = await db.query(query, [userId, token, expiresAt]);
      return result.rows[0].id;
    } catch (error) {
      logger.error('Error saving verification token:', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Find valid email verification token
   * @param {string} token - Verification token
   * @returns {Promise<Object|null>} Token data or null
   */
  static async findVerificationToken(token) {
    try {
      const query = `
        SELECT * FROM email_verification_tokens 
        WHERE token = $1 
        AND used = false 
        AND expires_at > NOW()
      `;
      
      const result = await db.query(query, [token]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding verification token:', { error: error.message });
      throw error;
    }
  }

  /**
   * Mark email as verified
   * @param {number} userId - User's ID
   * @returns {Promise<void>}
   */
  static async verifyEmail(userId) {
    try {
      const query = `
        UPDATE users 
        SET email_verified = true 
        WHERE id = $1
      `;
      
      await db.query(query, [userId]);
    } catch (error) {
      logger.error('Error verifying email:', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Mark verification token as used
   * @param {string} token - Verification token
   * @returns {Promise<void>}
   */
  static async markVerificationTokenAsUsed(token) {
    try {
      const query = `
        UPDATE email_verification_tokens 
        SET used = true 
        WHERE token = $1
      `;
      
      await db.query(query, [token]);
    } catch (error) {
      logger.error('Error marking verification token as used:', { error: error.message });
      throw error;
    }
  }

  /**
   * Get recent verification token for rate limiting
   * @param {number} userId - User's ID
   * @returns {Promise<Object|null>} Recent token or null
   */
  static async getRecentVerificationToken(userId) {
    try {
      const query = `
        SELECT * FROM email_verification_tokens 
        WHERE user_id = $1 
        AND created_at > NOW() - INTERVAL '5 minutes'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting recent verification token:', { userId, error: error.message });
      throw error;
    }
  }

  /**
 * Get user data for export - FIXED VERSION
 * @param {number} userId - User's ID
 * @returns {Promise<Object>} User data including transactions
 */
static async getExportData(userId) {
  const client = await db.pool.connect();
  
  try {
    // Get user info
    const userQuery = `
      SELECT 
        email, username, created_at,
        language_preference, theme_preference, currency_preference
      FROM users 
      WHERE id = $1
    `;
    const userResult = await client.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      throw { ...errorCodes.NOT_FOUND, message: 'User not found' };
    }

    // Get all transactions - FIXED: Added table aliases to remove ambiguity
    const transactionsQuery = `
      SELECT 
        'expense' as type,
        e.amount, 
        e.description, 
        e.date,
        COALESCE(c.name, 'Uncategorized') as category,
        e.created_at
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = $1 AND e.deleted_at IS NULL
      
      UNION ALL
      
      SELECT 
        'income' as type,
        i.amount, 
        i.description, 
        i.date,
        COALESCE(c.name, 'Uncategorized') as category,
        i.created_at
      FROM income i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.user_id = $1 AND i.deleted_at IS NULL
      
      ORDER BY date DESC, created_at DESC
    `;
    const transactionsResult = await client.query(transactionsQuery, [userId]);

    return {
      user: userResult.rows[0],
      transactions: transactionsResult.rows
    };
  } catch (error) {
    logger.error('Error getting export data:', { userId, error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

  /**
   * Mark user onboarding as complete
   * @param {number} userId - User's ID
   * @returns {Promise<Object>} Updated user object
   */
  static async markOnboardingComplete(userId) {
    try {
      const query = `
        UPDATE users 
        SET onboarding_completed = true, updated_at = NOW()
        WHERE id = $1
        RETURNING 
          id, email, username, 
          language_preference, theme_preference, currency_preference,
          preferences, created_at, last_login, email_verified, onboarding_completed
      `;
      
      const result = await db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        throw { ...errorCodes.NOT_FOUND, message: 'User not found' };
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error marking onboarding complete:', { userId, error: error.message });
      throw error;
    }
  }
}

module.exports = User;