-- Efficient balance calculation views

-- Daily balance view
CREATE OR REPLACE VIEW daily_balances AS
WITH daily_transactions AS (
    SELECT 
        user_id,
        date,
        SUM(CASE WHEN deleted_at IS NULL THEN amount ELSE 0 END) as total
    FROM expenses
    GROUP BY user_id, date
    
    UNION ALL
    
    SELECT 
        user_id,
        date,
        -SUM(CASE WHEN deleted_at IS NULL THEN amount ELSE 0 END) as total
    FROM income
    GROUP BY user_id, date
)
SELECT 
    user_id,
    date,
    SUM(total) as net_amount,
    SUM(CASE WHEN total > 0 THEN total ELSE 0 END) as expenses,
    -SUM(CASE WHEN total < 0 THEN total ELSE 0 END) as income
FROM daily_transactions
GROUP BY user_id, date;

-- Function for period balances
CREATE OR REPLACE FUNCTION get_period_balance(
    p_user_id INTEGER,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    income DECIMAL(10,2),
    expenses DECIMAL(10,2),
    balance DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN net_amount < 0 THEN -net_amount ELSE 0 END), 0)::DECIMAL(10,2) as income,
        COALESCE(SUM(CASE WHEN net_amount > 0 THEN net_amount ELSE 0 END), 0)::DECIMAL(10,2) as expenses,
        COALESCE(SUM(-net_amount), 0)::DECIMAL(10,2) as balance
    FROM daily_balances
    WHERE user_id = p_user_id 
    AND date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;