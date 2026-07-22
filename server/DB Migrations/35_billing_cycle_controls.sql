-- Financial-cycle v6: billing-day windows, manageable recurring groups and per-card controls.
-- Raw provider transactions remain immutable; every field here is user-authored presentation or
-- forecasting metadata.

ALTER TABLE cycle_transaction_overrides
  ADD COLUMN IF NOT EXISTS recurrence_group_id uuid,
  ADD COLUMN IF NOT EXISTS recurrence_label text,
  ADD COLUMN IF NOT EXISTS recurrence_include_estimate boolean NOT NULL DEFAULT true;

ALTER TABLE cycle_transaction_overrides
  DROP CONSTRAINT IF EXISTS cycle_transaction_overrides_recurrence_label_check;

ALTER TABLE cycle_transaction_overrides
  ADD CONSTRAINT cycle_transaction_overrides_recurrence_label_check CHECK (
    recurrence_label IS NULL OR char_length(recurrence_label) BETWEEN 1 AND 100
  );

CREATE INDEX IF NOT EXISTS cycle_transaction_overrides_recurrence_group_idx
  ON cycle_transaction_overrides (user_id, recurrence_group_id)
  WHERE recurrence_group_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS financial_card_settings (
  user_id               integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_source           text NOT NULL,
  bank_account_number   text NOT NULL,
  statement_day         smallint CHECK (statement_day BETWEEN 1 AND 31),
  included              boolean NOT NULL DEFAULT true,
  linked_transaction_id integer REFERENCES transactions(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, bank_source, bank_account_number)
);

ALTER TABLE financial_card_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON financial_card_settings FROM anon, authenticated;

ALTER TABLE financial_cycle_aggregates
  ALTER COLUMN calculation_version SET DEFAULT 6;

DELETE FROM financial_cycle_aggregates
 WHERE calculation_version < 6;
