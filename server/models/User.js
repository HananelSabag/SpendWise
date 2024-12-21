// User model - handles database operations for users
const db = require('../config/db');
const bcrypt = require('bcrypt');

class User {
    // Create new user
    static async create(email, username, password) {
        try {
            // Hash password before storing
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const result = await db.query(
                `INSERT INTO users (email, username, password_hash) 
                 VALUES ($1, $2, $3) 
                 RETURNING id, email, username`,
                [email, username, hashedPassword]
            );
            
            return result.rows[0];
        } catch (err) {
            throw new Error('Error creating user: ' + err.message);
        }
    }
    // Add this method to the User class
static async verifyPassword(email, password) {
    try {
        // Get user by email
        const user = await this.findByEmail(email);
        if (!user) {
            return null;
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return null;
        }

        // Return user without password hash
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (err) {
        throw new Error('Login error: ' + err.message);
    }
}

    // Find user by email - will be used for login later
    static async findByEmail(email) {
        try {
            const result = await db.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );
            return result.rows[0];
        } catch (err) {
            throw new Error('Error finding user: ' + err.message);
        }
    }
}

module.exports = User;