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
const { getRepresentativeRates } = require('./exchangeRateService');

const MAX_TXNS = 2000;
const MAX_AMOUNT = 10_000_000;
const IDENTIFIED_BATCH_SIZE = 250;

/**
 * Re-select, under a row lock, the pending predecessor that couldMatchPendingRekey() already
 * accepted in JS. $9 carries those ids: the identifier evidence (suffix re-key, or the bank no
 * longer listing the old id) needs the current scrape, which SQL cannot see. Every factual guard
 * is still re-checked here so a concurrent write cannot slip a different row past the lock.
 */
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
    AND stale.id = ANY($9::int[])
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
    AND stale.type = $5
    AND (
      (
        stale.amount = $4
        AND LOWER(REGEXP_REPLACE(TRIM(stale.description), '\\s+', ' ', 'g'))
            = LOWER(REGEXP_REPLACE(TRIM($6), '\\s+', ' ', 'g'))
      )
      OR (
        stale.amount_is_estimated = TRUE
        AND stale.original_amount = $9
        AND stale.original_currency = $10
      )
      OR (
        stale.date = $7::date
        AND ABS(stale.amount - $4) <= 1.00
        AND LENGTH(LOWER(REGEXP_REPLACE(TRIM(stale.description), '\\s+', ' ', 'g'))) >= 4
        AND (
          LOWER(REGEXP_REPLACE(TRIM(stale.description), '\\s+', ' ', 'g'))
            LIKE '%' || LOWER(REGEXP_REPLACE(TRIM($6), '\\s+', ' ', 'g')) || '%'
          OR LOWER(REGEXP_REPLACE(TRIM($6), '\\s+', ' ', 'g'))
            LIKE '%' || LOWER(REGEXP_REPLACE(TRIM(stale.description), '\\s+', ' ', 'g')) || '%'
        )
      )
    )
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

const BATCH_IDENTIFIED_UPSERT_SQL = `/* batch identified transaction upsert */
  INSERT INTO transactions
    (user_id, amount, type, description, notes, date, transaction_datetime,
     raw_category, bank_sync_id, bank_source, bank_account_number,
     bank_processed_date, bank_status, original_amount, original_currency,
     charged_currency, txn_kind, installment_number, installment_total,
     amount_is_estimated, fx_rate_used, fx_rate_source, fx_rate_as_of,
     created_at, updated_at)
  SELECT $1, payload.amount, payload.type, payload.description, payload.notes,
         payload.date, payload.transaction_datetime, payload.raw_category,
         payload.bank_sync_id, payload.bank_source, payload.bank_account_number,
         payload.bank_processed_date, payload.bank_status, payload.original_amount,
         payload.original_currency, payload.charged_currency, payload.txn_kind,
         payload.installment_number, payload.installment_total,
         payload.amount_is_estimated, payload.fx_rate_used, payload.fx_rate_source,
         payload.fx_rate_as_of, NOW(), NOW()
    FROM jsonb_to_recordset($2::jsonb) AS payload(
      amount numeric, type text, description text, notes text, date date,
      transaction_datetime timestamptz, raw_category text, bank_sync_id text,
      bank_source text, bank_account_number text, bank_processed_date date,
      bank_status text, original_amount numeric, original_currency text,
      charged_currency text, txn_kind text, installment_number integer,
      installment_total integer, amount_is_estimated boolean,
      fx_rate_used numeric, fx_rate_source text, fx_rate_as_of timestamptz
    )
  ON CONFLICT (user_id, bank_sync_id) WHERE bank_sync_id IS NOT NULL
  DO UPDATE SET
    amount               = EXCLUDED.amount,
    type                 = EXCLUDED.type,
    description          = EXCLUDED.description,
    date                 = EXCLUDED.date,
    transaction_datetime = EXCLUDED.transaction_datetime,
    bank_processed_date  = COALESCE(EXCLUDED.bank_processed_date, transactions.bank_processed_date),
    bank_status          = COALESCE(EXCLUDED.bank_status, transactions.bank_status),
    original_amount      = COALESCE(EXCLUDED.original_amount, transactions.original_amount),
    original_currency    = COALESCE(EXCLUDED.original_currency, transactions.original_currency),
    charged_currency     = COALESCE(EXCLUDED.charged_currency, transactions.charged_currency),
    txn_kind             = COALESCE(EXCLUDED.txn_kind, transactions.txn_kind),
    installment_number   = COALESCE(EXCLUDED.installment_number, transactions.installment_number),
    installment_total    = COALESCE(EXCLUDED.installment_total, transactions.installment_total),
    amount_is_estimated  = EXCLUDED.amount_is_estimated,
    fx_rate_used         = EXCLUDED.fx_rate_used,
    fx_rate_source       = EXCLUDED.fx_rate_source,
    fx_rate_as_of        = EXCLUDED.fx_rate_as_of,
    raw_category         = COALESCE(transactions.raw_category, EXCLUDED.raw_category),
    notes                = CASE WHEN COALESCE(transactions.notes, '') = ''
                                THEN EXCLUDED.notes ELSE transactions.notes END,
    updated_at           = NOW()
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
     OR transactions.amount_is_estimated IS DISTINCT FROM EXCLUDED.amount_is_estimated
     OR transactions.fx_rate_used IS DISTINCT FROM EXCLUDED.fx_rate_used
     OR transactions.fx_rate_source IS DISTINCT FROM EXCLUDED.fx_rate_source
     OR transactions.fx_rate_as_of IS DISTINCT FROM EXCLUDED.fx_rate_as_of
     OR transactions.raw_category IS DISTINCT FROM COALESCE(transactions.raw_category, EXCLUDED.raw_category)
     OR (COALESCE(transactions.notes, '') = '' AND COALESCE(EXCLUDED.notes, '') <> '')
  RETURNING id, (xmax = 0) AS was_inserted`;

// The calendar date a transaction belongs to, in the app's timezone.
// toISOString() would use UTC — an Israeli 00:30 purchase would land on the
// previous day, shifting day grouping and financial-period boundaries.
const INGEST_TZ = process.env.PERIOD_TIMEZONE || process.env.SYNC_TIMEZONE || 'Asia/Jerusalem';
const INGEST_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: INGEST_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
});
function calendarDateInTz(d) {
  return INGEST_DATE_FORMATTER.format(d);
}

async function upsertIdentifiedBatches(client, userId, payloads) {
  let inserted = 0;
  for (let start = 0; start < payloads.length; start += IDENTIFIED_BATCH_SIZE) {
    const chunk = payloads.slice(start, start + IDENTIFIED_BATCH_SIZE);
    const result = await client.query(
      BATCH_IDENTIFIED_UPSERT_SQL,
      [userId, JSON.stringify(chunk)],
    );
    inserted += result.rows.filter((row) => row.was_inserted === true).length;
  }
  return inserted;
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

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function normalizedText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * A calendar day as 'YYYY-MM-DD', from either a scraper string or a pg DATE.
 *
 * node-postgres hands DATE columns back as a JS Date at LOCAL midnight, and
 * `String(thatDate).slice(0, 10)` yields "Sun Jul 12" — which Date.parse rejects. That silently
 * made dateDistance() return Infinity for every row read from the database, so the guard below
 * rejected every candidate and the whole pending-repair path never ran even once (it left real
 * duplicate rows behind: a pending copy plus its settled twin).
 * Read the parts locally, never via toISOString(), or a UTC+N local midnight rolls back a day.
 */
function calendarKey(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }
  if (!value) return null;
  const key = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : null;
}

function dateDistance(left, right) {
  const leftKey = calendarKey(left);
  const rightKey = calendarKey(right);
  if (!leftKey || !rightKey) return Infinity;
  const a = Date.parse(`${leftKey}T00:00:00Z`);
  const b = Date.parse(`${rightKey}T00:00:00Z`);
  return Number.isFinite(a) && Number.isFinite(b) ? Math.abs(a - b) / 86400000 : Infinity;
}

/** The provider's own id, which bank_sync_id carries as its last colon-separated segment. */
function rawIdentifierOf(bankSyncId) {
  if (!bankSyncId) return null;
  const parts = String(bankSyncId).split(':');
  return parts.length ? parts[parts.length - 1] : null;
}

/**
 * Has the bank stopped listing this pending row's identifier?
 *
 * Only answerable inside the window the scrape actually covered: a row older than that is
 * missing because nobody looked, not because it settled.
 */
function identifierVanished(candidate, scrape) {
  if (!scrape || !scrape.identifiers) return false;
  const raw = rawIdentifierOf(candidate.bank_sync_id);
  if (!raw) return false;
  const day = calendarKey(candidate.date);
  if (!day || !scrape.earliest || day < scrape.earliest) return false;
  return !scrape.identifiers.has(raw);
}

/**
 * Is this stale pending row the same movement as the settled one arriving now?
 *
 * Every branch demands the same account, direction, amount, description and a date within
 * three days — a bank may shift the day when a hold settles. What differs is the identifier
 * evidence:
 *   card providers  — publish no identifier at all until an authorization is final, so the
 *                     stale row simply has none, and the factual match is all we get.
 *   banks           — re-key on settlement. The old id may survive as a suffix of the new one
 *                     (45061616 → 61616), or be replaced outright (416173003 → 160717); the
 *                     latter is only catchable by noticing the bank no longer lists the old id.
 * A same-day pair of identical genuine movements stays safe: the bank keeps listing both ids,
 * so neither looks vanished, and the caller repairs only when exactly one candidate matches.
 */
function couldMatchPendingRekey(candidate, incoming, isCreditCompany, scrape = null) {
  if (String(candidate.bank_account_number || '') !== String(incoming.accountNumber || '')
    || candidate.type !== incoming.type
    || dateDistance(candidate.date, incoming.date) > 3) return false;
  if (isCreditCompany) {
    if (candidate.bank_sync_id != null || candidate.bank_status !== 'pending') return false;
    const exact = Number(candidate.amount) === incoming.amount
      && normalizedText(candidate.description) === normalizedText(incoming.description);
    const estimatedFx = candidate.amount_is_estimated === true
      && Number(candidate.original_amount) === incoming.originalAmount
      && candidate.original_currency === incoming.originalCurrency;
    // Card providers may publish a short merchant label and an estimated ILS amount while
    // pending, then return a fuller label and a few agorot of FX drift when settled. On the
    // same purchase day, a unique near-amount containment match is the same lifecycle row.
    // The SQL re-check still requires exactly one candidate under a row lock.
    const pendingMerchant = normalizedText(candidate.description);
    const settledMerchant = normalizedText(incoming.description);
    const sameMerchantFamily = Math.min(pendingMerchant.length, settledMerchant.length) >= 4
      && (pendingMerchant.includes(settledMerchant) || settledMerchant.includes(pendingMerchant));
    const nearSameDayAuthorization = dateDistance(candidate.date, incoming.date) === 0
      && Math.abs(Number(candidate.amount) - incoming.amount) <= 1
      && sameMerchantFamily;
    return exact || estimatedFx || nearSameDayAuthorization;
  }
  return candidate.bank_sync_id != null
    && candidate.bank_sync_id !== incoming.bankSyncId
    && (candidate.bank_status == null || candidate.bank_status === 'pending')
    && Number(candidate.amount) === incoming.amount
    && normalizedText(candidate.description) === normalizedText(incoming.description)
    && (String(candidate.bank_sync_id).endsWith(incoming.rawIdentifier)
      || identifierVanished(candidate, scrape));
}

function buildPayloadFxRates(accounts) {
  const samples = new Map();
  for (const account of accounts || []) {
    const accountNumber = String(account.account_number || 'default').trim();
    for (const txn of account.txns || []) {
      const charged = Math.abs(Number(txn.charged_amount));
      const original = Math.abs(Number(txn.original_amount));
      const currency = normalizeCurrency(txn.original_currency);
      const chargedCurrency = normalizeCurrency(txn.charged_currency);
      if (!currency || currency === 'ILS' || chargedCurrency !== 'ILS'
        || !Number.isFinite(charged) || charged <= 0
        || !Number.isFinite(original) || original <= 0) continue;
      const rate = charged / original;
      if (!Number.isFinite(rate) || rate <= 0 || rate > 1000) continue;
      const key = `${accountNumber}:${currency}`;
      const list = samples.get(key) || [];
      list.push(rate);
      samples.set(key, list);
    }
  }
  return new Map([...samples].map(([key, values]) => [key, {
    rate: median(values), source: 'provider_history_median', asOf: null,
  }]));
}

function estimatePendingFx(txn, accountNumber, representativeRates, payloadRates) {
  const status = normalizeBankStatus(txn.status);
  const charged = Number(txn.charged_amount);
  const originalSigned = Number(txn.original_amount);
  const currency = normalizeCurrency(txn.original_currency);
  if (charged !== 0 || status !== 'pending' || !Number.isFinite(originalSigned)
    || originalSigned === 0 || !currency || currency === 'ILS') return null;
  const rateInfo = representativeRates.get(currency)
    || payloadRates.get(`${accountNumber}:${currency}`);
  if (!rateInfo || !Number.isFinite(rateInfo.rate) || rateInfo.rate <= 0) return null;
  const signedAmount = Math.sign(originalSigned)
    * Math.round((Math.abs(originalSigned) * rateInfo.rate + Number.EPSILON) * 100) / 100;
  return {
    chargedAmount: signedAmount,
    rate: rateInfo.rate,
    source: rateInfo.source,
    asOf: rateInfo.asOf,
  };
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
  let identifiedAttempts = 0;
  const identifiedBySyncId = new Map();
  const isCreditCompany = institutionKind(source) === 'credit_card';
  const payloadFxRates = buildPayloadFxRates(accounts);
  const hasPendingForeignZero = accounts.some((account) => (account.txns || []).some((txn) => {
    const currency = normalizeCurrency(txn.original_currency);
    return Number(txn.charged_amount) === 0
      && normalizeBankStatus(txn.status) === 'pending'
      && currency && currency !== 'ILS'
      && Number(txn.original_amount) !== 0;
  }));
  const representativeRates = hasPendingForeignZero ? await getRepresentativeRates() : new Map();

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
  // `date::text` is deliberate: pg would otherwise return a Date at local midnight, and the
  // comparison helpers work on 'YYYY-MM-DD' keys. Handing them a Date used to poison every
  // pending-repair decision (see calendarKey).
  const pendingInventory = (await client.query(
    `/* pending lifecycle inventory */
     SELECT id, bank_account_number, amount, type, description, date::text AS date,
            bank_sync_id, bank_status, amount_is_estimated,
            original_amount, original_currency
       FROM transactions
      WHERE user_id = $1 AND bank_source = $2 AND deleted_at IS NULL
        AND ((bank_sync_id IS NULL AND bank_status = 'pending')
          OR (bank_sync_id IS NOT NULL AND (bank_status IS NULL OR bank_status = 'pending')))`,
    [userId, source],
  )).rows;

  /**
   * What this scrape actually reported, per account: every raw identifier, and the oldest day
   * it covered.
   *
   * A bank that re-keys a movement on settlement simply stops reporting the old identifier —
   * Leumi has been seen turning 416173003 into 160717, which shares no suffix with it, so
   * suffix matching cannot catch that. "The bank no longer lists this id" is the real evidence,
   * and it is safe in the one case that matters: two genuine same-day ₪500 withdrawals both stay
   * listed under their own ids, so neither is ever mistaken for the other's re-key.
   * The oldest covered day matters because a pending row from before the scrape window is absent
   * for a boring reason — nobody looked — and must not be read as "vanished".
   */
  const scrapeReport = new Map();
  for (const account of accounts) {
    const key = (account.account_number || 'default').toString().trim();
    const identifiers = new Set();
    let earliest = null;
    for (const txn of account.txns || []) {
      if (txn.identifier != null && txn.identifier !== '') identifiers.add(String(txn.identifier));
      const day = calendarKey(txn.date);
      if (day && (!earliest || day < earliest)) earliest = day;
    }
    scrapeReport.set(key, { identifiers, earliest });
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
      const bankStatus = normalizeBankStatus(txn.status);
      const originalAmount = normalizeOptionalAmount(txn.original_amount);
      const originalCurrency = normalizeCurrency(txn.original_currency);
      const fxEstimate = estimatePendingFx(txn, acctKey, representativeRates, payloadFxRates);
      const chargedAmount = fxEstimate?.chargedAmount ?? parseFloat(txn.charged_amount);
      const amountIsEstimated = Boolean(fxEstimate);
      const fxRateUsed = fxEstimate?.rate || null;
      const fxRateSource = fxEstimate?.source || null;
      const fxRateAsOf = fxEstimate?.asOf || null;

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
      const chargedCurrency = amountIsEstimated ? 'ILS' : normalizeCurrency(txn.charged_currency);
      const txnKind = String(txn.txn_kind ?? '').trim().slice(0, 50) || null;
      const installmentNumber = normalizePositiveInteger(txn.installment_number);
      const installmentTotal = normalizePositiveInteger(txn.installment_total);
      const validInstallments = installmentNumber && installmentTotal
        && installmentNumber <= installmentTotal;
      const rawIdentifier = txn.identifier == null ? null : String(txn.identifier);
      const legacyBankSyncId = rawIdentifier ? `${source}:${acctKey}:${rawIdentifier}` : null;
      // Banks can reuse one identifier for different factual movements, even
      // on the same day. Qualify by local date, direction, and amount while
      // keeping the raw id as the suffix for lifecycle repair.
      const bankSyncId = rawIdentifier
        ? (isCreditCompany
          ? legacyBankSyncId
          : `${source}:${acctKey}:${date}:${type === 'expense' ? 'e' : 'i'}${amount.toFixed(2)}:${rawIdentifier}`)
        : null;

      const acctNum = acctKey === 'default' ? null : acctKey;

      if (bankSyncId) {
        // One-time compatibility for pending rows stored before date-qualified
        // ids existed. Promote only an exact legacy fact; when two provider rows
        // share the legacy id, the non-matching one inserts independently.
        const legacyCandidateExists = pendingInventory.some((candidate) => (
          candidate.bank_sync_id === legacyBankSyncId
          && String(candidate.bank_account_number || '') === String(acctNum || '')
          && Number(candidate.amount) === amount
          && candidate.type === type
          && normalizedText(candidate.description) === normalizedText(description)
          && String(candidate.date).slice(0, 10) === date
        ));
        if (legacyBankSyncId !== bankSyncId && legacyCandidateExists) {
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
        const rekeyInput = {
          accountNumber: acctNum,
          amount,
          type,
          description,
          date,
          bankSyncId,
          rawIdentifier: String(txn.identifier),
          originalAmount,
          originalCurrency,
        };
        const scrape = scrapeReport.get(acctKey) || null;
        if (bankStatus === 'completed'
          && pendingInventory.some((candidate) => couldMatchPendingRekey(
            candidate, rekeyInput, isCreditCompany, scrape,
          ))) {
          // The JS pass above already proved a match exists; re-select it under a row lock so
          // the repair is atomic. Pass the ids the JS pass accepted so the SQL agrees with it —
          // otherwise a bank that re-keyed outright is matched here and rejected there, and the
          // duplicate is inserted anyway.
          const rekeyableIds = pendingInventory
            .filter((candidate) => couldMatchPendingRekey(candidate, rekeyInput, isCreditCompany, scrape))
            .map((candidate) => Number(candidate.id));
          const rekeyCandidates = isCreditCompany
            ? await client.query(
              CARD_PENDING_REKEY_CANDIDATE_SQL,
              [
                userId, source, acctNum, amount, type, description, date, bankSyncId,
                originalAmount, originalCurrency,
              ],
            )
            : await client.query(
              PENDING_REKEY_CANDIDATE_SQL,
              [
                userId, source, acctNum, amount, type, description, date,
                bankSyncId, rekeyableIds,
              ],
            );
          if (rekeyCandidates.rows.length === 1) {
            const repairedId = Number(rekeyCandidates.rows[0].id);
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
                 amount_is_estimated  = $18,
                 fx_rate_used         = $19,
                 fx_rate_source       = $20,
                 fx_rate_as_of        = $21,
                 updated_at           = NOW()
               WHERE id = $1`,
              [
                rekeyCandidates.rows[0].id, bankSyncId, amount, type, description,
                bankNotes, date, transactionDatetime, rawCategory, bankProcessedDate,
                bankStatus, originalAmount, originalCurrency, chargedCurrency, txnKind,
                validInstallments ? installmentNumber : null,
                validInstallments ? installmentTotal : null,
                amountIsEstimated, fxRateUsed, fxRateSource, fxRateAsOf,
              ],
            );
            skipped++;
            const inventoryIndex = pendingInventory.findIndex((row) => Number(row.id) === repairedId);
            if (inventoryIndex >= 0) pendingInventory.splice(inventoryIndex, 1);
            continue;
          }
        }

        // Hard-deduped rows are sent in bounded batches. This preserves the
        // exact ON CONFLICT lifecycle semantics while avoiding one network
        // round trip per provider transaction.
        identifiedAttempts += 1;
        identifiedBySyncId.set(bankSyncId, {
          amount,
          type,
          description,
          notes: bankNotes,
          date,
          transaction_datetime: transactionDatetime,
          raw_category: rawCategory,
          bank_sync_id: bankSyncId,
          bank_source: source,
          bank_account_number: acctNum,
          bank_processed_date: bankProcessedDate,
          bank_status: bankStatus,
          original_amount: originalAmount,
          original_currency: originalCurrency,
          charged_currency: chargedCurrency,
          txn_kind: txnKind,
          installment_number: validInstallments ? installmentNumber : null,
          installment_total: validInstallments ? installmentTotal : null,
          amount_is_estimated: amountIsEstimated,
          fx_rate_used: fxRateUsed,
          fx_rate_source: fxRateSource,
          fx_rate_as_of: fxRateAsOf,
        });
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
               amount_is_estimated = $17,
               fx_rate_used        = $18,
               fx_rate_source      = $19,
               fx_rate_as_of       = $20,
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
                 OR amount_is_estimated IS DISTINCT FROM $17
                 OR fx_rate_used IS DISTINCT FROM $18
                 OR fx_rate_source IS DISTINCT FROM $19
                 OR fx_rate_as_of IS DISTINCT FROM $20
               )`,
            [
              existing.rows[0].id, amount, type, description, date,
              transactionDatetime, bankProcessedDate, bankStatus, rawCategory, bankNotes,
              originalAmount, originalCurrency, chargedCurrency, txnKind,
              validInstallments ? installmentNumber : null,
              validInstallments ? installmentTotal : null,
              amountIsEstimated, fxRateUsed, fxRateSource, fxRateAsOf,
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
                amount_is_estimated, fx_rate_used, fx_rate_source, fx_rate_as_of,
                created_at, updated_at)
             VALUES ($1,$2,$3,$4,$12,$5,$6,$7,$8,$9,$10,$11,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,NOW(),NOW())`,
            [
              userId, amount, type, description, date, transactionDatetime,
              rawCategory, source, acctNum, bankProcessedDate, bankStatus, bankNotes,
              originalAmount, originalCurrency, chargedCurrency, txnKind,
              validInstallments ? installmentNumber : null,
              validInstallments ? installmentTotal : null,
              amountIsEstimated, fxRateUsed, fxRateSource, fxRateAsOf,
            ],
          );
          inserted++;
        }
      }
    }
  }

  const identifiedPayloads = [...identifiedBySyncId.values()];
  if (identifiedPayloads.length) {
    const batchInserted = await upsertIdentifiedBatches(client, userId, identifiedPayloads);
    inserted += batchInserted;
    skipped += identifiedAttempts - batchInserted;
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
  buildPayloadFxRates,
  estimatePendingFx,
  calendarKey,
  dateDistance,
  rawIdentifierOf,
  identifierVanished,
  couldMatchPendingRekey,
  PENDING_REKEY_CANDIDATE_SQL,
};
