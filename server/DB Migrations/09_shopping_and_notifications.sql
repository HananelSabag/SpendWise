-- ✅ SpendWise — Shopping Wishlist & Notifications
-- Creates all tables needed for the shopping wishlist feature and
-- the in-app notification system.  Uses IF NOT EXISTS throughout so
-- this file is safe to run multiple times (idempotent).

-- Enable pgcrypto for gen_random_uuid() if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- 1. SHOPPING ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopping_items (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(200) NOT NULL,
    category   VARCHAR(50)  NOT NULL DEFAULT 'אחר',
    price_ils  DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price_ils >= 0),
    buy_url    TEXT,
    notes      TEXT,
    is_bought  BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shopping_items_user_id
    ON shopping_items(user_id);

CREATE INDEX IF NOT EXISTS idx_shopping_items_user_bought
    ON shopping_items(user_id, is_bought);

-- ─────────────────────────────────────────────
-- 2. SHOPPING SHARES
--    owner_id  = the user whose list is shared
--    member_id = the user who can see/edit it
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopping_shares (
    id         SERIAL PRIMARY KEY,
    owner_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_shopping_shares UNIQUE (owner_id, member_id),
    CONSTRAINT chk_no_self_share  CHECK (owner_id <> member_id)
);

CREATE INDEX IF NOT EXISTS idx_shopping_shares_owner  ON shopping_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_shopping_shares_member ON shopping_shares(member_id);

-- ─────────────────────────────────────────────
-- 3. SHOPPING INVITATIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopping_invitations (
    id            SERIAL PRIMARY KEY,
    inviter_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_email VARCHAR(255) NOT NULL,
    invitee_id    INTEGER      REFERENCES users(id) ON DELETE SET NULL,
    token         UUID NOT NULL DEFAULT gen_random_uuid(),
    status        VARCHAR(20)  NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','accepted','declined','cancelled')),
    expires_at    TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    responded_at  TIMESTAMP,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_shopping_invitations UNIQUE (inviter_id, invitee_email),
    CONSTRAINT uq_shopping_invitation_token UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_shopping_inv_inviter
    ON shopping_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_shopping_inv_invitee_id
    ON shopping_invitations(invitee_id)
    WHERE invitee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shopping_inv_token
    ON shopping_invitations(token);
CREATE INDEX IF NOT EXISTS idx_shopping_inv_status_expires
    ON shopping_invitations(status, expires_at)
    WHERE status = 'pending';

-- ─────────────────────────────────────────────
-- 4. NOTIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(50)  NOT NULL,
    title      VARCHAR(200) NOT NULL,
    body       TEXT,
    data       JSONB NOT NULL DEFAULT '{}',
    is_read    BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
    ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON notifications(user_id, created_at DESC);
