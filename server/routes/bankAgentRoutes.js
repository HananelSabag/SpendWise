/**
 * Bank Agent Routes — machine-to-machine API for scraper agents
 *
 * An agent (running on a trusted machine) polls for pending sync jobs,
 * receives the encrypted credentials (which only IT can decrypt with its
 * private key), scrapes the bank, and reports results back.
 *
 * Two kinds of agent, two auth methods, same endpoints:
 *  - Default Host: X-Agent-Key, timing-safe comparison against the single
 *    BANK_AGENT_KEY shared secret (unchanged from the original design).
 *    Scope: every user who has NOT paired their own device.
 *  - A user's own paired device: X-Device-Token, hashed and looked up in
 *    agent_devices. Scope: only that device's own user_id — see
 *    routes/agentPairingRoutes.js for how a device gets paired.
 * Either way this key only grants job-queue access — the credentials
 * remain sealed to whoever holds the matching private key.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const db = require('../config/db');
const logger = require('../utils/logger');
const { buildAgentClaimScope } = require('../services/agentClaimScope');
const { normalizeAgentFailure } = require('../services/bankAgentFailureService');
const { ingestAccounts } = require('../services/bankSyncService');
const { enqueueDueJobs } = require('../services/syncSchedulingService');
const { invalidateCycleDerivedData } = require('../services/cycleService');
const { invalidateDashboardCache } = require('../services/dashboardService');

const AUTO_PAUSE_AFTER_FAILURES = 3;

const agentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  // The agent polls on the user's Task Scheduler interval (as low as ~20min =
  // 3/hour) plus one result post per job. 600/hour leaves generous headroom
  // for short intervals and multiple connections without ever throttling the
  // one trusted machine.
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

function timingSafeStringEqual(a, b) {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

async function agentAuth(req, res, next) {
  const deviceToken = req.headers['x-device-token'];
  if (deviceToken) {
    const hash = crypto.createHash('sha256').update(String(deviceToken), 'utf8').digest('hex');
    try {
      const result = await db.query(
        `UPDATE agent_devices SET last_seen_at = NOW()
         WHERE device_token_hash = $1 AND status = 'active'
         RETURNING user_id, label`,
        [hash],
      );
      if (result.rows.length === 0) {
        logger.warn('bank-agent: rejected invalid device token', { ip: req.ip });
        return res.status(401).json({ error: 'Unauthorized' });
      }
      req.agentScope = { userId: result.rows[0].user_id, label: result.rows[0].label };
      return next();
    } catch (err) {
      logger.error('bank-agent: device token lookup failed', { error: err.message });
      return res.status(500).json({ error: 'Auth check failed' });
    }
  }

  const expected = process.env.BANK_AGENT_KEY;
  if (!expected) {
    logger.error('bank-agent: BANK_AGENT_KEY is not set — endpoint disabled');
    return res.status(503).json({ error: 'Bank agent not configured' });
  }
  const incoming = req.headers['x-agent-key'];
  if (!incoming || !timingSafeStringEqual(incoming, expected)) {
    logger.warn('bank-agent: rejected invalid or missing agent key', { ip: req.ip });
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.agentScope = { global: true };
  next();
}

router.use(agentLimiter, agentAuth);

// ── POST /jobs/claim ──────────────────────────────────────────────────────────
// Atomically claim up to `limit` pending jobs (oldest first). Returns each
// job with its connection's encrypted credentials (sealed box ciphertext).
//
// This is also the scheduler tick: the agent's poll is the only moment jobs
// are ever consumed, so due scheduled jobs (07:00/19:00 Israel targets) are
// enqueued right here, immediately before claiming. See
// services/syncSchedulingService.js for why in-process cron was removed.
router.post('/jobs/claim', async (req, res) => {
  const limit = Math.min(Number(req.body?.limit) || 5, 10);

  // Default Host only ever sees users who haven't paired their own device;
  // a paired device only ever sees its own user. Never both, never neither.
  // The privacy boundary is centralized + unit-tested: Default Host excludes
  // paired users; a paired device can select only its own user id. The second
  // parameter is also persisted as the per-job audit label.
  const { scopeClause, params } = buildAgentClaimScope(req.agentScope, limit);

  try {
    await enqueueDueJobs();

    const result = await db.query(
      `UPDATE bank_sync_jobs j SET
         status = 'running',
         started_at = NOW(),
         claimed_by = $2
       FROM (
         SELECT j2.id FROM bank_sync_jobs j2
         JOIN bank_connections c2 ON c2.id = j2.connection_id
         WHERE j2.status = 'pending'
           AND c2.status = 'active'
         ${scopeClause}
         ORDER BY j2.requested_at ASC
         LIMIT $1
         FOR UPDATE OF j2 SKIP LOCKED
       ) picked,
       bank_connections c
       WHERE j.id = picked.id AND c.id = j.connection_id
       RETURNING j.id, j.connection_id, j.user_id, j.trigger,
                 c.bank_source, c.encrypted_credentials`,
      params,
    );
    if (result.rows.length > 0) {
      logger.info('bank-agent: jobs claimed', { count: result.rows.length, scope: req.agentScope.global ? 'global' : `user:${req.agentScope.userId}` });
    }
    res.json({ ok: true, jobs: result.rows });
  } catch (err) {
    logger.error('bank-agent: claim failed', { error: err.message });
    res.status(500).json({ error: 'Failed to claim jobs' });
  }
});

// ── POST /jobs/:id/result ─────────────────────────────────────────────────────
// Agent reports the outcome of a claimed job.
// Body (success): { success: true,  accounts: [{ account_number, type, balance, txns }] }
// Body (failure): { success: false, error: "message", transient?: boolean, error_code?: string }
//   transient=true marks expected, self-resolving declines (e.g. the agent's
//   local scrape cooldown) — the job is recorded as failed with its message,
//   but the connection's consecutive_failures counter is NOT incremented, so
//   a healthy connection can never be auto-paused by cooldown declines.
router.post('/jobs/:id/result', async (req, res) => {
  const jobId = Number(req.params.id);
  if (!Number.isInteger(jobId)) return res.status(400).json({ error: 'Invalid job id' });

  const { success, accounts, error: agentError, transient, error_code: errorCode } = req.body || {};
  if (typeof success !== 'boolean') {
    return res.status(400).json({ error: 'success (boolean) is required' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Lock the job row; only running jobs can receive results.
    const jobRow = await client.query(
      `SELECT id, connection_id, user_id, status FROM bank_sync_jobs
       WHERE id = $1 FOR UPDATE`,
      [jobId],
    );
    if (jobRow.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Job not found' });
    }
    const job = jobRow.rows[0];
    if (job.status !== 'running') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Job is ${job.status}, expected running` });
    }
    // A paired device may only ever report on its own user's jobs — without
    // this, a compromised device could inject fabricated accounts/balances
    // into another user's data via a job it never legitimately claimed.
    if (!req.agentScope.global && job.user_id !== req.agentScope.userId) {
      await client.query('ROLLBACK');
      logger.warn('bank-agent: device attempted to report a job outside its scope', {
        jobId, jobUserId: job.user_id, deviceUserId: req.agentScope.userId,
      });
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (success) {
      if (!Array.isArray(accounts)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'accounts array required on success' });
      }

      const { inserted, skipped } = await ingestAccounts(
        client, job.user_id,
        (await client.query('SELECT bank_source FROM bank_connections WHERE id=$1', [job.connection_id])).rows[0].bank_source,
        accounts,
      );

      const balance = accounts.find(a => typeof a.balance === 'number')?.balance ?? null;
      await client.query(
        `UPDATE bank_sync_jobs SET status='done', finished_at=NOW(), result=$2 WHERE id=$1`,
        [jobId, JSON.stringify({ inserted, skipped, balance })],
      );
      await client.query(
        `UPDATE bank_connections SET
           last_sync_at = NOW(), consecutive_failures = 0, last_error = NULL,
           status = CASE WHEN status = 'error' THEN 'active' ELSE status END
         WHERE id = $1`,
        [job.connection_id],
      );

      await client.query('COMMIT');
      // The cache must be cleared after commit; doing it inside ingestAccounts
      // leaves a window where an old snapshot can be cached again for 15 seconds.
      await invalidateCycleDerivedData(job.user_id);
      invalidateDashboardCache(job.user_id);
      logger.info('bank-agent: job done', { jobId, inserted, skipped });
      return res.json({ ok: true, inserted, skipped });
    }

    // ── Failure path ──
    const failure = normalizeAgentFailure({ agentError, transient, errorCode });
    const errMsg = failure.rawError;
    const isTransient = failure.transient;
    await client.query(
      `UPDATE bank_sync_jobs SET status='failed', finished_at=NOW(), result=$2 WHERE id=$1`,
      [jobId, JSON.stringify({
        error: errMsg,
        transient: isTransient,
        code: failure.code,
        terminal: failure.terminal,
      })],
    );

    if (isTransient) {
      // Expected decline (cooldown etc.) — record the job outcome but leave
      // the connection's health counters and status untouched.
      await client.query('COMMIT');
      logger.info('bank-agent: job declined (transient)', { jobId, error: errMsg });
      return res.json({ ok: true, transient: true });
    }

    const failUpdate = await client.query(
      `UPDATE bank_connections SET
         consecutive_failures = consecutive_failures + 1,
         last_error = $2,
         status = CASE WHEN $4 OR consecutive_failures + 1 >= $3 THEN 'error' ELSE status END
       WHERE id = $1
       RETURNING consecutive_failures, status`,
      [job.connection_id, failure.userMessage, AUTO_PAUSE_AFTER_FAILURES, failure.terminal],
    );

    if (failure.terminal) {
      // A user-action failure must not leave already queued work behind. A
      // running sibling result will be rejected because its row is no longer
      // running, preventing stale credentials from re-breaking an edited link.
      await client.query(
        `UPDATE bank_sync_jobs SET
           status='failed', finished_at=NOW(),
           result=jsonb_build_object(
             'error', 'Connection requires updated login details',
             'code', 'CONNECTION_REQUIRES_ACTION',
             'terminal', true
           )
         WHERE connection_id=$1 AND id<>$2 AND status IN ('pending','running')`,
        [job.connection_id, jobId],
      );
    }

    await client.query('COMMIT');
    const { consecutive_failures, status } = failUpdate.rows[0];
    logger.warn('bank-agent: job failed', {
      jobId, consecutive_failures, connectionStatus: status,
      code: failure.code, terminal: failure.terminal,
    });
    return res.json({
      ok: true,
      consecutive_failures,
      connection_status: status,
      terminal: failure.terminal,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('bank-agent: result processing failed', { error: err.message, jobId });
    res.status(500).json({ error: 'Failed to process result' });
  } finally {
    client.release();
  }
});

module.exports = router;
