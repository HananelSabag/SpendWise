/**
 * Bank Agent Routes — machine-to-machine API for the local scraper agent
 *
 * The agent (running on a trusted residential machine) polls for pending
 * sync jobs, receives the encrypted credentials (which only IT can decrypt
 * with its private key), scrapes the bank, and reports results back.
 *
 * Auth: X-Agent-Key header, timing-safe comparison (same pattern as the
 * legacy bank-sync route). This key only grants job-queue access — the
 * credentials remain sealed to anyone without the agent's private key.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const db = require('../config/db');
const logger = require('../utils/logger');
const { ingestAccounts } = require('../services/bankSyncService');

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

function agentAuth(req, res, next) {
  const expected = process.env.BANK_AGENT_KEY;
  if (!expected) {
    logger.error('bank-agent: BANK_AGENT_KEY is not set — endpoint disabled');
    return res.status(503).json({ error: 'Bank agent not configured' });
  }
  const incoming = req.headers['x-agent-key'];
  if (!incoming) {
    logger.warn('bank-agent: missing X-Agent-Key header', { ip: req.ip });
    return res.status(401).json({ error: 'Unauthorized' });
  }
  let valid = false;
  try {
    const a = Buffer.from(incoming, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    valid = false;
  }
  if (!valid) {
    logger.warn('bank-agent: rejected invalid agent key', { ip: req.ip });
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.use(agentLimiter, agentAuth);

// ── POST /jobs/claim ──────────────────────────────────────────────────────────
// Atomically claim up to `limit` pending jobs (oldest first). Returns each
// job with its connection's encrypted credentials (sealed box ciphertext).
router.post('/jobs/claim', async (req, res) => {
  const limit = Math.min(Number(req.body?.limit) || 5, 10);

  try {
    const result = await db.query(
      `UPDATE bank_sync_jobs j SET
         status = 'running',
         started_at = NOW()
       FROM (
         SELECT id FROM bank_sync_jobs
         WHERE status = 'pending'
         ORDER BY requested_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED
       ) picked,
       bank_connections c
       WHERE j.id = picked.id AND c.id = j.connection_id
       RETURNING j.id, j.connection_id, j.user_id, j.trigger,
                 c.bank_source, c.encrypted_credentials`,
      [limit],
    );
    if (result.rows.length > 0) {
      logger.info('bank-agent: jobs claimed', { count: result.rows.length });
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
// Body (failure): { success: false, error: "message" }
router.post('/jobs/:id/result', async (req, res) => {
  const jobId = Number(req.params.id);
  if (!Number.isInteger(jobId)) return res.status(400).json({ error: 'Invalid job id' });

  const { success, accounts, error: agentError } = req.body || {};
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
      logger.info('bank-agent: job done', { jobId, inserted, skipped });
      return res.json({ ok: true, inserted, skipped });
    }

    // ── Failure path ──
    const errMsg = String(agentError || 'Unknown agent error').slice(0, 500);
    await client.query(
      `UPDATE bank_sync_jobs SET status='failed', finished_at=NOW(), result=$2 WHERE id=$1`,
      [jobId, JSON.stringify({ error: errMsg })],
    );
    const failUpdate = await client.query(
      `UPDATE bank_connections SET
         consecutive_failures = consecutive_failures + 1,
         last_error = $2,
         status = CASE WHEN consecutive_failures + 1 >= $3 THEN 'error' ELSE status END
       WHERE id = $1
       RETURNING consecutive_failures, status`,
      [job.connection_id, errMsg, AUTO_PAUSE_AFTER_FAILURES],
    );

    await client.query('COMMIT');
    const { consecutive_failures, status } = failUpdate.rows[0];
    logger.warn('bank-agent: job failed', { jobId, consecutive_failures, connectionStatus: status });
    return res.json({ ok: true, consecutive_failures, connection_status: status });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('bank-agent: result processing failed', { error: err.message, jobId });
    res.status(500).json({ error: 'Failed to process result' });
  } finally {
    client.release();
  }
});

module.exports = router;
