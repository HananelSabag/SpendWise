/**
 * Bank Connections Routes — self-service bank linking
 *
 * Security model (end-to-end encryption):
 *   The client encrypts bank credentials IN THE BROWSER using tweetnacl
 *   sealed boxes with the scraper agent's X25519 public key. This server
 *   stores only the ciphertext and can never decrypt it. Only the local
 *   agent machine (private key holder) can read the credentials.
 *
 * Anti-block model:
 *   Banks lock accounts on frequent logins. Manual sync is limited to
 *   2/day with a 3h minimum gap; the scheduler adds at most 2 daily jobs.
 *
 * All routes require JWT auth; every query is scoped to req.user.id.
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const db = require('../config/db');
const logger = require('../utils/logger');
const { auth } = require('../middleware/auth');

const VALID_SOURCES = ['yahav', 'isracard', 'max', 'discount'];
const MAX_CIPHERTEXT_LEN = 4096;      // sealed box of a creds JSON is well under this
const MANUAL_SYNCS_PER_DAY = 2;
const MANUAL_SYNC_GAP_HOURS = 3;

const connectionsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

router.use(connectionsLimiter, auth);

// ── GET /public-key ───────────────────────────────────────────────────────────
// The agent's X25519 public key, used by the browser to seal credentials.
router.get('/public-key', (req, res) => {
  const publicKey = process.env.BANK_AGENT_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(503).json({ error: 'Bank connect is not configured yet' });
  }
  res.json({ ok: true, publicKey });
});

// ── GET / ─────────────────────────────────────────────────────────────────────
// List the user's connections. NEVER returns encrypted_credentials.
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, bank_source, display_name, status, consecutive_failures,
              last_sync_at, last_error, created_at
       FROM bank_connections
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [req.user.id],
    );
    res.json({ ok: true, connections: result.rows });
  } catch (err) {
    logger.error('bank-connections: list failed', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

// ── POST / ────────────────────────────────────────────────────────────────────
// Create a connection. Body: { bank_source, encrypted_credentials, display_name? }
router.post('/', async (req, res) => {
  const { bank_source, encrypted_credentials, display_name } = req.body;

  if (!VALID_SOURCES.includes(bank_source)) {
    return res.status(400).json({ error: 'Invalid bank_source' });
  }
  if (typeof encrypted_credentials !== 'string' ||
      encrypted_credentials.length < 32 ||
      encrypted_credentials.length > MAX_CIPHERTEXT_LEN ||
      !/^[A-Za-z0-9+/=]+$/.test(encrypted_credentials)) {
    return res.status(400).json({ error: 'Invalid encrypted_credentials' });
  }
  const name = typeof display_name === 'string' ? display_name.trim().slice(0, 100) : null;

  try {
    const result = await db.query(
      `INSERT INTO bank_connections (user_id, bank_source, encrypted_credentials, display_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, bank_source)
       DO UPDATE SET
         encrypted_credentials = EXCLUDED.encrypted_credentials,
         display_name          = COALESCE(EXCLUDED.display_name, bank_connections.display_name),
         status                = 'active',
         consecutive_failures  = 0,
         last_error            = NULL
       RETURNING id, bank_source, display_name, status, created_at`,
      [req.user.id, bank_source, encrypted_credentials, name],
    );
    logger.info('bank-connections: created/updated', { userId: req.user.id, bank: bank_source });
    res.status(201).json({ ok: true, connection: result.rows[0] });
  } catch (err) {
    logger.error('bank-connections: create failed', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to create connection' });
  }
});

// ── PATCH /:id ────────────────────────────────────────────────────────────────
// Pause / resume / rename. Body: { status?, display_name? }
router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

  const { status, display_name } = req.body;
  if (status !== undefined && !['active', 'paused'].includes(status)) {
    return res.status(400).json({ error: 'status must be active or paused' });
  }

  try {
    const result = await db.query(
      `UPDATE bank_connections SET
         status               = COALESCE($3, status),
         display_name         = COALESCE($4, display_name),
         consecutive_failures = CASE WHEN $3 = 'active' THEN 0 ELSE consecutive_failures END,
         last_error           = CASE WHEN $3 = 'active' THEN NULL ELSE last_error END
       WHERE id = $1 AND user_id = $2
       RETURNING id, bank_source, display_name, status`,
      [id, req.user.id, status ?? null,
       typeof display_name === 'string' ? display_name.trim().slice(0, 100) : null],
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Connection not found' });
    res.json({ ok: true, connection: result.rows[0] });
  } catch (err) {
    logger.error('bank-connections: patch failed', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to update connection' });
  }
});

// ── DELETE /:id ───────────────────────────────────────────────────────────────
// Permanent delete — ciphertext is gone forever (jobs cascade).
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    const result = await db.query(
      `DELETE FROM bank_connections WHERE id = $1 AND user_id = $2 RETURNING bank_source`,
      [id, req.user.id],
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Connection not found' });
    logger.info('bank-connections: deleted', { userId: req.user.id, bank: result.rows[0].bank_source });
    res.json({ ok: true });
  } catch (err) {
    logger.error('bank-connections: delete failed', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to delete connection' });
  }
});

// ── POST /:id/sync ────────────────────────────────────────────────────────────
// Enqueue a manual sync job. Rate limited to protect the bank account:
// max 2 manual syncs per day, min 3h between any two syncs.
router.post('/:id/sync', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    const conn = await db.query(
      `SELECT id, status FROM bank_connections WHERE id = $1 AND user_id = $2`,
      [id, req.user.id],
    );
    if (conn.rows.length === 0) return res.status(404).json({ error: 'Connection not found' });
    if (conn.rows[0].status !== 'active') {
      return res.status(409).json({ error: 'Connection is paused', code: 'CONNECTION_PAUSED' });
    }

    // Guard: existing pending/running job for this connection
    const inFlight = await db.query(
      `SELECT id FROM bank_sync_jobs
       WHERE connection_id = $1 AND status IN ('pending','running') LIMIT 1`,
      [id],
    );
    if (inFlight.rows.length > 0) {
      return res.status(409).json({ error: 'A sync is already queued', code: 'SYNC_IN_FLIGHT' });
    }

    // Guard: manual quota (2/day) and gap (3h since any job)
    const quota = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE trigger = 'manual'
                            AND requested_at > NOW() - INTERVAL '24 hours')::int AS manual_today,
         MAX(requested_at) AS last_any
       FROM bank_sync_jobs WHERE connection_id = $1`,
      [id],
    );
    const { manual_today, last_any } = quota.rows[0];
    if (manual_today >= MANUAL_SYNCS_PER_DAY) {
      return res.status(429).json({ error: 'Daily manual sync limit reached', code: 'SYNC_QUOTA' });
    }
    if (last_any && Date.now() - new Date(last_any).getTime() < MANUAL_SYNC_GAP_HOURS * 3600_000) {
      return res.status(429).json({ error: `Minimum ${MANUAL_SYNC_GAP_HOURS}h between syncs`, code: 'SYNC_TOO_SOON' });
    }

    const job = await db.query(
      `INSERT INTO bank_sync_jobs (connection_id, user_id, trigger)
       VALUES ($1, $2, 'manual') RETURNING id, status, requested_at`,
      [id, req.user.id],
    );
    logger.info('bank-connections: manual sync queued', { userId: req.user.id, connectionId: id });
    res.status(201).json({ ok: true, job: job.rows[0] });
  } catch (err) {
    logger.error('bank-connections: sync enqueue failed', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to queue sync' });
  }
});

// ── GET /jobs ─────────────────────────────────────────────────────────────────
// Recent jobs for the user's connections (for the status UI).
router.get('/jobs', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT j.id, j.connection_id, j.status, j.trigger, j.requested_at,
              j.finished_at, j.result, c.bank_source
       FROM bank_sync_jobs j
       JOIN bank_connections c ON c.id = j.connection_id
       WHERE j.user_id = $1
       ORDER BY j.requested_at DESC
       LIMIT 20`,
      [req.user.id],
    );
    res.json({ ok: true, jobs: result.rows });
  } catch (err) {
    logger.error('bank-connections: jobs list failed', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

module.exports = router;
