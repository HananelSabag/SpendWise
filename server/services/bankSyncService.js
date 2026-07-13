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

const PENDING_REKEY_CANDIDATE_SQL = `/* pending-to-settled rekey candidate */
  SELECT id
  FROM transactions stale
  WHERE stale.user_id = $1
    AND stale.bank_source = $2
    AND stale.bank_account_number IS NOT DISTINCT FROM $3
    AND stale.amount = $4
    AND stale.type = $5
    AND LOWER(REGEXP_REPLACE(TRIM(stale.description), '\\s+', ' ', 'g'))
        = LOWER(REGEXP_REPLACE(TRIM($6), '\\s+', ' ', 'g'))
    AND ABS(stale.date - $7::date) <= 3
    AND stale.deleted_at IS NULL
    AND stale.bank_sync_id IS NOT NULL
    AND stale.bank_sync_id <> $8
    AND (stale.bank_status IS NULL OR stale.bank_status = 'pending')
    AND RIGHT(stale.bank_sync_id, LENGTH($9)) = $9
    AND NOT EXISTS (
      SELECT 1 FROM transactions current
      WHERE current.user_id = $1 AND current.bank_sync_id = $8
    )
  ORDER BY stale.id
  LIMIT 2
  FOR UPDATE OF stale`;

const CARD_PENDING_REKEY_CANDIDATE_SQL = `/* card pending-to-settled rekey candidate */
  SELECT id
  FROM transactions stale
  WHERE stale.user_id = $1
    AND stale.bank_source = $2
    AND stale.bank_account_number IS NOT DISTINCT FROM $3
    AND stale.amount = $4
    AND stale.type = $5
    AND LOWER(REGEXP_REPLACE(TRIM(stale.description), '\\s+', ' ', 'g'))
        = LOWER(REGEXP_REPLACE(TRIM($6), '\\s+', ' ', 'g'))
    AND ABS(stale.date - $7::date) <= 3
    AND stale.deleted_at IS NULL
    AND stale.bank_status = 'pending'
    AND stale.bank_sync_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM transactions current
      WHERE current.user_id = $1 AND current.bank_sync_id = $8
    )
  ORDER BY ABS(stale.date - $7::date), stale.id
  LIMIT 2
  FOR UPDATE OF stale`;

// The calendar date a transaction belongs to, in the app's timezone.
// toISOString() would use UTC — an Israeli 00:30 purchase would land on the
// previous day, shifting day grouping and financial-period boundaries.
const INGEST_TZ = process.env.PERIOD_TIMEZONE || process.env.SYNC_TIMEZONE || 'Asia/Jerusalem';
function calendarDateInTz(d) {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: INGEST_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

function normalizeProcessedDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : calendarDateInTz(date);
}

function normalizeBankStatus(value) {
  return value === 'pending' || value === 'completed' ? value : null;
}

function normalizeOptionalAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || Math.abs(amount) > MAX_AMOUNT) return null;
  return Math.abs(amount);
}

function normalizeCurrency(value) {
  const currency = String(value ?? '').trim().toUpperCase();
  if (!currency) return null;
  if (currency === '₪' || currency === 'NIS') return 'ILS';
  return currency.slice(0, 12);
}

function normalizePositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 && number <= 32767 ? number : null;
}

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
  const isCreditCompany = institutionKind(source) === 'credit_card';

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
      const date = calendarDateInTz(txnDate);
      const transactionDatetime = txnDate.toISOString();
      const description = (txn.description || '').trim().slice(0, 500);
      const bankNotes = (txn.notes || '').toString().trim().slice(0, 2000);
      // Source-provided category text (Max sends one; banks usually don't).
      // null when absent — we never guess a category at ingest time.
      const rawCategory = (txn.raw_category || '').toString().trim().slice(0, 200) || null;
      const bankProcessedDate = normalizeProcessedDate(txn.processed_date);
      const bankStatus = normalizeBankStatus(txn.status);
      const originalAmount = normalizeOptionalAmount(txn.original_amount);
      const originalCurrency = normalizeCurrency(txn.original_currency);
      const chargedCurrency = normalizeCurrency(txn.charged_currency);
      const txnKind = String(txn.txn_kind ?? '').trim().slice(0, 50) || null;
      const installmentNumber = normalizePositiveInteger(txn.installment_number);
      const installmentTotal = normalizePositiveInteger(txn.installment_total);
      const validInstallments = installmentNumber && installmentTotal
        && installmentNumber <= installmentTotal;
      const rawIdentifier = txn.identifier == null ? null : String(txn.identifier);
      const legacyBankSyncId = rawIdentifier ? `${source}:${acctKey}:${rawIdentifier}` : null;
      // Banks can reuse one identifier for different factual movements,
      // including completed rows on different dates. Qualify every bank id by
      // local date while keeping the raw id as the suffix for lifecycle repair.
      const bankSyncId = rawIdentifier
        ? (isCreditCompany
          ? legacyBankSyncId
          : `${source}:${acctKey}:${date}:${rawIdentifier}`)
        : null;

      const acctNum = acctKey === 'default' ? null : acctKey;

      if (bankSyncId) {
        // One-time compatibility for pending rows stored before date-qualified
        // ids existed. Promote only an exact legacy fact; when two provider rows
        // share the legacy id, the non-matching one inserts independently.
        if (legacyBankSyncId !== bankSyncId) {
          await client.query(
            `/* promote legacy pending bank id */
             UPDATE transactions legacy
                SET bank_sync_id = $2, updated_at = NOW()
              WHERE legacy.user_id = $1
                AND legacy.bank_sync_id = $3
                AND legacy.bank_source = $4
                AND legacy.bank_account_number IS NOT DISTINCT FROM $5
                AND legacy.amount = $6
                AND legacy.type = $7
                AND LOWER(REGEXP_REPLACE(TRIM(legacy.description), '\\s+', ' ', 'g'))
                    = LOWER(REGEXP_REPLACE(TRIM($8), '\\s+', ' ', 'g'))
                AND legacy.date = $9::date
                AND legacy.deleted_at IS NULL
                AND (legacy.bank_status IS NULL OR legacy.bank_status = 'pending')
                AND NOT EXISTS (
                  SELECT 1 FROM transactions current
                   WHERE current.user_id = $1 AND current.bank_sync_id = $2
                )`,
            [userId, bankSyncId, legacyBankSyncId, source, acctNum, amount, type, description, date],
          );
        }

        // Some banks re-key the same movement when it settles (Leumi has been
        // observed changing 45061616 → 61616 and shifting the date by 2 days).
        // Before inserting a completed fact, repair exactly one stale pending
        // predecessor. Banks may re-key their identifier; card providers often
        // omit the identifier entirely until an authorization is finalized.
        if (bankStatus === 'completed') {
          const rekeyCandidates = isCreditCompany
            ? await client.query(
              CARD_PENDING_REKEY_CANDIDATE_SQL,
              [userId, source, acctNum, amount, type, description, date, bankSyncId],
            )
            : await client.query(
              PENDING_REKEY_CANDIDATE_SQL,
              [
                userId, source, acctNum, amount, type, description, date,
                bankSyncId, String(txn.identifier),
              ],
            );
          if (rekeyCandidates.rows.length === 1) {
            await client.query(
              `UPDATE transactions SET
                 bank_sync_id         = $2,
                 amount               = $3,
                 type                 = $4,
                 description          = $5,
                 notes                = CASE WHEN COALESCE($6, '') <> '' THEN $6 ELSE notes END,
                 date                 = $7,
                 transaction_datetime = $8,
                 raw_category         = COALESCE(raw_category, $9),
                 bank_processed_date  = COALESCE($10, bank_processed_date),
                 bank_status          = $11,
                 original_amount      = COALESCE($12, original_amount),
                 original_currency    = COALESCE($13, original_currency),
                 charged_currency     = COALESCE($14, charged_currency),
                 txn_kind             = COALESCE($15, txn_kind),
                 installment_number   = COALESCE($16, installment_number),
                 installment_total    = COALESCE($17, installment_total),
                 updated_at           = NOW()
               WHERE id = $1`,
              [
                rekeyCandidates.rows[0].id, bankSyncId, amount, type, description,
                bankNotes, date, transactionDatetime, rawCategory, bankProcessedDate,
                bankStatus, originalAmount, originalCurrency, chargedCurrency, txnKind,
                validInstallments ? installmentNumber : null,
                validInstallments ? installmentTotal : null,
              ],
            );
            skipped++;
            continue;
          }
        }

        // Hard dedup via partial unique index on (user_id, bank_sync_id).
        const result = await client.query(
           `INSERT INTO transactions
             (user_id, amount, type, description, notes, date, transaction_datetime,
              raw_category, bank_sync_id, bank_source, bank_account_number,
              bank_processed_date, bank_status, original_amount, original_currency,
              charged_currency, txn_kind, installment_number, installment_total,
              created_at, updated_at)
           VALUES ($1,$2,$3,$4,$13,$5,$6,$7,$8,$9,$10,$11,$12,$14,$15,$16,$17,$18,$19,NOW(),NOW())
           ON CONFLICT (user_id, bank_sync_id)
             WHERE bank_sync_id IS NOT NULL
           DO UPDATE SET
             amount              = EXCLUDED.amount,
             type                = EXCLUDED.type,
             description         = EXCLUDED.description,
             date                = EXCLUDED.date,
             transaction_datetime = EXCLUDED.transaction_datetime,
             bank_processed_date = COALESCE(EXCLUDED.bank_processed_date, transactions.bank_processed_date),
             bank_status         = COALESCE(EXCLUDED.bank_status, transactions.bank_status),
             original_amount     = COALESCE(EXCLUDED.original_amount, transactions.original_amount),
             original_currency   = COALESCE(EXCLUDED.original_currency, transactions.original_currency),
             charged_currency    = COALESCE(EXCLUDED.charged_currency, transactions.charged_currency),
             txn_kind            = COALESCE(EXCLUDED.txn_kind, transactions.txn_kind),
             installment_number  = COALESCE(EXCLUDED.installment_number, transactions.installment_number),
             installment_total   = COALESCE(EXCLUDED.installment_total, transactions.installment_total),
             raw_category        = COALESCE(transactions.raw_category, EXCLUDED.raw_category),
             notes               = CASE
                                     WHEN COALESCE(transactions.notes, '') = '' THEN EXCLUDED.notes
                                     ELSE transactions.notes
                                   END,
             updated_at          = NOW()
           WHERE transactions.amount IS DISTINCT FROM EXCLUDED.amount
              OR transactions.type IS DISTINCT FROM EXCLUDED.type
              OR transactions.description IS DISTINCT FROM EXCLUDED.description
              OR transactions.date IS DISTINCT FROM EXCLUDED.date
              OR transactions.transaction_datetime IS DISTINCT FROM EXCLUDED.transaction_datetime
              OR transactions.bank_processed_date IS DISTINCT FROM COALESCE(EXCLUDED.bank_processed_date, transactions.bank_processed_date)
              OR transactions.bank_status IS DISTINCT FROM COALESCE(EXCLUDED.bank_status, transactions.bank_status)
              OR transactions.original_amount IS DISTINCT FROM COALESCE(EXCLUDED.original_amount, transactions.original_amount)
              OR transactions.original_currency IS DISTINCT FROM COALESCE(EXCLUDED.original_currency, transactions.original_currency)
              OR transactions.charged_currency IS DISTINCT FROM COALESCE(EXCLUDED.charged_currency, transactions.charged_currency)
              OR transactions.txn_kind IS DISTINCT FROM COALESCE(EXCLUDED.txn_kind, transactions.txn_kind)
              OR transactions.installment_number IS DISTINCT FROM COALESCE(EXCLUDED.installment_number, transactions.installment_number)
              OR transactions.installment_total IS DISTINCT FROM COALESCE(EXCLUDED.installment_total, transactions.installment_total)
              OR transactions.raw_category IS DISTINCT FROM COALESCE(transactions.raw_category, EXCLUDED.raw_category)
              OR (COALESCE(transactions.notes, '') = '' AND COALESCE(EXCLUDED.notes, '') <> '')
           RETURNING id, (xmax = 0) AS was_inserted`,
          [
            userId, amount, type, description, date, transactionDatetime,
            rawCategory, bankSyncId, source, acctNum, bankProcessedDate, bankStatus, bankNotes,
            originalAmount, originalCurrency, chargedCurrency, txnKind,
            validInstallments ? installmentNumber : null,
            validInstallments ? installmentTotal : null,
          ],
        );
        result.rows[0]?.was_inserted ? inserted++ : skipped++;
      } else {
        // Soft dedup: match on (user_id, source, account, date, amount, description).
        // Deliberately INCLUDES tombstoned rows (deleted_at set): a user-deleted
        // bank transaction must keep blocking re-import, not resurrect here.
        const existing = await client.query(
          `SELECT id, bank_processed_date, bank_status, raw_category, notes FROM transactions
           WHERE user_id=$1 AND bank_source=$2
             AND bank_account_number IS NOT DISTINCT FROM $6
             AND (
               (date=$3 AND amount=$4 AND description=$5)
               OR (transaction_datetime=$7 AND description=$5)
             )
           LIMIT 1`,
          [userId, source, date, amount, description, acctNum, transactionDatetime],
        );
        if (existing.rows.length > 0) {
          // A deduped re-sync can still enrich an old row with statement date
          // and status metadata introduced after that row was first imported.
          await client.query(
            `UPDATE transactions SET
               amount              = $2,
               type                = $3,
               description         = $4,
               date                = $5,
               transaction_datetime = $6,
               bank_processed_date = COALESCE($7, bank_processed_date),
               bank_status         = COALESCE($8, bank_status),
               raw_category        = COALESCE(raw_category, $9),
               notes               = CASE WHEN COALESCE(notes, '') = '' THEN $10 ELSE notes END,
               original_amount     = COALESCE($11, original_amount),
               original_currency   = COALESCE($12, original_currency),
               charged_currency    = COALESCE($13, charged_currency),
               txn_kind            = COALESCE($14, txn_kind),
               installment_number  = COALESCE($15, installment_number),
               installment_total   = COALESCE($16, installment_total),
               updated_at          = NOW()
             WHERE id = $1
               AND (
                 amount IS DISTINCT FROM $2
                 OR type IS DISTINCT FROM $3
                 OR description IS DISTINCT FROM $4
                 OR date IS DISTINCT FROM $5
                 OR transaction_datetime IS DISTINCT FROM $6
                 OR bank_processed_date IS DISTINCT FROM COALESCE($7, bank_processed_date)
                 OR bank_status IS DISTINCT FROM COALESCE($8, bank_status)
                 OR raw_category IS DISTINCT FROM COALESCE(raw_category, $9)
                 OR (COALESCE(notes, '') = '' AND COALESCE($10, '') <> '')
                 OR original_amount IS DISTINCT FROM COALESCE($11, original_amount)
                 OR original_currency IS DISTINCT FROM COALESCE($12, original_currency)
                 OR charged_currency IS DISTINCT FROM COALESCE($13, charged_currency)
                 OR txn_kind IS DISTINCT FROM COALESCE($14, txn_kind)
                 OR installment_number IS DISTINCT FROM COALESCE($15, installment_number)
                 OR installment_total IS DISTINCT FROM COALESCE($16, installment_total)
               )`,
            [
              existing.rows[0].id, amount, type, description, date,
              transactionDatetime, bankProcessedDate, bankStatus, rawCategory, bankNotes,
              originalAmount, originalCurrency, chargedCurrency, txnKind,
              validInstallments ? installmentNumber : null,
              validInstallments ? installmentTotal : null,
            ],
          );
          skipped++;
        } else {
          await client.query(
             `INSERT INTO transactions
               (user_id, amount, type, description, notes, date, transaction_datetime,
                raw_category, bank_source, bank_account_number,
                bank_processed_date, bank_status, original_amount, original_currency,
                charged_currency, txn_kind, installment_number, installment_total,
                created_at, updated_at)
             VALUES ($1,$2,$3,$4,$12,$5,$6,$7,$8,$9,$10,$11,$13,$14,$15,$16,$17,$18,NOW(),NOW())`,
            [
              userId, amount, type, description, date, transactionDatetime,
              rawCategory, source, acctNum, bankProcessedDate, bankStatus, bankNotes,
              originalAmount, originalCurrency, chargedCurrency, txnKind,
              validInstallments ? installmentNumber : null,
              validInstallments ? installmentTotal : null,
            ],
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

module.exports = {
  ingestAccounts,
  MAX_TXNS,
  calendarDateInTz,
  normalizeProcessedDate,
  normalizeBankStatus,
  normalizeOptionalAmount,
  normalizeCurrency,
  normalizePositiveInteger,
  PENDING_REKEY_CANDIDATE_SQL,
};
