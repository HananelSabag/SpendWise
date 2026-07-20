-- Financial-cycle v5: durable recurring classifications and one estimate preference.
--
-- The bank transaction remains immutable.  These columns only enrich the existing user override
-- with the recurring meaning selected in Cycle Control.  Identity continues to come from the
-- referenced provider transaction (bank source/account + stable provider identifier when present).

ALTER TABLE cycle_transaction_overrides
  ADD COLUMN IF NOT EXISTS recurrence_kind text,
  ADD COLUMN IF NOT EXISTS recurrence_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE cycle_transaction_overrides
  DROP CONSTRAINT IF EXISTS cycle_transaction_overrides_recurrence_kind_check;

ALTER TABLE cycle_transaction_overrides
  ADD CONSTRAINT cycle_transaction_overrides_recurrence_kind_check CHECK (
    recurrence_kind IS NULL OR recurrence_kind IN (
      'salary', 'recurring_income',
      'loan_repayment', 'standing_order', 'electricity', 'water', 'gas',
      'municipal_tax', 'car_insurance', 'other_insurance', 'recurring_bill',
      'fixed_monthly_expense'
    )
  );

ALTER TABLE financial_cycle_settings
  ADD COLUMN IF NOT EXISTS use_estimates boolean NOT NULL DEFAULT true;

-- Closed-cycle arithmetic is unchanged, but v5 prevents old derived payloads from being mixed
-- with the new recurring projection contract.
ALTER TABLE financial_cycle_aggregates
  ALTER COLUMN calculation_version SET DEFAULT 5;

DELETE FROM financial_cycle_aggregates
 WHERE calculation_version < 5;
