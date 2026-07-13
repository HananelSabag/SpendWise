-- Pending foreign-card authorizations may expose only the original currency
-- amount until the issuer posts the final ILS charge. Keep the temporary ILS
-- estimate explicit so it can be explained and replaced without duplicating the
-- ledger fact when the completed provider row arrives.
-- Applied to production Supabase on 2026-07-13.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS amount_is_estimated BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fx_rate_used NUMERIC(18, 8),
  ADD COLUMN IF NOT EXISTS fx_rate_source TEXT,
  ADD COLUMN IF NOT EXISTS fx_rate_as_of TIMESTAMPTZ;

COMMENT ON COLUMN transactions.amount_is_estimated IS
  'True only while a pending foreign authorization uses a temporary ILS estimate.';
COMMENT ON COLUMN transactions.fx_rate_used IS
  'ILS per one original-currency unit used for a temporary pending estimate.';
COMMENT ON COLUMN transactions.fx_rate_source IS
  'Transparent source for the temporary rate, e.g. boi_representative or provider_history_median.';
