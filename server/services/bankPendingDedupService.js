const db = require('../config/db');

const CANDIDATE_SQL = `
  SELECT
    stale.id AS stale_id,
    settled.id AS settled_id,
    stale.user_id,
    stale.bank_source,
    stale.bank_account_number,
    stale.amount,
    stale.description,
    stale.date AS stale_date,
    settled.date AS settled_date,
    stale.bank_status AS stale_status,
    settled.bank_status AS settled_status,
    stale.bank_sync_id AS stale_sync_id,
    settled.bank_sync_id AS settled_sync_id
  FROM transactions stale
  JOIN transactions settled
    ON settled.user_id = stale.user_id
   AND settled.bank_source = stale.bank_source
   AND settled.bank_account_number IS NOT DISTINCT FROM stale.bank_account_number
   AND settled.type = stale.type
   AND settled.amount = stale.amount
   AND LOWER(REGEXP_REPLACE(TRIM(settled.description), '\\s+', ' ', 'g'))
       = LOWER(REGEXP_REPLACE(TRIM(stale.description), '\\s+', ' ', 'g'))
   AND ABS(settled.date - stale.date) <= 3
   AND settled.id > stale.id
  WHERE stale.deleted_at IS NULL
    AND settled.deleted_at IS NULL
    AND stale.bank_sync_id IS NOT NULL
    AND settled.bank_sync_id IS NOT NULL
    AND stale.bank_sync_id <> settled.bank_sync_id
    AND (stale.bank_status IS NULL OR stale.bank_status = 'pending')
    AND settled.bank_status = 'completed'
    AND RIGHT(
      stale.bank_sync_id,
      LENGTH(SUBSTRING(settled.bank_sync_id FROM '[^:]+$'))
    ) = SUBSTRING(settled.bank_sync_id FROM '[^:]+$')
    AND ($1::int IS NULL OR stale.user_id = $1)
  ORDER BY stale.user_id, stale.id
`;

const RETIRE_SQL = `
  UPDATE transactions stale
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE stale.id = $1
    AND stale.deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM transactions settled
      WHERE settled.id = $2
        AND settled.deleted_at IS NULL
        AND settled.user_id = stale.user_id
        AND settled.bank_source = stale.bank_source
        AND settled.bank_account_number IS NOT DISTINCT FROM stale.bank_account_number
        AND settled.type = stale.type
        AND settled.amount = stale.amount
        AND LOWER(REGEXP_REPLACE(TRIM(settled.description), '\\s+', ' ', 'g'))
            = LOWER(REGEXP_REPLACE(TRIM(stale.description), '\\s+', ' ', 'g'))
        AND ABS(settled.date - stale.date) <= 3
        AND stale.bank_sync_id IS NOT NULL
        AND settled.bank_sync_id IS NOT NULL
        AND stale.bank_sync_id <> settled.bank_sync_id
        AND (stale.bank_status IS NULL OR stale.bank_status = 'pending')
        AND settled.bank_status = 'completed'
        AND RIGHT(
          stale.bank_sync_id,
          LENGTH(SUBSTRING(settled.bank_sync_id FROM '[^:]+$'))
        ) = SUBSTRING(settled.bank_sync_id FROM '[^:]+$')
    )
  RETURNING stale.id AS retired_id
`;

async function previewPendingSettledDuplicates(userId = null, queryable = db) {
  const result = await queryable.query(CANDIDATE_SQL, [userId]);
  return result.rows;
}

async function retirePendingSettledDuplicate(staleId, settledId, queryable) {
  if (!Number.isInteger(staleId) || !Number.isInteger(settledId)) {
    throw new TypeError('stale and settled ids must be integers');
  }
  const result = await queryable.query(RETIRE_SQL, [staleId, settledId]);
  if (result.rows.length !== 1) {
    throw new Error(`candidate ${staleId} -> ${settledId} no longer matches; nothing retired`);
  }
  return result.rows[0];
}

module.exports = {
  CANDIDATE_SQL,
  RETIRE_SQL,
  previewPendingSettledDuplicates,
  retirePendingSettledDuplicate,
};
