/**
 * Bank Sync Route (LEGACY path + stats)
 *
 * POST /bank-sync — receives scraped transactions from spendwise-agent's
 * standalone mode (X-API-Key auth). The production path is the Bank Connect
 * job queue (routes/bankAgentRoutes.js); this POST endpoint is kept as a
 * dev/fallback entry point. Both share services/bankSyncService.js.
 *
 * GET /bank-sync/stats — per-source dashboard stats (JWT auth), used by
 * the client's BankSyncPage and balance panel.
 *
 * POST /api/v1/bank-sync
 *
 * Security layers:
 *   1. Dedicated strict rate limiter (20 req / hour / IP)
 *   2. Timing-safe API key comparison (prevents timing attacks)
 *   3. ALLOWED_HOUSEHOLD_IDS whitelist (env var) — restricts which user IDs
 *      can be synced even if the key is somehow compromised
 *   4. User existence check before any DB writes
 *   5. Amount sanity cap — rejects unrealistic amounts
 *   6. Payload size cap — rejects oversized transaction lists
 *   7. All rejections logged with IP; no internal details in error responses
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const db = require('../config/db');
const logger = require('../utils/logger');
const { auth } = require('../middleware/auth');
const { ingestAccounts, MAX_TXNS } = require('../services/bankSyncService');
const { VALID_SOURCES, INSTITUTIONS, institutionKind } = require('../config/institutions');
const { getUserFinancialCycle } = require('../services/financialCycleService');

const CREDIT_CARD_SOURCES = Object.entries(INSTITUTIONS)
  .filter(([, meta]) => meta.kind === 'credit_card')
  .map(([source]) => source);

// ── Strict rate limiter ───────────────────────────────────────────────────────
// Tighter than the main API limiter: this endpoint should only be called by
// one trusted machine, so 20 requests per hour per IP is generous.
const bankSyncLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

// ── Timing-safe API key auth ──────────────────────────────────────────────────
// Uses crypto.timingSafeEqual so the response time reveals nothing about how
// many characters of the key matched, preventing brute-force timing attacks.
function bankSyncAuth(req, res, next) {
  const expected = process.env.BANK_SYNC_API_KEY;
  if (!expected) {
    logger.error('bank-sync: BANK_SYNC_API_KEY is not set — endpoint disabled');
    return res.status(503).json({ error: 'Bank sync not configured' });
  }

  const incoming = req.headers['x-api-key'];
  if (!incoming) {
    logger.warn('bank-sync: missing X-API-Key header', { ip: req.ip });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Compare via constant-time function — lengths must match too.
  let valid = false;
  try {
    const a = Buffer.from(incoming, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    valid = false;
  }

  if (!valid) {
    logger.warn('bank-sync: rejected invalid API key', { ip: req.ip });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

// ── POST /bank-sync ───────────────────────────────────────────────────────────
router.post('/', bankSyncLimiter, bankSyncAuth, async (req, res) => {
  const { household_id, source, accounts } = req.body;

  // ── Input validation ────────────────────────────────────────────────────────
  if (!household_id || !source || !Array.isArray(accounts)) {
    return res.status(400).json({ error: 'Invalid payload: household_id, source, accounts required' });
  }

  const userId = Number(household_id);
  if (!Number.isFinite(userId) || userId <= 0 || !Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Invalid household_id' });
  }

  if (typeof source !== 'string' || source.length > 50 || !/^[a-z0-9_-]+$/.test(source)) {
    return res.status(400).json({ error: 'Invalid source' });
  }
  if (!VALID_SOURCES.includes(source)) {
    return res.status(400).json({ error: 'Unsupported source' });
  }

  // ── Household ID whitelist ──────────────────────────────────────────────────
  // Even with a valid key, only allow syncing to pre-approved user IDs.
  // Set ALLOWED_HOUSEHOLD_IDS=1,34 in your server .env / Render env vars.
  const allowedIds = process.env.ALLOWED_HOUSEHOLD_IDS
    ? process.env.ALLOWED_HOUSEHOLD_IDS.split(',').map(s => parseInt(s.trim(), 10)).filter(Number.isFinite)
    : null;
  if (allowedIds && !allowedIds.includes(userId)) {
    logger.warn('bank-sync: rejected — household_id not in whitelist', { userId, ip: req.ip });
    return res.status(403).json({ error: 'Forbidden' });
  }

  // ── Payload size cap ────────────────────────────────────────────────────────
  const totalTxns = accounts.reduce((sum, a) => sum + (Array.isArray(a.txns) ? a.txns.length : 0), 0);
  if (totalTxns > MAX_TXNS) {
    return res.status(400).json({ error: `Payload exceeds ${MAX_TXNS} transaction limit` });
  }

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // ── User existence check ────────────────────────────────────────────────
    const userCheck = await client.query('SELECT id FROM users WHERE id=$1 LIMIT 1', [userId]);
    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      logger.warn('bank-sync: rejected — user not found', { userId, ip: req.ip });
      return res.status(404).json({ error: 'User not found' });
    }

    // Shared ingestion (dedup + bank_accounts upsert) — same code path as
    // the agent route, so both entry points behave identically.
    const { inserted, skipped } = await ingestAccounts(client, userId, source, accounts);

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

// ── GET /bank-sync/stats ─────────────────────────────────────────────────────
// Returns per-source statistics for the logged-in user's bank transactions.
// Used by the SpendWise client to display the Bank Sync dashboard.
router.get('/stats', auth, async (req, res) => {
  const userId = req.user.id;
  try {
    // Money figures (income/expense) are scoped to the user's current
    // financial period so this page and the dashboard tell the same story;
    // transaction COUNTS stay all-time — they're sync-health, not money.
    const period = await getUserFinancialCycle(userId);
    const result = await db.query(
      `WITH sources AS (
         SELECT DISTINCT bank_source AS source
         FROM transactions
         WHERE user_id = $1 AND bank_source IS NOT NULL AND deleted_at IS NULL
         UNION
         SELECT DISTINCT bank_source AS source
         FROM bank_accounts
         WHERE user_id = $1
       ),
       tx AS (
         SELECT
           t.*,
           CASE
             WHEN t.bank_source = ANY($4::text[])
               THEN COALESCE(t.bank_processed_date, t.date)
             ELSE t.date
           END AS activity_date
         FROM transactions t
         LEFT JOIN bank_accounts ba_filter
           ON ba_filter.user_id = t.user_id
          AND ba_filter.bank_source = t.bank_source
          AND ba_filter.account_number = COALESCE(t.bank_account_number, '')
         WHERE t.user_id = $1
           AND t.bank_source IS NOT NULL
           AND t.deleted_at IS NULL
           AND COALESCE(ba_filter.enabled, true) = true
       ),
       tx_stats AS (
         SELECT
           bank_source AS source,
           COUNT(id)::int AS total,
           MAX(created_at) AS last_transaction_sync,
           COALESCE(SUM(CASE WHEN type='income'  AND activity_date >= $2 AND activity_date < $3 THEN 1 ELSE 0 END), 0)::int AS income_count,
           COALESCE(SUM(CASE WHEN type='expense' AND activity_date >= $2 AND activity_date < $3 THEN 1 ELSE 0 END), 0)::int AS expense_count,
           COALESCE(SUM(CASE WHEN type='income'  AND activity_date >= $2 AND activity_date < $3 THEN amount ELSE 0 END), 0) AS total_income,
           COALESCE(SUM(CASE WHEN type='expense' AND activity_date >= $2 AND activity_date < $3 THEN amount ELSE 0 END), 0) AS total_expense
         FROM tx
         GROUP BY bank_source
       ),
       acct_stats AS (
         SELECT bank_source AS source, MAX(last_synced_at) AS last_account_sync
         FROM bank_accounts
         WHERE user_id = $1
         GROUP BY bank_source
       ),
       acct_tx_stats AS (
         -- Same shape as tx_stats but broken out per account/card, not just
         -- per institution — a bank login or card company can expose more
         -- than one account/card (bank_accounts is keyed on account_number),
         -- and each one needs its own "how much moved through this specific
         -- account/card" figure, not one number shared across all of them.
         SELECT
           bank_source AS source,
           COALESCE(bank_account_number, '') AS account_number,
           COUNT(id)::int AS total,
           MAX(activity_date) AS last_transaction_at,
           COALESCE(SUM(CASE WHEN type='income'  AND activity_date >= $2 AND activity_date < $3 THEN amount ELSE 0 END), 0) AS total_income,
           COALESCE(SUM(CASE WHEN type='expense' AND activity_date >= $2 AND activity_date < $3 THEN amount ELSE 0 END), 0) AS total_expense
         FROM tx
         GROUP BY bank_source, COALESCE(bank_account_number, '')
       )
       SELECT
         s.source                                                             AS source,
         COALESCE(ts.total, 0)::int                                           AS total,
         COALESCE(ts.last_transaction_sync, ast.last_account_sync)            AS last_sync,
         COALESCE(ts.income_count, 0)::int                                    AS income_count,
         COALESCE(ts.expense_count, 0)::int                                   AS expense_count,
         COALESCE(ts.total_income, 0)                                         AS total_income,
         COALESCE(ts.total_expense, 0)                                        AS total_expense,
         COALESCE(
            (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
               'account_number',      ba.account_number,
               'account_type',        ba.account_type,
               'balance',             ba.balance,
               'enabled',             ba.enabled,
               'last_synced_at',      ba.last_synced_at,
               'transaction_count',   COALESCE(act.total, 0),
               'income',              COALESCE(act.total_income, 0),
               'expense',             COALESCE(act.total_expense, 0),
               'last_transaction_at', act.last_transaction_at
            ) ORDER BY ba.account_number)
             FROM bank_accounts ba
             LEFT JOIN acct_tx_stats act
               ON act.source = ba.bank_source AND act.account_number = ba.account_number
             WHERE ba.user_id = $1 AND ba.bank_source = s.source),
            '[]'::jsonb
          )                                                                    AS accounts
       FROM sources s
       LEFT JOIN tx_stats ts ON ts.source = s.source
       LEFT JOIN acct_stats ast ON ast.source = s.source
       ORDER BY last_sync DESC`,
      [userId, period.start, period.end, CREDIT_CARD_SOURCES],
    );
    const sources = result.rows.map((r) => ({
      ...r,
      kind: institutionKind(r.source),
      label: INSTITUTIONS[r.source]?.label || r.source,
    }));
    res.json({
      ok: true,
      sources,
      period: { start: period.start, end: period.end, cycleDay: period.cycleDay },
    });
  } catch (err) {
    logger.error('bank-sync stats failed', { error: err.message, userId });
    res.status(500).json({ error: 'Failed to fetch bank sync stats' });
  }
});

module.exports = router;
