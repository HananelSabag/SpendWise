-- Financial-cycle calculation v3: signed refunds, user overrides and actionable control alerts.
--
-- All changes are additive. Raw transactions remain immutable; a user correction is stored as
-- a separate, auditable instruction consumed only by the financial-cycle engine.

CREATE TABLE IF NOT EXISTS cycle_transaction_overrides (
  transaction_id integer PRIMARY KEY REFERENCES transactions(id) ON DELETE CASCADE,
  user_id        integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  classification text NOT NULL CHECK (classification IN (
    'salary', 'income', 'financing', 'refund', 'expense', 'transfer', 'exclude'
  )),
  reason         text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cycle_transaction_overrides_user_idx
  ON cycle_transaction_overrides (user_id);

ALTER TABLE cycle_transaction_overrides ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON cycle_transaction_overrides FROM anon, authenticated;

-- One unresolved alert per issue. Repeated cycle reads must not fill the notification centre.
CREATE UNIQUE INDEX IF NOT EXISTS notifications_cycle_issue_unread_idx
  ON notifications (user_id, type, ((data ->> 'issueKey')))
  WHERE type = 'cycle_action_required'
    AND is_read = false
    AND data ? 'issueKey';

-- Versioned aggregates are derived data. Rebuild them from raw rows with the signed-refund
-- semantics rather than mixing old and new calculation versions in yearly reviews.
ALTER TABLE financial_cycle_aggregates
  ALTER COLUMN calculation_version SET DEFAULT 3;

DELETE FROM financial_cycle_aggregates
 WHERE calculation_version < 3;
