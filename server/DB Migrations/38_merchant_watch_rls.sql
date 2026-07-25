-- Merchant-watch rules are private financial metadata and are accessed only
-- through the authenticated Express API. The API always scopes reads/writes
-- by req.user.id and connects with the server-owned PostgreSQL role.
--
-- No anon/authenticated policy is intentional: direct Supabase Data API access
-- must be denied. The server role/table owner continues to bypass RLS.

ALTER TABLE public.merchant_watch_rules ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.merchant_watch_rules IS
  'Server-only user-scoped merchant monitoring rules; direct anon/authenticated access is denied by RLS.';
