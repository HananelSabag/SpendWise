/**
 * Agent Pairing Routes — lets a user connect their OWN computer as their
 * sync agent instead of using the shared Default Host.
 *
 * Deliberately mounted at its own top-level path (NOT under /bank-agent):
 * bankAgentRoutes.js applies router.use(agentAuth) unconditionally to every
 * request that reaches it (machine auth, X-Agent-Key/X-Device-Token), which
 * would 401 these JWT-authenticated browser calls before they ever matched
 * a route. Only /confirm is unauthenticated — the Agent has no user session,
 * just a short-lived human-entered code.
 *
 * Security model: pairing never exposes another user's data. A code is
 * single-user, single-use, and expires in 10 minutes. The device_token
 * returned by /confirm is shown exactly once (server stores only its hash),
 * same "better lost than stolen" posture as the existing agent-private.key.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const db = require('../config/db');
const logger = require('../utils/logger');
const { auth } = require('../middleware/auth');

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/l
const CODE_LENGTH = 8;
const CODE_TTL_MINUTES = 10;
const DEVICE_TOKEN_BYTES = 32;

function randomCode() {
  let code = '';
  const bytes = crypto.randomBytes(CODE_LENGTH);
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

// Browser calls (start/status/unpair) are JWT-authed and infrequent —
// generous limit mainly to blunt scripted abuse, not real usage.
const browserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

// /confirm has no JWT — an attacker could try to guess codes. Tight per-IP
// cap; the code keyspace (33^8 ≈ 1.4e12) makes guessing infeasible anyway.
const confirmLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

// ── POST /start ──────────────────────────────────────────────────────────
// Issue a fresh pairing code for the logged-in user. Replaces any code
// they already had pending.
router.post('/start', browserLimiter, auth, async (req, res) => {
  try {
    await db.query(`DELETE FROM agent_pairing_codes WHERE user_id = $1`, [req.user.id]);

    // Retry on the (astronomically unlikely) primary-key collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomCode();
      try {
        const result = await db.query(
          `INSERT INTO agent_pairing_codes (code, user_id, expires_at)
           VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval)
           RETURNING code, expires_at`,
          [code, req.user.id, CODE_TTL_MINUTES],
        );
        return res.json({ ok: true, ...result.rows[0] });
      } catch (err) {
        if (err.code === '23505') continue; // unique_violation on code — retry
        throw err;
      }
    }
    throw new Error('Failed to allocate a pairing code');
  } catch (err) {
    logger.error('agent-pairing: start failed', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to start pairing' });
  }
});

// ── POST /confirm ────────────────────────────────────────────────────────
// Called by the Agent itself (no user session) once the user has typed the
// code into it. Body: { code, public_key, label }.
router.post('/confirm', confirmLimiter, async (req, res) => {
  const { code, public_key: publicKey, label } = req.body || {};
  if (typeof code !== 'string' || !/^[A-Z0-9]{8}$/.test(code)) {
    return res.status(400).json({ error: 'Invalid code' });
  }
  if (typeof publicKey !== 'string' || publicKey.length < 32 || publicKey.length > 128) {
    return res.status(400).json({ error: 'Invalid public_key' });
  }
  const safeLabel = typeof label === 'string' ? label.trim().slice(0, 100) : null;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const pairing = await client.query(
      `DELETE FROM agent_pairing_codes WHERE code = $1 AND expires_at > NOW() RETURNING user_id`,
      [code],
    );
    if (pairing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Code not found or expired' });
    }
    const userId = pairing.rows[0].user_id;

    // Re-pairing replaces the previous device outright.
    await client.query(
      `UPDATE agent_devices SET status = 'revoked' WHERE user_id = $1 AND status = 'active'`,
      [userId],
    );

    const deviceToken = crypto.randomBytes(DEVICE_TOKEN_BYTES).toString('base64url');
    await client.query(
      `INSERT INTO agent_devices (user_id, public_key, device_token_hash, label)
       VALUES ($1, $2, $3, $4)`,
      [userId, publicKey, hashToken(deviceToken), safeLabel],
    );

    await client.query('COMMIT');
    logger.info('agent-pairing: device paired', { userId });
    res.json({ ok: true, device_token: deviceToken });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('agent-pairing: confirm failed', { error: err.message });
    res.status(500).json({ error: 'Failed to confirm pairing' });
  } finally {
    client.release();
  }
});

// ── GET /status ──────────────────────────────────────────────────────────
router.get('/status', browserLimiter, auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT label, created_at AS paired_at FROM agent_devices
       WHERE user_id = $1 AND status = 'active'`,
      [req.user.id],
    );
    if (result.rows.length === 0) return res.json({ ok: true, paired: false });
    res.json({ ok: true, paired: true, ...result.rows[0] });
  } catch (err) {
    logger.error('agent-pairing: status failed', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch pairing status' });
  }
});

// ── POST /unpair ─────────────────────────────────────────────────────────
// Reverts the user to the Default Host. Any credentials already sealed to
// the revoked device's key become unreadable — the client warns before
// calling this and the user re-adds their bank connections.
router.post('/unpair', browserLimiter, auth, async (req, res) => {
  try {
    await db.query(
      `UPDATE agent_devices SET status = 'revoked' WHERE user_id = $1 AND status = 'active'`,
      [req.user.id],
    );
    logger.info('agent-pairing: unpaired', { userId: req.user.id });
    res.json({ ok: true });
  } catch (err) {
    logger.error('agent-pairing: unpair failed', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to unpair' });
  }
});

module.exports = router;
