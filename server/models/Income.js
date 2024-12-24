const db = require('../config/db');

class Income {
    static async create(data) {
        const { user_id, amount, description, date, is_recurring } = data;
        try {
            const result = await db.query(
                `INSERT INTO income (user_id, amount, description, date, is_recurring) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING *`,
                [user_id, amount, description, date, is_recurring]
            );
            return result.rows[0];
        } catch (err) {
            throw new Error('Error creating income: ' + err.message);
        }
    }

    static async findById(id, user_id) {
        try {
            const result = await db.query(
                'SELECT * FROM income WHERE id = $1 AND user_id = $2',
                [id, user_id]
            );
            return result.rows[0];
        } catch (err) {
            throw new Error('Error finding income: ' + err.message);
        }
    }

    static async findAll(user_id, filters = {}) {
        try {
            let query = 'SELECT * FROM income WHERE user_id = $1';
            const queryParams = [user_id];
            let paramCount = 1;

            if (filters.startDate) {
                paramCount++;
                query += ` AND date >= $${paramCount}`;
                queryParams.push(filters.startDate);
            }

            if (filters.endDate) {
                paramCount++;
                query += ` AND date <= $${paramCount}`;
                queryParams.push(filters.endDate);
            }

            if (filters.is_recurring !== undefined) {
                paramCount++;
                query += ` AND is_recurring = $${paramCount}`;
                queryParams.push(filters.is_recurring);
            }

            query += ' ORDER BY date DESC';

            const result = await db.query(query, queryParams);
            return result.rows;
        } catch (err) {
            throw new Error('Error fetching income: ' + err.message);
        }
    }

    // More methods following similar pattern...
}

module.exports = Income;