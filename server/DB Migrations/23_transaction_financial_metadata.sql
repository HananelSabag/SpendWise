-- Preserve provider facts needed for statement, debit, FX, and installment models.
-- Additive only: existing ledger facts and dates are not rewritten.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS original_currency TEXT,
  ADD COLUMN IF NOT EXISTS charged_currency TEXT,
  ADD COLUMN IF NOT EXISTS txn_kind TEXT,
  ADD COLUMN IF NOT EXISTS installment_number SMALLINT,
  ADD COLUMN IF NOT EXISTS installment_total SMALLINT,
  ADD COLUMN IF NOT EXISTS ledger_class TEXT,
  ADD COLUMN IF NOT EXISTS settlement_card_source TEXT,
  ADD COLUMN IF NOT EXISTS settlement_card_account TEXT;

DO $$
BEGIN
  ALTER TABLE transactions
    ADD CONSTRAINT transactions_installment_position_check
    CHECK (
      (installment_number IS NULL AND installment_total IS NULL)
      OR (
        installment_number > 0
        AND installment_total > 0
        AND installment_number <= installment_total
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_user_ledger_class_date
  ON transactions (user_id, ledger_class, date)
  WHERE deleted_at IS NULL AND ledger_class IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_statement_card
  ON transactions (
    user_id,
    settlement_card_source,
    settlement_card_account,
    bank_processed_date
  )
  WHERE deleted_at IS NULL AND settlement_card_source IS NOT NULL;

COMMENT ON COLUMN transactions.original_amount IS
  'Provider-reported original amount before FX/discount conversion; magnitude only.';
COMMENT ON COLUMN transactions.txn_kind IS
  'Provider transaction kind such as normal or installments.';
COMMENT ON COLUMN transactions.ledger_class IS
  'Derived economic class; nullable until classification is trustworthy.';
COMMENT ON COLUMN transactions.settlement_card_account IS
  'Resolved card last digits for a bank settlement/reconciliation event.';
