-- Final optimizations and utilities

-- 1. Auto-update timestamps
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

-- 2. Skip dates functionality (לדלג על תאריכים ספציפיים)
ALTER TABLE recurring_templates ADD COLUMN skip_dates DATE[] DEFAULT '{}';

-- 3. Summary statistics function
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id INTEGER)
RETURNS TABLE(
    total_income DECIMAL(10,2),
    total_expenses DECIMAL(10,2),
    net_balance DECIMAL(10,2),
    active_templates INTEGER,
    avg_daily_expense DECIMAL(10,2),
    avg_daily_income DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COALESCE(SUM(CASE WHEN deleted_at IS NULL THEN amount ELSE 0 END), 0) as total_exp
        FROM expenses WHERE user_id = p_user_id
    ), income_stats AS (
        SELECT 
            COALESCE(SUM(CASE WHEN deleted_at IS NULL THEN amount ELSE 0 END), 0) as total_inc
        FROM income WHERE user_id = p_user_id
    ), template_stats AS (
        SELECT COUNT(*) as active_temps
        FROM recurring_templates 
        WHERE user_id = p_user_id AND is_active = true
    ), daily_stats AS (
        SELECT 
            AVG(expenses) as avg_exp,
            AVG(income) as avg_inc
        FROM daily_balances
        WHERE user_id = p_user_id
        AND date >= CURRENT_DATE - INTERVAL '30 days'
    )
    SELECT 
        income_stats.total_inc::DECIMAL(10,2),
        stats.total_exp::DECIMAL(10,2),
        (income_stats.total_inc - stats.total_exp)::DECIMAL(10,2),
        template_stats.active_temps::INTEGER,
        COALESCE(daily_stats.avg_exp, 0)::DECIMAL(10,2),
        COALESCE(daily_stats.avg_inc, 0)::DECIMAL(10,2)
    FROM stats, income_stats, template_stats, daily_stats;
END;
$$ LANGUAGE plpgsql;

-- 4. Monthly summary view
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

-- 5. Smart search function
-- 5. Smart search function (FIXED)
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
    category_name VARCHAR(100)  -- שיניתי מ-TEXT ל-VARCHAR(100)
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


-- 6. Performance indexes
CREATE INDEX idx_expenses_search ON expenses USING gin(to_tsvector('simple', description));
CREATE INDEX idx_income_search ON income USING gin(to_tsvector('simple', description));
CREATE INDEX idx_daily_balances ON expenses(user_id, date, deleted_at);
CREATE INDEX idx_daily_balances_income ON income(user_id, date, deleted_at);

-- Test everything works
DO $$
BEGIN
    RAISE NOTICE '✅ All optimizations applied successfully!';
    PERFORM get_user_stats(1);
    RAISE NOTICE '✅ Statistics function works!';
    PERFORM search_transactions(1, 'Salary', 10);
    RAISE NOTICE '✅ Search function works!';
END $$;