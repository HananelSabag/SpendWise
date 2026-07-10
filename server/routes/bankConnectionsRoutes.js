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
const { INSTITUTIONS, VALID_SOURCES, institutionKind } = require('../config/institutions');

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
// The X25519 public key the browser seals credentials to. A user who has
// paired their own device gets THAT device's key back instead of the
// Default Host's — every subsequent connect/reconnect for them then seals
// to a key only their own machine can open.
router.get('/public-key', async (req, res) => {
  try {
    const device = await db.query(
      `SELECT public_key FROM agent_devices WHERE user_id = $1 AND status = 'active'`,
      [req.user.id],
    );
    const publicKey = device.rows[0]?.public_key || process.env.BANK_AGENT_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(503).json({ error: 'Bank connect is not configured yet' });
    }
    res.json({ ok: true, publicKey });
  } catch (err) {
    logger.error('bank-connections: public-key lookup failed', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch public key' });
  }
});

// ── GET / ─────────────────────────────────────────────────────────────────────
// List the user's connections. NEVER returns encrypted_credentials.
router.get('/', async (req, res) => {
  try {
    // Include the latest job's status/time so the UI can show live states
    // ("waiting for sync agent", "syncing now") — critical when the user's
    // agent machine is offline and jobs sit pending.
    const result = await db.query(
      `SELECT c.id, c.bank_source, c.display_name, c.status, c.consecutive_failures,
              c.last_sync_at, c.last_error, c.created_at,
              j.status       AS latest_job_status,
              j.trigger      AS latest_job_trigger,
              j.requested_at AS latest_job_requested_at,
              j.result       AS latest_job_result,
              j.claimed_by   AS latest_job_claimed_by,
              q.manual_today,
              q.last_done_sync_at,
              CASE
                WHEN q.last_done_sync_at IS NULL THEN NULL
                ELSE q.last_done_sync_at + ($2::int * INTERVAL '1 hour')
              END AS next_manual_sync_at
       FROM bank_connections c
       LEFT JOIN LATERAL (
         SELECT status, trigger, requested_at, result, claimed_by
         FROM bank_sync_jobs
         WHERE connection_id = c.id
         ORDER BY requested_at DESC
         LIMIT 1
       ) j ON true
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*) FILTER (
             WHERE trigger = 'manual'
               AND requested_at > NOW() - INTERVAL '24 hours'
               AND started_at IS NOT NULL
           )::int AS manual_today,
           MAX(finished_at) FILTER (WHERE status = 'done') AS last_done_sync_at
         FROM bank_sync_jobs
         WHERE connection_id = c.id
       ) q ON true
       WHERE c.user_id = $1
       ORDER BY c.created_at ASC`,
      [req.user.id, MANUAL_SYNC_GAP_HOURS],
    );
    const connections = result.rows.map((c) => ({
      ...c,
      kind: institutionKind(c.bank_source),
      institution_label: INSTITUTIONS[c.bank_source]?.label || c.bank_source,
    }));
    res.json({ ok: true, connections });
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
// By default the already-synced transactions/accounts are KEPT (deleting a
// login shouldn't erase financial history). Pass ?purge_data=true to also
// remove every transaction + account row this source synced. Hard delete is
// correct for a purge: with the connection gone nothing can re-import, and
// if the user ever reconnects, getting the data back from the bank is the
// expected outcome.
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  const purge = req.query.purge_data === 'true';

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `DELETE FROM bank_connections WHERE id = $1 AND user_id = $2 RETURNING bank_source`,
      [id, req.user.id],
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Connection not found' });
    }
    const bankSource = result.rows[0].bank_source;

    let purgedTransactions = 0;
    if (purge) {
      const txns = await client.query(
        `DELETE FROM transactions WHERE user_id = $1 AND bank_source = $2 RETURNING id`,
        [req.user.id, bankSource],
      );
      await client.query(
        `DELETE FROM bank_accounts WHERE user_id = $1 AND bank_source = $2`,
        [req.user.id, bankSource],
      );
      purgedTransactions = txns.rowCount;
    }

    await client.query('COMMIT');
    logger.info('bank-connections: deleted', {
      userId: req.user.id, bank: bankSource, purge, purgedTransactions,
    });
    res.json({ ok: true, purged: purge, purged_transactions: purgedTransactions });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('bank-connections: delete failed', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to delete connection' });
  } finally {
    client.release();
  }
});

// ── PATCH /:id/accounts/:accountNumber ────────────────────────────────────────
// Enable/disable syncing a specific account under a connection (e.g. exclude
// a building-committee side account). Body: { enabled: boolean }.
router.patch('/:id/accounts/:accountNumber', async (req, res) => {
  const id = Number(req.params.id);
  const accountNumber = String(req.params.accountNumber);
  const { enabled } = req.body;
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  if (typeof enabled !== 'boolean') return res.status(400).json({ error: 'enabled (boolean) required' });

  try {
    // Confirm the connection belongs to the user, and get its bank_source.
    const conn = await db.query(
      `SELECT bank_source FROM bank_connections WHERE id = $1 AND user_id = $2`,
      [id, req.user.id],
    );
    if (conn.rows.length === 0) return res.status(404).json({ error: 'Connection not found' });

    const result = await db.query(
      `UPDATE bank_accounts SET enabled = $4
       WHERE user_id = $1 AND bank_source = $2 AND account_number = $3
       RETURNING account_number, enabled`,
      [req.user.id, conn.rows[0].bank_source, accountNumber, enabled],
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Account not found' });
    res.json({ ok: true, account: result.rows[0] });
  } catch (err) {
    logger.error('bank-connections: account toggle failed', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to update account' });
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

    // Expire stale jobs so one dead job can't block "Sync Now" forever:
    //  • pending >2h  — the agent machine was off and never claimed it.
    //  • running >15m — the agent claimed it then died/was closed mid-scrape
    //    (e.g. the user quit the stuck agent). A real sync finishes in minutes,
    //    so a "running" job this old is a zombie. This is what lets the user
    //    re-sync a connection that got stuck instead of waiting hours.
    await db.query(
      `UPDATE bank_sync_jobs
       SET status='failed', finished_at=NOW(),
           result = CASE
             WHEN status='pending'
               THEN '{"error":"expired — sync agent did not pick this up in time","transient":true}'::jsonb
             ELSE '{"error":"expired — sync agent stopped before reporting a result","transient":true}'::jsonb
           END
       WHERE connection_id = $1
         AND ( (status='pending' AND requested_at < NOW() - INTERVAL '2 hours')
            OR (status='running' AND COALESCE(started_at, requested_at) < NOW() - INTERVAL '15 minutes') )`,
      [id],
    );

    // Guard: existing pending/running job for this connection
    const inFlight = await db.query(
      `SELECT id FROM bank_sync_jobs
       WHERE connection_id = $1 AND status IN ('pending','running') LIMIT 1`,
      [id],
    );
    if (inFlight.rows.length > 0) {
      return res.status(409).json({ error: 'A sync is already queued', code: 'SYNC_IN_FLIGHT' });
    }

    // Guards that protect the BANK account (frequent logins = lockout):
    //  - quota: 2 manual attempts/day that actually reached the bank
    //    (started_at set). Expired never-claimed jobs don't count.
    //  - gap: 3h since the last COMPLETED sync. A failed/expired attempt
    //    doesn't block an immediate retry — that was the "worked once,
    //    never again" complaint.
    const quota = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE trigger = 'manual'
                            AND requested_at > NOW() - INTERVAL '24 hours'
                            AND started_at IS NOT NULL)::int AS manual_today,
         MAX(finished_at) FILTER (WHERE status = 'done') AS last_done
       FROM bank_sync_jobs WHERE connection_id = $1`,
      [id],
    );
    const { manual_today, last_done } = quota.rows[0];
    if (manual_today >= MANUAL_SYNCS_PER_DAY) {
      return res.status(429).json({ error: 'Daily manual sync limit reached', code: 'SYNC_QUOTA' });
    }
    if (last_done && Date.now() - new Date(last_done).getTime() < MANUAL_SYNC_GAP_HOURS * 3600_000) {
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
              j.finished_at, j.result, j.claimed_by, c.bank_source
       FROM bank_sync_jobs j
       JOIN bank_connections c ON c.id = j.connection_id
       WHERE j.user_id = $1
       ORDER BY j.requested_at DESC
       LIMIT 20`,
      [req.user.id],
    );
    const jobs = result.rows.map((j) => ({ ...j, kind: institutionKind(j.bank_source) }));
    res.json({ ok: true, jobs });
  } catch (err) {
    logger.error('bank-connections: jobs list failed', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

module.exports = router;
