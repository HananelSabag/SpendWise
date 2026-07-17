const db = require('../config/db');
const { normalizeDescription } = require('./financialClassificationService');

const CONDITIONS = new Set(['all', 'above', 'exact']);

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function parseAmount(value, condition) {
  if (condition === 'all') return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
    throw badRequest('amount must be between 0 and 100,000,000');
  }
  return Math.round((Math.abs(amount) + Number.EPSILON) * 100) / 100;
}

async function createWatch(userId, input = {}) {
  const transactionId = Number(input.transactionId);
  const condition = String(input.condition || 'all').toLowerCase();
  if (!Number.isInteger(transactionId) || transactionId <= 0) throw badRequest('valid transactionId is required');
  if (!CONDITIONS.has(condition)) throw badRequest('condition must be all, above or exact');

  const transactionResult = await db.query(
    `SELECT id, description, amount
       FROM transactions
      WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL
      LIMIT 1`,
    [transactionId, userId],
  );
  const transaction = transactionResult.rows[0];
  if (!transaction) {
    const error = new Error('transaction not found');
    error.statusCode = 404;
    throw error;
  }

  const displayMerchant = String(transaction.description || '').trim().slice(0, 240);
  const normalizedMerchant = normalizeDescription(displayMerchant);
  if (!normalizedMerchant) throw badRequest('transaction has no merchant description');
  const amount = parseAmount(input.amount ?? transaction.amount, condition);

  const result = await db.query(
    `INSERT INTO merchant_watch_rules (
       user_id, display_merchant, normalized_merchant, condition, amount,
       created_from_transaction_id
     ) VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (
       user_id, normalized_merchant, condition, COALESCE(amount, -1)
     ) WHERE active = true
     DO UPDATE SET
       display_merchant=EXCLUDED.display_merchant,
       created_from_transaction_id=EXCLUDED.created_from_transaction_id,
       updated_at=NOW()
     RETURNING id, display_merchant, condition, amount, created_at`,
    [userId, displayMerchant, normalizedMerchant, condition, amount, transactionId],
  );
  return result.rows[0];
}

async function removeWatch(userId, ruleId) {
  const id = Number(ruleId);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('valid rule id is required');
  const result = await db.query(
    `UPDATE merchant_watch_rules
        SET active=false, updated_at=NOW()
      WHERE id=$1 AND user_id=$2 AND active=true
      RETURNING id`,
    [id, userId],
  );
  if (!result.rows[0]) {
    const error = new Error('watch rule not found');
    error.statusCode = 404;
    throw error;
  }
  return { id };
}

async function getWatched(userId) {
  const [rulesResult, matchesResult] = await Promise.all([
    db.query(
      `SELECT r.id, r.display_merchant, r.normalized_merchant, r.condition, r.amount, r.created_at,
         COUNT(t.id)::int AS match_count,
         COALESCE(SUM(ABS(t.amount)), 0)::numeric AS matched_total,
         MAX(COALESCE(t.transaction_datetime, t.date::timestamp)) AS latest_match_at
       FROM merchant_watch_rules r
       LEFT JOIN transactions t
         ON t.user_id=r.user_id
        AND t.deleted_at IS NULL
        AND LOWER(REGEXP_REPLACE(TRIM(COALESCE(t.description, '')), '\\s+', ' ', 'g'))=r.normalized_merchant
        AND (
          r.condition='all'
          OR (r.condition='above' AND ABS(t.amount) > r.amount)
          OR (r.condition='exact' AND ABS(ABS(t.amount) - r.amount) < 0.01)
        )
       WHERE r.user_id=$1 AND r.active=true
       GROUP BY r.id
       ORDER BY latest_match_at DESC NULLS LAST, r.created_at DESC`,
      [userId],
    ),
    db.query(
      `SELECT t.id, t.amount, t.type, t.description, t.date,
         t.transaction_datetime, t.bank_source, t.bank_account_number,
         t.raw_category, r.id AS rule_id, r.display_merchant,
         r.condition, r.amount AS rule_amount
       FROM merchant_watch_rules r
       JOIN transactions t
         ON t.user_id=r.user_id
        AND t.deleted_at IS NULL
        AND LOWER(REGEXP_REPLACE(TRIM(COALESCE(t.description, '')), '\\s+', ' ', 'g'))=r.normalized_merchant
        AND (
          r.condition='all'
          OR (r.condition='above' AND ABS(t.amount) > r.amount)
          OR (r.condition='exact' AND ABS(ABS(t.amount) - r.amount) < 0.01)
        )
       WHERE r.user_id=$1 AND r.active=true
       ORDER BY COALESCE(t.transaction_datetime, t.date::timestamp) DESC, t.id DESC
       LIMIT 100`,
      [userId],
    ),
  ]);
  return { rules: rulesResult.rows, matches: matchesResult.rows };
}

module.exports = { createWatch, removeWatch, getWatched, parseAmount };
