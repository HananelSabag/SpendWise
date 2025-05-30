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
      await client.query('BEGIN');
      
      const { username, currentPassword, newPassword, preferences } = data;
      const updates = [];
      const values = [];
      let paramCount = 1;

      // Handle username update
      if (username !== undefined) {
        updates.push(`username = $${paramCount}`);
        values.push(username);
        paramCount++;
      }

      // Handle preferences update
      if (preferences !== undefined) {
        updates.push(`preferences = $${paramCount}`);
        values.push(JSON.stringify(preferences));
        paramCount++;
      }

      // Handle password update
      if (newPassword) {
        // Verify current password first
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

      // Add userId as last parameter
      values.push(userId);
      
      const query = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, email, username, preferences, last_login;
      `;

      const result = await client.query(query, values);
      
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update user preferences
   * @param {number} userId - User's ID
   * @param {Object} preferences - New preferences
   * @returns {Promise<Object>} Updated preferences
   */
  static async updatePreferences(userId, preferences) {
    const query = `
      UPDATE users 
      SET preferences = $1
      WHERE id = $2
      RETURNING preferences;
    `;
    
    const result = await db.query(query, [JSON.stringify(preferences), userId]);
    return result.rows[0]?.preferences || {};
  }
}

module.exports = User;