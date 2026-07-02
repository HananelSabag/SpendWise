/**
 * Bank Sync Service
 * Shared transaction-ingestion logic used by both:
 *   - routes/bankSyncRoutes.js  (legacy: direct scraper POST with X-API-Key)
 *   - routes/bankAgentRoutes.js (new: job-queue agent reporting results)
 *
 * Handles dedup (hard via bank_sync_id unique index, soft via field match)
 * and upserts real bank account balances into bank_accounts.
 */

const logger = require('../utils/logger');

const MAX_TXNS = 2000;
const MAX_AMOUNT = 10_000_000;

/**
 * Ingest scraped accounts for a user inside an existing DB transaction.
 *
 * @param {object} client - pg client with an open transaction (BEGIN already called)
 * @param {number} userId
 * @param {string} source - bank source id (yahav/isracard/max/discount)
 * @param {Array}  accounts - [{ account_number, type, balance, txns: [...] }]
 * @returns {{ inserted: number, skipped: number }}
 */
async function ingestAccounts(client, userId, source, accounts) {
  let inserted = 0;
  let skipped = 0;

  const totalTxns = accounts.reduce(
    (sum, a) => sum + (Array.isArray(a.txns) ? a.txns.length : 0), 0
  );
  if (totalTxns > MAX_TXNS) {
    throw new Error(`Payload exceeds ${MAX_TXNS} transaction limit`);
  }

  for (const account of accounts) {
    for (const txn of (account.txns || [])) {
      const chargedAmount = parseFloat(txn.charged_amount);

      // Skip zero, NaN, or unrealistically large amounts.
      if (!Number.isFinite(chargedAmount) || chargedAmount === 0) { skipped++; continue; }
      if (Math.abs(chargedAmount) > MAX_AMOUNT) { skipped++; continue; }

      const type = chargedAmount < 0 ? 'expense' : 'income';
      const amount = Math.abs(chargedAmount);
      const txnDate = txn.date ? new Date(txn.date) : new Date();
      const date = txnDate.toISOString().split('T')[0];
      const transactionDatetime = txnDate.toISOString();
      const description = (txn.description || '').trim().slice(0, 500);
      const bankSyncId = txn.identifier ? `${source}:${txn.identifier}` : null;

      if (bankSyncId) {
        // Hard dedup via partial unique index on (user_id, bank_sync_id).
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

  // Upsert real bank account balances (actual money in the account —
  // distinct from SpendWise's calculated net of transactions).
  for (const account of accounts) {
    if (account.balance !== null && account.balance !== undefined && typeof account.balance === 'number') {
      await client.query(
        `INSERT INTO bank_accounts
           (user_id, bank_source, account_number, account_type, balance, last_synced_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (user_id, bank_source, account_number)
         DO UPDATE SET
           balance        = EXCLUDED.balance,
           account_type   = EXCLUDED.account_type,
           last_synced_at = NOW()`,
        [userId, source, account.account_number || '', account.type || null, account.balance],
      );
    }
  }

  logger.info('bank-sync: ingested', { userId, source, inserted, skipped });
  return { inserted, skipped };
}

module.exports = { ingestAccounts, MAX_TXNS };
