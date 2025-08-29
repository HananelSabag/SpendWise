-- ✅ SpendWise UNIFIED TRANSACTIONS TABLE MIGRATION
-- This migration creates a unified transactions table to replace separate income/expenses tables
-- Version: 7.0.0 - UNIFIED TRANSACTIONS ARCHITECTURE

-- ===============================
-- CREATE UNIFIED TRANSACTIONS TABLE
-- ===============================

-- Create the unified transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    description TEXT,
    notes TEXT,
    date DATE NOT NULL,
    transaction_datetime TIMESTAMPTZ DEFAULT NOW(),
    template_id INTEGER REFERENCES recurring_templates(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'upcoming', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Add constraint to ensure transaction_datetime is valid
ALTER TABLE transactions 
ADD CONSTRAINT check_transaction_datetime_valid 
CHECK (transaction_datetime IS NOT NULL AND transaction_datetime >= '2020-01-01'::timestamptz);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_template_id ON transactions(template_id) WHERE template_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id) WHERE category_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at) WHERE deleted_at IS NULL;

-- ===============================
-- MIGRATE DATA FROM SEPARATE TABLES
-- ===============================

-- Migration function to safely move data from income/expenses to transactions
CREATE OR REPLACE FUNCTION migrate_to_unified_transactions()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_income_count INTEGER := 0;
    v_expense_count INTEGER := 0;
    v_result JSON;
BEGIN
    -- Migrate income records
    INSERT INTO transactions (
        user_id, category_id, amount, type, description, notes, date, 
        transaction_datetime, template_id, created_at, updated_at, deleted_at
    )
    SELECT 
        user_id, category_id, amount, 'income'::VARCHAR, description, notes, date,
        COALESCE(created_at, NOW()), template_id, created_at, updated_at, deleted_at
    FROM income 
    WHERE id NOT IN (
        SELECT id FROM transactions WHERE type = 'income' 
    );
    
    GET DIAGNOSTICS v_income_count = ROW_COUNT;
    
    -- Migrate expense records
    INSERT INTO transactions (
        user_id, category_id, amount, type, description, notes, date, 
        transaction_datetime, template_id, created_at, updated_at, deleted_at
    )
    SELECT 
        user_id, category_id, amount, 'expense'::VARCHAR, description, notes, date,
        COALESCE(created_at, NOW()), template_id, created_at, updated_at, deleted_at
    FROM expenses 
    WHERE id NOT IN (
        SELECT id FROM transactions WHERE type = 'expense' 
    );
    
    GET DIAGNOSTICS v_expense_count = ROW_COUNT;
    
    -- Return migration results
    SELECT json_build_object(
        'success', true,
        'migrated_income', v_income_count,
        'migrated_expenses', v_expense_count,
        'total_migrated', v_income_count + v_expense_count,
        'migrated_at', NOW()
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- ===============================
-- UPDATED FUNCTIONS FOR UNIFIED TABLE
-- ===============================

-- Function to get transaction summary from unified table
CREATE OR REPLACE FUNCTION get_unified_transaction_summary(
    p_user_id INTEGER,
    p_days INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_start_date DATE;
BEGIN
    v_start_date := CURRENT_DATE - INTERVAL '1 day' * p_days;
    
    SELECT json_build_object(
        'total_income', (
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions 
            WHERE user_id = p_user_id 
            AND type = 'income'
            AND date >= v_start_date
            AND deleted_at IS NULL
        ),
        'total_expenses', (
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions 
            WHERE user_id = p_user_id 
            AND type = 'expense'
            AND date >= v_start_date
            AND deleted_at IS NULL
        ),
        'transaction_count', (
            SELECT COUNT(*)
            FROM transactions 
            WHERE user_id = p_user_id 
            AND date >= v_start_date
            AND deleted_at IS NULL
        ),
        'categories_used', (
            SELECT COUNT(DISTINCT category_id)
            FROM transactions 
            WHERE user_id = p_user_id 
            AND date >= v_start_date
            AND category_id IS NOT NULL
            AND deleted_at IS NULL
        ),
        'period_days', p_days,
        'start_date', v_start_date,
        'end_date', CURRENT_DATE
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Function to get recent transactions from unified table
CREATE OR REPLACE FUNCTION get_recent_transactions(
    p_user_id INTEGER,
    p_limit INTEGER DEFAULT 10
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', t.id,
            'amount', t.amount,
            'type', t.type,
            'description', t.description,
            'date', t.date,
            'category_name', c.name,
            'category_icon', c.icon,
            'is_recurring', t.template_id IS NOT NULL,
            'created_at', t.created_at
        ) ORDER BY t.date DESC, t.created_at DESC
    ) INTO v_result
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = p_user_id 
    AND t.deleted_at IS NULL
    ORDER BY t.date DESC, t.created_at DESC
    LIMIT p_limit;
    
    RETURN COALESCE(v_result, '[]'::json);
END;
$$;

-- ===============================
-- ADD MISSING COLUMNS TO RECURRING TEMPLATES
-- ===============================

-- Add name column to recurring_templates if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recurring_templates' AND column_name = 'name') THEN
        ALTER TABLE recurring_templates ADD COLUMN name VARCHAR(255);
        -- Update existing templates with name from description
        UPDATE recurring_templates SET name = COALESCE(description, 'Recurring Transaction') WHERE name IS NULL;
        -- Make name required for new records
        ALTER TABLE recurring_templates ALTER COLUMN name SET NOT NULL;
    END IF;
END $$;

-- ===============================
-- CLEANUP AND OPTIMIZATION
-- ===============================

-- Update sequences to avoid conflicts
SELECT setval('transactions_id_seq', 
    GREATEST(
        COALESCE((SELECT MAX(id) FROM transactions), 0),
        COALESCE((SELECT MAX(id) FROM income), 0),
        COALESCE((SELECT MAX(id) FROM expenses), 0)
    ) + 1
);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_transactions_updated_at();

-- ===============================
-- NOTES FOR DEPLOYMENT
-- ===============================

-- To complete migration, run:
-- SELECT migrate_to_unified_transactions();
-- 
-- After verifying data integrity, the old income/expenses tables can be:
-- 1. Renamed to income_backup, expenses_backup
-- 2. Eventually dropped after confirming everything works

COMMENT ON TABLE transactions IS 'Unified transactions table replacing separate income/expenses tables';
COMMENT ON COLUMN transactions.transaction_datetime IS 'Timestamp with timezone when transaction was recorded';
COMMENT ON COLUMN transactions.status IS 'Transaction status: completed, pending, upcoming, cancelled';
COMMENT ON FUNCTION migrate_to_unified_transactions() IS 'Migrates data from income/expenses tables to unified transactions table';
