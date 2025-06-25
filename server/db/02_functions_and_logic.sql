-- ✅ SpendWise Database Functions - All Business Logic That Works with Dashboard
-- This file contains all database functions for recurring transactions, balance calculations, and deletion logic
-- Version: Production Ready - Matches working Supabase deployment

-- ===============================
-- ESSENTIAL BALANCE FUNCTION - DASHBOARD CRITICAL
-- ===============================

-- ✅ CORRECTED: Period balance function with BOTH overloads (TESTED AND WORKING)
-- This function is CRITICAL for dashboard functionality

-- Version 1: Handle TIMESTAMP WITH TIME ZONE (used by dashboard queries)
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
    -- Use the already-correct daily_balances view to aggregate period totals
    -- This ensures we get accurate data without double-counting or wrong distributions
    RETURN QUERY 
    SELECT 
        COALESCE(SUM(db.income), 0)::DECIMAL(10,2) as income,
        COALESCE(SUM(db.expenses), 0)::DECIMAL(10,2) as expenses,
        COALESCE(SUM(db.net_amount), 0)::DECIMAL(10,2) as balance
    FROM daily_balances db
    WHERE db.user_id = p_user_id 
    AND db.date BETWEEN p_start_date::DATE AND p_end_date::DATE;
END;
$$;

-- Version 2: Handle DATE parameters (alternative usage)
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
    -- Use the already-correct daily_balances view to aggregate period totals
    -- This ensures we get accurate data without double-counting or wrong distributions
    RETURN QUERY 
    SELECT 
        COALESCE(SUM(db.income), 0)::DECIMAL(10,2) as income,
        COALESCE(SUM(db.expenses), 0)::DECIMAL(10,2) as expenses,
        COALESCE(SUM(db.net_amount), 0)::DECIMAL(10,2) as balance
    FROM daily_balances db
    WHERE db.user_id = p_user_id 
    AND db.date BETWEEN p_start_date AND p_end_date;
END;
$$;

-- ===============================
-- RECURRING TRANSACTION FUNCTIONS
-- ===============================

-- ✅ ENHANCED: Recurring transaction generation with skip_dates support
CREATE OR REPLACE FUNCTION generate_recurring_transactions()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    template RECORD;
    next_date DATE;
    generation_end_date DATE;
    last_generated_date DATE;
    transactions_created INTEGER := 0;
BEGIN
    -- Set generation period (3 months ahead)
    generation_end_date := CURRENT_DATE + INTERVAL '3 months';
    
    -- Process each active template
    FOR template IN 
        SELECT * FROM recurring_templates 
        WHERE is_active = true 
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        ORDER BY id
    LOOP
        -- Find last generated date for this template
        EXECUTE format('
            SELECT MAX(date) 
            FROM %I 
            WHERE template_id = $1 AND deleted_at IS NULL',
            CASE WHEN template.type = 'expense' THEN 'expenses' ELSE 'income' END
        ) INTO last_generated_date USING template.id;
        
        -- Set starting point correctly
        IF last_generated_date IS NULL THEN
            -- NEW template: Start from start_date
            next_date := template.start_date;
        ELSE
            -- EXISTING template: Calculate next occurrence
            next_date := CASE template.interval_type
                WHEN 'daily' THEN last_generated_date + INTERVAL '1 day'
                WHEN 'weekly' THEN last_generated_date + INTERVAL '1 week'
                WHEN 'monthly' THEN 
                    CASE 
                        WHEN template.day_of_month IS NOT NULL THEN
                            -- Use the day_of_month (fixed clustering issue)
                            (DATE_TRUNC('month', last_generated_date) + INTERVAL '1 month' + 
                             (LEAST(template.day_of_month, EXTRACT(DAY FROM (DATE_TRUNC('month', last_generated_date) + INTERVAL '2 months' - INTERVAL '1 day')::DATE)) - 1) * INTERVAL '1 day')::DATE
                        ELSE
                            -- Fallback
                            last_generated_date + INTERVAL '1 month'
                    END
            END;
        END IF;
        
        -- Generate transactions until end date
        WHILE next_date <= generation_end_date AND (template.end_date IS NULL OR next_date <= template.end_date) LOOP
            
            -- ✅ CRITICAL: Skip if this date is in the skip_dates array
            IF template.skip_dates IS NOT NULL AND next_date = ANY(template.skip_dates) THEN
                -- Move to next occurrence
                next_date := CASE template.interval_type
                    WHEN 'daily' THEN next_date + INTERVAL '1 day'
                    WHEN 'weekly' THEN next_date + INTERVAL '1 week'
                    WHEN 'monthly' THEN 
                        (DATE_TRUNC('month', next_date) + INTERVAL '1 month' + 
                         (LEAST(template.day_of_month, EXTRACT(DAY FROM (DATE_TRUNC('month', next_date) + INTERVAL '2 months' - INTERVAL '1 day')::DATE)) - 1) * INTERVAL '1 day')::DATE
                END;
                CONTINUE;
            END IF;
            
            -- Skip past dates (but allow today for new templates)
            IF next_date < CURRENT_DATE AND NOT (last_generated_date IS NULL AND next_date = CURRENT_DATE) THEN
                -- Move to next occurrence
                next_date := CASE template.interval_type
                    WHEN 'daily' THEN next_date + INTERVAL '1 day'
                    WHEN 'weekly' THEN next_date + INTERVAL '1 week'
                    WHEN 'monthly' THEN 
                        (DATE_TRUNC('month', next_date) + INTERVAL '1 month' + 
                         (LEAST(template.day_of_month, EXTRACT(DAY FROM (DATE_TRUNC('month', next_date) + INTERVAL '2 months' - INTERVAL '1 day')::DATE)) - 1) * INTERVAL '1 day')::DATE
                END;
                CONTINUE;
            END IF;
            
            -- Create the transaction
            EXECUTE format('
                INSERT INTO %I (user_id, amount, description, date, category_id, template_id)
                VALUES ($1, $2, $3, $4, $5, $6)',
                CASE WHEN template.type = 'expense' THEN 'expenses' ELSE 'income' END
            ) USING template.user_id, template.amount, template.description, 
                    next_date, template.category_id, template.id;
            
            transactions_created := transactions_created + 1;
            
            -- Calculate next occurrence
            next_date := CASE template.interval_type
                WHEN 'daily' THEN next_date + INTERVAL '1 day'
                WHEN 'weekly' THEN next_date + INTERVAL '1 week'
                WHEN 'monthly' THEN 
                    (DATE_TRUNC('month', next_date) + INTERVAL '1 month' + 
                     (LEAST(template.day_of_month, EXTRACT(DAY FROM (DATE_TRUNC('month', next_date) + INTERVAL '2 months' - INTERVAL '1 day')::DATE)) - 1) * INTERVAL '1 day')::DATE
            END;
        END LOOP;
    END LOOP;
END;
$$;

-- ===============================
-- ADVANCED DELETION FUNCTIONS
-- ===============================

-- ✅ ENHANCED: Delete transaction with multiple strategies
CREATE OR REPLACE FUNCTION delete_transaction_with_options(
  p_transaction_type text,
  p_transaction_id integer,
  p_user_id integer,
  p_delete_all boolean DEFAULT false,
  p_delete_future boolean DEFAULT false,
  p_delete_single boolean DEFAULT true
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id integer;
  v_transaction_date date;
  v_table_name text;
BEGIN
  -- Validate transaction type
  IF p_transaction_type NOT IN ('expense', 'income') THEN
    RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
  END IF;
  
  -- Set table name
  v_table_name := CASE WHEN p_transaction_type = 'expense' THEN 'expenses' ELSE 'income' END;
  
  -- Get transaction details
  EXECUTE format('
    SELECT template_id, date 
    FROM %I 
    WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    v_table_name
  ) INTO v_template_id, v_transaction_date
  USING p_transaction_id, p_user_id;
  
  -- Check if transaction exists
  IF v_transaction_date IS NULL THEN
    RAISE EXCEPTION 'Transaction not found or already deleted';
  END IF;
  
  -- Handle different deletion strategies
  IF p_delete_all AND v_template_id IS NOT NULL THEN
    -- Delete ALL instances of this recurring transaction
    EXECUTE format('
      UPDATE %I 
      SET deleted_at = NOW()
      WHERE template_id = $1 AND user_id = $2 AND deleted_at IS NULL',
      v_table_name
    ) USING v_template_id, p_user_id;
    
    -- Deactivate the template
    UPDATE recurring_templates 
    SET is_active = false, end_date = CURRENT_DATE - INTERVAL '1 day'
    WHERE id = v_template_id AND user_id = p_user_id;
    
  ELSIF p_delete_future AND v_template_id IS NOT NULL THEN
    -- Delete FUTURE instances (including current)
    EXECUTE format('
      UPDATE %I 
      SET deleted_at = NOW()
      WHERE template_id = $1 AND user_id = $2 AND date >= $3 AND deleted_at IS NULL',
      v_table_name
    ) USING v_template_id, p_user_id, v_transaction_date;
    
    -- Update template end date to stop future generation
    UPDATE recurring_templates 
    SET end_date = v_transaction_date - INTERVAL '1 day'
    WHERE id = v_template_id AND user_id = p_user_id;
    
  ELSE
    -- Delete SINGLE instance (default)
    EXECUTE format('
      UPDATE %I 
      SET deleted_at = NOW()
      WHERE id = $1 AND user_id = $2',
      v_table_name
    ) USING p_transaction_id, p_user_id;
    
    -- Add this date to skip_dates if it's a recurring transaction
    IF v_template_id IS NOT NULL THEN
      UPDATE recurring_templates 
      SET skip_dates = ARRAY_APPEND(COALESCE(skip_dates, '{}'), v_transaction_date)
      WHERE id = v_template_id AND user_id = p_user_id;
    END IF;
  END IF;
END;
$$;

-- ===============================
-- LEGACY SUPPORT FUNCTIONS
-- ===============================

-- ✅ Legacy: Update future transactions (maintained for compatibility)
CREATE OR REPLACE FUNCTION update_future_transactions(
    p_template_id INTEGER,
    p_user_id INTEGER,
    p_new_amount DECIMAL(10,2),
    p_new_description TEXT,
    p_new_category_id INTEGER,
    p_from_date DATE DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_template RECORD;
    v_table_name TEXT;
BEGIN
    -- Get template info
    SELECT * INTO v_template 
    FROM recurring_templates 
    WHERE id = p_template_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found';
    END IF;
    
    -- Determine table name
    v_table_name := CASE WHEN v_template.type = 'expense' THEN 'expenses' ELSE 'income' END;
    
    -- Update future transactions
    EXECUTE format('
        UPDATE %I 
        SET amount = $1, description = $2, category_id = $3, updated_at = NOW()
        WHERE template_id = $4 AND user_id = $5 AND date >= $6 AND deleted_at IS NULL',
        v_table_name
    ) USING p_new_amount, p_new_description, p_new_category_id, p_template_id, p_user_id, p_from_date;
    
    -- Update the template itself
    UPDATE recurring_templates 
    SET amount = p_new_amount, 
        description = p_new_description, 
        category_id = p_new_category_id,
        updated_at = NOW()
    WHERE id = p_template_id AND user_id = p_user_id;
END;
$$;

-- ✅ Legacy: Delete future transactions (maintained for compatibility) - FIXED
CREATE OR REPLACE FUNCTION delete_future_transactions(
    p_template_id INTEGER,
    p_user_id INTEGER,
    p_from_date DATE DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_template RECORD;
    v_table_name TEXT;
BEGIN
    -- Get template info
    SELECT * INTO v_template 
    FROM recurring_templates 
    WHERE id = p_template_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found';
    END IF;
    
    -- Determine table name
    v_table_name := CASE WHEN v_template.type = 'expense' THEN 'expenses' ELSE 'income' END;
    
    -- Soft delete future transactions
    EXECUTE format('
        UPDATE %I 
        SET deleted_at = NOW()
        WHERE template_id = $1 AND user_id = $2 AND date >= $3 AND deleted_at IS NULL',
        v_table_name
    ) USING p_template_id, p_user_id, p_from_date;
END;
$$;

-- ===============================
-- FUNCTION DOCUMENTATION
-- ===============================

COMMENT ON FUNCTION get_period_balance(INTEGER, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'DASHBOARD CRITICAL: Calculates period balance by aggregating daily_balances view - timestamp version - TESTED AND WORKING';
COMMENT ON FUNCTION get_period_balance(INTEGER, DATE, DATE) IS 'DASHBOARD CRITICAL: Calculates period balance by aggregating daily_balances view - date version - TESTED AND WORKING';
COMMENT ON FUNCTION generate_recurring_transactions() IS 'Enhanced recurring transaction generator with skip dates support';
COMMENT ON FUNCTION delete_transaction_with_options(text,integer,integer,boolean,boolean,boolean) IS 'Advanced deletion with single/future/all strategies';
COMMENT ON FUNCTION update_future_transactions(INTEGER,INTEGER,DECIMAL,TEXT,INTEGER,DATE) IS 'Legacy: Update future recurring transactions';
COMMENT ON FUNCTION delete_future_transactions(INTEGER,INTEGER,DATE) IS 'Legacy: Delete future recurring transactions'; 