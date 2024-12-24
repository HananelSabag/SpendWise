// Update server/models/User.js
const db = require('../config/db');
const bcrypt = require('bcrypt');

class User {
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

    static async findByEmail(email) {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    }

    static async updateProfile(userId, data) {
        const { username, currency, language } = data;
        const result = await db.query(
            `UPDATE users 
             SET username = COALESCE($1, username),
                 currency = COALESCE($2, currency),
                 language = COALESCE($3, language),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING id, email, username, currency, language`,
            [username, currency, language, userId]
        );
        return result.rows[0];
    }

    static async verifyPassword(email, password) {
        const user = await this.findByEmail(email);
        if (!user) return null;
        
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;

        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}

module.exports = User;