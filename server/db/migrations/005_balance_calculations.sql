-- File: 005_balance_calculations.sql
-- Functions for calculating daily/weekly/monthly/yearly balances

-- Daily balance calculation
CREATE OR REPLACE FUNCTION get_daily_balance(user_id_param INTEGER, date_param DATE)
RETURNS TABLE (
    total_income DECIMAL(10,2),
    total_expenses DECIMAL(10,2),
    net_amount DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH transactions_base AS (
        -- Combine both income and expenses with all needed columns
        SELECT 
            'income'::text as type,
            amount,
            date,
            is_recurring,
            recurring_interval,
            next_recurrence_date
        FROM income
        WHERE user_id = user_id_param
        UNION ALL
        SELECT 
            'expense'::text as type,
            amount,
            date,
            is_recurring,
            recurring_interval,
            next_recurrence_date
        FROM expenses
        WHERE user_id = user_id_param
    ),
    daily_totals AS (
        -- Get one-time transactions for the specific date
        SELECT 
            COALESCE(SUM(CASE WHEN t.type = 'income' AND NOT t.is_recurring AND t.date = date_param THEN amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN t.type = 'expense' AND NOT t.is_recurring AND t.date = date_param THEN amount ELSE 0 END), 0) as expenses
        FROM transactions_base t
    ),
    recurring_totals AS (
        -- Calculate recurring transactions
        SELECT 
            COALESCE(SUM(
                CASE WHEN t.type = 'income' AND t.is_recurring 
                     AND date_param BETWEEN t.date AND COALESCE(t.next_recurrence_date - INTERVAL '1 day', date_param)
                THEN
                    CASE t.recurring_interval
                        WHEN 'monthly' THEN amount / EXTRACT(DAY FROM DATE_TRUNC('month', date_param) + INTERVAL '1 month - 1 day')
                        WHEN 'weekly' THEN amount / 7
                        ELSE amount
                    END
                ELSE 0 END
            ), 0) as income,
            COALESCE(SUM(
                CASE WHEN t.type = 'expense' AND t.is_recurring 
                     AND date_param BETWEEN t.date AND COALESCE(t.next_recurrence_date - INTERVAL '1 day', date_param)
                THEN
                    CASE t.recurring_interval
                        WHEN 'monthly' THEN amount / EXTRACT(DAY FROM DATE_TRUNC('month', date_param) + INTERVAL '1 month - 1 day')
                        WHEN 'weekly' THEN amount / 7
                        ELSE amount
                    END
                ELSE 0 END
            ), 0) as expenses
        FROM transactions_base t
    )
    SELECT 
        (d.income + r.income)::DECIMAL(10,2) as total_income,
        (d.expenses + r.expenses)::DECIMAL(10,2) as total_expenses,
        (d.income + r.income - d.expenses - r.expenses)::DECIMAL(10,2) as net_amount
    FROM daily_totals d, recurring_totals r;
END;
$$ LANGUAGE plpgsql;

-- Weekly balance calculation
CREATE OR REPLACE FUNCTION get_weekly_balance(user_id_param INTEGER, date_param DATE)
RETURNS TABLE (
    total_income DECIMAL(10,2),
    total_expenses DECIMAL(10,2),
    net_amount DECIMAL(10,2)
) AS $$
DECLARE
    first_transaction_date DATE;
    week_start DATE;
BEGIN
    -- Find first transaction date
    SELECT MIN(transaction_date) INTO first_transaction_date
    FROM (
        SELECT MIN(date) as transaction_date 
        FROM income 
        WHERE user_id = user_id_param 
        UNION
        SELECT MIN(date) 
        FROM expenses
        WHERE user_id = user_id_param 
    ) first_dates;

    -- If no transactions exist, return zeros
    IF first_transaction_date IS NULL THEN
        RETURN QUERY SELECT 0::DECIMAL(10,2), 0::DECIMAL(10,2), 0::DECIMAL(10,2);
        RETURN;
    END IF;

    -- Calculate week start (Sunday) - either start of week or first transaction date if later
    week_start := GREATEST(
        date_param - EXTRACT(DOW FROM date_param)::INTEGER,
        first_transaction_date
    );

    RETURN QUERY
    WITH RECURSIVE daily_series AS (
        SELECT generate_series(
            week_start,
            date_param,
            interval '1 day'
        )::date as date
    )
    SELECT 
        SUM(b.total_income)::DECIMAL(10,2),
        SUM(b.total_expenses)::DECIMAL(10,2),
        SUM(b.net_amount)::DECIMAL(10,2)
    FROM daily_series d
    CROSS JOIN LATERAL get_daily_balance(user_id_param, d.date) b;
END;
$$ LANGUAGE plpgsql;

-- Monthly balance calculation
CREATE OR REPLACE FUNCTION get_monthly_balance(user_id_param INTEGER, date_param DATE)
RETURNS TABLE (
    total_income DECIMAL(10,2),
    total_expenses DECIMAL(10,2),
    net_amount DECIMAL(10,2)
) AS $$
DECLARE
    first_transaction_date DATE;
    month_start DATE;
BEGIN
    -- Find first transaction date
    SELECT MIN(transaction_date) INTO first_transaction_date
    FROM (
        SELECT MIN(date) as transaction_date 
        FROM income 
        WHERE user_id = user_id_param 
        UNION
        SELECT MIN(date) 
        FROM expenses
        WHERE user_id = user_id_param 
    ) first_dates;

    -- If no transactions exist, return zeros
    IF first_transaction_date IS NULL THEN
        RETURN QUERY SELECT 0::DECIMAL(10,2), 0::DECIMAL(10,2), 0::DECIMAL(10,2);
        RETURN;
    END IF;

    -- Calculate month start - either start of month or first transaction date if later
    month_start := GREATEST(
        date_trunc('month', date_param)::date,
        first_transaction_date
    );

    RETURN QUERY
    WITH RECURSIVE daily_series AS (
        SELECT generate_series(
            month_start,
            date_param,
            interval '1 day'
        )::date as date
    )
    SELECT 
        SUM(b.total_income)::DECIMAL(10,2),
        SUM(b.total_expenses)::DECIMAL(10,2),
        SUM(b.net_amount)::DECIMAL(10,2)
    FROM daily_series d
    CROSS JOIN LATERAL get_daily_balance(user_id_param, d.date) b;
END;
$$ LANGUAGE plpgsql;

-- Yearly balance calculation
CREATE OR REPLACE FUNCTION get_yearly_balance(user_id_param INTEGER, date_param DATE)
RETURNS TABLE (
    total_income DECIMAL(10,2),
    total_expenses DECIMAL(10,2),
    net_amount DECIMAL(10,2)
) AS $$
DECLARE
    first_transaction_date DATE;
    year_start DATE;
BEGIN
    -- Find first transaction date
    SELECT MIN(transaction_date) INTO first_transaction_date
    FROM (
        SELECT MIN(date) as transaction_date 
        FROM income 
        WHERE user_id = user_id_param 
        UNION
        SELECT MIN(date) 
        FROM expenses
        WHERE user_id = user_id_param 
    ) first_dates;

    -- If no transactions exist, return zeros
    IF first_transaction_date IS NULL THEN
        RETURN QUERY SELECT 0::DECIMAL(10,2), 0::DECIMAL(10,2), 0::DECIMAL(10,2);
        RETURN;
    END IF;

    -- Calculate year start - either January 1st or first transaction date if later
    year_start := GREATEST(
        date_trunc('year', date_param)::date,
        first_transaction_date
    );

    RETURN QUERY
    WITH RECURSIVE daily_series AS (
        SELECT generate_series(
            year_start,
            date_param,
            interval '1 day'
        )::date as date
    )
    SELECT 
        SUM(b.total_income)::DECIMAL(10,2),
        SUM(b.total_expenses)::DECIMAL(10,2),
        SUM(b.net_amount)::DECIMAL(10,2)
    FROM daily_series d
    CROSS JOIN LATERAL get_daily_balance(user_id_param, d.date) b;
END;
$$ LANGUAGE plpgsql;