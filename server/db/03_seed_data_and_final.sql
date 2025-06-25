-- ✅ SpendWise Seed Data and Final Setup
-- This file contains category seed data and final database configuration

-- ✅ ESSENTIAL CATEGORIES - Default categories for all users
INSERT INTO categories (name, description, icon, type, is_default) VALUES
-- Income Categories
('פריים', 'ברירת מחדל לעבודה ומשכורת', 'work', 'income', true),
('השקעות', 'רווחים מהשקעות ומניות', 'trending-up', 'income', true),
('מתנות', 'כסף שהתקבל במתנה', 'gift', 'income', true),
('אחר', 'הכנסות נוספות שלא נכנסות לקטגוריות האחרות', 'plus', 'income', true),

-- Expense Categories  
('מזון', 'קניות מכולת וכל הוצאות אוכל', 'shopping-cart', 'expense', true),
('בנזין/תחבורה', 'הוצאות רכב ותחבורה ציבורית', 'car', 'expense', true),
('חשבונות', 'חשמל, מים, גז, אינטרנט וטלפון', 'home', 'expense', true),
('בידור', 'סרטים, בילויים ופעילויות פנויה', 'film', 'expense', true),
('בריאות', 'רופאים, תרופות וביטוח בריאות', 'heart-pulse', 'expense', true),
('חינוך', 'לימודים, ספרים וחומרי לימוד', 'graduation-cap', 'expense', true),
('קניות', 'ביגוד, אלקטרוניקה וקניות כלליות', 'shopping-bag', 'expense', true),
('טיפוח', 'קוסמטיקה, מספרה וטיפוח אישי', 'scissors', 'expense', true),
('ספורט', 'חדר כושר, ציוד ספורט ופעילות גופנית', 'dumbbell', 'expense', true),
('נסיעות', 'חופשות, טיולים ונסיעות', 'plane', 'expense', true),
('צדקה', 'תרומות וכספי צדקה', 'hand-heart', 'expense', true),
('מסעדות', 'אוכל במסעדות ומשלוחים', 'utensils', 'expense', true),
('אחר', 'הוצאות נוספות שלא נכנסות לקטגוריות האחרות', 'more-horizontal', 'expense', true),

-- Mixed/Flexible Categories (can be either income or expense)
('מתנות', 'מתנות שניתנות או מתקבלות', 'gift', NULL, true),
('משפחה', 'כספים הקשורים למשפחה', 'users', NULL, true),
('עסקים', 'הכנסות והוצאות עסקיות', 'briefcase', NULL, true);

-- ✅ FINAL CONFIGURATION AND SECURITY

-- Add updated_at trigger for all main tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language plpgsql;

-- Apply triggers to main tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_templates_updated_at BEFORE UPDATE ON recurring_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_income_updated_at BEFORE UPDATE ON income FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ✅ FINAL PERMISSIONS AND GRANTS
-- Ensure proper access for application users
-- Note: In production, create specific roles and limit permissions

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ✅ VERIFICATION AND HEALTHCHECK
-- Create a simple health check function
CREATE OR REPLACE FUNCTION database_health_check()
RETURNS TABLE(
    component TEXT,
    status TEXT,
    details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        'Tables'::TEXT as component,
        CASE WHEN COUNT(*) >= 7 THEN 'OK' ELSE 'ERROR' END as status,
        'Found ' || COUNT(*)::TEXT || ' tables' as details
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    RETURN QUERY
    SELECT 
        'Views'::TEXT as component,
        CASE WHEN COUNT(*) >= 2 THEN 'OK' ELSE 'ERROR' END as status,
        'Found ' || COUNT(*)::TEXT || ' views' as details
    FROM information_schema.views 
    WHERE table_schema = 'public';
    
    RETURN QUERY
    SELECT 
        'Functions'::TEXT as component,
        CASE WHEN COUNT(*) >= 5 THEN 'OK' ELSE 'ERROR' END as status,
        'Found ' || COUNT(*)::TEXT || ' functions' as details
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION';
    
    RETURN QUERY
    SELECT 
        'Categories'::TEXT as component,
        CASE WHEN COUNT(*) >= 15 THEN 'OK' ELSE 'ERROR' END as status,
        'Found ' || COUNT(*)::TEXT || ' default categories' as details
    FROM categories 
    WHERE is_default = true;
END;
$$;

-- ✅ FINAL STATUS
-- Insert a completion record
INSERT INTO categories (name, description, icon, type, is_default) VALUES
('_MIGRATION_COMPLETE', 'Database setup completed successfully', 'check-circle', NULL, false)
ON CONFLICT DO NOTHING;

-- Add comments for maintenance
COMMENT ON SCHEMA public IS 'SpendWise Application Database - Production Ready v3.0';
COMMENT ON TABLE users IS 'Application users with preferences and auth data';
COMMENT ON TABLE categories IS 'Income/expense categories - includes multilingual defaults';
COMMENT ON TABLE recurring_templates IS 'Templates for automatic recurring transaction generation';
COMMENT ON TABLE expenses IS 'User expense transactions with soft deletion support';
COMMENT ON TABLE income IS 'User income transactions with soft deletion support';
COMMENT ON VIEW daily_balances IS 'CORRECTED: Daily balance calculations (income positive, expenses positive, net = income - expenses)';
COMMENT ON VIEW monthly_summary IS 'Monthly aggregated financial summary';

-- Final verification query (run this after migration)
-- SELECT * FROM database_health_check(); 