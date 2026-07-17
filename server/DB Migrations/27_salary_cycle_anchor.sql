-- A household may receive more than one salary into the same account.
-- Only the chosen anchor salary opens/closes financial-cycle windows; additional salaries
-- remain ordinary income inside that window instead of creating four-day pseudo-cycles.

ALTER TABLE salary_signatures
  ADD COLUMN IF NOT EXISTS cycle_anchor BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN salary_signatures.cycle_anchor IS
  'True when this salary identity opens financial-cycle windows; false for additional household salaries that remain income inside the primary cycle.';
