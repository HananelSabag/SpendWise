/**
 * Bank Sync Route
 * Receives scraped transactions from bank-scraper and inserts them into
 * the transactions table. Authenticated via X-API-Key (not JWT — this is a
 * machine-to-machine call from the scraper, not a browser session).
 *
 * POST /api/v1/bank-sync
 *
 * Payload shape (from sync.js buildPayload):
 *   {
 *     household_id: number,   // maps to user_id
 *     source:       string,   // "yahav", "isracard", "max", etc.
 *     accounts: [{
 *       account_number: string,
 *       type:           string,
 *       balance:        number,
 *       txns: [{
 *         date:           string (ISO),
 *         description:    string,
 *         charged_amount: number,  // negative = expense, positive = income
 *         identifier?:    string   // optional dedup key from the bank
 *       }]
 *     }]
 *   }
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const logger = require('../utils/logger');

// ── API-key auth ─────────────────────────────────────────────────────────────
// Separate from JWT: the scraper is a background service with no user session.
// The key must match BANK_SYNC_API_KEY in the server's .env.
function bankSyncAuth(req, res, next) {
  const incoming = req.headers['x-api-key'];
  const expected = process.env.BANK_SYNC_API_KEY;

  if (!expected) {
    logger.error('bank-sync: BANK_SYNC_API_KEY is not set — endpoint disabled');
    return res.status(503).json({ error: 'Bank sync not configured on server' });
  }
  if (!incoming || incoming !== expected) {
    logger.warn('bank-sync: rejected request with invalid API key', { ip: req.ip });
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ── POST /bank-sync ───────────────────────────────────────────────────────────
router.post('/', bankSyncAuth, async (req, res) => {
  const { household_id, source, accounts } = req.body;

  if (!household_id || !source || !Array.isArray(accounts)) {
    return res.status(400).json({ error: 'Invalid payload: household_id, source, accounts required' });
  }

  const userId = Number(household_id);
  if (!Number.isFinite(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Invalid household_id' });
  }

  const client = await db.getClient();
  let inserted = 0;
  let skipped = 0;

  try {
    await client.query('BEGIN');

    for (const account of accounts) {
      for (const txn of (account.txns || [])) {
        const chargedAmount = parseFloat(txn.charged_amount);

        // Skip zero or NaN amounts — not meaningful transactions.
        if (!Number.isFinite(chargedAmount) || chargedAmount === 0) {
          skipped++;
          continue;
        }

        const type = chargedAmount < 0 ? 'expense' : 'income';
        const amount = Math.abs(chargedAmount);
        const txnDate = txn.date ? new Date(txn.date) : new Date();
        const date = txnDate.toISOString().split('T')[0];
        const transactionDatetime = txnDate.toISOString();
        const description = (txn.description || '').trim().slice(0, 500);

        // bank_sync_id: "source:identifier" when the bank provides a reference
        // number; NULL otherwise (falls through to soft-dedup below).
        const bankSyncId = txn.identifier ? `${source}:${txn.identifier}` : null;

        if (bankSyncId) {
          // Hard dedup: the partial unique index on (user_id, bank_sync_id)
          // guarantees no duplicates. ON CONFLICT silently skips the row.
          const result = await client.query(
            `INSERT INTO transactions
               (user_id, amount, type, description, notes, date, transaction_datetime,
                bank_sync_id, bank_source, created_at, updated_at)
             VALUES ($1,$2,$3,$4,'',$5,$6,$7,$8,NOW(),NOW())
             ON CONFLICT (user_id, bank_sync_id)
               WHERE bank_sync_id IS NOT NULL
             DO NOTHING
             RETURNING id`,
            [userId, amount, type, description, date, transactionDatetime, bankSyncId, source],
          );
          result.rows.length > 0 ? inserted++ : skipped++;
        } else {
          // Soft dedup: match on (user_id, source, date, amount, description).
          // Not 100% reliable for banks that don't provide reference numbers,
          // but avoids the most common duplicates on re-runs.
          const existing = await client.query(
            `SELECT id FROM transactions
             WHERE user_id=$1 AND bank_source=$2 AND date=$3
               AND amount=$4 AND description=$5 AND deleted_at IS NULL
             LIMIT 1`,
            [userId, source, date, amount, description],
          );

          if (existing.rows.length > 0) {
            skipped++;
          } else {
            await client.query(
              `INSERT INTO transactions
                 (user_id, amount, type, description, notes, date, transaction_datetime,
                  bank_source, created_at, updated_at)
               VALUES ($1,$2,$3,$4,'',$5,$6,$7,NOW(),NOW())`,
              [userId, amount, type, description, date, transactionDatetime, source],
            );
            inserted++;
          }
        }
      }
    }

    await client.query('COMMIT');

    logger.info('bank-sync: completed', { userId, source, inserted, skipped });
    res.json({ ok: true, inserted, skipped });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('bank-sync: failed', { error: err.message, userId, source });
    res.status(500).json({ error: 'Bank sync failed' });
  } finally {
    client.release();
  }
});

module.exports = router;
