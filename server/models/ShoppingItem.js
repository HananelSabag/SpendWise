/**
 * ShoppingItem Model — shopping_items table
 */

const db = require('../config/db');

class ShoppingItem {
  static async getAll(userId) {
    // DISTINCT prevents duplicate rows when the same user appears via
    // multiple share paths (e.g. mutual shares between two users).
    const { rows } = await db.query(`
      SELECT DISTINCT ON (si.id)
             si.*,
             u.first_name AS owner_first_name,
             u.last_name  AS owner_last_name,
             u.username   AS owner_username
      FROM   shopping_items si
      JOIN   users u ON u.id = si.user_id
      WHERE  si.user_id = $1
         OR  si.user_id IN (
               SELECT owner_id FROM shopping_shares WHERE member_id = $1
             )
         OR  si.user_id IN (
               SELECT member_id FROM shopping_shares WHERE owner_id = $1
             )
      ORDER  BY si.id, si.category ASC, si.name ASC
    `, [userId]);
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
    const { name, category = 'אחר', price_ils = 0, buy_url = null, notes = null, image_url = null } = data;
    const { rows } = await db.query(
      `INSERT INTO shopping_items (user_id, name, category, price_ils, buy_url, notes, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, name.trim(), category, parseFloat(price_ils) || 0, buy_url || null, notes || null, image_url || null]
    );
    return rows[0];
  }

  static async update(id, userId, data) {
    const { name, category, price_ils, buy_url, notes, is_bought, image_url } = data;
    const { rows } = await db.query(
      `UPDATE shopping_items
       SET name      = COALESCE($3, name),
           category  = COALESCE($4, category),
           price_ils = COALESCE($5, price_ils),
           buy_url   = COALESCE($6, buy_url),
           notes     = COALESCE($7, notes),
           is_bought = COALESCE($8, is_bought),
           image_url = COALESCE($9, image_url)
       WHERE id = $1
        AND (
          user_id = $2
          OR user_id IN (SELECT member_id FROM shopping_shares WHERE owner_id = $2)
        )
       RETURNING *`,
      [
        id,
        userId,
        name ? name.trim() : null,
        category || null,
        price_ils != null ? parseFloat(price_ils) : null,
        buy_url !== undefined ? (buy_url || null) : null,
        notes !== undefined ? (notes || null) : null,
        is_bought != null ? is_bought : null,
        image_url !== undefined ? (image_url || null) : null,
      ]
    );
    return rows[0] || null;
  }

  static async delete(id, userId) {
    // Allow deletion if:
    //   1. The item belongs to the requesting user, OR
    //   2. The requesting user is the share owner and the item belongs to one of their members
    const { rowCount } = await db.query(`
      DELETE FROM shopping_items
      WHERE id = $1
        AND (
          user_id = $2
          OR user_id IN (
            SELECT member_id FROM shopping_shares WHERE owner_id = $2
          )
        )
    `, [id, userId]);
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
