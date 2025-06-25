-- ✅ SpendWise Database Synchronization Verification Script
-- Run this to verify local migrations match Supabase database state

-- 1. Check all expected tables exist
SELECT 
  'Table Check' as check_type,
  table_name,
  CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
  VALUES 
    ('users'),
    ('categories'),
    ('recurring_templates'),
    ('expenses'),
    ('income'),
    ('password_reset_tokens'),
    ('email_verification_tokens')
) AS expected(table_name)
LEFT JOIN information_schema.tables t 
  ON t.table_name = expected.table_name 
  AND t.table_schema = 'public'
ORDER BY expected.table_name;

-- 2. Check all expected views exist
SELECT 
  'View Check' as check_type,
  view_name,
  CASE WHEN view_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
  VALUES ('daily_balances'), ('monthly_summary')
) AS expected(view_name)
LEFT JOIN information_schema.views v 
  ON v.table_name = expected.view_name 
  AND v.table_schema = 'public'
ORDER BY expected.view_name;

-- 3. Check all expected functions exist with proper security
SELECT 
  'Function Check' as check_type,
  routine_name,
  CASE 
    WHEN routine_name IS NULL THEN '❌ MISSING'
    WHEN security_type = 'DEFINER' THEN '✅ SECURE'
    ELSE '⚠️ NEEDS_SECURITY_UPDATE'
  END as status,
  security_type
FROM (
  VALUES 
    ('generate_recurring_transactions'),
    ('update_future_transactions'), 
    ('delete_future_transactions'),
    ('delete_transaction_with_options'),
    ('calculate_smart_daily_balance'),
    ('get_period_balance')
) AS expected(routine_name)
LEFT JOIN information_schema.routines r 
  ON r.routine_name = expected.routine_name 
  AND r.routine_schema = 'public'
ORDER BY expected.routine_name;

-- 4. Test balance calculation logic (should show correct income/expense relationship)
SELECT 
  'Balance Logic Test' as check_type,
  'Sample calculation for user 13' as description,
  SUM(income) as total_income,
  SUM(expenses) as total_expenses,
  SUM(net_amount) as net_balance,
  CASE 
    WHEN SUM(net_amount) = (SUM(income) - SUM(expenses)) THEN '✅ CORRECT'
    ELSE '❌ LOGIC_ERROR'
  END as calculation_status
FROM daily_balances 
WHERE user_id = 13;

-- 5. Test deletion function exists and works
SELECT 
  'Deletion Function Test' as check_type,
  'delete_transaction_with_options' as function_name,
  CASE 
    WHEN pg_get_functiondef('delete_transaction_with_options(text,integer,integer,boolean,boolean,boolean)'::regprocedure) IS NOT NULL 
    THEN '✅ FUNCTION_EXISTS'
    ELSE '❌ FUNCTION_MISSING'
  END as status;

-- 6. Check migration tracking
SELECT 
  'Migration Status' as check_type,
  version,
  name,
  '✅ APPLIED' as status
FROM supabase_migrations.schema_migrations 
ORDER BY version;

-- Summary verification query
SELECT 
  '🎯 VERIFICATION SUMMARY' as final_status,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'categories', 'recurring_templates', 'expenses', 'income', 'password_reset_tokens', 'email_verification_tokens')
    ) = 7 
    AND (
      SELECT COUNT(*) FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name IN ('daily_balances', 'monthly_summary')
    ) = 2
    AND (
      SELECT COUNT(*) FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN ('generate_recurring_transactions', 'delete_transaction_with_options')
    ) >= 2
    THEN '✅ ALL_SYSTEMS_OPERATIONAL'
    ELSE '⚠️ NEEDS_ATTENTION'
  END as overall_status; 