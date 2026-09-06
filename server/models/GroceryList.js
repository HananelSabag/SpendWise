/**
 * GroceryList model — lists and membership.
 *
 * Authorization rule for the whole feature: a user may touch a list if and only
 * if `grocery_list_members` has a row for (list_id, user_id). The owner has a
 * member row too, so there is exactly one rule and it is symmetric — an accepted
 * member can edit the owner's items and vice versa. Item authorship is history,
 * never permission.
 *
 * A user may belong to SEVERAL lists (migration 44) — their own household one
 * and, say, the one a friend shared. Which of them they are looking at is
 * `grocery_list_members.last_opened_at`: highest wins, per user and per list, so
 * two people on the same list can each be somewhere different. They still own
 * at most one list; extra lists arrive by invitation.
 *
 * Every request may name a list explicitly (see `middleware/groceryAccess`);
 * membership is checked either way, so naming one is a convenience and never
 * a grant of access.
 *
 * Concurrency: there is no list-level lock. `version` is a change stamp for
 * polling, nothing more.
 */

const db = require('../config/db');

class GroceryList {
  /**
   * The list this user is on, creating their own (plus the owner membership and
   * an empty active trip) on first use, inside a single transaction. Only ever
   * creates when they belong to NO list — an invitation is the other way in.
   */
  static async resolveForUser(userId) {
    const existing = await this.findForUser(userId);
    if (existing) return existing;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Re-check inside the transaction: two parallel first requests from the
      // same user must not create two lists.
      const { rows: raced } = await client.query(
        `SELECT l.id
           FROM grocery_lists l
           JOIN grocery_list_members m ON m.list_id = l.id
          WHERE m.user_id = $1 AND l.archived_at IS NULL
          LIMIT 1`,
        [userId]
      );

      if (raced.length === 0) {
        const { rows: created } = await client.query(
          `INSERT INTO grocery_lists (owner_id) VALUES ($1)
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [userId]
        );

        const listId = created[0]?.id
          ?? (await client.query(
                `SELECT id FROM grocery_lists WHERE owner_id = $1 AND archived_at IS NULL`,
                [userId]
             )).rows[0].id;

        await client.query(
          `INSERT INTO grocery_list_members (list_id, user_id, role)
           VALUES ($1, $2, 'owner')
           ON CONFLICT (list_id, user_id) DO NOTHING`,
          [listId, userId]
        );

        await client.query(
          `INSERT INTO grocery_trips (list_id, status) VALUES ($1, 'active')
           ON CONFLICT DO NOTHING`,
          [listId]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }

    return this.findForUser(userId);
  }

  /**
   * The list this user is currently on, or null.
   *
   * Most-recently-opened wins. The old tie-breakers stay underneath it for
   * memberships that predate `last_opened_at`: a list shared WITH you beats one
   * you made yourself, which is what someone who joined a household expects.
   */
  static async findForUser(userId) {
    const { rows } = await db.query(
      `SELECT l.*, m.role, m.joined_at
         FROM grocery_list_members m
         JOIN grocery_lists l ON l.id = m.list_id
        WHERE m.user_id = $1 AND l.archived_at IS NULL
        ORDER BY m.last_opened_at DESC NULLS LAST,
                 (m.role = 'member') DESC,
                 m.joined_at ASC
        LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }

  /** One specific list, but only if this user is on it. Otherwise null. */
  static async findForUserById(listId, userId) {
    const { rows } = await db.query(
      `SELECT l.*, m.role, m.joined_at
         FROM grocery_list_members m
         JOIN grocery_lists l ON l.id = m.list_id
        WHERE m.list_id = $1 AND m.user_id = $2 AND l.archived_at IS NULL`,
      [listId, userId]
    );
    return rows[0] || null;
  }

  /**
   * Every list this user can open, newest-opened first — what the list switcher
   * shows. A list has no user-facing name of its own, so the label is whose it
   * is; `open_items` is the only number worth showing next to it.
   */
  static async listsForUser(userId) {
    const { rows } = await db.query(
      `SELECT l.id,
              l.name,
              l.owner_id,
              m.role,
              m.last_opened_at,
              owner.first_name  AS owner_first_name,
              owner.username    AS owner_username,
              (SELECT COUNT(*)::int FROM grocery_list_members gm
                WHERE gm.list_id = l.id)                          AS member_count,
              (SELECT COUNT(*)::int FROM grocery_items i
                 JOIN grocery_trips t ON t.id = i.trip_id
                WHERE t.list_id = l.id
                  AND t.status = 'active'
                  AND i.is_purchased = false)                     AS open_items
         FROM grocery_list_members m
         JOIN grocery_lists l ON l.id = m.list_id
         JOIN users owner     ON owner.id = l.owner_id
        WHERE m.user_id = $1 AND l.archived_at IS NULL
        ORDER BY m.last_opened_at DESC NULLS LAST,
                 (m.role = 'member') DESC,
                 m.joined_at ASC`,
      [userId]
    );
    return rows;
  }

  /**
   * Mark a list as the one this user is on. Membership-checked, so this doubles
   * as the switch action's authorization. Returns false if they aren't a member.
   */
  static async markOpened(listId, userId) {
    const { rowCount } = await db.query(
      `UPDATE grocery_list_members
          SET last_opened_at = NOW()
        WHERE list_id = $1 AND user_id = $2`,
      [listId, userId]
    );
    return rowCount > 0;
  }

  /** Membership row for (list, user), or null. The single authorization check. */
  static async getMembership(listId, userId) {
    const { rows } = await db.query(
      `SELECT m.*, l.owner_id
         FROM grocery_list_members m
         JOIN grocery_lists l ON l.id = m.list_id
        WHERE m.list_id = $1 AND m.user_id = $2 AND l.archived_at IS NULL`,
      [listId, userId]
    );
    return rows[0] || null;
  }

  static async getById(listId) {
    const { rows } = await db.query(
      `SELECT * FROM grocery_lists WHERE id = $1 AND archived_at IS NULL`,
      [listId]
    );
    return rows[0] || null;
  }

  /** Members with the profile fields the UI shows. Never returns emails to non-owners. */
  static async getMembers(listId) {
    const { rows } = await db.query(
      `SELECT m.user_id, m.role, m.joined_at,
              u.username, u.first_name, u.last_name, u.email, u.avatar
         FROM grocery_list_members m
         JOIN users u ON u.id = m.user_id
        WHERE m.list_id = $1
        ORDER BY (m.role = 'owner') DESC, m.joined_at ASC`,
      [listId]
    );
    return rows;
  }

  /**
   * Monotonic change stamp. Every mutation bumps it; viewers poll it instead of
   * refetching the whole list. Runs on the caller's client so it joins their
   * transaction.
   */
  static async bumpVersion(client, listId) {
    const { rows } = await (client || db).query(
      `UPDATE grocery_lists SET version = version + 1 WHERE id = $1 RETURNING version`,
      [listId]
    );
    return rows[0]?.version ?? null;
  }

  /**
   * Current change stamp, for the live poll.
   *
   * There is no list-level lock any more: two people adding different items or
   * checking off different items cannot conflict, and freezing the whole list
   * for 60s to protect against that was the wrong trade. The only real
   * collision — two people editing the same item's fields — is handled by a
   * short per-item claim plus `grocery_items.version`.
   */
  static async getVersion(listId) {
    const { rows } = await db.query(
      `SELECT version FROM grocery_lists WHERE id = $1`,
      [listId]
    );
    return rows[0] ? Number(rows[0].version) : null;
  }

  // ─── Membership changes ───────────────────────────────────────────────────

  /** Owner removes a member. Refuses to remove the owner. */
  static async removeMember(listId, ownerId, memberId) {
    const { rowCount } = await db.query(
      `DELETE FROM grocery_list_members m
        USING grocery_lists l
        WHERE m.list_id = $1
          AND m.user_id = $3
          AND m.role <> 'owner'
          AND l.id = m.list_id
          AND l.owner_id = $2`,
      [listId, ownerId, memberId]
    );
    return rowCount > 0;
  }

  /** A member walks away from a list they don't own. */
  static async leave(listId, userId) {
    const { rowCount } = await db.query(
      `DELETE FROM grocery_list_members
        WHERE list_id = $1 AND user_id = $2 AND role <> 'owner'`,
      [listId, userId]
    );
    return rowCount > 0;
  }

  /**
   * Owner drops every member but keeps the list (and all its history) intact.
   * Returns the removed user ids so the controller can notify them.
   */
  static async disband(listId, ownerId) {
    const { rows } = await db.query(
      `DELETE FROM grocery_list_members m
        USING grocery_lists l
        WHERE m.list_id = $1
          AND m.role <> 'owner'
          AND l.id = m.list_id
          AND l.owner_id = $2
      RETURNING m.user_id`,
      [listId, ownerId]
    );

    await db.query(
      `UPDATE grocery_list_invitations
          SET status = 'cancelled', responded_at = NOW()
        WHERE list_id = $1 AND status = 'pending'`,
      [listId]
    );

    return rows.map((r) => r.user_id);
  }
}

module.exports = { GroceryList };
