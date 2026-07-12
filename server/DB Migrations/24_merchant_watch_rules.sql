-- User-created merchant monitoring rules.
-- Rules observe ledger facts; they never rewrite, categorize or exclude them.

CREATE TABLE IF NOT EXISTS merchant_watch_rules (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_merchant TEXT NOT NULL,
  normalized_merchant TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('all', 'above', 'exact')),
  amount NUMERIC(14,2),
  created_from_transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT merchant_watch_amount_check CHECK (
    (condition = 'all' AND amount IS NULL)
    OR (condition IN ('above', 'exact') AND amount > 0)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS merchant_watch_rules_unique_active
  ON merchant_watch_rules (
    user_id,
    normalized_merchant,
    condition,
    COALESCE(amount, -1)
  )
  WHERE active = true;

CREATE INDEX IF NOT EXISTS merchant_watch_rules_user_active
  ON merchant_watch_rules (user_id, created_at DESC)
  WHERE active = true;
