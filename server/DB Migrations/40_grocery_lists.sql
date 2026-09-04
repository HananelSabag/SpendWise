-- ✅ SpendWise — Shared household grocery list (replaces the shopping wishlist)
--
-- The previous feature (migrations 09/10/11) modelled a personal *wishlist* of
-- household products: items hung directly off a user_id, "sharing" was a bag of
-- (owner, member) pairs, categories were Hebrew display strings stored as domain
-- identifiers, and there was no list, no shopping trip, and no history.
--
-- This migration replaces it with a list-centric model:
--
--   grocery_lists              one shared household list (owner + members)
--   grocery_list_members       symmetric membership; the owner has a row too
--   grocery_list_invitations   invitations by email, registered or not
--   grocery_trips              one active trip per list + the completed archive
--   grocery_items              items belong to a trip, never to a user
--
-- Authorization is list-based and symmetric: every accepted member may edit every
-- item. Authorship (added_by / purchased_by) is recorded for history only.
--
-- Concurrency: `grocery_lists` carries a server-authoritative edit lease
-- (lock_user_id / lock_token / lock_expires_at) and a monotonic `version` that
-- viewers poll to detect changes.
--
-- LEGACY DATA: the old wishlist held 7 rows, all already marked purchased
-- (furniture and appliances from May 2026) and all owned by a single user.
-- The product owner explicitly asked for a clean start with no carry-over, so
-- the old tables are dropped at the end of this file rather than backfilled.
-- Rollback = re-run migrations 09/10/11 (the data itself is not recoverable).
--
-- Idempotent: safe to re-run. Transactional: all-or-nothing.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- 1. LISTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grocery_lists (
    id                BIGSERIAL PRIMARY KEY,
    owner_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name              VARCHAR(120) NOT NULL DEFAULT 'Household',

    -- Bumped on every mutation. Viewers poll this instead of refetching items.
    version           BIGINT  NOT NULL DEFAULT 1,

    -- Server-authoritative edit lease. All four columns move together.
    lock_user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    lock_session_id   VARCHAR(64),
    lock_token        UUID,
    lock_acquired_at  TIMESTAMPTZ,
    lock_expires_at   TIMESTAMPTZ,

    archived_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_grocery_lists_lock_pairing CHECK (
        (lock_user_id IS NULL AND lock_token IS NULL AND lock_expires_at IS NULL)
        OR
        (lock_user_id IS NOT NULL AND lock_token IS NOT NULL AND lock_expires_at IS NOT NULL)
    )
);

-- One live list per owner today; the partial predicate leaves room for
-- additional (archived or future named) lists without a schema change.
CREATE UNIQUE INDEX IF NOT EXISTS uq_grocery_lists_active_owner
    ON grocery_lists(owner_id) WHERE archived_at IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. MEMBERS
--    The owner also gets a row (role = 'owner') so that every
--    authorization check is a single membership lookup.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grocery_list_members (
    id         BIGSERIAL PRIMARY KEY,
    list_id    BIGINT  NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       VARCHAR(10) NOT NULL DEFAULT 'member'
                   CHECK (role IN ('owner', 'member')),
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_grocery_list_members UNIQUE (list_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_grocery_list_members_user
    ON grocery_list_members(user_id);

-- ─────────────────────────────────────────────────────────────
-- 3. INVITATIONS
--    invitee_id is NULL until the invited email owns an account,
--    which is what makes the "invite someone who hasn't signed up
--    yet" flow possible: registration links the row by email.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grocery_list_invitations (
    id             BIGSERIAL PRIMARY KEY,
    list_id        BIGINT  NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
    inviter_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_email  VARCHAR(255) NOT NULL,
    invitee_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token          UUID NOT NULL DEFAULT gen_random_uuid(),
    status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
    expires_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
    responded_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_grocery_invitation_token UNIQUE (token),
    CONSTRAINT chk_grocery_invitation_email_lower CHECK (invitee_email = LOWER(invitee_email))
);

-- At most one *live* invitation per (list, email). Resolved rows stay for history.
CREATE UNIQUE INDEX IF NOT EXISTS uq_grocery_invitation_pending
    ON grocery_list_invitations(list_id, invitee_email) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_grocery_invitation_invitee
    ON grocery_list_invitations(invitee_id) WHERE invitee_id IS NOT NULL AND status = 'pending';

CREATE INDEX IF NOT EXISTS idx_grocery_invitation_email_pending
    ON grocery_list_invitations(invitee_email) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_grocery_invitation_list
    ON grocery_list_invitations(list_id);

-- ─────────────────────────────────────────────────────────────
-- 4. TRIPS
--    The single 'active' trip *is* the current shopping list.
--    Completing it archives it and opens a fresh empty one.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grocery_trips (
    id              BIGSERIAL PRIMARY KEY,
    list_id         BIGINT NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
    status          VARCHAR(12) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'completed')),
    store_name      VARCHAR(120),
    total_ils       NUMERIC(10, 2) CHECK (total_ils IS NULL OR total_ils >= 0),

    -- Storage object PATH inside a private bucket, never a public URL.
    -- Reads go through the API, which mints a short-lived signed URL.
    receipt_path    TEXT,
    receipt_mime    VARCHAR(60),

    -- Set only when the user explicitly pushes the trip into SpendWise.
    transaction_id  INTEGER REFERENCES transactions(id) ON DELETE SET NULL,

    completed_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_grocery_trip_completion CHECK (
        (status = 'active'    AND completed_at IS NULL)
        OR
        (status = 'completed' AND completed_at IS NOT NULL)
    )
);

-- Exactly one active trip per list — this is the invariant the whole
-- "finish shopping → fresh list" cycle depends on.
CREATE UNIQUE INDEX IF NOT EXISTS uq_grocery_trips_active
    ON grocery_trips(list_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_grocery_trips_history
    ON grocery_trips(list_id, completed_at DESC) WHERE status = 'completed';

-- One manual expense per trip, at most.
CREATE UNIQUE INDEX IF NOT EXISTS uq_grocery_trips_transaction
    ON grocery_trips(transaction_id) WHERE transaction_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 5. ITEMS
--    Language-neutral category keys. Display labels live in the
--    client translation files, never in the database.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grocery_items (
    id             BIGSERIAL PRIMARY KEY,
    trip_id        BIGINT NOT NULL REFERENCES grocery_trips(id) ON DELETE CASCADE,
    name           VARCHAR(200) NOT NULL,
    category_key   VARCHAR(32) NOT NULL DEFAULT 'other'
                       CHECK (category_key IN (
                           'produce', 'bakery', 'dairy_eggs', 'meat_fish',
                           'pantry', 'frozen', 'snacks_sweets', 'beverages',
                           'baby', 'household', 'personal_care', 'other'
                       )),
    quantity       NUMERIC(8, 2) CHECK (quantity IS NULL OR quantity > 0),
    unit           VARCHAR(16),
    note           TEXT,
    image_url      TEXT,
    product_url    TEXT,
    sort_order     INTEGER NOT NULL DEFAULT 0,

    is_purchased   BOOLEAN NOT NULL DEFAULT false,
    added_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
    purchased_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    purchased_at   TIMESTAMPTZ,

    -- Optimistic-concurrency stamp for a single row.
    version        INTEGER NOT NULL DEFAULT 1,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_grocery_item_purchase CHECK (
        (is_purchased = false AND purchased_at IS NULL)
        OR
        (is_purchased = true  AND purchased_at IS NOT NULL)
    ),
    CONSTRAINT chk_grocery_item_name_not_blank CHECK (LENGTH(BTRIM(name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_grocery_items_trip
    ON grocery_items(trip_id, is_purchased, category_key, sort_order);

CREATE INDEX IF NOT EXISTS idx_grocery_items_added_by
    ON grocery_items(added_by) WHERE added_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_grocery_items_purchased_by
    ON grocery_items(purchased_by) WHERE purchased_by IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 6. updated_at triggers (reuse the existing helper)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_grocery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_grocery_lists_updated_at ON grocery_lists;
CREATE TRIGGER trg_grocery_lists_updated_at
    BEFORE UPDATE ON grocery_lists
    FOR EACH ROW EXECUTE FUNCTION set_grocery_updated_at();

DROP TRIGGER IF EXISTS trg_grocery_items_updated_at ON grocery_items;
CREATE TRIGGER trg_grocery_items_updated_at
    BEFORE UPDATE ON grocery_items
    FOR EACH ROW EXECUTE FUNCTION set_grocery_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 7. Notifications: widen `type` usage (no schema change needed).
--    New stable types, all localized on the client:
--      grocery_invite, grocery_invite_accepted, grocery_invite_declined,
--      grocery_member_removed, grocery_list_disbanded, grocery_trip_completed
--    Retire the old Hebrew-bodied shopping_* notifications.
-- ─────────────────────────────────────────────────────────────
DELETE FROM notifications WHERE type LIKE 'shopping%';

-- ─────────────────────────────────────────────────────────────
-- 8. Drop the superseded wishlist tables.
--    Deliberate and approved: the only rows were 7 already-purchased
--    household items belonging to one user.
-- ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS shopping_invitations CASCADE;
DROP TABLE IF EXISTS shopping_shares      CASCADE;
DROP TABLE IF EXISTS shopping_items       CASCADE;
DROP FUNCTION IF EXISTS update_shopping_items_updated_at() CASCADE;

COMMIT;

-- ─────────────────────────────────────────────────────────────
-- VERIFICATION
-- ─────────────────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables
--  WHERE table_schema = 'public' AND table_name LIKE 'grocery%'
--  ORDER BY table_name;
--   → grocery_items, grocery_list_invitations, grocery_list_members,
--     grocery_lists, grocery_trips
--
-- SELECT to_regclass('public.shopping_items');   → NULL
--
-- -- exactly one active trip per list
-- SELECT list_id, COUNT(*) FROM grocery_trips WHERE status = 'active'
--  GROUP BY list_id HAVING COUNT(*) > 1;         → 0 rows
--
-- -- every list owner is also a member row
-- SELECT l.id FROM grocery_lists l
--  WHERE NOT EXISTS (SELECT 1 FROM grocery_list_members m
--                    WHERE m.list_id = l.id AND m.user_id = l.owner_id);  → 0 rows
--
-- ROLLBACK (destructive, drops the new feature's data):
--   DROP TABLE IF EXISTS grocery_items, grocery_trips,
--     grocery_list_invitations, grocery_list_members, grocery_lists CASCADE;
--   DROP FUNCTION IF EXISTS set_grocery_updated_at() CASCADE;
--   then re-run 09_shopping_and_notifications.sql, 10_*, 11_* to restore the
--   old (empty) wishlist tables.
