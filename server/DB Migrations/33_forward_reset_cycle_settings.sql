-- Forward-reset cycle settings and calculation v4.
--
-- The bank ledger remains immutable. This table stores only the user's preferred way to draw
-- reporting windows: automatic household-income detection or a fixed monthly reset day.

CREATE TABLE IF NOT EXISTS financial_cycle_settings (
  user_id           integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  engine_mode       text NOT NULL DEFAULT 'automatic'
                    CHECK (engine_mode IN ('automatic', 'manual')),
  manual_anchor_day smallint
                    CHECK (manual_anchor_day BETWEEN 1 AND 31),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (engine_mode <> 'manual' OR manual_anchor_day IS NOT NULL)
);

ALTER TABLE financial_cycle_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON financial_cycle_settings FROM anon, authenticated;

-- Closed-cycle aggregates depend on the selected boundary and the new signed daily analysis.
ALTER TABLE financial_cycle_aggregates
  ALTER COLUMN calculation_version SET DEFAULT 4;

DELETE FROM financial_cycle_aggregates
 WHERE calculation_version < 4;
