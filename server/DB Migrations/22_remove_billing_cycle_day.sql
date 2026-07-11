-- Run only after calendar-month server/client code is live.
ALTER TABLE users DROP COLUMN IF EXISTS billing_cycle_day;

