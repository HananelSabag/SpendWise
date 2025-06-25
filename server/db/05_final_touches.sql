-- Final optimizations and utilities

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expenses_timestamp BEFORE UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_income_timestamp BEFORE UPDATE ON income  
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_templates_timestamp BEFORE UPDATE ON recurring_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- User Preferences Migration (for existing databases only)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS language_preference VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(20) DEFAULT 'light',
ADD COLUMN IF NOT EXISTS currency_preference VARCHAR(10) DEFAULT 'USD';

-- Add constraints for valid values (with error handling for existing constraints)
DO $$
BEGIN
    -- Check and add language_preference constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_language_preference' 
        AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users ADD CONSTRAINT check_language_preference 
        CHECK (language_preference IN ('en', 'he', 'es', 'fr', 'de', 'ar'));
    END IF;
    
    -- Check and add theme_preference constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_theme_preference' 
        AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users ADD CONSTRAINT check_theme_preference 
        CHECK (theme_preference IN ('light', 'dark', 'auto'));
    END IF;
    
    -- Check and add currency_preference constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_currency_preference' 
        AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users ADD CONSTRAINT check_currency_preference 
        CHECK (currency_preference IN ('USD', 'EUR', 'ILS', 'GBP', 'JPY', 'CNY'));
    END IF;
END $$;

-- Migrate existing preferences from JSONB to new columns
UPDATE users 
SET 
    language_preference = COALESCE((preferences->>'language'), 'en'),
    theme_preference = COALESCE((preferences->>'theme'), 'light'),
    currency_preference = COALESCE((preferences->>'currency'), 'USD')
WHERE preferences IS NOT NULL
AND (language_preference IS NULL OR theme_preference IS NULL OR currency_preference IS NULL); -- Added condition to prevent re-migration

-- Clean up migrated preferences from JSONB
UPDATE users 
SET preferences = preferences - 'language' - 'theme' - 'currency'
WHERE preferences ? 'language' 
   OR preferences ? 'theme' 
   OR preferences ? 'currency';

-- Email verification functionality for existing databases
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Set existing users as verified (grandfathering them in)
UPDATE users SET email_verified = true 
WHERE email_verified IS NULL OR email_verified = false
AND created_at < '2024-01-01'; -- Only grandfather old users, not all

-- Create email verification tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add skip_dates column to recurring_templates if it doesn't exist
ALTER TABLE recurring_templates ADD COLUMN IF NOT EXISTS skip_dates DATE[] DEFAULT '{}';

-- Fixed user stats function with COALESCE for new users
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id INTEGER)
RETURNS TABLE(
    total_income DECIMAL(10,2),
    total_expenses DECIMAL(10,2),
    net_balance DECIMAL(10,2),
    avg_daily_income DECIMAL(10,2),
    avg_daily_expense DECIMAL(10,2),
    active_templates INTEGER,
    transaction_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH user_transactions AS (
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
            COUNT(*) as transaction_count
        FROM (
            SELECT amount, 'income' as type FROM income 
            WHERE user_id = p_user_id AND deleted_at IS NULL
            UNION ALL
            SELECT amount, 'expense' as type FROM expenses 
            WHERE user_id = p_user_id AND deleted_at IS NULL
        ) t
    ),
    daily_averages AS (
        SELECT 
            COALESCE(AVG(expenses), 0) as avg_daily_expense,
            COALESCE(AVG(income), 0) as avg_daily_income
        FROM daily_balances db
        WHERE db.user_id = p_user_id
    ),
    template_count AS (
        SELECT COALESCE(COUNT(*), 0) as active_templates
        FROM recurring_templates rt
        WHERE rt.user_id = p_user_id AND rt.is_active = true
    )
    SELECT 
        ut.total_income,
        ut.total_expenses,
        ut.total_income - ut.total_expenses as net_balance,
        -- ✅ CRITICAL FIX: Use COALESCE with 0 fallback for new users
        COALESCE(da.avg_daily_income, 0) as avg_daily_income,
        COALESCE(da.avg_daily_expense, 0) as avg_daily_expense,
        tc.active_templates::INTEGER,
        ut.transaction_count::INTEGER
    FROM user_transactions ut
    CROSS JOIN daily_averages da
    CROSS JOIN template_count tc;
END;
$$ LANGUAGE plpgsql;

-- Monthly summary view
CREATE OR REPLACE VIEW monthly_summary AS
SELECT 
    user_id,
    DATE_TRUNC('month', date) as month,
    SUM(income) as total_income,
    SUM(expenses) as total_expenses,
    SUM(income - expenses) as net_balance,
    COUNT(DISTINCT date) as active_days
FROM daily_balances
GROUP BY user_id, DATE_TRUNC('month', date);

-- Smart search function
CREATE OR REPLACE FUNCTION search_transactions(
    p_user_id INTEGER,
    p_search_term TEXT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
    id INTEGER,
    type TEXT,
    amount DECIMAL(10,2),
    description TEXT,
    date DATE,
    category_name VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        'expense'::TEXT as type,
        e.amount,
        e.description,
        e.date,
        c.name as category_name
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = p_user_id
    AND e.deleted_at IS NULL
    AND (
        e.description ILIKE '%' || p_search_term || '%'
        OR c.name ILIKE '%' || p_search_term || '%'
    )
    
    UNION ALL
    
    SELECT 
        i.id,
        'income'::TEXT as type,
        i.amount,
        i.description,
        i.date,
        c.name as category_name
    FROM income i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.user_id = p_user_id
    AND i.deleted_at IS NULL
    AND (
        i.description ILIKE '%' || p_search_term || '%'
        OR c.name ILIKE '%' || p_search_term || '%'
    )
    
    ORDER BY date DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_expenses_search ON expenses USING gin(to_tsvector('simple', description));
CREATE INDEX IF NOT EXISTS idx_income_search ON income USING gin(to_tsvector('simple', description));
CREATE INDEX IF NOT EXISTS idx_daily_balances ON expenses(user_id, date, deleted_at);
CREATE INDEX IF NOT EXISTS idx_daily_balances_income ON income(user_id, date, deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens ON email_verification_tokens(token, used, expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_user ON email_verification_tokens(user_id) WHERE used = false;

-- Token cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW() OR used = true;
    
    DELETE FROM email_verification_tokens 
    WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp for all users
UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id IS NOT NULL;