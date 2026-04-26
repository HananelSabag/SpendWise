-- ============================================================
-- 08_dashboard_perf_indexes.sql
-- ============================================================
-- REWRITTEN against the LIVE database state (verified via Supabase MCP),
-- not against what the previous migration files claimed. Major findings:
--
--   • Live data is TINY: ~119 rows in transactions, 4 users.
--     EXPLAIN ANALYZE on real dashboard queries showed:
--       Transaction.getRecent: 1.4ms
--       Balance period sum:    0.3ms
--       get_dashboard_summary: 10ms
--     ⇒  DB query speed is NOT the cause of the 5–10s warm dashboard load.
--        That comes from network RTT (Render us-east → Supabase eu-north-1
--        ≈ 150ms each way) × multiple parallel API calls + Render's 0.1 vCPU.
--
--   • Several indexes the migration files claim to create DON'T EXIST in
--     prod (idx_transactions_type, idx_transactions_status, idx_transactions_
--     template_id, idx_transactions_category_id, idx_transactions_created_at).
--
--   • Composite (user_id, date) ALREADY EXISTS — the original v1 of this
--     migration was redundant.
--
--   • Supabase advisor flagged unindexed FKs on transactions.category_id and
--     recurring_templates.{user_id, category_id} — those are the real wins,
--     because every dashboard JOIN goes through them.
--
--   • Three indexes are flagged "unused" by the advisor and are redundant
--     with composite indexes. We drop them — not for query speed (queries
--     don't use them), but for write speed: every INSERT/UPDATE on
--     transactions has to update every index. Fewer dead indexes = faster
--     writes and less memory on the 512MB free-tier instance.
--
-- WHEN TO APPLY:
--   • Anytime — uses CONCURRENTLY where possible, doesn't lock the tables.
--   • Recommended path: paste into Supabase SQL Editor and run statement by
--     statement (Supabase forbids CONCURRENTLY inside an explicit transaction).
--   • Or apply via apply_migration MCP tool.
-- ============================================================


-- 1. Foreign-key covering indexes the Supabase advisor flagged.
--    These actually matter for the dashboard's JOIN to categories.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_category_id
  ON transactions (category_id)
  WHERE category_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recurring_templates_user_active
  ON recurring_templates (user_id, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recurring_templates_category_id
  ON recurring_templates (category_id)
  WHERE category_id IS NOT NULL;


-- 2. Recent-transactions widget tiebreak: ORDER BY date DESC, created_at DESC.
--    Helps once the table grows past a few hundred rows; harmless at current scale.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_created_at
  ON transactions (user_id, created_at DESC)
  WHERE deleted_at IS NULL;


-- 3. Replace the bad-column-order status index with a useful one.
--    Old: (status, user_id, date) — status is low cardinality, useless as leading column.
--    New: (user_id, status, date) — matches actual WHERE user_id=? AND status=?.
DROP INDEX CONCURRENTLY IF EXISTS idx_transactions_status_user_date;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_status_date
  ON transactions (user_id, status, date)
  WHERE deleted_at IS NULL;


-- 4. Remove indexes the advisor confirmed have NEVER been used (redundant
--    with the composite idx_transactions_user_date). Fewer indexes =
--    faster INSERTs/UPDATEs, less memory pressure on the 512MB instance.
DROP INDEX CONCURRENTLY IF EXISTS idx_transactions_date;     -- single col, never used
DROP INDEX CONCURRENTLY IF EXISTS idx_transactions_user_id;  -- single col, redundant


-- 5. Postgres 17 / glibc collation refresh. The logs are spammed with
--    'database "postgres" has a collation version mismatch' warnings —
--    this clears them.
ALTER DATABASE postgres REFRESH COLLATION VERSION;


-- 6. ANALYZE so the planner picks up new stats immediately.
ANALYZE transactions;
ANALYZE recurring_templates;
ANALYZE categories;


-- ============================================================
-- VERIFICATION
--
--   Confirm the planner picks the right indexes:
--
--   EXPLAIN ANALYZE
--   SELECT id FROM transactions
--   WHERE user_id = 1 AND deleted_at IS NULL
--   ORDER BY date DESC LIMIT 10;
--   -- expect: "Index Scan ... using idx_transactions_user_date"
--
--   SELECT * FROM pg_indexes
--   WHERE tablename = 'transactions'
--   ORDER BY indexname;
-- ============================================================
