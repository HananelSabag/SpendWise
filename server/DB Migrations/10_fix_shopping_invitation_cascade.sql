-- ✅ SpendWise — Fix shopping_invitations.invitee_id FK
-- Changes ON DELETE SET NULL → ON DELETE CASCADE so that when an invitee
-- user is hard-deleted by an admin, their pending received invitations are
-- also deleted instead of leaving zombie rows with invitee_id = NULL.

ALTER TABLE shopping_invitations
  DROP CONSTRAINT IF EXISTS shopping_invitations_invitee_id_fkey,
  ADD CONSTRAINT shopping_invitations_invitee_id_fkey
    FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE;

-- Clean up any existing zombie rows (invitee_id = NULL from prior deletes)
DELETE FROM shopping_invitations WHERE invitee_id IS NULL AND status = 'pending';
