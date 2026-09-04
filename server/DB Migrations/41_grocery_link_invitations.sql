-- ✅ SpendWise — open link invitations for the shared grocery list
--
-- Migration 40 addressed every invitation to a specific email, which is the
-- safer shape but makes the common case heavy: to add your partner to the
-- household list you had to type their address, and delivery depended on an
-- email provider that isn't configured.
--
-- This adds the other shape alongside it: an invitation with no recipient,
-- redeemable by whoever opens the link. It is a deliberate trade — anyone
-- holding the link can join — bounded by the same guards as before:
--   * joining is still an explicit Accept, never a side effect of opening it
--   * the link expires (14 days) and the owner can revoke it at any time
--   * only ONE open link may be pending per list, so revoking really revokes
--
-- Addressed invitations are unchanged and remain the stricter option.
--
-- Idempotent and transactional.

BEGIN;

-- An invitation with no invitee_email is an open link.
ALTER TABLE grocery_list_invitations
    ALTER COLUMN invitee_email DROP NOT NULL;

-- The existing uq_grocery_invitation_pending index is on
-- (list_id, invitee_email) WHERE status = 'pending'. Postgres treats NULLs as
-- distinct there, so it would happily allow a pile of open links per list.
-- This one keeps exactly one, which is what makes "revoke the link" meaningful.
CREATE UNIQUE INDEX IF NOT EXISTS uq_grocery_invitation_open_link
    ON grocery_list_invitations(list_id)
    WHERE status = 'pending' AND invitee_email IS NULL;

COMMIT;

-- ─────────────────────────────────────────────────────────────
-- VERIFICATION
-- ─────────────────────────────────────────────────────────────
-- SELECT is_nullable FROM information_schema.columns
--  WHERE table_name = 'grocery_list_invitations' AND column_name = 'invitee_email';
--   → YES
--
-- SELECT indexname FROM pg_indexes
--  WHERE tablename = 'grocery_list_invitations' AND indexname = 'uq_grocery_invitation_open_link';
--   → one row
--
-- -- at most one open link pending per list
-- SELECT list_id, COUNT(*) FROM grocery_list_invitations
--  WHERE status = 'pending' AND invitee_email IS NULL
--  GROUP BY list_id HAVING COUNT(*) > 1;   → 0 rows
--
-- ROLLBACK:
--   DROP INDEX IF EXISTS uq_grocery_invitation_open_link;
--   DELETE FROM grocery_list_invitations WHERE invitee_email IS NULL;
--   ALTER TABLE grocery_list_invitations ALTER COLUMN invitee_email SET NOT NULL;
