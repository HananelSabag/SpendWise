-- File: 002_functions.sql
-- Enhanced functions and triggers for transaction handling

-- Function to handle recurring transactions
CREATE OR REPLACE FUNCTION process_recurring_transaction()
RETURNS TRIGGER AS $$
DECLARE
    start_date DATE;
    end_of_month DATE;
BEGIN
    -- Only process for recurring transactions
    IF NOT NEW.is_recurring THEN
        RETURN NEW;
    END IF;

    -- Set initial values for new recurring transactions
    IF TG_OP = 'INSERT' THEN
        -- Default to first day of the month if no explicit start date
        IF NEW.recurring_start_date IS NULL THEN
            start_date := DATE_TRUNC('month', NEW.date)::DATE;
            NEW.recurring_start_date := start_date;

            -- If transaction starts mid-month and is monthly, adjust first amount
            IF NEW.date > start_date AND NEW.recurring_interval = 'monthly' THEN
                end_of_month := (DATE_TRUNC('month', NEW.date) + INTERVAL '1 month - 1 day')::DATE;
                -- Calculate prorated amount for first month
                NEW.amount := (NEW.recurring_amount * 
                    (end_of_month - NEW.date + 1)::DECIMAL / 
                    (end_of_month - start_date + 1)::DECIMAL);
            END IF;
        ELSE 
            start_date := NEW.recurring_start_date;
        END IF;

        NEW.last_occurrence_date := NEW.date;
        NEW.recurring_status := 'active';
        NEW.recurring_amount := COALESCE(NEW.recurring_amount, NEW.amount);
        
        -- Calculate next recurrence date
        NEW.next_recurrence_date := CASE NEW.recurring_interval
            WHEN 'daily' THEN NEW.date + INTERVAL '1 day'
            WHEN 'weekly' THEN NEW.date + INTERVAL '1 week'
            WHEN 'monthly' THEN 
                CASE 
                    WHEN NEW.recurring_start_date IS NOT NULL THEN
                        NEW.date + INTERVAL '1 month'
                    ELSE
                        (DATE_TRUNC('month', NEW.date) + INTERVAL '1 month')::DATE
                END
        END;
    END IF;

    -- Calculate daily amount
    NEW.daily_amount := CASE NEW.recurring_interval
        WHEN 'daily' THEN NEW.recurring_amount
        WHEN 'weekly' THEN NEW.recurring_amount / 7
        WHEN 'monthly' THEN NEW.recurring_amount / 
            EXTRACT(days FROM DATE_TRUNC('month', NEW.date) + INTERVAL '1 month - 1 day')
        ELSE NULL
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- File: 006_enhanced_recurring_transactions.sql
-- Enhanced function for generating recurring transactions 36 months in advance

/*
 * This migration improves the recurring transactions generation by:
 * 1. Generating transactions for the next 36 months (3 years) instead of just one
 * 2. Ensuring transactions are properly created in advance
 * 3. Maintaining the same filtering logic to prevent duplicates
 */
-- Enhanced function to handle both past and future recurring transactions
CREATE OR REPLACE FUNCTION generate_recurring_transactions()
RETURNS void AS $$
DECLARE
    rec RECORD;
    next_date DATE;
    future_date DATE;
    current_date_var DATE := CURRENT_DATE;
    months_ahead INTEGER := 3; -- How many months ahead to generate
    i INTEGER;
BEGIN
    -- Process recurring expenses
    FOR rec IN 
        SELECT e.* FROM expenses e
        WHERE e.is_recurring = true 
        AND e.recurring_status = 'active'
        AND (e.recurring_end_date IS NULL OR e.recurring_end_date >= current_date_var)
        -- Process only transactions that are the most recent in their chain
        AND NOT EXISTS (
            SELECT 1 FROM expenses newer 
            WHERE (newer.parent_transaction_id = e.id OR 
                  (e.parent_transaction_id IS NOT NULL AND 
                   newer.parent_transaction_id = e.parent_transaction_id))
            AND newer.date > e.date
            AND newer.is_recurring = true
            AND newer.recurring_status = 'active'
        )
    LOOP
        -- Key point - check if next_recurrence_date is greater than current date
        -- If not (missing past transactions), generate all missing transactions
        next_date := rec.next_recurrence_date;
        
        -- If there's no "next occurrence date" or it's in the past, generate from original date
        IF next_date IS NULL OR next_date < current_date_var THEN
            -- Calculate next date based on transaction frequency and original date
            next_date := CASE rec.recurring_interval
                WHEN 'daily' THEN rec.date + INTERVAL '1 day'
                WHEN 'weekly' THEN rec.date + INTERVAL '1 week'
                WHEN 'monthly' THEN rec.date + INTERVAL '1 month'
            END;
            
            -- Now generate past transactions up to current date (fill the gap)
            WHILE next_date <= current_date_var LOOP
                -- Skip dates in the skip list
                IF rec.skip_dates IS NULL OR NOT (next_date = ANY(rec.skip_dates)) THEN
                    -- Log for debugging
                    RAISE NOTICE 'Creating past expense: % for date %', rec.description, next_date;
                    
                    -- Create transaction for past date
                    INSERT INTO expenses (
                        user_id, amount, description, date,
                        category_id, is_recurring, recurring_interval,
                        recurring_amount, recurring_start_date,
                        recurring_end_date, parent_transaction_id,
                        recurring_status, last_occurrence_date,
                        skip_dates, daily_amount
                    ) VALUES (
                        rec.user_id, 
                        rec.recurring_amount,
                        rec.description,
                        next_date,
                        rec.category_id,
                        true,
                        rec.recurring_interval,
                        rec.recurring_amount,
                        rec.recurring_start_date,
                        rec.recurring_end_date,
                        COALESCE(rec.parent_transaction_id, rec.id),
                        'active',
                        next_date,
                        rec.skip_dates,
                        rec.daily_amount
                    );
                END IF;
                
                -- Advance to next date
                next_date := CASE rec.recurring_interval
                    WHEN 'daily' THEN next_date + INTERVAL '1 day'
                    WHEN 'weekly' THEN next_date + INTERVAL '1 week'
                    WHEN 'monthly' THEN next_date + INTERVAL '1 month'
                END;
                
                -- If we've reached the end date, stop
                IF rec.recurring_end_date IS NOT NULL AND next_date > rec.recurring_end_date THEN
                    EXIT;
                END IF;
            END LOOP;
        END IF;
        
        -- Now we know past transactions are created, and we have the next date
        -- Continue creating 3 months ahead from the current date
        future_date := next_date;
        
        -- Loop to create transactions for months ahead
        FOR i IN 1..months_ahead LOOP
            -- Skip dates in the skip list
            IF rec.skip_dates IS NULL OR NOT (future_date = ANY(rec.skip_dates)) THEN
                -- Log for debugging
                RAISE NOTICE 'Creating future expense: % for date %', rec.description, future_date;
                
                -- Create future transaction
                INSERT INTO expenses (
                    user_id, amount, description, date,
                    category_id, is_recurring, recurring_interval,
                    recurring_amount, recurring_start_date,
                    recurring_end_date, parent_transaction_id,
                    recurring_status, last_occurrence_date,
                    skip_dates, daily_amount
                ) VALUES (
                    rec.user_id, 
                    rec.recurring_amount,
                    rec.description,
                    future_date,
                    rec.category_id,
                    true,
                    rec.recurring_interval,
                    rec.recurring_amount,
                    rec.recurring_start_date,
                    rec.recurring_end_date,
                    COALESCE(rec.parent_transaction_id, rec.id),
                    'active',
                    future_date,
                    rec.skip_dates,
                    rec.daily_amount
                );
            END IF;
            
            -- Advance to next date
            future_date := CASE rec.recurring_interval
                WHEN 'daily' THEN future_date + INTERVAL '1 day'
                WHEN 'weekly' THEN future_date + INTERVAL '1 week'
                WHEN 'monthly' THEN future_date + INTERVAL '1 month'
            END;
            
            -- If we've reached the end date, stop
            IF rec.recurring_end_date IS NOT NULL AND future_date > rec.recurring_end_date THEN
                EXIT;
            END IF;
        END LOOP;
        
        -- Update next occurrence date
        UPDATE expenses 
        SET next_recurrence_date = future_date
        WHERE id = rec.id;
    END LOOP;

    -- Process recurring income - identical code for income table
    FOR rec IN 
        SELECT i.* FROM income i
        WHERE i.is_recurring = true 
        AND i.recurring_status = 'active'
        AND (i.recurring_end_date IS NULL OR i.recurring_end_date >= current_date_var)
        -- Process only transactions that are the most recent in their chain
        AND NOT EXISTS (
            SELECT 1 FROM income newer 
            WHERE (newer.parent_transaction_id = i.id OR 
                  (i.parent_transaction_id IS NOT NULL AND 
                   newer.parent_transaction_id = i.parent_transaction_id))
            AND newer.date > i.date
            AND newer.is_recurring = true
            AND newer.recurring_status = 'active'
        )
    LOOP
        -- Key point - check if next_recurrence_date is greater than current date
        -- If not (missing past transactions), generate all missing transactions
        next_date := rec.next_recurrence_date;
        
        -- If there's no "next occurrence date" or it's in the past, generate from original date
        IF next_date IS NULL OR next_date < current_date_var THEN
            -- Calculate next date based on transaction frequency and original date
            next_date := CASE rec.recurring_interval
                WHEN 'daily' THEN rec.date + INTERVAL '1 day'
                WHEN 'weekly' THEN rec.date + INTERVAL '1 week'
                WHEN 'monthly' THEN rec.date + INTERVAL '1 month'
            END;
            
            -- Now generate past transactions up to current date (fill the gap)
            WHILE next_date <= current_date_var LOOP
                -- Skip dates in the skip list
                IF rec.skip_dates IS NULL OR NOT (next_date = ANY(rec.skip_dates)) THEN
                    -- Log for debugging
                    RAISE NOTICE 'Creating past income: % for date %', rec.description, next_date;
                    
                    -- Create transaction for past date
                    INSERT INTO income (
                        user_id, amount, description, date,
                        category_id, is_recurring, recurring_interval,
                        recurring_amount, recurring_start_date,
                        recurring_end_date, parent_transaction_id,
                        recurring_status, last_occurrence_date,
                        skip_dates, daily_amount
                    ) VALUES (
                        rec.user_id, 
                        rec.recurring_amount,
                        rec.description,
                        next_date,
                        rec.category_id,
                        true,
                        rec.recurring_interval,
                        rec.recurring_amount,
                        rec.recurring_start_date,
                        rec.recurring_end_date,
                        COALESCE(rec.parent_transaction_id, rec.id),
                        'active',
                        next_date,
                        rec.skip_dates,
                        rec.daily_amount
                    );
                END IF;
                
                -- Advance to next date
                next_date := CASE rec.recurring_interval
                    WHEN 'daily' THEN next_date + INTERVAL '1 day'
                    WHEN 'weekly' THEN next_date + INTERVAL '1 week'
                    WHEN 'monthly' THEN next_date + INTERVAL '1 month'
                END;
                
                -- If we've reached the end date, stop
                IF rec.recurring_end_date IS NOT NULL AND next_date > rec.recurring_end_date THEN
                    EXIT;
                END IF;
            END LOOP;
        END IF;
        
        -- Now we know past transactions are created, and we have the next date
        -- Continue creating 3 months ahead from the current date
        future_date := next_date;
        
        -- Loop to create transactions for months ahead
        FOR i IN 1..months_ahead LOOP
            -- Skip dates in the skip list
            IF rec.skip_dates IS NULL OR NOT (future_date = ANY(rec.skip_dates)) THEN
                -- Log for debugging
                RAISE NOTICE 'Creating future income: % for date %', rec.description, future_date;
                
                -- Create future transaction
                INSERT INTO income (
                    user_id, amount, description, date,
                    category_id, is_recurring, recurring_interval,
                    recurring_amount, recurring_start_date,
                    recurring_end_date, parent_transaction_id,
                    recurring_status, last_occurrence_date,
                    skip_dates, daily_amount
                ) VALUES (
                    rec.user_id, 
                    rec.recurring_amount,
                    rec.description,
                    future_date,
                    rec.category_id,
                    true,
                    rec.recurring_interval,
                    rec.recurring_amount,
                    rec.recurring_start_date,
                    rec.recurring_end_date,
                    COALESCE(rec.parent_transaction_id, rec.id),
                    'active',
                    future_date,
                    rec.skip_dates,
                    rec.daily_amount
                );
            END IF;
            
            -- Advance to next date
            future_date := CASE rec.recurring_interval
                WHEN 'daily' THEN future_date + INTERVAL '1 day'
                WHEN 'weekly' THEN future_date + INTERVAL '1 week'
                WHEN 'monthly' THEN future_date + INTERVAL '1 month'
            END;
            
            -- If we've reached the end date, stop
            IF rec.recurring_end_date IS NOT NULL AND future_date > rec.recurring_end_date THEN
                EXIT;
            END IF;
        END LOOP;
        
        -- Update next occurrence date
        UPDATE income 
        SET next_recurrence_date = future_date
        WHERE id = rec.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;


-- Create or replace triggers
DROP TRIGGER IF EXISTS process_expense_recurring ON expenses;
DROP TRIGGER IF EXISTS process_income_recurring ON income;

CREATE TRIGGER process_expense_recurring
    BEFORE INSERT OR UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION process_recurring_transaction();

CREATE TRIGGER process_income_recurring
    BEFORE INSERT OR UPDATE ON income
    FOR EACH ROW
    EXECUTE FUNCTION process_recurring_transaction();

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_expenses_recurring 
ON expenses (is_recurring, recurring_status, next_recurrence_date)
WHERE is_recurring = true;

CREATE INDEX IF NOT EXISTS idx_income_recurring 
ON income (is_recurring, recurring_status, next_recurrence_date)
WHERE is_recurring = true;