-- ================================
-- SpendWise Onboarding Database Update
-- Run this script in Supabase SQL Editor
-- ================================

-- 1. Add onboarding_completed column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 2. Add performance index for onboarding queries
-- (Only indexes users who haven't completed onboarding for efficiency)
CREATE INDEX IF NOT EXISTS idx_users_onboarding 
ON users(onboarding_completed) 
WHERE onboarding_completed = false;

-- 3. Set existing users as having completed onboarding
-- (Assuming existing users don't need to go through onboarding)
UPDATE users 
SET onboarding_completed = true 
WHERE onboarding_completed IS NULL OR onboarding_completed = false;

-- 4. Add comment for documentation
COMMENT ON COLUMN users.onboarding_completed IS 'Whether the user has completed the initial onboarding process';

-- ================================
-- Verification
-- ================================

-- Check the results
SELECT 
    'Column added successfully' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as onboarded_users,
    COUNT(CASE WHEN onboarding_completed = false THEN 1 END) as not_onboarded_users
FROM users; 