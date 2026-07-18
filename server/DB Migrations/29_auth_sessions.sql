-- Stateful refresh-token sessions with atomic rotation and revocation.
-- Access tokens remain short-lived JWTs; refresh tokens are stored only as SHA-256 hashes.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_token_version INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY,
  family_id UUID NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  replaced_by UUID REFERENCES auth_sessions(id) ON DELETE SET NULL,
  user_agent_hash CHAR(64),
  ip_hash CHAR(64),
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_active_idx
  ON auth_sessions (user_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS auth_sessions_family_idx
  ON auth_sessions (family_id, created_at DESC);

CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx
  ON auth_sessions (expires_at);

ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE auth_sessions FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE auth_sessions IS
  'Server-owned refresh sessions. Only hashes are persisted; rotation is atomic and replay-aware.';
