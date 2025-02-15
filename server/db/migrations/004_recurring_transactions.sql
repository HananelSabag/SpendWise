-- File: 004_recurring_transactions.sql
-- Handles recurring transactions and daily amount calculations

CREATE OR REPLACE FUNCTION calculate_daily_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT NEW.is_recurring THEN
        NEW.daily_amount = NULL;
        NEW.recurring_amount = NULL;
        NEW.recurring_interval = NULL;
        NEW.next_recurrence_date = NULL;
        RETURN NEW;
    END IF;
    
    -- Set default values for recurring transactions
    IF NEW.recurring_amount IS NULL THEN
        NEW.recurring_amount = NEW.amount;
    END IF;

    CASE NEW.recurring_interval
        WHEN 'monthly' THEN
            NEW.daily_amount = NEW.recurring_amount / 
                EXTRACT(days FROM DATE_TRUNC('month', NEW.date) + 
                INTERVAL '1 month - 1 day');
            NEW.next_recurrence_date = DATE_TRUNC('month', NEW.date) + INTERVAL '1 month';
        WHEN 'weekly' THEN
            NEW.daily_amount = NEW.recurring_amount / 7;
            NEW.next_recurrence_date = NEW.date + INTERVAL '7 days';
        WHEN 'daily' THEN
            NEW.daily_amount = NEW.recurring_amount;
            NEW.next_recurrence_date = NEW.date + INTERVAL '1 day';
        ELSE
            NEW.daily_amount = NULL;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for expenses
DROP TRIGGER IF EXISTS expenses_daily_calc ON expenses;
CREATE TRIGGER expenses_daily_calc
    BEFORE INSERT OR UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION calculate_daily_amount();

-- Create triggers for income
DROP TRIGGER IF EXISTS income_daily_calc ON income;
CREATE TRIGGER income_daily_calc
    BEFORE INSERT OR UPDATE ON income
    FOR EACH ROW
    EXECUTE FUNCTION calculate_daily_amount();

-- Function to process recurring transactions
CREATE OR REPLACE FUNCTION process_recurring_transactions()
RETURNS void AS $$
BEGIN
    -- Process recurring expenses
    INSERT INTO expenses (
        user_id, amount, description, date, category_id,
        is_recurring, recurring_interval, recurring_amount,
        next_recurrence_date, last_processed_date
    )
    SELECT 
        user_id, recurring_amount, description, next_recurrence_date, category_id,
        true, recurring_interval, recurring_amount,
        CASE recurring_interval
            WHEN 'monthly' THEN next_recurrence_date + INTERVAL '1 month'
            WHEN 'weekly' THEN next_recurrence_date + INTERVAL '7 days'
            WHEN 'daily' THEN next_recurrence_date + INTERVAL '1 day'
        END,
        CURRENT_DATE
    FROM expenses
    WHERE is_recurring = true
    AND next_recurrence_date <= CURRENT_DATE
    AND (last_processed_date IS NULL OR last_processed_date < CURRENT_DATE);

    -- Process recurring income
    INSERT INTO income (
        user_id, amount, description, date, category_id,
        is_recurring, recurring_interval, recurring_amount,
        next_recurrence_date, last_processed_date
    )
    SELECT 
        user_id, recurring_amount, description, next_recurrence_date, category_id,
        true, recurring_interval, recurring_amount,
        CASE recurring_interval
            WHEN 'monthly' THEN next_recurrence_date + INTERVAL '1 month'
            WHEN 'weekly' THEN next_recurrence_date + INTERVAL '7 days'
            WHEN 'daily' THEN next_recurrence_date + INTERVAL '1 day'
        END,
        CURRENT_DATE
    FROM income
    WHERE is_recurring = true
    AND next_recurrence_date <= CURRENT_DATE
    AND (last_processed_date IS NULL OR last_processed_date < CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;