-- ============================================================================
-- 44_grocery_multiple_lists.sql
--
-- Let a person belong to more than one grocery list.
--
-- WHY
-- ---
-- Until now a user worked on exactly one list, and accepting an invitation
-- while already in one was REFUSED (`GROCERY_ALREADY_IN_ANOTHER_LIST` /
-- `GROCERY_OWN_LIST_NOT_EMPTY`). In practice that made a shared link a dead end
-- for the exact person most likely to be sent one: someone who already runs a
-- household list. The only remedy the app could offer was "empty or close your
-- own list first", i.e. destroy the list you actually use in order to accept.
--
-- The schema never needed the restriction — `grocery_list_members` is a plain
-- join table and has always allowed several rows per user. The restriction
-- lived entirely in application logic. What was genuinely missing is a way to
-- know WHICH list a person is looking at, which is what this migration adds.
--
-- WHAT
-- ----
-- `last_opened_at` on the membership row: the per-user "currently open" marker.
-- Per user *and* per list, deliberately — two people on the same list are each
-- somewhere different, and a column on `grocery_lists` could not express that.
-- NULL means "never explicitly opened", which orders last.
--
-- NOT CHANGED
-- -----------
--   * one live list per OWNER (partial unique index) — you still create exactly
--     one list of your own; extra lists arrive by invitation.
--   * one active trip per list.
--   * membership is still the single authorization rule.
--
-- Rollback:  ALTER TABLE grocery_list_members DROP COLUMN last_opened_at;
-- ============================================================================

BEGIN;

ALTER TABLE grocery_list_members
    ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMPTZ;

COMMENT ON COLUMN grocery_list_members.last_opened_at IS
    'When this user last opened this list. Highest value = the list they are on. NULL = never explicitly opened.';

-- Seed it so existing members keep landing on the list they were already using:
-- the old resolver preferred a list shared WITH you over your own, so preserve
-- exactly that ordering as the starting point.
UPDATE grocery_list_members m
   SET last_opened_at = m.joined_at
  FROM grocery_lists l
 WHERE l.id = m.list_id
   AND l.archived_at IS NULL
   AND m.role = 'member'
   AND m.last_opened_at IS NULL;

-- Resolving "which list is this user on" reads membership by user and orders by
-- this column on every single grocery request.
CREATE INDEX IF NOT EXISTS idx_grocery_members_user_opened
    ON grocery_list_members (user_id, last_opened_at DESC NULLS LAST);

COMMIT;

-- ── Verification ────────────────────────────────────────────────────────────
-- SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--  WHERE table_name = 'grocery_list_members' AND column_name = 'last_opened_at';
--
-- SELECT m.user_id, m.list_id, m.role, m.last_opened_at
--   FROM grocery_list_members m ORDER BY m.user_id, m.last_opened_at DESC NULLS LAST;
