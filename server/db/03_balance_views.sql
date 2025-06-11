-- Efficient balance calculation views

-- Daily balance view (UNCHANGED - used for data integrity)
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

-- Smart daily balance calculation function
CREATE OR REPLACE FUNCTION calculate_smart_daily_balance(
    p_user_id INTEGER,
    p_target_date DATE
)
RETURNS TABLE(
    income DECIMAL(10,2),
    expenses DECIMAL(10,2),
    balance DECIMAL(10,2)
) AS $$
DECLARE
    v_month_start DATE;
    v_month_end DATE;
    v_days_in_month INTEGER;
    v_one_time_income DECIMAL(10,2) := 0;
    v_one_time_expenses DECIMAL(10,2) := 0;
    v_recurring_daily_income DECIMAL(10,2) := 0;
    v_recurring_daily_expenses DECIMAL(10,2) := 0;
    v_template RECORD;
BEGIN
    -- Calculate month boundaries for recurring distribution
    v_month_start := DATE_TRUNC('month', p_target_date);
    v_month_end := (v_month_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    v_days_in_month := EXTRACT(DAY FROM v_month_end);
    
    -- Get one-time transactions for this specific date (template_id IS NULL)
    SELECT 
        COALESCE(SUM(i.amount), 0),
        COALESCE(SUM(e.amount), 0)
    INTO v_one_time_income, v_one_time_expenses
    FROM 
        (SELECT amount FROM income 
         WHERE user_id = p_user_id AND date = p_target_date 
         AND template_id IS NULL AND deleted_at IS NULL) i
    FULL OUTER JOIN 
        (SELECT amount FROM expenses 
         WHERE user_id = p_user_id AND date = p_target_date 
         AND template_id IS NULL AND deleted_at IS NULL) e ON FALSE;
    
    -- Process monthly recurring templates - distribute across month days
    FOR v_template IN 
        SELECT rt.* 
        FROM recurring_templates rt
        WHERE rt.user_id = p_user_id 
        AND rt.is_active = true
        AND rt.start_date <= p_target_date
        AND (rt.end_date IS NULL OR rt.end_date >= p_target_date)
        AND rt.interval_type = 'monthly'
        AND (rt.skip_dates IS NULL OR p_target_date != ALL(rt.skip_dates))
    LOOP
        IF v_template.type = 'income' THEN
            v_recurring_daily_income := v_recurring_daily_income + (v_template.amount / v_days_in_month);
        ELSE
            v_recurring_daily_expenses := v_recurring_daily_expenses + (v_template.amount / v_days_in_month);
        END IF;
    END LOOP;
    
    -- Process daily and weekly recurring templates
    FOR v_template IN 
        SELECT rt.* 
        FROM recurring_templates rt
        WHERE rt.user_id = p_user_id 
        AND rt.is_active = true
        AND rt.start_date <= p_target_date
        AND (rt.end_date IS NULL OR rt.end_date >= p_target_date)
        AND rt.interval_type IN ('weekly', 'daily')
        AND (rt.skip_dates IS NULL OR p_target_date != ALL(rt.skip_dates))
    LOOP
        -- Check if this date matches the recurring pattern
        IF v_template.interval_type = 'daily' OR 
           (v_template.interval_type = 'weekly' AND 
            EXTRACT(DOW FROM p_target_date) = COALESCE(v_template.day_of_week, EXTRACT(DOW FROM v_template.start_date))) THEN
            
            IF v_template.type = 'income' THEN
                v_recurring_daily_income := v_recurring_daily_income + v_template.amount;
            ELSE
                v_recurring_daily_expenses := v_recurring_daily_expenses + v_template.amount;
            END IF;
        END IF;
    END LOOP;
    
    -- Return final calculated amounts
    RETURN QUERY SELECT 
        (v_one_time_income + v_recurring_daily_income)::DECIMAL(10,2) as income,
        (v_one_time_expenses + v_recurring_daily_expenses)::DECIMAL(10,2) as expenses,
        (v_one_time_income + v_recurring_daily_income - v_one_time_expenses - v_recurring_daily_expenses)::DECIMAL(10,2) as balance;
END;
$$ LANGUAGE plpgsql;

-- UPDATED: Smart period balance function - The Genius Solution!
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
DECLARE
    v_current_date DATE;
    v_total_income DECIMAL(10,2) := 0;
    v_total_expenses DECIMAL(10,2) := 0;
    v_day_result RECORD;
BEGIN
    -- Loop through each day in the period and sum smart daily calculations
    v_current_date := p_start_date;
    
    WHILE v_current_date <= p_end_date LOOP
        -- Get smart daily balance for this specific day
        SELECT * INTO v_day_result FROM calculate_smart_daily_balance(p_user_id, v_current_date);
        
        -- Add to period totals
        v_total_income := v_total_income + v_day_result.income;
        v_total_expenses := v_total_expenses + v_day_result.expenses;
        
        -- Move to next day
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
    
    -- Return period totals
    RETURN QUERY SELECT 
        v_total_income::DECIMAL(10,2) as income,
        v_total_expenses::DECIMAL(10,2) as expenses,
        (v_total_income - v_total_expenses)::DECIMAL(10,2) as balance;
END;
$$ LANGUAGE plpgsql;