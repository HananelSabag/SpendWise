-- ✅ SpendWise — Family Hub: the manual household picture
--
-- WHY THIS EXISTS
-- ---------------
-- Everything else in SpendWise is derived from scraped bank/card data: it is
-- accurate about what *already happened*. What it cannot tell you is the thing
-- a couple actually wants to know before the month starts:
--
--     "of the money that comes in, how much is already spoken for,
--      and how much is genuinely left for us to live on?"
--
-- That question needs facts the bank never reports — which salary belongs to
-- whom, which standing charge leaves whose account, how much sits in a pension,
-- how much is still owed on a loan. So this data is entered BY HAND, on purpose,
-- by the two people who know it. It is a plan, not a ledger; it never mixes with
-- transactions and never changes a single accounting total.
--
-- TWO TABLES, TWO DIFFERENT MEANINGS OF "AMOUNT"
-- ----------------------------------------------
--   family_monthly_items.amount  = ₪ per MONTH  (a flow: income, standing charge,
--                                                loan repayment, monthly saving)
--   family_balances.amount       = ₪ RIGHT NOW  (a stock: savings, pension,
--                                                study fund, investments)
--
-- Keeping them apart is what stops the classic double-count: a pension is a big
-- number that must never be subtracted from this month's leftover, and a
-- mortgage payment must never be mistaken for a debt balance. A loan is the one
-- thing that is honestly both, so a loan row carries its monthly payment (the
-- flow) plus optional `outstanding_amount` / `payments_left` (the debt) — one
-- row, because that is how a person thinks about a loan.
--
-- WHO SEES IT
-- -----------
-- These tables are deliberately NOT scoped per user: they hold ONE household's
-- shared picture, and every person on the server-side allowlist
-- (`server/config/familyAccess.js`) sees the same rows. Authorization is that
-- one allowlist check in `server/middleware/familyAccess.js` and nowhere else.
-- `created_by` / `updated_by` are history, never permission.
--
-- Idempotent and transactional.

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. Monthly flow — income, fixed, variable, loans, saving
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_monthly_items (
    id                 SERIAL PRIMARY KEY,

    -- What this row does to the month:
    --   income   → money arriving
    --   fixed    → a charge that is certain, every month (mortgage, arnona, day care)
    --   variable → a charge they choose the size of (groceries, fuel, leisure)
    --   loan     → a repayment; may also carry the outstanding debt below
    --   savings  → money deliberately moved out of the account to be kept
    kind               TEXT NOT NULL
                       CHECK (kind IN ('income', 'fixed', 'variable', 'loan', 'savings')),

    name               TEXT NOT NULL,
    amount             NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),

    -- Whose money this is: the earner for income, the account it leaves for a
    -- charge. NULL = joint / shared, which is a real answer, not a missing one.
    owner_user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Language-neutral grouping key. Labels live in the client's translations —
    -- never store a Hebrew label as an identifier (learned the hard way on the
    -- grocery list).
    category_key       TEXT NOT NULL DEFAULT 'other'
                       CHECK (category_key IN (
                           'salary', 'benefits', 'other_income',
                           'housing', 'utilities', 'kids', 'food', 'transport',
                           'insurance', 'health', 'communication', 'subscriptions',
                           'leisure', 'debt', 'savings', 'other'
                       )),

    -- Day of the month it is charged/received, when they know it (1–31).
    charge_day         SMALLINT CHECK (charge_day BETWEEN 1 AND 31),

    -- Off, not deleted: day care stops over the summer, a loan ends, a salary
    -- pauses. Inactive rows keep their history and stay out of every total.
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,

    notes              TEXT,
    sort_order         INTEGER NOT NULL DEFAULT 0,

    -- ── Loan-only, all optional ──────────────────────────────────────────
    lender             TEXT,
    outstanding_amount NUMERIC(12,2) CHECK (outstanding_amount >= 0),
    payments_left      SMALLINT      CHECK (payments_left >= 0),
    end_date           DATE,

    created_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 2. Balances — what the household has put aside
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_balances (
    id                   SERIAL PRIMARY KEY,

    kind                 TEXT NOT NULL
                         CHECK (kind IN ('savings', 'pension', 'study_fund',
                                         'investment', 'emergency', 'other')),

    name                 TEXT NOT NULL,
    institution          TEXT,

    -- NULL = joint. A pension is always personal; a rainy-day fund usually isn't.
    owner_user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,

    amount               NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),

    -- INFORMATIONAL ONLY, and the code must keep it that way: a pension or study
    -- fund deposit is deducted from the gross salary, so subtracting it from a
    -- NET salary would invent an expense that never leaves the account. Money
    -- they actively transfer to savings belongs in family_monthly_items as
    -- kind='savings' instead — that one really does leave the account.
    monthly_contribution NUMERIC(12,2) CHECK (monthly_contribution >= 0),

    -- Balances go stale; showing when it was last checked is more honest than
    -- pretending the number is live.
    as_of                DATE,

    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    notes                TEXT,
    sort_order           INTEGER NOT NULL DEFAULT 0,

    created_by           INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by           INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 3. Indexes
--    Both tables hold tens of rows, so these are for the foreign keys
--    (house convention since migration 36), not for speed.
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_family_monthly_items_owner   ON family_monthly_items(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_family_monthly_items_kind    ON family_monthly_items(kind) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_family_balances_owner        ON family_balances(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_family_balances_kind         ON family_balances(kind) WHERE is_active;

-- ─────────────────────────────────────────────────────────────
-- 4. updated_at
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_family_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_family_monthly_items_updated_at ON family_monthly_items;
CREATE TRIGGER trg_family_monthly_items_updated_at
    BEFORE UPDATE ON family_monthly_items
    FOR EACH ROW EXECUTE FUNCTION set_family_updated_at();

DROP TRIGGER IF EXISTS trg_family_balances_updated_at ON family_balances;
CREATE TRIGGER trg_family_balances_updated_at
    BEFORE UPDATE ON family_balances
    FOR EACH ROW EXECUTE FUNCTION set_family_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 5. RLS: deny by default
--    The API server connects as the table owner, so RLS never gates it. This is
--    here so that if the Supabase anon key is ever used from a browser, the most
--    private table in the app is not world-readable. Same posture as the
--    merchant-watch rules in migration 38: enabled, with no policies.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE family_monthly_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_balances      ENABLE ROW LEVEL SECURITY;

COMMIT;
