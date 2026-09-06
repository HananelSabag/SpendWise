/**
 * FamilyBudget — data access for the household's manual picture.
 *
 * Two tables, two meanings of "amount" (see migration 43):
 *   family_monthly_items → ₪ per month  (income, fixed, variable, loan, savings)
 *   family_balances      → ₪ right now  (savings, pension, study fund, …)
 *
 * Conventions worth keeping:
 *   * DATE columns are selected as `::text`. node-postgres turns a bare DATE into
 *     a JS Date at local midnight, which has already shifted a day in this
 *     codebase once. A plain 'YYYY-MM-DD' string cannot drift.
 *   * NUMERIC columns are cast to float8 so the API emits numbers, not strings —
 *     these are four- and five-figure planning amounts, nowhere near the
 *     precision limit, and every consumer wants to add them up.
 *   * Rows carry no per-user scoping on purpose: the household shares one
 *     dataset and access is decided once, in `middleware/familyAccess.js`.
 */

const db = require('../config/db');
const { memberIds, memberEmails } = require('../config/familyAccess');

const ITEM_COLUMNS = `
  id, kind, name,
  amount::float8              AS amount,
  owner_user_id, category_key, charge_day, is_active, notes, sort_order,
  lender,
  outstanding_amount::float8  AS outstanding_amount,
  payments_left,
  end_date::text              AS end_date,
  created_by, updated_by, created_at, updated_at
`;

const BALANCE_COLUMNS = `
  id, kind, name, institution, owner_user_id,
  amount::float8               AS amount,
  monthly_contribution::float8 AS monthly_contribution,
  as_of::text                  AS as_of,
  is_active, notes, sort_order,
  created_by, updated_by, created_at, updated_at
`;

/** Fields a client may set on a monthly item. Anything else in the body is ignored. */
const ITEM_FIELDS = [
  'kind', 'name', 'amount', 'owner_user_id', 'category_key', 'charge_day',
  'is_active', 'notes', 'sort_order',
  'lender', 'outstanding_amount', 'payments_left', 'end_date',
];

/** Fields a client may set on a balance. */
const BALANCE_FIELDS = [
  'kind', 'name', 'institution', 'owner_user_id', 'amount',
  'monthly_contribution', 'as_of', 'is_active', 'notes', 'sort_order',
];

/**
 * Build an INSERT/UPDATE from a validated field bag.
 * Returns null when an update carries nothing to change.
 */
const buildInsert = (table, columns, fields, actorId) => {
  const keys = Object.keys(fields);
  const values = keys.map((k) => fields[k]);
  values.push(actorId, actorId);
  const placeholders = keys.map((_, i) => `$${i + 1}`);
  return {
    text: `INSERT INTO ${table} (${keys.join(', ')}, created_by, updated_by)
           VALUES (${placeholders.join(', ')}, $${keys.length + 1}, $${keys.length + 2})
           RETURNING ${columns}`,
    values,
  };
};

const buildUpdate = (table, columns, fields, id, actorId) => {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const assignments = keys.map((k, i) => `${k} = $${i + 1}`);
  const values = keys.map((k) => fields[k]);
  values.push(actorId, id);
  return {
    text: `UPDATE ${table}
              SET ${assignments.join(', ')}, updated_by = $${keys.length + 1}
            WHERE id = $${keys.length + 2}
        RETURNING ${columns}`,
    values,
  };
};

class FamilyBudget {
  /**
   * The people the UI labels rows with. Resolved from the allowlist rather than
   * from the data, so a household member with nothing entered yet still appears
   * in the "whose is this?" picker.
   */
  static async members(client = db) {
    const { rows } = await client.query(
      `SELECT id, email, username, first_name, last_name, avatar, profile_picture_url
         FROM users
        WHERE id = ANY($1::int[]) OR LOWER(email) = ANY($2::text[])
        ORDER BY id`,
      [memberIds(), memberEmails()]
    );
    // Name and avatar only — the page labels rows with a first name, and an
    // address would be personal data crossing the wire for no reason.
    return rows.map((row) => ({
      id: row.id,
      name: row.first_name || row.username || `#${row.id}`,
      avatar: row.profile_picture_url || row.avatar || null,
    }));
  }

  // ── Monthly items ─────────────────────────────────────────────────────────

  static async listItems(client = db) {
    const { rows } = await client.query(
      `SELECT ${ITEM_COLUMNS}
         FROM family_monthly_items
        ORDER BY kind, sort_order, id`
    );
    return rows;
  }

  static async getItem(id, client = db) {
    const { rows } = await client.query(
      `SELECT ${ITEM_COLUMNS} FROM family_monthly_items WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  static async createItem(fields, actorId, client = db) {
    const { text, values } = buildInsert('family_monthly_items', ITEM_COLUMNS, fields, actorId);
    const { rows } = await client.query(text, values);
    return rows[0];
  }

  static async updateItem(id, fields, actorId, client = db) {
    const built = buildUpdate('family_monthly_items', ITEM_COLUMNS, fields, id, actorId);
    if (!built) return FamilyBudget.getItem(id, client);
    const { rows } = await client.query(built.text, built.values);
    return rows[0] || null;
  }

  static async deleteItem(id, client = db) {
    const { rowCount } = await client.query(
      'DELETE FROM family_monthly_items WHERE id = $1',
      [id]
    );
    return rowCount > 0;
  }

  // ── Balances ──────────────────────────────────────────────────────────────

  static async listBalances(client = db) {
    const { rows } = await client.query(
      `SELECT ${BALANCE_COLUMNS}
         FROM family_balances
        ORDER BY kind, sort_order, id`
    );
    return rows;
  }

  static async getBalance(id, client = db) {
    const { rows } = await client.query(
      `SELECT ${BALANCE_COLUMNS} FROM family_balances WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  static async createBalance(fields, actorId, client = db) {
    const { text, values } = buildInsert('family_balances', BALANCE_COLUMNS, fields, actorId);
    const { rows } = await client.query(text, values);
    return rows[0];
  }

  static async updateBalance(id, fields, actorId, client = db) {
    const built = buildUpdate('family_balances', BALANCE_COLUMNS, fields, id, actorId);
    if (!built) return FamilyBudget.getBalance(id, client);
    const { rows } = await client.query(built.text, built.values);
    return rows[0] || null;
  }

  static async deleteBalance(id, client = db) {
    const { rowCount } = await client.query(
      'DELETE FROM family_balances WHERE id = $1',
      [id]
    );
    return rowCount > 0;
  }
}

module.exports = { FamilyBudget, ITEM_FIELDS, BALANCE_FIELDS };
