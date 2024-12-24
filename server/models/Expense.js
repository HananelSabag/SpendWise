const db = require('../config/db');

class Expense {
    static async create(data) {
        const { user_id, amount, description, category_id, date } = data;
        try {
            const result = await db.query(
                `INSERT INTO expenses (user_id, amount, description, category_id, date) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING *`,
                [user_id, amount, description, category_id, date]
            );
            return result.rows[0];
        } catch (err) {
            throw new Error('Error creating expense: ' + err.message);
        }
    }

    static async findById(id, user_id) {
        try {
            const result = await db.query(
                `SELECT e.*, c.name as category_name 
                 FROM expenses e 
                 LEFT JOIN categories c ON e.category_id = c.id 
                 WHERE e.id = $1 AND e.user_id = $2`,
                [id, user_id]
            );
            return result.rows[0];
        } catch (err) {
            throw new Error('Error finding expense: ' + err.message);
        }
    }

    static async findAll(user_id, filters = {}) {
        try {
            let query = `SELECT e.*, c.name as category_name 
                        FROM expenses e 
                        LEFT JOIN categories c ON e.category_id = c.id 
                        WHERE e.user_id = $1`;
            
            const queryParams = [user_id];
            let paramCount = 1;

            if (filters.startDate) {
                paramCount++;
                query += ` AND e.date >= $${paramCount}`;
                queryParams.push(filters.startDate);
            }

            if (filters.endDate) {
                paramCount++;
                query += ` AND e.date <= $${paramCount}`;
                queryParams.push(filters.endDate);
            }

            if (filters.category_id) {
                paramCount++;
                query += ` AND e.category_id = $${paramCount}`;
                queryParams.push(filters.category_id);
            }

            query += ' ORDER BY e.date DESC';

            const result = await db.query(query, queryParams);
            return result.rows;
        } catch (err) {
            throw new Error('Error fetching expenses: ' + err.message);
        }
    }

    static async update(id, user_id, data) {
        const { amount, description, category_id, date } = data;
        try {
            const result = await db.query(
                `UPDATE expenses 
                 SET amount = $1, description = $2, category_id = $3, date = $4 
                 WHERE id = $5 AND user_id = $6 
                 RETURNING *`,
                [amount, description, category_id, date, id, user_id]
            );
            return result.rows[0];
        } catch (err) {
            throw new Error('Error updating expense: ' + err.message);
        }
    }

    static async delete(id, user_id) {
        try {
            await db.query(
                'DELETE FROM expenses WHERE id = $1 AND user_id = $2',
                [id, user_id]
            );
            return true;
        } catch (err) {
            throw new Error('Error deleting expense: ' + err.message);
        }
    }

    static async getMonthlyTotal(user_id, year, month) {
        try {
            const result = await db.query(
                `SELECT SUM(amount) as total 
                 FROM expenses 
                 WHERE user_id = $1 
                 AND EXTRACT(YEAR FROM date) = $2 
                 AND EXTRACT(MONTH FROM date) = $3`,
                [user_id, year, month]
            );
            return result.rows[0].total || 0;
        } catch (err) {
            throw new Error('Error calculating monthly total: ' + err.message);
        }
    }

    static async getCategoryTotals(user_id, startDate, endDate) {
        try {
            const result = await db.query(
                `SELECT c.name, SUM(e.amount) as total 
                 FROM expenses e 
                 JOIN categories c ON e.category_id = c.id 
                 WHERE e.user_id = $1 
                 AND e.date BETWEEN $2 AND $3 
                 GROUP BY c.name`,
                [user_id, startDate, endDate]
            );
            return result.rows;
        } catch (err) {
            throw new Error('Error calculating category totals: ' + err.message);
        }
    }
}

module.exports = Expense;