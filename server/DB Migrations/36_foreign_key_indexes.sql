-- Cover foreign keys used by deletes, joins, and retention jobs.
-- All statements are idempotent so the migration is safe to re-run.

CREATE INDEX IF NOT EXISTS admin_activity_log_admin_id_idx
  ON public.admin_activity_log (admin_id);
CREATE INDEX IF NOT EXISTS admin_activity_log_target_user_id_idx
  ON public.admin_activity_log (target_user_id);
CREATE INDEX IF NOT EXISTS auth_sessions_replaced_by_idx
  ON public.auth_sessions (replaced_by);
CREATE INDEX IF NOT EXISTS email_verification_tokens_user_id_idx
  ON public.email_verification_tokens (user_id);
CREATE INDEX IF NOT EXISTS financial_card_settings_linked_transaction_id_idx
  ON public.financial_card_settings (linked_transaction_id);
CREATE INDEX IF NOT EXISTS merchant_watch_rules_created_from_transaction_id_idx
  ON public.merchant_watch_rules (created_from_transaction_id);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
  ON public.password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS salary_signatures_created_from_transaction_id_idx
  ON public.salary_signatures (created_from_transaction_id);
CREATE INDEX IF NOT EXISTS system_settings_updated_by_idx
  ON public.system_settings (updated_by);
CREATE INDEX IF NOT EXISTS user_restrictions_applied_by_idx
  ON public.user_restrictions (applied_by);
