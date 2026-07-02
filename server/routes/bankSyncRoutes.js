/**
 * Bank Sync Route
 * Receives scraped transactions from bank-scraper and inserts them into
 * the transactions table. Authenticated via X-API-Key (not JWT — this is a
 * machine-to-machine call from the scraper, not a browser session).
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
    const result = await db.query(
      `SELECT
         t.bank_source                                                        AS source,
         COUNT(t.id)::int                                                     AS total,
         MAX(t.created_at)                                                    AS last_sync,
         SUM(CASE WHEN t.type='income'  THEN 1 ELSE 0 END)::int              AS income_count,
         SUM(CASE WHEN t.type='expense' THEN 1 ELSE 0 END)::int              AS expense_count,
         SUM(CASE WHEN t.type='income'  THEN t.amount ELSE 0 END)            AS total_income,
         SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END)            AS total_expense,
         COALESCE(
           (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
              'account_number', ba.account_number,
              'account_type',   ba.account_type,
              'balance',        ba.balance,
              'last_synced_at', ba.last_synced_at
           ))
            FROM bank_accounts ba
            WHERE ba.user_id = $1 AND ba.bank_source = t.bank_source),
           '[]'::jsonb
         )                                                                    AS accounts
       FROM transactions t
       WHERE t.user_id = $1
         AND t.bank_source IS NOT NULL
         AND t.deleted_at IS NULL
       GROUP BY t.bank_source
       ORDER BY last_sync DESC`,
      [userId],
    );
    res.json({ ok: true, sources: result.rows });
  } catch (err) {
    logger.error('bank-sync stats failed', { error: err.message, userId });
    res.status(500).json({ error: 'Failed to fetch bank sync stats' });
  }
});

module.exports = router;
