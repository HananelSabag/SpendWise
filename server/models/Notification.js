/**
 * Notification model — the persistent in-app notification centre.
 *
 * Moved out of the old `models/ShoppingShare.js` when the wishlist feature was
 * replaced; the notifications table itself is unchanged.
 *
 * Presentation rule: `type` + `data` are the contract, and the client renders
 * the text from its own translation files. `title`/`body` are stored only as an
 * English fallback for clients that don't know a type yet — never as the source
 * of truth, which is what previously made English users read Hebrew strings.
 */

const db = require('../config/db');

class Notification {
  static async create(userId, type, title, body, data = {}) {
    const { rows } = await db.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, body, JSON.stringify(data)]
    );
    return rows[0];
  }

  static async getForUser(userId, limit = 30) {
    const { rows } = await db.query(
      `SELECT * FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
      [userId, limit]
    );
    return rows;
  }

  static async getUnreadCount(userId) {
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS count FROM notifications
        WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return rows[0].count;
  }

  static async markAllRead(userId) {
    await db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
  }

  static async markRead(id, userId) {
    const { rowCount } = await db.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return rowCount > 0;
  }

  /**
   * Mark exactly the notifications that carry a given data key/value — used to
   * retire the invitation notification the user just answered, without touching
   * anything else they haven't read.
   */
  static async markReadByDataValue(userId, type, key, value) {
    const { rowCount } = await db.query(
      `UPDATE notifications
          SET is_read = true
        WHERE user_id = $1 AND type = $2 AND is_read = false
          AND data ->> $3 = $4`,
      [userId, type, key, String(value)]
    );
    return rowCount;
  }

  /** Delete notifications tied to a resource that no longer exists. */
  static async deleteByDataValue(userId, type, key, value) {
    const { rowCount } = await db.query(
      `DELETE FROM notifications
        WHERE user_id = $1 AND type = $2 AND data ->> $3 = $4`,
      [userId, type, key, String(value)]
    );
    return rowCount;
  }
}

module.exports = { Notification };
