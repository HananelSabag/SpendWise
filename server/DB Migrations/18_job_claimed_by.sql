-- ============================================================================
-- 18_job_claimed_by.sql — record WHICH agent claimed each sync job
-- ============================================================================
-- The claim scoping itself is enforced in SQL (a paired device can only ever
-- claim its own user's jobs; the Default Host only claims jobs of users with
-- NO active paired device — see routes/bankAgentRoutes.js). This column makes
-- that visible: 'default-host' or 'device:<label>' per job, so an admin can
-- verify at a glance that e.g. user 1's jobs never ran on user 41's machine.
--
-- Applied to Supabase via MCP apply_migration on 2026-07-10.

ALTER TABLE bank_sync_jobs ADD COLUMN IF NOT EXISTS claimed_by TEXT;
