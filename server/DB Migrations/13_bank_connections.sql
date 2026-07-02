-- ============================================================================
-- 13_bank_connections.sql — Self-service bank connections ("Bank Connect")
-- ============================================================================
-- Applied to Supabase on 2026-07-02 via MCP apply_migration.
--
-- Security model:
--   encrypted_credentials is a tweetnacl SEALED BOX (base64), encrypted in the
--   user's BROWSER with the scraper agent's X25519 public key. The SpendWise
--   server stores it but can NEVER decrypt it — only the local agent machine
--   (private key holder) can. A DB or server breach leaks nothing readable.
--
-- Anti-block model (banks lock accounts on frequent logins):
--   * scheduler enqueues at most 2 jobs per connection per day
--   * consecutive_failures auto-pauses the connection at 3
-- ============================================================================

CREATE TABLE IF NOT EXISTS bank_connections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_source TEXT NOT NULL CHECK (bank_source IN ('yahav','isracard','max','discount')),
  encrypted_credentials TEXT NOT NULL,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','error')),
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, bank_source)
);

CREATE INDEX IF NOT EXISTS bank_connections_active_idx
  ON bank_connections (status) WHERE status = 'active';

-- Job queue: the local agent polls /bank-agent/jobs/claim and reports results.
CREATE TABLE IF NOT EXISTS bank_sync_jobs (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER NOT NULL REFERENCES bank_connections(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','failed')),
  trigger TEXT NOT NULL DEFAULT 'schedule' CHECK (trigger IN ('schedule','manual')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  result JSONB
);

CREATE INDEX IF NOT EXISTS bank_sync_jobs_pending_idx
  ON bank_sync_jobs (status, requested_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS bank_sync_jobs_user_idx
  ON bank_sync_jobs (user_id, requested_at DESC);
