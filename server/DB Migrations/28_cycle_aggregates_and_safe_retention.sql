-- Durable financial-cycle history plus conservative retention controls.
-- Additive/reversible: no production rows are deleted by this migration.

CREATE TABLE IF NOT EXISTS financial_cycle_aggregates (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cycle_start DATE NOT NULL,
  cycle_end DATE NOT NULL,
  income NUMERIC(14,2) NOT NULL,
  expenses NUMERIC(14,2) NOT NULL,
  operating_net NUMERIC(14,2) NOT NULL,
  financing NUMERIC(14,2) NOT NULL DEFAULT 0,
  bank_movement NUMERIC(14,2) NOT NULL,
  timing_adjustment NUMERIC(14,2) NOT NULL DEFAULT 0,
  category_totals JSONB NOT NULL DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, cycle_start),
  CHECK (cycle_end > cycle_start)
);

ALTER TABLE financial_cycle_aggregates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE financial_cycle_aggregates FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS financial_cycle_aggregates_user_year_idx
  ON financial_cycle_aggregates (user_id, cycle_start DESC);

-- Supports bounded cycle source queries without a COALESCE expression scan.
CREATE INDEX IF NOT EXISTS transactions_cycle_processed_idx
  ON transactions (user_id, bank_processed_date, id)
  WHERE deleted_at IS NULL AND bank_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS transactions_cycle_date_fallback_idx
  ON transactions (user_id, date, id)
  WHERE deleted_at IS NULL AND bank_source IS NOT NULL AND bank_processed_date IS NULL;

CREATE INDEX IF NOT EXISTS salary_signatures_cycle_anchor_idx
  ON salary_signatures (user_id, id)
  WHERE active = true;

-- Migration 20 scheduled real cleanup directly. Put a disabled-by-default gate
-- in front of that implementation so cron and manual calls are dry/safe until
-- an operator explicitly enables retention after reviewing a preview.
ALTER TABLE data_retention_settings
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT false;

UPDATE data_retention_settings SET enabled = false WHERE id = 1;

DO $$
BEGIN
  IF to_regprocedure('public.run_data_retention_unchecked(boolean)') IS NULL
     AND to_regprocedure('public.run_data_retention(boolean)') IS NOT NULL THEN
    ALTER FUNCTION public.run_data_retention(boolean)
      RENAME TO run_data_retention_unchecked;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.run_data_retention(p_dry_run BOOLEAN DEFAULT true)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_enabled BOOLEAN := false;
BEGIN
  IF p_dry_run THEN
    RETURN public.preview_data_retention();
  END IF;

  SELECT enabled INTO v_enabled
    FROM public.data_retention_settings
   WHERE id = 1;

  IF NOT COALESCE(v_enabled, false) THEN
    RETURN jsonb_build_object(
      'status', 'skipped',
      'reason', 'retention_disabled',
      'dry_run', false
    );
  END IF;

  RETURN public.run_data_retention_unchecked(false);
END;
$$;

-- Migration 20 granted service_role access to the original function. Function
-- renames preserve ACLs, so revoke that inherited grant as well or callers can
-- bypass the new safety gate by invoking the renamed implementation directly.
REVOKE ALL ON FUNCTION public.run_data_retention_unchecked(BOOLEAN)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.run_data_retention(BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_data_retention(BOOLEAN) TO service_role;

COMMENT ON TABLE financial_cycle_aggregates IS
  'Durable closed salary-cycle totals used after raw transaction retention.';
COMMENT ON COLUMN data_retention_settings.enabled IS
  'Global retention gate. False by default; preview remains available.';
