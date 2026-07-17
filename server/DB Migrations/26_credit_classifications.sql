-- 26_credit_classifications.sql
--
-- What a credit actually is, when only the user can say.
--
-- The engine proves what it can: a loan drawdown is provable because repayments arrive under
-- the provider's own identifier. But a bank handing back the exact amount of a card bill two
-- days later is a strong hint, not a fact — Leumi's "פריסה לתשלומים" spreads a bill into a loan,
-- and no provider field says so. Booking that silently as income would overstate a month by the
-- full bill; booking it silently as debt would understate it. So we ask once, and remember.
--
-- Keyed by transaction, not by identifier: identifiers are the provider's and may repeat across
-- institutions, while a transaction id is ours and unambiguous.

CREATE TABLE IF NOT EXISTS credit_classifications (
  transaction_id integer PRIMARY KEY REFERENCES transactions(id) ON DELETE CASCADE,
  user_id        integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- income:    money that is the user's (salary, a transfer, a refund)
  -- financing: borrowed money that must be paid back, and is therefore never income
  class          text    NOT NULL CHECK (class IN ('income', 'financing')),
  -- Why we asked, so a future reader can tell a considered answer from a stray tap.
  reason         text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- The cycle engine reads every answer a user has ever given, on every cycle build.
CREATE INDEX IF NOT EXISTS credit_classifications_user_idx
  ON credit_classifications (user_id);

-- The browser never talks to this table directly; all access goes through the authenticated
-- Express API. Keep Supabase's anon/authenticated roles out by default while the server's table-
-- owner connection continues to work normally.
ALTER TABLE credit_classifications ENABLE ROW LEVEL SECURITY;
