-- ============================================================================
-- 19_card_statement_dates.sql -- preserve credit-card debit/payment metadata
-- ============================================================================
-- Israeli card scrapers expose both:
--   * purchase date (`transactions.date`) for spending analytics
--   * processed/debit date for the card statement and financial-cycle totals
--
-- Keeping these separate fixes the cycle-day edge where a purchase made before
-- the 10th but charged by CAL/Max on the 10th disappeared from the new period.
-- Status is retained so pending and completed card activity remain auditable.
-- ============================================================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS bank_processed_date DATE,
  ADD COLUMN IF NOT EXISTS bank_status TEXT;

DO $$
BEGIN
  ALTER TABLE transactions
    ADD CONSTRAINT transactions_bank_status_check
    CHECK (bank_status IS NULL OR bank_status IN ('pending', 'completed'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_user_source_processed_date
  ON transactions (user_id, bank_source, bank_processed_date)
  WHERE deleted_at IS NULL AND bank_source IS NOT NULL;

