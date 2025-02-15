/**
 * User Model
 * Handles all user-related database operations and business logic
 */

const db = require('../config/db');
const bcrypt = require('bcrypt');

class User {
    /**
     * Create a new user
     * @param {string} email - User's email address
     * @param {string} username - User's username
     * @param {string} password - User's plain text password
     * @returns {Promise<Object>} Created user object (without password)
     */
    static async create(email, username, password) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await db.query(
                `INSERT INTO users (email, username, password_hash) 
                 VALUES ($1, $2, $3) 
                 RETURNING id, email, username, created_at`,
                [email, username, hashedPassword]
            );
            return result.rows[0];
        } catch (err) {
            if (err.code === '23505') { // unique_violation
                throw new Error('Email already exists');
            }
            throw new Error('Error creating user: ' + err.message);
        }
    }

    /**
     * Find a user by email
     * @param {string} email - User's email address
     * @returns {Promise<Object|null>} User object if found, null otherwise
     */
    static async findByEmail(email) {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    }

    /**
     * Find a user by ID
     * @param {number} id - User's ID
     * @returns {Promise<Object|null>} User object if found, null otherwise
     */
    static async findById(id) {
        try {
            const result = await db.query(
                'SELECT id, email, username FROM users WHERE id = $1',
                [id]
            );
            return result.rows[0];
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Error finding user: ' + err.message);
        }
    }

    /**
     * Verify user's password
     * @param {string} email - User's email
     * @param {string} password - Password to verify
     * @returns {Promise<Object|null>} User object without password if verified, null otherwise
     */
    static async verifyPassword(email, password) {
        const user = await this.findByEmail(email);
        if (!user) return null;
        
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;

        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    /**
     * Update user's profile
     * @param {number} userId - User's ID
     * @param {Object} data - Update data (username, currentPassword, newPassword)
     * @returns {Promise<Object>} Updated user object
     */static async updateProfile(userId, data) {
    try {
        const { username, currentPassword, newPassword } = data;
        let updates = [];
        let values = [];
        let paramCount = 1;

        // Handle username update
        if (username) {
            updates.push(`username = $${paramCount}`);
            values.push(username);
            paramCount++;
        }

        // Handle password update
        if (newPassword) {
            const user = await db.query(
                'SELECT password_hash FROM users WHERE id = $1',
                [userId]
            );

            if (!user.rows[0]) {
                throw new Error('User not found');
            }

            const validPassword = await bcrypt.compare(
                currentPassword,
                user.rows[0].password_hash
            );

            if (!validPassword) {
                throw new Error('Current password is incorrect');
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updates.push(`password_hash = $${paramCount}`);
            values.push(hashedPassword);
            paramCount++;
        }

        // Ensure there are updates to make
        if (updates.length === 0) {
            throw new Error('No valid updates provided');
        }

        // Add userId as the last parameter
        values.push(userId);
        
        const query = `
            UPDATE users 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, email, username;
        `;

        console.log('Executing query:', { query, values }); // Debug log

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        return result.rows[0];
    } catch (error) {
        console.error('Profile update error:', error);
        throw error;
    }
}
}

module.exports = User;