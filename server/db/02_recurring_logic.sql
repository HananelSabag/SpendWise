-- Simple recurring transaction logic

-- Function to generate recurring transactions
CREATE OR REPLACE FUNCTION generate_recurring_transactions()
RETURNS void AS $$
DECLARE
    template RECORD;
    next_date DATE;
    generation_end_date DATE;
    last_generated_date DATE;
BEGIN
    -- Set generation period (3 months ahead)
    generation_end_date := CURRENT_DATE + INTERVAL '3 months';
    
    -- Process each active template
    FOR template IN 
        SELECT rt.* FROM recurring_templates rt
        WHERE rt.is_active = true 
        AND (rt.end_date IS NULL OR rt.end_date >= CURRENT_DATE)
    LOOP
        -- Find last generated date for this template
        EXECUTE format('
            SELECT MAX(date) 
            FROM %I 
            WHERE template_id = $1 AND deleted_at IS NULL',
            CASE WHEN template.type = 'expense' THEN 'expenses' ELSE 'income' END
        ) INTO last_generated_date USING template.id;
        
        -- ✅ CRITICAL FIX: Set starting point correctly
        IF last_generated_date IS NULL THEN
            -- NEW template: Start from the actual start_date (include it!)
            next_date := template.start_date;
        ELSE
            -- EXISTING template: Start from day after last generated
            next_date := last_generated_date;
        END IF;
        
        -- Generate transactions until generation_end_date
        WHILE next_date <= generation_end_date AND (template.end_date IS NULL OR next_date <= template.end_date) LOOP
            
            -- ✅ FIX: For existing templates, calculate NEXT occurrence first
            IF last_generated_date IS NOT NULL THEN
                next_date := CASE template.interval_type
                    WHEN 'daily' THEN next_date + INTERVAL '1 day'
                    WHEN 'weekly' THEN next_date + INTERVAL '1 week'
                    WHEN 'monthly' THEN 
                        -- Smart monthly calculation
                        CASE 
                            WHEN template.day_of_month IS NOT NULL THEN
                                -- Next month on specific day
                                (DATE_TRUNC('month', next_date) + INTERVAL '1 month' + 
                                 (template.day_of_month - 1) * INTERVAL '1 day')::DATE
                            ELSE
                                next_date + INTERVAL '1 month'
                        END
                END;
            END IF;
            
            -- Skip if in the past (but allow today!)
            IF next_date < CURRENT_DATE THEN
                -- ✅ FIX: For new templates on first iteration, don't skip start_date
                IF last_generated_date IS NULL AND next_date = template.start_date AND next_date = CURRENT_DATE THEN
                    -- This is a new template starting today - DON'T skip it!
                ELSE
                    CONTINUE;
                END IF;
            END IF;
            
            -- Skip if beyond template end date
            IF template.end_date IS NOT NULL AND next_date > template.end_date THEN
                EXIT;
            END IF;
            
            -- ✅ FIX: Skip if date is in skip_dates array
            IF template.skip_dates IS NOT NULL AND next_date = ANY(template.skip_dates) THEN
                -- Calculate next occurrence and continue
                next_date := CASE template.interval_type
                    WHEN 'daily' THEN next_date + INTERVAL '1 day'
                    WHEN 'weekly' THEN next_date + INTERVAL '1 week'
                    WHEN 'monthly' THEN 
                        CASE 
                            WHEN template.day_of_month IS NOT NULL THEN
                                (DATE_TRUNC('month', next_date) + INTERVAL '1 month' + 
                                 (template.day_of_month - 1) * INTERVAL '1 day')::DATE
                            ELSE
                                next_date + INTERVAL '1 month'
                        END
                END;
                CONTINUE;
            END IF;
            
            -- Insert transaction
            EXECUTE format('
                INSERT INTO %I (user_id, amount, description, date, category_id, template_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT DO NOTHING',
                CASE WHEN template.type = 'expense' THEN 'expenses' ELSE 'income' END
            ) USING template.user_id, template.amount, template.description, 
                    next_date, template.category_id, template.id;
            
            -- ✅ FIX: For new templates, NOW calculate next occurrence after inserting
            IF last_generated_date IS NULL THEN
                last_generated_date := next_date; -- Mark that we're no longer "new"
            END IF;
            
            -- Calculate next occurrence for next iteration
            next_date := CASE template.interval_type
                WHEN 'daily' THEN next_date + INTERVAL '1 day'
                WHEN 'weekly' THEN next_date + INTERVAL '1 week'
                WHEN 'monthly' THEN 
                    CASE 
                        WHEN template.day_of_month IS NOT NULL THEN
                            (DATE_TRUNC('month', next_date) + INTERVAL '1 month' + 
                             (template.day_of_month - 1) * INTERVAL '1 day')::DATE
                        ELSE
                            next_date + INTERVAL '1 month'
                    END
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