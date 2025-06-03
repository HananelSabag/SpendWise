/**
 * User Model - Updated for new DB structure
 * Handles all user-related database operations
 * @module models/User
 */

const db = require('../config/db');
const bcrypt = require('bcrypt');
const errorCodes = require('../utils/errorCodes');

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
      
      const query = `
        INSERT INTO users (email, username, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, email, username, created_at, preferences;
      `;
      
      const result = await db.query(query, [email, username, hashedPassword]);
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
   * Find user by email
   * @param {string} email - User's email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, email, username, password_hash, preferences, last_login
      FROM users 
      WHERE email = $1;
    `;
    
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   * @param {number} id - User's ID
   * @returns {Promise<Object|null>} User object (without password)
   */
  static async findById(id) {
    const query = `
      SELECT id, email, username, preferences, created_at, last_login
      FROM users 
      WHERE id = $1;
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Verify user's password
   * @param {string} email - User's email
   * @param {string} password - Password to verify
   * @returns {Promise<Object|null>} User object if verified
   */
  static async verifyPassword(email, password) {
    const user = await this.findByEmail(email);
    if (!user) return null;
    
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return null;

    // Update last login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Return user without password
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
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
      const { 
        username, 
        currentPassword, 
        newPassword 
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

      // ✅ ביצוע העדכון
      const query = `
        UPDATE users 
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING id, username, email, preferences, created_at, updated_at
      `;
      
      values.push(userId);
      
      const result = await client.query(query, values);
      
      if (!result.rows[0]) {
        throw { ...errorCodes.NOT_FOUND };
      }

      return {
        success: true,
        data: {
          user: result.rows[0]
        }
      };
      
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update user preferences - FIXED to properly merge preferences
   * @param {number} userId - User's ID
   * @param {Object} preferences - New preferences to merge
   * @returns {Promise<Object>} Updated preferences
   */
  static async updatePreferences(userId, preferences) {
    try {
      // First, get the existing user data to merge preferences
      const existingQuery = 'SELECT preferences FROM users WHERE id = $1';
      const existingResult = await db.query(existingQuery, [userId]);
      
      if (existingResult.rows.length === 0) {
        throw { ...errorCodes.NOT_FOUND, message: 'User not found' };
      }
      
      // Get existing preferences or empty object
      const existingPreferences = existingResult.rows[0].preferences || {};
      
      // Merge new preferences with existing ones (new ones override)
      const mergedPreferences = { ...existingPreferences, ...preferences };
      
      // Update with merged preferences
      const updateQuery = `
        UPDATE users 
        SET preferences = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING preferences;
      `;
      
      const result = await db.query(updateQuery, [JSON.stringify(mergedPreferences), userId]);
      return result.rows[0]?.preferences || {};
    } catch (error) {
      console.error('Error updating preferences:', error);
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
}

module.exports = User;