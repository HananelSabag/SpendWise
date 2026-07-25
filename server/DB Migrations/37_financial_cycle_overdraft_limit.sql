-- A user-entered checking-account overdraft limit for forward-cycle planning.
--
-- This is a presentation threshold only. It never changes bank balances,
-- transactions, cycle accounting, or credit-card reconciliation.

ALTER TABLE financial_cycle_settings
  ADD COLUMN IF NOT EXISTS overdraft_limit numeric(14, 2)
  CHECK (overdraft_limit IS NULL OR overdraft_limit >= 0);
