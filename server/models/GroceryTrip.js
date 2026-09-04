/**
 * GroceryTrip model — the active shopping trip, its items, and the archive.
 *
 * The single `status = 'active'` trip per list *is* the current shopping list.
 * Completing it stamps the total/store/receipt, flips it to 'completed', and
 * opens a fresh empty trip — so history is durable and the list starts clean
 * without ever deleting a purchased item.
 */

const db = require('../config/db');
const { GroceryList } = require('./GroceryList');
const { DEFAULT_CATEGORY } = require('../services/groceryCategories');

const ITEM_COLUMNS = `
  i.id, i.trip_id, i.name, i.category_key, i.quantity, i.unit, i.note,
  i.image_url, i.product_url, i.sort_order, i.is_purchased,
  i.added_by, i.purchased_by, i.purchased_at, i.version,
  i.created_at, i.updated_at,
  CASE WHEN i.editing_until > NOW() THEN i.editing_user_id END AS editing_user_id
`;

/**
 * How long an edit claim survives without being refreshed.
 *
 * Only long enough to cover someone actually typing in the sheet — a stale
 * claim from a closed tab must not keep the item hostage.
 */
const EDIT_CLAIM_SECONDS = 90;

class GroceryTrip {
  /** The list's active trip, creating one if the previous was just completed. */
  static async getActive(listId, client = db) {
    const { rows } = await client.query(
      `SELECT * FROM grocery_trips WHERE list_id = $1 AND status = 'active'`,
      [listId]
    );
    if (rows[0]) return rows[0];

    const { rows: created } = await client.query(
      `INSERT INTO grocery_trips (list_id, status) VALUES ($1, 'active')
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [listId]
    );
    if (created[0]) return created[0];

    // Lost the race — another request created it a moment ago.
    const { rows: retry } = await client.query(
      `SELECT * FROM grocery_trips WHERE list_id = $1 AND status = 'active'`,
      [listId]
    );
    return retry[0];
  }

  /**
   * Items of a trip, already in aisle order then insertion order. Sorting in SQL
   * keeps the client from having to know the aisle sequence twice.
   */
  static async getItems(tripId) {
    const { rows } = await db.query(
      `SELECT ${ITEM_COLUMNS},
              adder.first_name     AS added_by_first_name,
              adder.username       AS added_by_username,
              buyer.first_name     AS purchased_by_first_name,
              buyer.username       AS purchased_by_username,
              CASE WHEN i.editing_until > NOW()
                   THEN COALESCE(editor.first_name, editor.username) END AS editing_by_name
         FROM grocery_items i
    LEFT JOIN users adder  ON adder.id  = i.added_by
    LEFT JOIN users buyer  ON buyer.id  = i.purchased_by
    LEFT JOIN users editor ON editor.id = i.editing_user_id
        WHERE i.trip_id = $1
        ORDER BY i.sort_order ASC, i.id ASC`,
      [tripId]
    );
    return rows;
  }

  /**
   * Claim an item for editing.
   *
   * Advisory only — `version` is what actually prevents a lost update. This
   * just stops two people typing into the same item at once, and it is scoped
   * to ONE item rather than the whole list, because adding or checking off
   * different items cannot collide.
   *
   * Atomic: succeeds when the item is unclaimed, the claim lapsed, or it is
   * already yours. Returns null when someone else holds it.
   */
  static async claimItem(itemId, userId) {
    const { rows } = await db.query(
      `UPDATE grocery_items
          SET editing_user_id = $2,
              editing_until   = NOW() + ($3 || ' seconds')::interval
        WHERE id = $1
          AND (editing_user_id IS NULL
               OR editing_user_id = $2
               OR editing_until <= NOW())
      RETURNING id, editing_until`,
      [itemId, userId, String(EDIT_CLAIM_SECONDS)]
    );
    return rows[0] || null;
  }

  /** Who is editing this item right now, if anyone. */
  static async getItemClaim(itemId) {
    const { rows } = await db.query(
      `SELECT i.editing_user_id,
              COALESCE(u.first_name, u.username) AS editing_by_name
         FROM grocery_items i
    LEFT JOIN users u ON u.id = i.editing_user_id
        WHERE i.id = $1 AND i.editing_until > NOW()`,
      [itemId]
    );
    return rows[0] || null;
  }

  /** Give the item back. Idempotent — releasing one you don't hold is a no-op. */
  static async releaseItem(itemId, userId) {
    await db.query(
      `UPDATE grocery_items
          SET editing_user_id = NULL, editing_until = NULL
        WHERE id = $1 AND editing_user_id = $2`,
      [itemId, userId]
    );
  }

  static async getItemById(itemId) {
    const { rows } = await db.query(
      `SELECT i.*, t.list_id, t.status AS trip_status
         FROM grocery_items i
         JOIN grocery_trips t ON t.id = i.trip_id
        WHERE i.id = $1`,
      [itemId]
    );
    return rows[0] || null;
  }

  /**
   * Append an item. `sort_order` is the running max so items keep a stable
   * position inside their category regardless of when they were added.
   */
  static async addItem(tripId, listId, userId, data) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO grocery_items
           (trip_id, name, category_key, quantity, unit, note,
            image_url, product_url, added_by, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
                 COALESCE((SELECT MAX(sort_order) + 1 FROM grocery_items WHERE trip_id = $1), 0))
         RETURNING *`,
        [
          tripId,
          data.name.trim(),
          data.category_key || DEFAULT_CATEGORY,
          data.quantity ?? null,
          data.unit || null,
          data.note || null,
          data.image_url || null,
          data.product_url || null,
          userId,
        ]
      );

      const version = await GroceryList.bumpVersion(client, listId);
      await client.query('COMMIT');
      return { item: rows[0], version };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Patch an item. Only keys present in `fields` are touched, so a partial edit
   * from one participant never clobbers another's field. `expectedVersion`, when
   * supplied, makes the write fail rather than overwrite a newer row.
   */
  static async updateItem(itemId, listId, fields, expectedVersion = null) {
    const assignments = [];
    const values = [itemId];

    const push = (column, value) => {
      values.push(value);
      assignments.push(`${column} = $${values.length}`);
    };

    if (fields.name !== undefined)         push('name', fields.name.trim());
    if (fields.category_key !== undefined) push('category_key', fields.category_key);
    if (fields.quantity !== undefined)     push('quantity', fields.quantity);
    if (fields.unit !== undefined)         push('unit', fields.unit);
    if (fields.note !== undefined)         push('note', fields.note);
    if (fields.image_url !== undefined)    push('image_url', fields.image_url);
    if (fields.product_url !== undefined)  push('product_url', fields.product_url);
    if (fields.sort_order !== undefined)   push('sort_order', fields.sort_order);

    if (assignments.length === 0) return { item: null, conflict: false };

    assignments.push('version = version + 1');
    // Saving ends the edit session; no separate release round-trip.
    assignments.push('editing_user_id = NULL', 'editing_until = NULL');

    let versionGuard = '';
    if (expectedVersion !== null) {
      values.push(expectedVersion);
      versionGuard = ` AND version = $${values.length}`;
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `UPDATE grocery_items SET ${assignments.join(', ')}
          WHERE id = $1${versionGuard}
          RETURNING *`,
        values
      );

      if (!rows[0]) {
        await client.query('ROLLBACK');
        return { item: null, conflict: expectedVersion !== null };
      }

      const version = await GroceryList.bumpVersion(client, listId);
      await client.query('COMMIT');
      return { item: rows[0], version, conflict: false };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Flip the purchased flag. Purchaser and timestamp are server-set — a client
   * may not claim who bought what or when.
   */
  static async setPurchased(itemId, listId, userId, purchased) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `UPDATE grocery_items
            SET is_purchased = $2,
                purchased_by = CASE WHEN $2 THEN $3::int ELSE NULL END,
                purchased_at = CASE WHEN $2 THEN NOW() ELSE NULL END,
                version      = version + 1
          WHERE id = $1
          RETURNING *`,
        [itemId, purchased, userId]
      );

      if (!rows[0]) {
        await client.query('ROLLBACK');
        return { item: null };
      }

      const version = await GroceryList.bumpVersion(client, listId);
      await client.query('COMMIT');
      return { item: rows[0], version };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  static async deleteItem(itemId, listId) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const { rowCount } = await client.query(
        `DELETE FROM grocery_items WHERE id = $1`,
        [itemId]
      );
      if (rowCount === 0) {
        await client.query('ROLLBACK');
        return { deleted: false };
      }
      const version = await GroceryList.bumpVersion(client, listId);
      await client.query('COMMIT');
      return { deleted: true, version };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Archive the active trip and open a fresh one, atomically.
   *
   * Unpurchased leftovers do not vanish: they are carried into the new trip so a
   * forgotten item is still on the list next time. Purchased items stay with the
   * completed trip forever.
   */
  static async complete(listId, tripId, userId, { storeName, totalIls, receiptPath, receiptMime }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const { rows: completed } = await client.query(
        `UPDATE grocery_trips
            SET status = 'completed',
                completed_by = $3,
                completed_at = NOW(),
                store_name = $4,
                total_ils = $5,
                receipt_path = COALESCE($6, receipt_path),
                receipt_mime = COALESCE($7, receipt_mime)
          WHERE id = $2 AND list_id = $1 AND status = 'active'
          RETURNING *`,
        [listId, tripId, userId, storeName || null, totalIls ?? null, receiptPath || null, receiptMime || null]
      );

      if (!completed[0]) {
        await client.query('ROLLBACK');
        return { trip: null };
      }

      const { rows: fresh } = await client.query(
        `INSERT INTO grocery_trips (list_id, status) VALUES ($1, 'active') RETURNING *`,
        [listId]
      );

      // Carry unpurchased leftovers forward, keeping their aisle position.
      const { rowCount: carried } = await client.query(
        `UPDATE grocery_items SET trip_id = $2
          WHERE trip_id = $1 AND is_purchased = false`,
        [tripId, fresh[0].id]
      );

      const version = await GroceryList.bumpVersion(client, listId);
      await client.query('COMMIT');
      return { trip: completed[0], nextTrip: fresh[0], carriedOver: carried, version };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  /** Completed trips, newest first, with a per-trip item count and participants. */
  static async getHistory(listId, { limit = 20, offset = 0 } = {}) {
    const { rows } = await db.query(
      `SELECT t.id, t.store_name, t.total_ils, t.completed_at, t.transaction_id,
              (t.receipt_path IS NOT NULL) AS has_receipt,
              t.completed_by,
              completer.first_name AS completed_by_first_name,
              completer.username   AS completed_by_username,
              COUNT(i.id)::int     AS item_count
         FROM grocery_trips t
    LEFT JOIN grocery_items i ON i.trip_id = t.id
    LEFT JOIN users completer ON completer.id = t.completed_by
        WHERE t.list_id = $1 AND t.status = 'completed'
        GROUP BY t.id, completer.first_name, completer.username
        ORDER BY t.completed_at DESC
        LIMIT $2 OFFSET $3`,
      [listId, limit, offset]
    );
    return rows;
  }

  static async getHistoryCount(listId) {
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS count FROM grocery_trips
        WHERE list_id = $1 AND status = 'completed'`,
      [listId]
    );
    return rows[0].count;
  }

  static async getTrip(tripId, listId) {
    const { rows } = await db.query(
      `SELECT * FROM grocery_trips WHERE id = $1 AND list_id = $2`,
      [tripId, listId]
    );
    return rows[0] || null;
  }

  /**
   * Attach a manual SpendWise expense to a completed trip. The partial unique
   * index on `transaction_id` plus the `IS NULL` guard make this idempotent:
   * a double tap can never produce two expenses.
   */
  static async linkTransaction(tripId, listId, transactionId) {
    const { rows } = await db.query(
      `UPDATE grocery_trips
          SET transaction_id = $3
        WHERE id = $1 AND list_id = $2
          AND status = 'completed'
          AND transaction_id IS NULL
        RETURNING *`,
      [tripId, listId, transactionId]
    );
    return rows[0] || null;
  }
}

module.exports = { GroceryTrip, EDIT_CLAIM_SECONDS };
