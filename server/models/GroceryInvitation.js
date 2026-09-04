/**
 * GroceryInvitation model — invitations to join a shared grocery list.
 *
 * Invitations are addressed to an *email*, not a user id, which is what lets
 * someone invite a person who has not signed up yet: the row keeps
 * `invitee_id = NULL` until that email registers, and `linkForNewUser` claims it
 * at registration time.
 *
 * Acceptance is a single database transaction (status flip + membership insert)
 * and is idempotent, so a retried request can never half-apply.
 */

const db = require('../config/db');

/** Outcome codes the controller maps to HTTP status + a client translation key. */
const INVITE_RESULT = {
  OK: 'OK',
  NOT_FOUND: 'NOT_FOUND',
  EXPIRED: 'EXPIRED',
  WRONG_RECIPIENT: 'WRONG_RECIPIENT',
  ALREADY_MEMBER: 'ALREADY_MEMBER',
  ALREADY_IN_ANOTHER_LIST: 'ALREADY_IN_ANOTHER_LIST',
  OWN_LIST_NOT_EMPTY: 'OWN_LIST_NOT_EMPTY',
};

class GroceryInvitation {
  /**
   * Create (or refresh) a pending invitation.
   *
   * Returns `{ invitation, inviteeIsRegistered }`. The caller must not vary its
   * HTTP response on `inviteeIsRegistered` — that would turn this endpoint into
   * an account-existence oracle.
   */
  static async create(listId, inviterId, email) {
    const inviteeEmail = email.trim().toLowerCase();

    const { rows: found } = await db.query(
      `SELECT id FROM users WHERE LOWER(email) = $1 AND is_active = true LIMIT 1`,
      [inviteeEmail]
    );
    const inviteeId = found[0]?.id ?? null;

    // Already on the list — nothing to do, and saying so out loud would leak.
    if (inviteeId) {
      const { rows: member } = await db.query(
        `SELECT 1 FROM grocery_list_members WHERE list_id = $1 AND user_id = $2`,
        [listId, inviteeId]
      );
      if (member.length) {
        return { invitation: null, inviteeIsRegistered: true, alreadyMember: true };
      }
    }

    // Refresh an existing pending row instead of piling up duplicates. The
    // partial unique index (list_id, invitee_email) WHERE status = 'pending'
    // is what makes this safe under concurrent invites.
    const { rows: existing } = await db.query(
      `UPDATE grocery_list_invitations
          SET token      = gen_random_uuid(),
              invitee_id = $3,
              expires_at = NOW() + INTERVAL '14 days',
              created_at = NOW()
        WHERE list_id = $1 AND invitee_email = $2 AND status = 'pending'
      RETURNING *`,
      [listId, inviteeEmail, inviteeId]
    );
    if (existing[0]) {
      return { invitation: existing[0], inviteeIsRegistered: !!inviteeId, alreadyMember: false };
    }

    const { rows } = await db.query(
      `INSERT INTO grocery_list_invitations (list_id, inviter_id, invitee_email, invitee_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [listId, inviterId, inviteeEmail, inviteeId]
    );

    return { invitation: rows[0], inviteeIsRegistered: !!inviteeId, alreadyMember: false };
  }

  /**
   * Pending invitations addressed to this user — matched by id *or* by email, so
   * an invitation sent before they registered still shows up.
   */
  static async getPendingForUser(userId, email) {
    const { rows } = await db.query(
      `SELECT inv.id, inv.list_id, inv.token, inv.created_at, inv.expires_at,
              inv.inviter_id,
              u.username AS inviter_username, u.first_name AS inviter_first_name,
              u.last_name AS inviter_last_name, u.avatar AS inviter_avatar,
              l.name AS list_name,
              (SELECT COUNT(*)::int FROM grocery_list_members m WHERE m.list_id = inv.list_id) AS member_count
         FROM grocery_list_invitations inv
         JOIN users u        ON u.id = inv.inviter_id
         JOIN grocery_lists l ON l.id = inv.list_id
        WHERE inv.status = 'pending'
          AND inv.expires_at > NOW()
          AND (inv.invitee_id = $1 OR LOWER(inv.invitee_email) = $2)
          AND l.archived_at IS NULL
        ORDER BY inv.created_at DESC`,
      [userId, String(email || '').toLowerCase()]
    );
    return rows;
  }

  /**
   * Preview an invitation from its token. Deliberately read-only: opening an
   * invite URL must never join anything — the user has to press Accept.
   */
  static async getByToken(token) {
    const { rows } = await db.query(
      `SELECT inv.*,
              u.username AS inviter_username, u.first_name AS inviter_first_name,
              u.last_name AS inviter_last_name, u.avatar AS inviter_avatar,
              l.name AS list_name, l.archived_at,
              (SELECT COUNT(*)::int FROM grocery_list_members m WHERE m.list_id = inv.list_id) AS member_count
         FROM grocery_list_invitations inv
         JOIN users u         ON u.id = inv.inviter_id
         JOIN grocery_lists l ON l.id = inv.list_id
        WHERE inv.token = $1
        LIMIT 1`,
      [token]
    );
    return rows[0] || null;
  }

  /**
   * Accept in one transaction: verify recipient, insert membership, flip status.
   *
   * Refuses (rather than silently reshuffling) when the user is already working
   * on someone else's list, or owns a list that still has members or history.
   * An empty owned list is archived out of the way instead.
   */
  static async accept(token, user) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const { rows: invRows } = await client.query(
        `SELECT inv.*, l.archived_at
           FROM grocery_list_invitations inv
           JOIN grocery_lists l ON l.id = inv.list_id
          WHERE inv.token = $1
          FOR UPDATE OF inv`,
        [token]
      );
      const inv = invRows[0];

      if (!inv || inv.archived_at) {
        await client.query('ROLLBACK');
        return { result: INVITE_RESULT.NOT_FOUND };
      }

      const userEmail = String(user.email || '').toLowerCase();
      if (inv.invitee_id !== null && inv.invitee_id !== user.id) {
        await client.query('ROLLBACK');
        return { result: INVITE_RESULT.WRONG_RECIPIENT };
      }
      if (inv.invitee_id === null && inv.invitee_email !== userEmail) {
        await client.query('ROLLBACK');
        return { result: INVITE_RESULT.WRONG_RECIPIENT };
      }

      // Idempotent: accepting twice is a success, not an error.
      const { rows: alreadyMember } = await client.query(
        `SELECT 1 FROM grocery_list_members WHERE list_id = $1 AND user_id = $2`,
        [inv.list_id, user.id]
      );
      if (alreadyMember.length) {
        await client.query(
          `UPDATE grocery_list_invitations
              SET status = 'accepted', responded_at = COALESCE(responded_at, NOW()), invitee_id = $2
            WHERE id = $1 AND status = 'pending'`,
          [inv.id, user.id]
        );
        await client.query('COMMIT');
        return { result: INVITE_RESULT.OK, listId: inv.list_id, inviterId: inv.inviter_id };
      }

      if (inv.status !== 'pending') {
        await client.query('ROLLBACK');
        return { result: INVITE_RESULT.NOT_FOUND };
      }
      if (new Date(inv.expires_at) <= new Date()) {
        await client.query(
          `UPDATE grocery_list_invitations SET status = 'expired' WHERE id = $1 AND status = 'pending'`,
          [inv.id]
        );
        await client.query('COMMIT');
        return { result: INVITE_RESULT.EXPIRED };
      }

      // What is this user currently attached to?
      const { rows: current } = await client.query(
        `SELECT m.list_id, m.role, l.owner_id
           FROM grocery_list_members m
           JOIN grocery_lists l ON l.id = m.list_id
          WHERE m.user_id = $1 AND l.archived_at IS NULL`,
        [user.id]
      );

      const joinedElsewhere = current.find((m) => m.role === 'member');
      if (joinedElsewhere) {
        await client.query('ROLLBACK');
        return { result: INVITE_RESULT.ALREADY_IN_ANOTHER_LIST };
      }

      const ownList = current.find((m) => m.role === 'owner');
      if (ownList) {
        const { rows: busy } = await client.query(
          `SELECT
             (SELECT COUNT(*) FROM grocery_list_members m
               WHERE m.list_id = $1 AND m.user_id <> $2)                       AS other_members,
             (SELECT COUNT(*) FROM grocery_trips t
               WHERE t.list_id = $1 AND t.status = 'completed')                AS history,
             (SELECT COUNT(*) FROM grocery_items i
                JOIN grocery_trips t ON t.id = i.trip_id
               WHERE t.list_id = $1)                                           AS items`,
          [ownList.list_id, user.id]
        );
        const b = busy[0];
        if (Number(b.other_members) > 0 || Number(b.history) > 0 || Number(b.items) > 0) {
          await client.query('ROLLBACK');
          return { result: INVITE_RESULT.OWN_LIST_NOT_EMPTY };
        }

        // Untouched auto-created list — archive it so the shared one takes over.
        await client.query(
          `UPDATE grocery_lists SET archived_at = NOW() WHERE id = $1`,
          [ownList.list_id]
        );
        await client.query(
          `DELETE FROM grocery_list_members WHERE list_id = $1`,
          [ownList.list_id]
        );
      }

      await client.query(
        `INSERT INTO grocery_list_members (list_id, user_id, role)
         VALUES ($1, $2, 'member')
         ON CONFLICT (list_id, user_id) DO NOTHING`,
        [inv.list_id, user.id]
      );

      await client.query(
        `UPDATE grocery_list_invitations
            SET status = 'accepted', responded_at = NOW(), invitee_id = $2
          WHERE id = $1`,
        [inv.id, user.id]
      );

      await client.query(
        `UPDATE grocery_lists SET version = version + 1 WHERE id = $1`,
        [inv.list_id]
      );

      await client.query('COMMIT');
      return { result: INVITE_RESULT.OK, listId: inv.list_id, inviterId: inv.inviter_id };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  static async decline(token, user) {
    const { rows } = await db.query(
      `UPDATE grocery_list_invitations
          SET status = 'declined', responded_at = NOW(), invitee_id = COALESCE(invitee_id, $2)
        WHERE token = $1
          AND status = 'pending'
          AND (invitee_id = $2 OR (invitee_id IS NULL AND invitee_email = $3))
      RETURNING *`,
      [token, user.id, String(user.email || '').toLowerCase()]
    );
    return rows[0] || null;
  }

  /** Owner withdraws an invitation they sent. */
  static async cancel(listId, inviterId, email) {
    const { rows } = await db.query(
      `UPDATE grocery_list_invitations
          SET status = 'cancelled', responded_at = NOW()
        WHERE list_id = $1 AND inviter_id = $2
          AND invitee_email = $3 AND status = 'pending'
      RETURNING *`,
      [listId, inviterId, String(email || '').toLowerCase()]
    );
    return rows[0] || null;
  }

  /** Invitations this list has sent that are still awaiting an answer. */
  static async getPendingForList(listId) {
    const { rows } = await db.query(
      `SELECT id, invitee_email, invitee_id, created_at, expires_at, token
         FROM grocery_list_invitations
        WHERE list_id = $1 AND status = 'pending' AND expires_at > NOW()
        ORDER BY created_at DESC`,
      [listId]
    );
    return rows;
  }

  /**
   * Called once at registration: bind any invitation that was addressed to this
   * email before the account existed. Still pending — the new user must accept.
   */
  static async linkForNewUser(userId, email) {
    const { rowCount } = await db.query(
      `UPDATE grocery_list_invitations
          SET invitee_id = $1
        WHERE invitee_id IS NULL
          AND invitee_email = $2
          AND status = 'pending'
          AND expires_at > NOW()`,
      [userId, String(email || '').toLowerCase()]
    );
    return rowCount;
  }
}

module.exports = { GroceryInvitation, INVITE_RESULT };
