/**
 * ShoppingItem Model — shopping_items table
 */

const db = require('../config/db');

class ShoppingItem {
  static async getAll(userId) {
    const { rows } = await db.query(
      `SELECT * FROM shopping_items
       WHERE user_id = $1
       ORDER BY category ASC, name ASC`,
      [userId]
    );
    return rows;
  }

  static async getById(id, userId) {
    const { rows } = await db.query(
      `SELECT * FROM shopping_items WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return rows[0] || null;
  }

  static async create(userId, data) {
    const { name, category = 'אחר', price_ils = 0, buy_url = null, notes = null } = data;
    const { rows } = await db.query(
      `INSERT INTO shopping_items (user_id, name, category, price_ils, buy_url, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, name.trim(), category, parseFloat(price_ils) || 0, buy_url || null, notes || null]
    );
    return rows[0];
  }

  static async update(id, userId, data) {
    const { name, category, price_ils, buy_url, notes, is_bought } = data;
    const { rows } = await db.query(
      `UPDATE shopping_items
       SET name      = COALESCE($3, name),
           category  = COALESCE($4, category),
           price_ils = COALESCE($5, price_ils),
           buy_url   = $6,
           notes     = $7,
           is_bought = COALESCE($8, is_bought)
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        id,
        userId,
        name ? name.trim() : null,
        category || null,
        price_ils != null ? parseFloat(price_ils) : null,
        buy_url !== undefined ? (buy_url || null) : undefined,
        notes !== undefined ? (notes || null) : undefined,
        is_bought != null ? is_bought : null,
      ]
    );
    return rows[0] || null;
  }

  static async delete(id, userId) {
    const { rowCount } = await db.query(
      `DELETE FROM shopping_items WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return rowCount > 0;
  }

  static async getTotal(userId) {
    const { rows } = await db.query(
      `SELECT COALESCE(SUM(price_ils), 0) AS total
       FROM shopping_items
       WHERE user_id = $1 AND is_bought = false`,
      [userId]
    );
    return parseFloat(rows[0].total);
  }
}

module.exports = { ShoppingItem };
