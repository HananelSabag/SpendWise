-- ============================================================================
-- 15_billing_cycle_day.sql — user financial cycle day
-- ============================================================================
-- Applied to Supabase directly (via MCP) at some point before this file was
-- written — this migration was missing from the tracked history, so a fresh
-- database built from these files alone would have been missing the column
-- that server/middleware/auth.js, server/models/User.js, and the dashboard
-- period calculation (server/utils/financialPeriod.js) all depend on.
--
-- billing_cycle_day is the day of the month (1-31) the user's financial
-- period resets on (e.g. salary day), driving the dashboard's "this period"
-- calculation instead of a rolling day-count window.
--
-- Column + inline CHECK added together so a fresh DB gets the same
-- Postgres-generated constraint name (users_billing_cycle_day_check) already
-- present in production.
-- ============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS billing_cycle_day INTEGER NOT NULL DEFAULT 1
    CHECK (billing_cycle_day BETWEEN 1 AND 31);
