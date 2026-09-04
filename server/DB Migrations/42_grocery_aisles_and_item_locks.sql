-- ✅ SpendWise — real supermarket aisles, and per-item edit locking
--
-- Two changes, both driven by using the thing.
--
-- 1. AISLES. Israeli supermarkets shelve alcohol and disposables as their own
--    departments, and folding them into "beverages" and "household" sent you to
--    the wrong end of the shop. Added in aisle order.
--
-- 2. LOCKING. The list-level edit lease was too blunt: one person touching the
--    list froze the other out of the whole thing for up to 60 seconds, for no
--    good reason. Two people adding different items, or checking off different
--    items, cannot conflict — the only genuine collision is two people editing
--    the SAME item's fields at once. That is now a short claim on the item, and
--    the list-level lock is retired.
--
--    Concurrency for everything else is already covered:
--      * item edits carry `version` (optimistic concurrency, 409 on stale)
--      * one active trip per list is a partial unique index
--      * `grocery_lists.version` still drives live polling and stays
--
-- Idempotent and transactional.

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. Two more aisles
-- ─────────────────────────────────────────────────────────────
ALTER TABLE grocery_items
    DROP CONSTRAINT IF EXISTS grocery_items_category_key_check;

ALTER TABLE grocery_items
    ADD CONSTRAINT grocery_items_category_key_check
    CHECK (category_key IN (
        'produce', 'bakery', 'dairy_eggs', 'meat_fish',
        'pantry', 'frozen', 'snacks_sweets', 'beverages', 'alcohol',
        'baby', 'household', 'disposables', 'personal_care', 'other'
    ));

-- ─────────────────────────────────────────────────────────────
-- 2. Per-item edit claim
--    Short-lived and advisory: it stops two people typing into the same item
--    at once. It is NOT the integrity mechanism — `version` is.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE grocery_items
    ADD COLUMN IF NOT EXISTS editing_user_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS editing_until    TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_grocery_items_editing
    ON grocery_items(trip_id)
    WHERE editing_user_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 3. Retire the list-level lease
--    `version` stays: it is what live polling watches.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE grocery_lists
    DROP CONSTRAINT IF EXISTS chk_grocery_lists_lock_pairing;

ALTER TABLE grocery_lists
    DROP COLUMN IF EXISTS lock_user_id,
    DROP COLUMN IF EXISTS lock_session_id,
    DROP COLUMN IF EXISTS lock_token,
    DROP COLUMN IF EXISTS lock_acquired_at,
    DROP COLUMN IF EXISTS lock_expires_at;

COMMIT;

-- ─────────────────────────────────────────────────────────────
-- VERIFICATION
-- ─────────────────────────────────────────────────────────────
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint
--  WHERE conname = 'grocery_items_category_key_check';
--   → includes 'alcohol' and 'disposables'
--
-- SELECT column_name FROM information_schema.columns
--  WHERE table_name = 'grocery_lists' AND column_name LIKE 'lock%';   → 0 rows
--
-- SELECT column_name FROM information_schema.columns
--  WHERE table_name = 'grocery_items' AND column_name LIKE 'editing%';
--   → editing_user_id, editing_until
--
-- ROLLBACK:
--   ALTER TABLE grocery_items DROP COLUMN IF EXISTS editing_user_id,
--                             DROP COLUMN IF EXISTS editing_until;
--   UPDATE grocery_items SET category_key = 'beverages' WHERE category_key = 'alcohol';
--   UPDATE grocery_items SET category_key = 'household' WHERE category_key = 'disposables';
--   -- then restore the 12-value CHECK and re-run migration 40's lock columns.
