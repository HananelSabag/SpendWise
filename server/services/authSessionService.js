const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { generateTokens, verifyToken } = require('../middleware/auth');

const ROTATION_GRACE_MS = 30_000;

const digest = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const safeEqual = (left, right) => {
  if (!left || !right) return false;
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const requestFingerprint = (req) => ({
  userAgentHash: req?.get?.('User-Agent') ? digest(req.get('User-Agent')) : null,
  ipHash: req?.ip ? digest(`${process.env.JWT_REFRESH_SECRET}:${req.ip}`) : null,
});

const sessionError = (code, message, status = 401) => Object.assign(new Error(message), { code, status });

function tokenExpiry(refreshToken) {
  const decoded = jwt.decode(refreshToken);
  if (!decoded?.exp) throw sessionError('INVALID_REFRESH_TOKEN', 'Invalid refresh token');
  return new Date(decoded.exp * 1000);
}

function buildSessionTokens(user, sessionId) {
  return generateTokens(user, {
    sessionId,
    refreshTokenId: crypto.randomUUID(),
  });
}

async function issueSession(user, req, familyId = crypto.randomUUID(), queryable = db) {
  const sessionId = crypto.randomUUID();
  const tokens = buildSessionTokens(user, sessionId);
  const fingerprint = requestFingerprint(req);

  await queryable.query(
    `INSERT INTO auth_sessions (
       id, family_id, user_id, refresh_token_hash, expires_at,
       user_agent_hash, ip_hash
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      sessionId,
      familyId,
      user.id,
      digest(tokens.refreshToken),
      tokenExpiry(tokens.refreshToken),
      fingerprint.userAgentHash,
      fingerprint.ipHash,
    ],
  );

  return tokens;
}

async function rotateSession(rawRefreshToken, user, decoded, req) {
  // Seamless bridge for sessions issued before migration 29. The already
  // verified legacy token is exchanged once for a stateful session.
  if (!decoded.sid) return issueSession(user, req);

  const client = await db.getClient();
  let transactionOpen = false;
  try {
    await client.query('BEGIN');
    transactionOpen = true;
    const result = await client.query(
      `SELECT id, family_id, user_id, refresh_token_hash, expires_at,
              revoked_at, revoked_reason
         FROM auth_sessions
        WHERE id = $1
        FOR UPDATE`,
      [decoded.sid],
    );
    const session = result.rows[0];
    if (!session || Number(session.user_id) !== Number(user.id)) {
      throw sessionError('INVALID_REFRESH_TOKEN', 'Invalid refresh session');
    }

    if (session.revoked_at) {
      const age = Date.now() - new Date(session.revoked_at).getTime();
      if (session.revoked_reason === 'rotated' && age <= ROTATION_GRACE_MS) {
        throw sessionError('SESSION_ALREADY_ROTATED', 'Refresh token was already rotated', 409);
      }
      await client.query(
        `UPDATE auth_sessions
            SET revoked_at = COALESCE(revoked_at, NOW()), revoked_reason = 'refresh_reuse'
          WHERE family_id = $1 AND revoked_at IS NULL`,
        [session.family_id],
      );
      await client.query('COMMIT');
      transactionOpen = false;
      throw sessionError('REFRESH_TOKEN_REUSED', 'Refresh token reuse detected');
    }

    if (new Date(session.expires_at).getTime() <= Date.now()) {
      await client.query(
        `UPDATE auth_sessions SET revoked_at = NOW(), revoked_reason = 'expired' WHERE id = $1`,
        [session.id],
      );
      await client.query('COMMIT');
      transactionOpen = false;
      throw sessionError('REFRESH_TOKEN_EXPIRED', 'Refresh token expired');
    }

    if (!safeEqual(session.refresh_token_hash, digest(rawRefreshToken))) {
      await client.query(
        `UPDATE auth_sessions
            SET revoked_at = COALESCE(revoked_at, NOW()), revoked_reason = 'refresh_reuse'
          WHERE family_id = $1 AND revoked_at IS NULL`,
        [session.family_id],
      );
      await client.query('COMMIT');
      transactionOpen = false;
      throw sessionError('REFRESH_TOKEN_REUSED', 'Refresh token reuse detected');
    }

    const tokens = await issueSession(user, req, session.family_id, client);
    const replacement = verifyToken(tokens.refreshToken, process.env.JWT_REFRESH_SECRET);
    await client.query(
      `UPDATE auth_sessions
          SET revoked_at = NOW(), revoked_reason = 'rotated', replaced_by = $2,
              last_used_at = NOW()
        WHERE id = $1`,
      [session.id, replacement.sid],
    );
    await client.query('COMMIT');
    transactionOpen = false;
    return tokens;
  } catch (error) {
    if (transactionOpen) await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function revokeSession(rawRefreshToken, reason = 'logout') {
  if (!rawRefreshToken) return false;
  let decoded;
  try {
    decoded = verifyToken(rawRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (_) {
    return false;
  }
  if (!decoded.sid) return false;

  const result = await db.query(
    `UPDATE auth_sessions
        SET revoked_at = COALESCE(revoked_at, NOW()), revoked_reason = COALESCE(revoked_reason, $2)
      WHERE family_id = (SELECT family_id FROM auth_sessions WHERE id = $1)
        AND revoked_at IS NULL`,
    [decoded.sid, reason],
    'auth_session_revoke',
  );
  return result.rowCount > 0;
}

async function revokeAllForUser(userId, reason, exceptSessionId = null, queryable = db) {
  await queryable.query(
    `UPDATE auth_sessions
        SET revoked_at = COALESCE(revoked_at, NOW()), revoked_reason = COALESCE(revoked_reason, $2)
      WHERE user_id = $1 AND revoked_at IS NULL
        AND ($3::uuid IS NULL OR id <> $3::uuid)`,
    [userId, reason, exceptSessionId],
  );
}

module.exports = {
  digest,
  issueSession,
  rotateSession,
  revokeSession,
  revokeAllForUser,
};
