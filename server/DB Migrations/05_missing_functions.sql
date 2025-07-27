-- ✅ MISSING FUNCTIONS - Critical for Production
-- This file contains functions that were referenced but not defined

-- ===============================
-- RECURRING TRANSACTIONS FUNCTION
-- ===============================

-- Generate recurring transactions (called by scheduler)
CREATE OR REPLACE FUNCTION generate_recurring_transactions()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_generated_count INTEGER := 0;
    v_template RECORD;
    v_result JSON;
BEGIN
    -- Log function start
    INSERT INTO system_logs (level, message, created_at)
    VALUES ('INFO', 'Starting recurring transactions generation', NOW());
    
    -- For now, return success without generating transactions
    -- The recurring logic has been moved to JavaScript (RecurringEngine.js)
    -- This function exists to prevent database errors during startup
    
    v_result := json_build_object(
        'success', true,
        'generated_count', v_generated_count,
        'message', 'Recurring transactions handled by JavaScript engine',
        'timestamp', NOW()
    );
    
    -- Log completion
    INSERT INTO system_logs (level, message, created_at)
    VALUES ('INFO', 'Completed recurring transactions check - handled by JS engine', NOW());
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    -- Log error
    INSERT INTO system_logs (level, message, error_detail, created_at)
    VALUES ('ERROR', 'Failed to generate recurring transactions', SQLERRM, NOW());
    
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'timestamp', NOW()
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_recurring_transactions() TO authenticated;

-- Add comment
COMMENT ON FUNCTION generate_recurring_transactions() IS 'Placeholder function for recurring transactions - actual logic in JavaScript RecurringEngine.js';

-- ===============================
-- SYSTEM LOGS TABLE (if not exists)
-- ===============================

-- Create system_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(10) NOT NULL DEFAULT 'INFO',
    message TEXT NOT NULL,
    error_detail TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);

-- Grant permissions
GRANT ALL ON system_logs TO authenticated;
GRANT USAGE ON SEQUENCE system_logs_id_seq TO authenticated; 