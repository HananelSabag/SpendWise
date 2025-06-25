-- Simple recurring transaction logic

-- Enhanced recurring transaction generation with better NULL handling
CREATE OR REPLACE FUNCTION generate_recurring_transactions()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

-- Function to handle template updates
CREATE OR REPLACE FUNCTION update_future_transactions(
    p_template_id INTEGER,
    p_from_date DATE,
    p_amount DECIMAL(10,2),
    p_description TEXT,
    p_category_id INTEGER
)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

-- Function to delete future transactions
CREATE OR REPLACE FUNCTION delete_future_transactions(
    p_template_id INTEGER,
    p_from_date DATE
)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;