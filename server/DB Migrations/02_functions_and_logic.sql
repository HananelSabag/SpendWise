-- ✅ SpendWise Database Functions - OPTIMIZED VERSION 2.0
-- This file contains optimized database functions aligned with the JavaScript-based architecture
-- Version: Production Ready - Matches current optimized server implementation

-- ===============================
-- CORE DASHBOARD FUNCTIONS - CRITICAL FOR FRONTEND
-- ===============================

-- ✅ ENHANCED: Dashboard summary function with optimized performance
CREATE OR REPLACE FUNCTION get_dashboard_summary(
    p_user_id INTEGER,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
    v_start_of_month DATE;
    v_end_of_month DATE;
BEGIN
    -- Calculate month boundaries
    v_start_of_month := DATE_TRUNC('month', p_date)::DATE;
    v_end_of_month := (DATE_TRUNC('month', p_date) + INTERVAL '1 month - 1 day')::DATE;
    
    -- Build comprehensive dashboard data
    SELECT json_build_object(
        'current_balance', (
            SELECT COALESCE(SUM(
                CASE WHEN type = 'income' THEN amount ELSE -amount END
            ), 0)
            FROM (
                SELECT amount, 'income' as type FROM income 
                WHERE user_id = p_user_id AND deleted_at IS NULL
                UNION ALL
                SELECT amount, 'expense' as type FROM expenses 
                WHERE user_id = p_user_id AND deleted_at IS NULL
            ) all_transactions
        ),
        'monthly_income', (
            SELECT COALESCE(SUM(amount), 0)
            FROM income 
            WHERE user_id = p_user_id 
            AND date BETWEEN v_start_of_month AND v_end_of_month
            AND deleted_at IS NULL
        ),
        'monthly_expenses', (
            SELECT COALESCE(SUM(amount), 0)
            FROM expenses 
            WHERE user_id = p_user_id 
            AND date BETWEEN v_start_of_month AND v_end_of_month
            AND deleted_at IS NULL
        ),
        'today_transactions', (
            SELECT COUNT(*)
            FROM (
                SELECT id FROM income 
                WHERE user_id = p_user_id AND date = p_date AND deleted_at IS NULL
                UNION ALL
                SELECT id FROM expenses 
                WHERE user_id = p_user_id AND date = p_date AND deleted_at IS NULL
            ) today_trans
        ),
        'active_templates', (
            SELECT COUNT(*)
            FROM recurring_templates
            WHERE user_id = p_user_id 
            AND is_active = true
            AND (end_date IS NULL OR end_date >= p_date)
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- ✅ ENHANCED: Monthly summary function with trend analysis
CREATE OR REPLACE FUNCTION get_monthly_summary(
    p_user_id INTEGER,
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    p_month INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
    v_start_date DATE;
    v_end_date DATE;
    v_prev_start DATE;
    v_prev_end DATE;
BEGIN
    -- Calculate current month boundaries
    v_start_date := DATE(p_year || '-' || p_month || '-01');
    v_end_date := (v_start_date + INTERVAL '1 month - 1 day')::DATE;
    
    -- Calculate previous month for comparison
    v_prev_start := (v_start_date - INTERVAL '1 month')::DATE;
    v_prev_end := (v_start_date - INTERVAL '1 day')::DATE;
    
    -- Build comprehensive monthly summary
    SELECT json_build_object(
        'period', json_build_object(
            'year', p_year,
            'month', p_month,
            'start_date', v_start_date,
            'end_date', v_end_date
        ),
        'current_month', json_build_object(
            'income', COALESCE((
                SELECT SUM(amount) FROM income 
                WHERE user_id = p_user_id 
                AND date BETWEEN v_start_date AND v_end_date
                AND deleted_at IS NULL
            ), 0),
            'expenses', COALESCE((
                SELECT SUM(amount) FROM expenses 
                WHERE user_id = p_user_id 
                AND date BETWEEN v_start_date AND v_end_date
                AND deleted_at IS NULL
            ), 0),
            'transactions', (
                SELECT COUNT(*) FROM (
                    SELECT id FROM income 
                    WHERE user_id = p_user_id AND date BETWEEN v_start_date AND v_end_date AND deleted_at IS NULL
                    UNION ALL
                    SELECT id FROM expenses 
                    WHERE user_id = p_user_id AND date BETWEEN v_start_date AND v_end_date AND deleted_at IS NULL
                ) current_trans
            )
        ),
        'previous_month', json_build_object(
            'income', COALESCE((
                SELECT SUM(amount) FROM income 
                WHERE user_id = p_user_id 
                AND date BETWEEN v_prev_start AND v_prev_end
                AND deleted_at IS NULL
            ), 0),
            'expenses', COALESCE((
                SELECT SUM(amount) FROM expenses 
                WHERE user_id = p_user_id 
                AND date BETWEEN v_prev_start AND v_prev_end
                AND deleted_at IS NULL
            ), 0)
        ),
        'daily_breakdown', (
            SELECT json_agg(
                json_build_object(
                    'date', day_date,
                    'income', COALESCE(day_income, 0),
                    'expenses', COALESCE(day_expenses, 0),
                    'balance', COALESCE(day_income, 0) - COALESCE(day_expenses, 0)
                ) ORDER BY day_date
            )
            FROM (
                SELECT 
                    gs.day_date,
                    SUM(i.amount) as day_income,
                    SUM(e.amount) as day_expenses
                FROM generate_series(v_start_date, v_end_date, '1 day'::interval) gs(day_date)
                LEFT JOIN income i ON i.date = gs.day_date::DATE 
                    AND i.user_id = p_user_id AND i.deleted_at IS NULL
                LEFT JOIN expenses e ON e.date = gs.day_date::DATE 
                    AND e.user_id = p_user_id AND e.deleted_at IS NULL
                GROUP BY gs.day_date
            ) daily_data
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- ===============================
-- LEGACY BALANCE FUNCTIONS - MAINTAINED FOR COMPATIBILITY
-- ===============================

-- ✅ Period balance function - Version 1: TIMESTAMP WITH TIME ZONE
CREATE OR REPLACE FUNCTION get_period_balance(
    p_user_id INTEGER,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(
    income DECIMAL(10,2),
    expenses DECIMAL(10,2),
    balance DECIMAL(10,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        COALESCE(SUM(i.amount), 0)::DECIMAL(10,2) as income,
        COALESCE(SUM(e.amount), 0)::DECIMAL(10,2) as expenses,
        (COALESCE(SUM(i.amount), 0) - COALESCE(SUM(e.amount), 0))::DECIMAL(10,2) as balance
    FROM income i
    FULL OUTER JOIN expenses e ON i.user_id = e.user_id 
        AND i.date = e.date
    WHERE COALESCE(i.user_id, e.user_id) = p_user_id 
    AND COALESCE(i.date, e.date) BETWEEN p_start_date::DATE AND p_end_date::DATE
    AND COALESCE(i.deleted_at, e.deleted_at) IS NULL;
END;
$$;

-- ✅ Period balance function - Version 2: DATE
CREATE OR REPLACE FUNCTION get_period_balance(
    p_user_id INTEGER,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    income DECIMAL(10,2),
    expenses DECIMAL(10,2),
    balance DECIMAL(10,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        COALESCE(SUM(i.amount), 0)::DECIMAL(10,2) as income,
        COALESCE(SUM(e.amount), 0)::DECIMAL(10,2) as expenses,
        (COALESCE(SUM(i.amount), 0) - COALESCE(SUM(e.amount), 0))::DECIMAL(10,2) as balance
    FROM income i
    FULL OUTER JOIN expenses e ON i.user_id = e.user_id 
        AND i.date = e.date
    WHERE COALESCE(i.user_id, e.user_id) = p_user_id 
    AND COALESCE(i.date, e.date) BETWEEN p_start_date AND p_end_date
    AND COALESCE(i.deleted_at, e.deleted_at) IS NULL;
END;
$$;

-- ===============================
-- 🚀 NEW: COMPREHENSIVE ANALYTICS FUNCTIONS
-- ===============================

-- ✅ USER STATISTICS AND ANALYTICS
CREATE OR REPLACE FUNCTION get_user_analytics(
    p_user_id INTEGER,
    p_months_back INTEGER DEFAULT 12
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
    v_start_date DATE;
BEGIN
    v_start_date := (CURRENT_DATE - (p_months_back || ' months')::INTERVAL)::DATE;
    
    SELECT json_build_object(
        'user_profile', json_build_object(
            'total_transactions', (
                SELECT COUNT(*) FROM (
                    SELECT id FROM income WHERE user_id = p_user_id AND deleted_at IS NULL
                    UNION ALL
                    SELECT id FROM expenses WHERE user_id = p_user_id AND deleted_at IS NULL
                ) all_trans
            ),
            'active_days', (
                SELECT COUNT(DISTINCT date) FROM (
                    SELECT date FROM income WHERE user_id = p_user_id AND deleted_at IS NULL
                    UNION
                    SELECT date FROM expenses WHERE user_id = p_user_id AND deleted_at IS NULL
                ) activity_dates
            ),
            'first_transaction', (
                SELECT MIN(date) FROM (
                    SELECT date FROM income WHERE user_id = p_user_id AND deleted_at IS NULL
                    UNION
                    SELECT date FROM expenses WHERE user_id = p_user_id AND deleted_at IS NULL
                ) all_dates
            ),
            'last_transaction', (
                SELECT MAX(date) FROM (
                    SELECT date FROM income WHERE user_id = p_user_id AND deleted_at IS NULL
                    UNION
                    SELECT date FROM expenses WHERE user_id = p_user_id AND deleted_at IS NULL
                ) all_dates
            ),
            'recurring_templates', (
                SELECT COUNT(*) FROM recurring_templates 
                WHERE user_id = p_user_id AND is_active = true
            )
        ),
        'spending_patterns', json_build_object(
            'avg_daily_spending', (
                SELECT ROUND(AVG(daily_expenses), 2) FROM (
                    SELECT date, SUM(amount) as daily_expenses
                    FROM expenses 
                    WHERE user_id = p_user_id AND deleted_at IS NULL
                    AND date >= v_start_date
                    GROUP BY date
                ) daily_totals
            ),
            'avg_monthly_spending', (
                SELECT ROUND(AVG(monthly_expenses), 2) FROM (
                    SELECT DATE_TRUNC('month', date) as month, SUM(amount) as monthly_expenses
                    FROM expenses 
                    WHERE user_id = p_user_id AND deleted_at IS NULL
                    AND date >= v_start_date
                    GROUP BY DATE_TRUNC('month', date)
                ) monthly_totals
            ),
            'top_expense_categories', (
                SELECT json_agg(
                    json_build_object(
                        'category', c.name,
                        'amount', category_totals.total_amount,
                        'count', category_totals.transaction_count
                    ) ORDER BY category_totals.total_amount DESC
                ) 
                FROM (
                    SELECT 
                        category_id,
                        SUM(amount) as total_amount,
                        COUNT(*) as transaction_count
                    FROM expenses 
                    WHERE user_id = p_user_id AND deleted_at IS NULL
                    AND date >= v_start_date
                    GROUP BY category_id
                    ORDER BY total_amount DESC
                    LIMIT 5
                ) category_totals
                LEFT JOIN categories c ON category_totals.category_id = c.id
            ),
            'monthly_trends', (
                SELECT json_agg(
                    json_build_object(
                        'month', month,
                        'income', COALESCE(monthly_income, 0),
                        'expenses', COALESCE(monthly_expenses, 0),
                        'savings', COALESCE(monthly_income, 0) - COALESCE(monthly_expenses, 0),
                        'savings_rate', CASE 
                            WHEN COALESCE(monthly_income, 0) > 0 
                            THEN ROUND(((COALESCE(monthly_income, 0) - COALESCE(monthly_expenses, 0)) / monthly_income) * 100, 2)
                            ELSE 0 
                        END
                    ) ORDER BY month DESC
                )
                FROM (
                    SELECT 
                        DATE_TRUNC('month', COALESCE(i.date, e.date)) as month,
                        SUM(i.amount) as monthly_income,
                        SUM(e.amount) as monthly_expenses
                    FROM income i
                    FULL OUTER JOIN expenses e ON DATE_TRUNC('month', i.date) = DATE_TRUNC('month', e.date)
                        AND i.user_id = e.user_id
                    WHERE COALESCE(i.user_id, e.user_id) = p_user_id
                    AND COALESCE(i.deleted_at, e.deleted_at) IS NULL
                    AND COALESCE(i.date, e.date) >= v_start_date
                    GROUP BY DATE_TRUNC('month', COALESCE(i.date, e.date))
                ) monthly_data
            )
        ),
        'financial_health', json_build_object(
            'current_balance', (
                SELECT COALESCE(SUM(
                    CASE WHEN type = 'income' THEN amount ELSE -amount END
                ), 0)
                FROM (
                    SELECT amount, 'income' as type FROM income 
                    WHERE user_id = p_user_id AND deleted_at IS NULL
                    UNION ALL
                    SELECT amount, 'expense' as type FROM expenses 
                    WHERE user_id = p_user_id AND deleted_at IS NULL
                ) all_transactions
            ),
            'average_savings_rate', (
                SELECT ROUND(AVG(
                    CASE 
                        WHEN monthly_income > 0 
                        THEN ((monthly_income - monthly_expenses) / monthly_income) * 100
                        ELSE 0 
                    END
                ), 2)
                FROM (
                    SELECT 
                        DATE_TRUNC('month', COALESCE(i.date, e.date)) as month,
                        COALESCE(SUM(i.amount), 0) as monthly_income,
                        COALESCE(SUM(e.amount), 0) as monthly_expenses
                    FROM income i
                    FULL OUTER JOIN expenses e ON DATE_TRUNC('month', i.date) = DATE_TRUNC('month', e.date)
                        AND i.user_id = e.user_id
                    WHERE COALESCE(i.user_id, e.user_id) = p_user_id
                    AND COALESCE(i.deleted_at, e.deleted_at) IS NULL
                    AND COALESCE(i.date, e.date) >= v_start_date
                    GROUP BY DATE_TRUNC('month', COALESCE(i.date, e.date))
                ) monthly_savings
            ),
            'spending_variance', (
                SELECT ROUND(STDDEV(monthly_expenses), 2) FROM (
                    SELECT DATE_TRUNC('month', date) as month, SUM(amount) as monthly_expenses
                    FROM expenses 
                    WHERE user_id = p_user_id AND deleted_at IS NULL
                    AND date >= v_start_date
                    GROUP BY DATE_TRUNC('month', date)
                ) monthly_expenses_data
            )
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- ✅ CATEGORY USAGE ANALYTICS
CREATE OR REPLACE FUNCTION get_category_analytics(
    p_user_id INTEGER,
    p_months_back INTEGER DEFAULT 6
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
    v_start_date DATE;
BEGIN
    v_start_date := (CURRENT_DATE - (p_months_back || ' months')::INTERVAL)::DATE;
    
    SELECT json_build_object(
        'category_performance', (
            SELECT json_agg(
                json_build_object(
                    'category_id', c.id,
                    'category_name', c.name,
                    'category_type', c.type,
                    'total_amount', COALESCE(stats.total_amount, 0),
                    'transaction_count', COALESCE(stats.transaction_count, 0),
                    'avg_amount', COALESCE(stats.avg_amount, 0),
                    'max_amount', COALESCE(stats.max_amount, 0),
                    'min_amount', COALESCE(stats.min_amount, 0),
                    'last_used', stats.last_used,
                    'usage_frequency', COALESCE(stats.usage_frequency, 0)
                ) ORDER BY COALESCE(stats.total_amount, 0) DESC
            )
            FROM categories c
            LEFT JOIN (
                SELECT 
                    category_id,
                    SUM(amount) as total_amount,
                    COUNT(*) as transaction_count,
                    ROUND(AVG(amount), 2) as avg_amount,
                    MAX(amount) as max_amount,
                    MIN(amount) as min_amount,
                    MAX(date) as last_used,
                    ROUND(COUNT(*)::DECIMAL / GREATEST(DATE_PART('day', CURRENT_DATE - MIN(date)), 1), 2) as usage_frequency
                FROM (
                    SELECT category_id, amount, date FROM income 
                    WHERE user_id = p_user_id AND deleted_at IS NULL AND date >= v_start_date
                    UNION ALL
                    SELECT category_id, amount, date FROM expenses 
                    WHERE user_id = p_user_id AND deleted_at IS NULL AND date >= v_start_date
                ) all_transactions
                GROUP BY category_id
            ) stats ON c.id = stats.category_id
            WHERE c.user_id = p_user_id OR c.is_default = true
        ),
        'monthly_category_trends', (
            SELECT json_agg(
                json_build_object(
                    'month', month,
                    'categories', category_data
                ) ORDER BY month DESC
            )
            FROM (
                SELECT 
                    DATE_TRUNC('month', date) as month,
                    json_agg(
                        json_build_object(
                            'category_name', c.name,
                            'amount', monthly_amounts.total_amount
                        ) ORDER BY monthly_amounts.total_amount DESC
                    ) as category_data
                FROM (
                    SELECT 
                        DATE_TRUNC('month', date) as month,
                        category_id,
                        SUM(amount) as total_amount
                    FROM (
                        SELECT category_id, amount, date FROM income 
                        WHERE user_id = p_user_id AND deleted_at IS NULL AND date >= v_start_date
                        UNION ALL
                        SELECT category_id, amount, date FROM expenses 
                        WHERE user_id = p_user_id AND deleted_at IS NULL AND date >= v_start_date
                    ) all_transactions
                    GROUP BY DATE_TRUNC('month', date), category_id
                ) monthly_amounts
                JOIN categories c ON monthly_amounts.category_id = c.id
                GROUP BY month
            ) monthly_category_data
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- ===============================
-- MAINTENANCE AND CLEANUP FUNCTIONS
-- ===============================

-- ✅ OPTIMIZED: Token cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS TABLE(deleted_password_tokens bigint, deleted_email_tokens bigint) AS $$
DECLARE
    p_deleted_count bigint := 0;
    e_deleted_count bigint := 0;
BEGIN
    WITH deleted_p AS (
        DELETE FROM password_reset_tokens
        WHERE expires_at < NOW() OR used = TRUE
        RETURNING 1
    )
    SELECT COUNT(*) INTO p_deleted_count FROM deleted_p;

    WITH deleted_e AS (
        DELETE FROM email_verification_tokens
        WHERE expires_at < NOW() OR used = TRUE
        RETURNING 1
    )
    SELECT COUNT(*) INTO e_deleted_count FROM deleted_e;

    RETURN QUERY SELECT p_deleted_count, e_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ✅ OPTIMIZED: Database maintenance function
CREATE OR REPLACE FUNCTION run_maintenance()
RETURNS TEXT AS $$
BEGIN
    -- VACUUM ANALYZE all tables for performance
    EXECUTE 'VACUUM (ANALYZE, VERBOSE) expenses';
    EXECUTE 'VACUUM (ANALYZE, VERBOSE) income';
    EXECUTE 'VACUUM (ANALYZE, VERBOSE) users';
    EXECUTE 'VACUUM (ANALYZE, VERBOSE) categories';
    EXECUTE 'VACUUM (ANALYZE, VERBOSE) recurring_templates';
    EXECUTE 'VACUUM (ANALYZE, VERBOSE) password_reset_tokens';
    EXECUTE 'VACUUM (ANALYZE, VERBOSE) email_verification_tokens';

    RETURN 'Maintenance completed: VACUUM ANALYZE performed on key tables.';
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- FUNCTION DOCUMENTATION AND COMMENTS
-- ===============================

COMMENT ON FUNCTION get_dashboard_summary(INTEGER, DATE) IS 'OPTIMIZED: Main dashboard data with comprehensive metrics - JavaScript-integrated';
COMMENT ON FUNCTION get_monthly_summary(INTEGER, INTEGER, INTEGER) IS 'OPTIMIZED: Monthly financial summary with trend analysis and daily breakdown';
COMMENT ON FUNCTION get_user_analytics(INTEGER, INTEGER) IS 'NEW: Comprehensive user analytics including spending patterns and financial health';
COMMENT ON FUNCTION get_category_analytics(INTEGER, INTEGER) IS 'NEW: Category performance analytics with usage trends and insights';
COMMENT ON FUNCTION get_period_balance(INTEGER, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'LEGACY: Period balance calculation - timestamp version';
COMMENT ON FUNCTION get_period_balance(INTEGER, DATE, DATE) IS 'LEGACY: Period balance calculation - date version';
COMMENT ON FUNCTION cleanup_expired_tokens() IS 'OPTIMIZED: Automated token cleanup for security';
COMMENT ON FUNCTION run_maintenance() IS 'OPTIMIZED: Database maintenance and performance optimization'; 