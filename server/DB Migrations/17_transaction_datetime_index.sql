-- ============================================================================
-- 17_transaction_datetime_index.sql — index for the list/recent hot path
-- ============================================================================
-- The transactions list and the dashboard "recent" query now order by
-- transaction_datetime (real event time) instead of created_at (ingest
-- time). Partial on live rows since every read filters deleted_at IS NULL
-- (tombstoned bank rows only exist to block re-import).
--
-- Applied to Supabase via MCP apply_migration on 2026-07-10.

CREATE INDEX IF NOT EXISTS idx_transactions_user_datetime
  ON transactions (user_id, transaction_datetime DESC)
  WHERE deleted_at IS NULL;
