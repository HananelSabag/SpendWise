-- ✅ SpendWise Database Functions - All Business Logic
-- This file contains all database functions for recurring transactions, balance calculations, and deletion logic

-- ✅ CORRECTED: Simple and accurate period balance function
-- This uses the already-correct daily_balances view instead of complex logic
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
    
    -- Update template end date to stop future generations
    UPDATE recurring_templates 
    SET end_date = v_transaction_date - INTERVAL '1 day'
    WHERE id = v_template_id AND user_id = p_user_id;
    
  ELSE
    -- Delete SINGLE transaction only (default)
    EXECUTE format('
      UPDATE %I 
      SET deleted_at = NOW()
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      v_table_name
    ) USING p_transaction_id, p_user_id;
    
    -- For recurring transactions, add to skip_dates to prevent regeneration
    IF v_template_id IS NOT NULL THEN
      UPDATE recurring_templates 
      SET skip_dates = array_append(skip_dates, v_transaction_date)
      WHERE id = v_template_id AND user_id = p_user_id;
    END IF;
  END IF;
  
END;
$$;

-- ✅ TEMPLATE UPDATE FUNCTION
CREATE OR REPLACE FUNCTION update_future_transactions(
    p_template_id INTEGER,
    p_from_date DATE,
    p_amount DECIMAL(10,2),
    p_description TEXT,
    p_category_id INTEGER
)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_template RECORD;
BEGIN
    -- Get template details
    SELECT type INTO v_template FROM recurring_templates WHERE id = p_template_id;
    
    -- Update future transactions
    EXECUTE format('
        UPDATE %I 
        SET amount = $1, description = $2, category_id = $3, updated_at = NOW()
        WHERE template_id = $4 AND date >= $5 AND deleted_at IS NULL',
        CASE WHEN v_template.type = 'expense' THEN 'expenses' ELSE 'income' END
    ) USING p_amount, p_description, p_category_id, p_template_id, p_from_date;
END;
$$;

-- ✅ LEGACY DELETION FUNCTION (kept for backward compatibility)
CREATE OR REPLACE FUNCTION delete_future_transactions(
    p_template_id INTEGER,
    p_from_date DATE
)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_template RECORD;
BEGIN
    -- Get template details
    SELECT type INTO v_template FROM recurring_templates WHERE id = p_template_id;
    
    -- Soft delete future transactions
    EXECUTE format('
        UPDATE %I 
        SET deleted_at = NOW()
        WHERE template_id = $1 AND date >= $2 AND deleted_at IS NULL',
        CASE WHEN v_template.type = 'expense' THEN 'expenses' ELSE 'income' END
    ) USING p_template_id, p_from_date;
    
    -- Deactivate template if deleting from today
    IF p_from_date <= CURRENT_DATE THEN
        UPDATE recurring_templates 
        SET is_active = false, end_date = p_from_date - INTERVAL '1 day'
        WHERE id = p_template_id;
    END IF;
END;
$$;

-- ✅ ADD FUNCTION DOCUMENTATION
COMMENT ON FUNCTION get_period_balance IS 'FIXED: Calculates period balance by aggregating daily_balances view - uses actual transaction data only';
COMMENT ON FUNCTION generate_recurring_transactions IS 'ENHANCED: Generates recurring transactions with proper skip_dates support';
COMMENT ON FUNCTION delete_transaction_with_options IS 'Enhanced deletion function that handles single, future, and all deletion strategies for both regular and recurring transactions';
COMMENT ON FUNCTION update_future_transactions IS 'Updates future transactions for a recurring template';
COMMENT ON FUNCTION delete_future_transactions IS 'Legacy deletion function - use delete_transaction_with_options for new code'; 