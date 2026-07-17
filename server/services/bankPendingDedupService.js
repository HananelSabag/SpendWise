/**
 * Retiring holds that already settled under a new identity.
 *
 * A provider re-reports a settled hold as a brand-new row. Where ingest failed to recognise the
 * predecessor, the ledger keeps both and the user's spending reads high. This finds those
 * leftovers and retires them reversibly (deleted_at, never a DELETE).
 *
 * Three shapes are recognised, and each needs different evidence:
 *   suffix re-key   — the bank keeps the old id inside the new one (45061616 → 61616).
 *   silent re-key   — the bank swaps the id outright (416173003 → 160717), sharing no suffix.
 *   card hold       — card providers publish NO identifier until a charge is final, so the stale
 *                     row has none at all and there is no id to compare.
 * For the latter two the proof is temporal: a sync ran, inserted the settled twin, and left the
 * pending row untouched. Ingest upserts every row the provider still reports, so an untouched
 * row is one the provider stopped reporting — it settled.
 *
 * Matching is deliberately stricter than ingest's ±3 days: the same merchant and amount on two
 * neighbouring days is a real pair of purchases, not a duplicate. Requiring the exact day (and
 * ranked 1:1 pairing) is what stops a genuine still-pending purchase from being retired as the
 * previous day's ghost.
 */

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
    settled.bank_sync_id AS settled_sync_id,
    CASE
      WHEN stale.bank_sync_id IS NULL THEN 'card_hold'
      WHEN RIGHT(stale.bank_sync_id, LENGTH(SUBSTRING(settled.bank_sync_id FROM '[^:]+$')))
           = SUBSTRING(settled.bank_sync_id FROM '[^:]+$') THEN 'suffix_rekey'
      ELSE 'silent_rekey'
    END AS evidence
  FROM transactions stale
  JOIN transactions settled
    ON settled.user_id = stale.user_id
   AND settled.bank_source = stale.bank_source
   AND settled.bank_account_number IS NOT DISTINCT FROM stale.bank_account_number
   AND settled.type = stale.type
   AND settled.amount = stale.amount
   AND LOWER(REGEXP_REPLACE(TRIM(settled.description), '\\s+', ' ', 'g'))
       = LOWER(REGEXP_REPLACE(TRIM(stale.description), '\\s+', ' ', 'g'))
   AND settled.date = stale.date
   AND settled.id > stale.id
  WHERE stale.deleted_at IS NULL
    AND settled.deleted_at IS NULL
    AND settled.bank_sync_id IS NOT NULL
    AND stale.bank_status = 'pending'
    AND settled.bank_status = 'completed'
    AND (stale.bank_sync_id IS NULL OR stale.bank_sync_id <> settled.bank_sync_id)
    AND (
      -- The bank kept the old id inside the new one.
      (stale.bank_sync_id IS NOT NULL
        AND RIGHT(stale.bank_sync_id, LENGTH(SUBSTRING(settled.bank_sync_id FROM '[^:]+$')))
            = SUBSTRING(settled.bank_sync_id FROM '[^:]+$'))
      -- Or the sync that inserted the twin left this row alone, so the provider had already
      -- stopped reporting it. Covers both an outright re-key and an identifier-less card hold.
      OR stale.updated_at < settled.created_at
    )
    -- One settled row may retire at most one hold: rank both sides and pair them off, so a
    -- second genuine purchase of the same amount never inherits the first one's twin.
    AND (
      SELECT COUNT(*) FROM transactions peer
      WHERE peer.user_id = stale.user_id AND peer.bank_source = stale.bank_source
        AND peer.bank_account_number IS NOT DISTINCT FROM stale.bank_account_number
        AND peer.type = stale.type AND peer.amount = stale.amount
        AND peer.date = stale.date AND peer.deleted_at IS NULL
        AND peer.bank_status = 'pending'
        AND LOWER(REGEXP_REPLACE(TRIM(peer.description), '\\s+', ' ', 'g'))
            = LOWER(REGEXP_REPLACE(TRIM(stale.description), '\\s+', ' ', 'g'))
        AND peer.id <= stale.id
    ) = (
      SELECT COUNT(*) FROM transactions peer
      WHERE peer.user_id = settled.user_id AND peer.bank_source = settled.bank_source
        AND peer.bank_account_number IS NOT DISTINCT FROM settled.bank_account_number
        AND peer.type = settled.type AND peer.amount = settled.amount
        AND peer.date = settled.date AND peer.deleted_at IS NULL
        AND peer.bank_status = 'completed'
        AND LOWER(REGEXP_REPLACE(TRIM(peer.description), '\\s+', ' ', 'g'))
            = LOWER(REGEXP_REPLACE(TRIM(settled.description), '\\s+', ' ', 'g'))
        AND peer.id <= settled.id
    )
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
        AND settled.date = stale.date
        AND settled.bank_sync_id IS NOT NULL
        AND stale.bank_status = 'pending'
        AND settled.bank_status = 'completed'
        AND (stale.bank_sync_id IS NULL OR stale.bank_sync_id <> settled.bank_sync_id)
        AND (
          (stale.bank_sync_id IS NOT NULL
            AND RIGHT(stale.bank_sync_id, LENGTH(SUBSTRING(settled.bank_sync_id FROM '[^:]+$')))
                = SUBSTRING(settled.bank_sync_id FROM '[^:]+$'))
          OR stale.updated_at < settled.created_at
        )
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
