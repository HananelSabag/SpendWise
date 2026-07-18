-- Cycle calculation v2: an opening salary closes the prior economic cycle.
-- Aggregates are derived/cache data, so stale v1 rows must never feed yearly reviews.

ALTER TABLE financial_cycle_aggregates
  ADD COLUMN IF NOT EXISTS calculation_version INTEGER;

UPDATE financial_cycle_aggregates
   SET calculation_version = 1
 WHERE calculation_version IS NULL;

ALTER TABLE financial_cycle_aggregates
  ALTER COLUMN calculation_version SET DEFAULT 2;

ALTER TABLE financial_cycle_aggregates
  ALTER COLUMN calculation_version SET NOT NULL;

DELETE FROM financial_cycle_aggregates
 WHERE calculation_version < 2;
