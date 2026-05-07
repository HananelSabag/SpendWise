/**
 * ShoppingShare + Notification models
 */

const db = require('../config/db');

class ShoppingShare {
  static async createInvitation(inviterId, inviteeEmail) {
    const { rows: found } = await db.query(
      `SELECT id FROM users WHERE LOWER(email) = $1 AND is_active = true LIMIT 1`,
      [inviteeEmail]
    );
    const inviteeId = found[0]?.id || null;

    const { rows } = await db.query(`
      INSERT INTO shopping_invitations (inviter_id, invitee_email, invitee_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (inviter_id, invitee_email) DO UPDATE
        SET status       = 'pending',
            token        = gen_random_uuid(),
            invitee_id   = EXCLUDED.invitee_id,
            created_at   = NOW(),
            expires_at   = NOW() + INTERVAL '7 days',
            responded_at = NULL
      RETURNING *
    `, [inviterId, inviteeEmail, inviteeId]);

    return { invitation: rows[0], inviteeFound: inviteeId !== null };
  }

  static async getPendingInvitations(userId) {
    const { rows } = await db.query(`
      SELECT si.*,
             u.username       AS inviter_username,
             u.first_name     AS inviter_first_name,
             u.last_name      AS inviter_last_name,
             u.avatar         AS inviter_avatar
      FROM   shopping_invitations si
      JOIN   users u ON u.id = si.inviter_id
      WHERE  si.invitee_id = $1
        AND  si.status     = 'pending'
        AND  si.expires_at > NOW()
      ORDER  BY si.created_at DESC
    `, [userId]);
    return rows;
  }

  static async findByToken(token) {
    const { rows } = await db.query(`
      SELECT si.*,
             u.username   AS inviter_username,
             u.first_name AS inviter_first_name,
             u.email      AS inviter_email
      FROM   shopping_invitations si
      JOIN   users u ON u.id = si.inviter_id
      WHERE  si.token     = $1
        AND  si.status    = 'pending'
        AND  si.expires_at > NOW()
      LIMIT  1
    `, [token]);
    return rows[0] || null;
  }

  static async acceptInvitation(token, userId) {
    const inv = await this.findByToken(token);
    if (!inv || inv.invitee_id !== userId) return null;

    await db.query(
      `UPDATE shopping_invitations SET status = 'accepted', responded_at = NOW() WHERE token = $1`,
      [token]
    );
    await db.query(`
      INSERT INTO shopping_shares (owner_id, member_id)
      VALUES ($1, $2)
      ON CONFLICT (owner_id, member_id) DO NOTHING
    `, [inv.inviter_id, userId]);

    return inv;
  }

  static async declineInvitation(token, userId) {
    const { rows } = await db.query(`
      UPDATE shopping_invitations
         SET status = 'declined', responded_at = NOW()
       WHERE token = $1 AND invitee_id = $2 AND status = 'pending'
      RETURNING *
    `, [token, userId]);
    return rows[0] || null;
  }

  static async getMembers(userId) {
    const { rows: myMembers } = await db.query(`
      SELECT ss.*, u.username, u.first_name, u.last_name, u.avatar, u.email
      FROM   shopping_shares ss
      JOIN   users u ON u.id = ss.member_id
      WHERE  ss.owner_id = $1
      ORDER  BY ss.created_at DESC
    `, [userId]);

    const { rows: sharedWithMe } = await db.query(`
      SELECT ss.*, u.username, u.first_name, u.last_name, u.avatar, u.email
      FROM   shopping_shares ss
      JOIN   users u ON u.id = ss.owner_id
      WHERE  ss.member_id = $1
      ORDER  BY ss.created_at DESC
    `, [userId]);

    const { rows: pendingSent } = await db.query(`
      SELECT invitee_email, created_at, expires_at, token
      FROM   shopping_invitations
      WHERE  inviter_id = $1 AND status = 'pending' AND expires_at > NOW()
      ORDER  BY created_at DESC
    `, [userId]);

    return { myMembers, sharedWithMe, pendingSent };
  }

  static async removeMember(ownerId, memberId) {
    const { rowCount } = await db.query(
      `DELETE FROM shopping_shares WHERE owner_id = $1 AND member_id = $2`,
      [ownerId, memberId]
    );
    return rowCount > 0;
  }

  static async leaveShare(ownerId, memberId) {
    const { rowCount } = await db.query(
      `DELETE FROM shopping_shares WHERE owner_id = $1 AND member_id = $2`,
      [ownerId, memberId]
    );
    return rowCount > 0;
  }

  // Owner disbands the entire shared list — removes all members at once
  static async disbandShare(ownerId) {
    const { rows } = await db.query(
      `DELETE FROM shopping_shares WHERE owner_id = $1 RETURNING member_id`,
      [ownerId]
    );
    return rows.map((r) => r.member_id);
  }

  static async cancelInvitation(inviterId, inviteeEmail) {
    const { rowCount } = await db.query(
      `DELETE FROM shopping_invitations WHERE inviter_id = $1 AND invitee_email = $2 AND status = 'pending'`,
      [inviterId, inviteeEmail]
    );
    return rowCount > 0;
  }
}

class Notification {
  static async create(userId, type, title, body, data = {}) {
    const { rows } = await db.query(`
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, type, title, body, JSON.stringify(data)]);
    return rows[0];
  }

  static async getForUser(userId, limit = 30) {
    const { rows } = await db.query(`
      SELECT * FROM notifications
      WHERE  user_id = $1
      ORDER  BY created_at DESC
      LIMIT  $2
    `, [userId, limit]);
    return rows;
  }

  static async getUnreadCount(userId) {
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false`,
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

  static async markReadByType(userId, type) {
    await db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND type = $2 AND is_read = false`,
      [userId, type]
    );
  }
}

module.exports = { ShoppingShare, Notification };
