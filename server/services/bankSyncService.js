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
const { institutionKind } = require('../config/institutions');

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

  // Which accounts has the user disabled? Their balance is still refreshed
  // (so they stay visible + toggleable in the UI), but their transactions
  // are skipped — this is how a user excludes e.g. a building-committee
  // side account without losing sight of it.
  const disabled = new Set();
  {
    const existing = await client.query(
      `SELECT account_number FROM bank_accounts
       WHERE user_id = $1 AND bank_source = $2 AND enabled = false`,
      [userId, source],
    );
    for (const r of existing.rows) disabled.add((r.account_number || '').trim());
  }

  for (const account of accounts) {
    // Scope the dedup id to the account too — a bank with multiple accounts
    // (e.g. Yahav main + side account) can reuse the same transaction
    // reference number across accounts; without the account in the key the
    // second account's transaction would be wrongly skipped as a duplicate.
    const acctKey = (account.account_number || 'default').toString().trim();

    // Skip transactions from user-disabled accounts (balance still upserted below).
    if (disabled.has(acctKey)) continue;

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
      // Source-provided category text (Max sends one; banks usually don't).
      // null when absent — we never guess a category at ingest time.
      const rawCategory = (txn.raw_category || '').toString().trim().slice(0, 200) || null;
      const bankSyncId = txn.identifier ? `${source}:${acctKey}:${txn.identifier}` : null;

      const acctNum = acctKey === 'default' ? null : acctKey;

      if (bankSyncId) {
        // Hard dedup via partial unique index on (user_id, bank_sync_id).
        const result = await client.query(
          `INSERT INTO transactions
             (user_id, amount, type, description, notes, date, transaction_datetime,
              raw_category, bank_sync_id, bank_source, bank_account_number, created_at, updated_at)
           VALUES ($1,$2,$3,$4,'',$5,$6,$7,$8,$9,$10,NOW(),NOW())
           ON CONFLICT (user_id, bank_sync_id)
             WHERE bank_sync_id IS NOT NULL
           DO NOTHING
           RETURNING id`,
          [userId, amount, type, description, date, transactionDatetime, rawCategory, bankSyncId, source, acctNum],
        );
        result.rows.length > 0 ? inserted++ : skipped++;
      } else {
        // Soft dedup: match on (user_id, source, account, date, amount, description).
        const existing = await client.query(
          `SELECT id FROM transactions
           WHERE user_id=$1 AND bank_source=$2 AND date=$3
             AND amount=$4 AND description=$5 AND deleted_at IS NULL
             AND bank_account_number IS NOT DISTINCT FROM $6
           LIMIT 1`,
          [userId, source, date, amount, description, acctNum],
        );
        if (existing.rows.length > 0) {
          skipped++;
        } else {
          await client.query(
            `INSERT INTO transactions
               (user_id, amount, type, description, notes, date, transaction_datetime,
                raw_category, bank_source, bank_account_number, created_at, updated_at)
             VALUES ($1,$2,$3,$4,'',$5,$6,$7,$8,$9,NOW(),NOW())`,
            [userId, amount, type, description, date, transactionDatetime, rawCategory, source, acctNum],
          );
          inserted++;
        }
      }
    }
  }

  // Upsert every discovered account (even with a null balance) so it stays
  // visible and toggleable in the UI. balance = real money in the account
  // (distinct from SpendWise's calculated net). The `enabled` flag is never
  // overwritten here — only the user changes it.
  //
  // A credit company (isracard/max/cal) has NO bank balance — only a real bank
  // account does. Even if the scraper reports a figure for a card source, we
  // never store it as a balance, so it can't leak into the dashboard's total.
  const isCreditCompany = institutionKind(source) === 'credit_card';
  for (const account of accounts) {
    const balance = (!isCreditCompany && typeof account.balance === 'number' && Number.isFinite(account.balance))
      ? account.balance
      : null;
    await client.query(
      `INSERT INTO bank_accounts
         (user_id, bank_source, account_number, account_type, balance, last_synced_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, bank_source, account_number)
       DO UPDATE SET
         balance        = COALESCE(EXCLUDED.balance, bank_accounts.balance),
         account_type   = COALESCE(EXCLUDED.account_type, bank_accounts.account_type),
         last_synced_at = NOW()`,
      [userId, source, account.account_number || '', account.type || null, balance],
    );
  }

  logger.info('bank-sync: ingested', { userId, source, inserted, skipped });
  return { inserted, skipped };
}

module.exports = { ingestAccounts, MAX_TXNS };
