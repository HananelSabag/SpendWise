-- ============================================================================
-- 16_expand_bank_sources.sql — allow every institution the product offers
-- ============================================================================
-- The connect picker (client BANK_FORMS), the server registry
-- (config/institutions.js VALID_SOURCES) and the agent (src/core/banks.js)
-- all support 14 institutions, but this CHECK still allowed only the 5 the
-- project started with — so connecting any of the other 9 passed every
-- validation layer and then failed here with a generic 500, AFTER the user
-- had typed real bank credentials. Keep this list in lockstep with
-- config/institutions.js.
--
-- Applied to Supabase via MCP apply_migration on 2026-07-09.

ALTER TABLE bank_connections DROP CONSTRAINT IF EXISTS bank_connections_bank_source_check;
ALTER TABLE bank_connections ADD CONSTRAINT bank_connections_bank_source_check
  CHECK (bank_source IN (
    'yahav','hapoalim','leumi','mizrahi','discount','mercantile',
    'otsar_hahayal','beinleumi','massad','pagi',
    'isracard','amex','visa_cal','max'
  ));
