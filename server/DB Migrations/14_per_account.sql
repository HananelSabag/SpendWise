-- ============================================================================
-- 14_per_account.sql — multi-account bank support
-- ============================================================================
-- Applied to Supabase on 2026-07-02 via MCP.
--
-- A bank login can expose several accounts (e.g. Yahav main + a building-
-- committee side account). These changes let each account be tracked and
-- toggled independently.
-- ============================================================================

-- 1. Every bank transaction remembers WHICH account it came from.
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
CREATE INDEX IF NOT EXISTS transactions_bank_account_idx
  ON transactions (user_id, bank_source, bank_account_number)
  WHERE bank_account_number IS NOT NULL;

-- 2. Per-account sync toggle. New accounts default to enabled; the user can
--    turn off ones they don't want. Disabled accounts stay visible (balance
--    still refreshed) but their transactions are not imported.
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;

-- 3. Some banks (e.g. Yahav) don't expose a balance. An account must still be
--    storable with a null balance so it remains visible and toggleable.
ALTER TABLE bank_accounts ALTER COLUMN balance DROP NOT NULL;

-- 4. Add Bank Leumi to the supported sources.
ALTER TABLE bank_connections DROP CONSTRAINT IF EXISTS bank_connections_bank_source_check;
ALTER TABLE bank_connections ADD CONSTRAINT bank_connections_bank_source_check
  CHECK (bank_source IN ('yahav','leumi','isracard','max','discount'));
