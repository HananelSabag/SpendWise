-- Stores the real bank account balance from spendwise-agent sync payloads.
-- This is separate from the transactions table (which stores individual txns).
-- Purpose: show actual bank balance in the SpendWise balance panel,
--          distinct from the SpendWise calculated net (income - expenses).
CREATE TABLE IF NOT EXISTS bank_accounts (
  user_id        INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_source    TEXT         NOT NULL,
  account_number TEXT         NOT NULL DEFAULT '',
  account_type   TEXT,
  balance        NUMERIC(15,2) NOT NULL DEFAULT 0,
  last_synced_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, bank_source, account_number)
);

CREATE INDEX IF NOT EXISTS bank_accounts_user_idx ON bank_accounts(user_id);
