-- ✅ SpendWise FINAL Admin System - Super Admin for Hananel
-- This file adds comprehensive admin functionality with Hananel as the super admin
-- Version: FINAL - Admin System Complete

-- ===============================
-- ADMIN SYSTEM CORE TABLES
-- ===============================

-- Add admin role to users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));
    END IF;
END $$;

-- Admin activity log table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'view_users', 'block_user', 'delete_user', 'change_settings', etc.
    target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action_details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings table for admin-configurable settings
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_public BOOLEAN DEFAULT false, -- Whether non-admin users can see this setting
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User blocks/restrictions table
CREATE TABLE IF NOT EXISTS user_restrictions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    restriction_type VARCHAR(50) NOT NULL, -- 'blocked', 'login_disabled', 'export_disabled', etc.
    reason TEXT,
    applied_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- ADMIN INDEXES FOR PERFORMANCE
-- ===============================

-- Performance indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action_type ON admin_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_user_id ON user_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_active ON user_restrictions(is_active);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- ===============================
-- ADMIN FUNCTIONS
-- ===============================

-- ✅ Get all users with admin details (for admin dashboard)
CREATE OR REPLACE FUNCTION get_admin_users_overview(
    p_admin_id INTEGER,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
    v_admin_role TEXT;
BEGIN
    -- Check if user is admin
    SELECT role INTO v_admin_role FROM users WHERE id = p_admin_id;
    
    IF v_admin_role NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Get users with their stats and restrictions
    SELECT json_build_object(
        'users', (
            SELECT json_agg(
                json_build_object(
                    'id', u.id,
                    'email', u.email,
                    'username', u.username,
                    'role', u.role,
                    'email_verified', u.email_verified,
                    'onboarding_completed', u.onboarding_completed,
                    'created_at', u.created_at,
                    'last_login', u.last_login,
                    'language_preference', u.language_preference,
                    'currency_preference', u.currency_preference,
                    'total_transactions', COALESCE(stats.transaction_count, 0),
                    'total_amount', COALESCE(stats.total_amount, 0),
                    'active_restrictions', COALESCE(restrictions.restriction_count, 0),
                    'restriction_types', COALESCE(restrictions.restriction_types, '[]'::json)
                )
            )
            FROM (
                SELECT * FROM users 
                ORDER BY created_at DESC 
                LIMIT p_limit OFFSET p_offset
            ) u
            LEFT JOIN (
                SELECT 
                    user_id,
                    COUNT(*) as transaction_count,
                    SUM(CASE WHEN type = 'income' THEN amount ELSE amount END) as total_amount
                FROM (
                    SELECT user_id, amount, 'income' as type FROM income WHERE deleted_at IS NULL
                    UNION ALL
                    SELECT user_id, amount, 'expense' as type FROM expenses WHERE deleted_at IS NULL
                ) all_transactions
                GROUP BY user_id
            ) stats ON u.id = stats.user_id
            LEFT JOIN (
                SELECT 
                    user_id,
                    COUNT(*) as restriction_count,
                    json_agg(restriction_type) as restriction_types
                FROM user_restrictions 
                WHERE is_active = true 
                  AND (expires_at IS NULL OR expires_at > NOW())
                GROUP BY user_id
            ) restrictions ON u.id = restrictions.user_id
        ),
        'total_count', (SELECT COUNT(*) FROM users),
        'summary', json_build_object(
            'total_users', (SELECT COUNT(*) FROM users),
            'verified_users', (SELECT COUNT(*) FROM users WHERE email_verified = true),
            'blocked_users', (
                SELECT COUNT(DISTINCT user_id) 
                FROM user_restrictions 
                WHERE is_active = true 
                  AND restriction_type = 'blocked'
                  AND (expires_at IS NULL OR expires_at > NOW())
            ),
            'new_users_today', (
                SELECT COUNT(*) FROM users 
                WHERE DATE(created_at) = CURRENT_DATE
            ),
            'active_users_week', (
                SELECT COUNT(*) FROM users 
                WHERE last_login >= NOW() - INTERVAL '7 days'
            )
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- ✅ Admin user management functions
CREATE OR REPLACE FUNCTION admin_manage_user(
    p_admin_id INTEGER,
    p_target_user_id INTEGER,
    p_action VARCHAR(50), -- 'block', 'unblock', 'delete', 'verify_email', 'reset_password'
    p_reason TEXT DEFAULT NULL,
    p_expires_hours INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_role TEXT;
    v_target_role TEXT;
    v_result JSON;
    v_expires_at TIMESTAMP;
BEGIN
    -- Check admin permissions
    SELECT role INTO v_admin_role FROM users WHERE id = p_admin_id;
    SELECT role INTO v_target_role FROM users WHERE id = p_target_user_id;
    
    IF v_admin_role NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Super admin check for sensitive operations
    IF v_target_role IN ('admin', 'super_admin') AND v_admin_role != 'super_admin' THEN
        RAISE EXCEPTION 'Access denied: Super admin privileges required to manage admin users';
    END IF;
    
    -- Set expiration if provided
    IF p_expires_hours IS NOT NULL THEN
        v_expires_at := NOW() + (p_expires_hours || ' hours')::INTERVAL;
    END IF;
    
    -- Execute action
    CASE p_action
        WHEN 'block' THEN
            INSERT INTO user_restrictions (user_id, restriction_type, reason, applied_by, expires_at)
            VALUES (p_target_user_id, 'blocked', p_reason, p_admin_id, v_expires_at);
            
        WHEN 'unblock' THEN
            UPDATE user_restrictions 
            SET is_active = false, updated_at = NOW()
            WHERE user_id = p_target_user_id 
              AND restriction_type = 'blocked' 
              AND is_active = true;
              
        WHEN 'delete' THEN
            -- Soft delete user (for safety - can be restored)
            UPDATE users 
            SET email = email || '_deleted_' || EXTRACT(epoch FROM NOW()),
                updated_at = NOW()
            WHERE id = p_target_user_id;
            
            -- Add restriction record
            INSERT INTO user_restrictions (user_id, restriction_type, reason, applied_by)
            VALUES (p_target_user_id, 'deleted', p_reason, p_admin_id);
            
        WHEN 'verify_email' THEN
            UPDATE users 
            SET email_verified = true, updated_at = NOW()
            WHERE id = p_target_user_id;
            
        ELSE
            RAISE EXCEPTION 'Invalid action: %', p_action;
    END CASE;
    
    -- Log admin activity
    INSERT INTO admin_activity_log (admin_id, action_type, target_user_id, action_details)
    VALUES (p_admin_id, p_action, p_target_user_id, json_build_object(
        'reason', p_reason,
        'expires_hours', p_expires_hours
    ));
    
    SELECT json_build_object(
        'success', true,
        'action', p_action,
        'target_user_id', p_target_user_id,
        'timestamp', NOW()
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- ✅ System settings management
CREATE OR REPLACE FUNCTION admin_manage_settings(
    p_admin_id INTEGER,
    p_action VARCHAR(20), -- 'get', 'set', 'delete'
    p_setting_key VARCHAR(100) DEFAULT NULL,
    p_setting_value JSONB DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_category VARCHAR(50) DEFAULT 'general'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_role TEXT;
    v_result JSON;
BEGIN
    -- Check admin permissions
    SELECT role INTO v_admin_role FROM users WHERE id = p_admin_id;
    
    IF v_admin_role NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    CASE p_action
        WHEN 'get' THEN
            SELECT json_agg(
                json_build_object(
                    'key', setting_key,
                    'value', setting_value,
                    'description', description,
                    'category', category,
                    'is_public', is_public,
                    'updated_at', updated_at
                )
            ) INTO v_result
            FROM system_settings
            WHERE (p_setting_key IS NULL OR setting_key = p_setting_key)
            ORDER BY category, setting_key;
            
        WHEN 'set' THEN
            INSERT INTO system_settings (setting_key, setting_value, description, category, updated_by)
            VALUES (p_setting_key, p_setting_value, p_description, p_category, p_admin_id)
            ON CONFLICT (setting_key) 
            DO UPDATE SET 
                setting_value = EXCLUDED.setting_value,
                description = COALESCE(EXCLUDED.description, system_settings.description),
                category = COALESCE(EXCLUDED.category, system_settings.category),
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW();
                
            SELECT json_build_object(
                'success', true,
                'setting_key', p_setting_key,
                'action', 'set'
            ) INTO v_result;
            
        WHEN 'delete' THEN
            DELETE FROM system_settings WHERE setting_key = p_setting_key;
            
            SELECT json_build_object(
                'success', true,
                'setting_key', p_setting_key,
                'action', 'delete'
            ) INTO v_result;
            
        ELSE
            RAISE EXCEPTION 'Invalid action: %', p_action;
    END CASE;
    
    -- Log admin activity
    INSERT INTO admin_activity_log (admin_id, action_type, action_details)
    VALUES (p_admin_id, 'manage_settings', json_build_object(
        'action', p_action,
        'setting_key', p_setting_key
    ));
    
    RETURN v_result;
END;
$$;

-- ✅ Get admin activity log
CREATE OR REPLACE FUNCTION get_admin_activity_log(
    p_admin_id INTEGER,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_role TEXT;
    v_result JSON;
BEGIN
    -- Check admin permissions
    SELECT role INTO v_admin_role FROM users WHERE id = p_admin_id;
    
    IF v_admin_role NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    SELECT json_build_object(
        'activities', (
            SELECT json_agg(
                json_build_object(
                    'id', aal.id,
                    'admin_username', au.username,
                    'admin_email', au.email,
                    'action_type', aal.action_type,
                    'target_user', CASE 
                        WHEN aal.target_user_id IS NOT NULL 
                        THEN json_build_object(
                            'id', tu.id,
                            'username', tu.username,
                            'email', tu.email
                        )
                        ELSE NULL 
                    END,
                    'action_details', aal.action_details,
                    'ip_address', aal.ip_address,
                    'created_at', aal.created_at
                ) ORDER BY aal.created_at DESC
            )
            FROM admin_activity_log aal
            LEFT JOIN users au ON aal.admin_id = au.id
            LEFT JOIN users tu ON aal.target_user_id = tu.id
            LIMIT p_limit OFFSET p_offset
        ),
        'total_count', (SELECT COUNT(*) FROM admin_activity_log)
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- ===============================
-- SET HANANEL AS SUPER ADMIN
-- ===============================

-- Make hananel12345@gmail.com a super admin (if user exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE email = 'hananel12345@gmail.com') THEN
        UPDATE users 
        SET role = 'super_admin',
            updated_at = NOW()
        WHERE email = 'hananel12345@gmail.com';
        
        RAISE NOTICE 'Hananel has been promoted to Super Admin!';
    ELSE
        RAISE NOTICE 'User hananel12345@gmail.com not found. Super admin role will be applied when user registers.';
    END IF;
END $$;

-- ===============================
-- DEFAULT SYSTEM SETTINGS
-- ===============================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description, category, is_public) VALUES
('max_export_per_day', '3', 'Maximum number of exports per user per day', 'limits', false),
('max_transaction_batch_size', '100', 'Maximum number of transactions that can be created in one batch', 'limits', false),
('maintenance_mode', 'false', 'Enable maintenance mode (blocks non-admin access)', 'system', false),
('registration_enabled', 'true', 'Allow new user registrations', 'system', true),
('google_oauth_enabled', 'true', 'Enable Google OAuth login', 'auth', true),
('default_currency', '"USD"', 'Default currency for new users', 'defaults', true),
('default_language', '"en"', 'Default language for new users', 'defaults', true),
('app_version', '"2.0"', 'Current application version', 'info', true),
('support_email', '"support@spendwise.com"', 'Support email address', 'contact', true),
('privacy_policy_url', '"https://spendwise.com/privacy"', 'Privacy policy URL', 'legal', true)
ON CONFLICT (setting_key) DO NOTHING;

-- ===============================
-- ADMIN TRIGGERS
-- ===============================

-- Auto-promote hananel12345@gmail.com to super_admin on registration
CREATE OR REPLACE FUNCTION auto_promote_hananel()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email = 'hananel12345@gmail.com' THEN
        NEW.role = 'super_admin';
        NEW.email_verified = true; -- Auto-verify Hananel's email
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-promotion
DROP TRIGGER IF EXISTS trigger_auto_promote_hananel ON users;
CREATE TRIGGER trigger_auto_promote_hananel
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_promote_hananel();

-- ===============================
-- FUNCTION DOCUMENTATION
-- ===============================

COMMENT ON FUNCTION get_admin_users_overview(INTEGER, INTEGER, INTEGER) IS 'ADMIN: Get comprehensive users overview with stats and restrictions';
COMMENT ON FUNCTION admin_manage_user(INTEGER, INTEGER, VARCHAR, TEXT, INTEGER) IS 'ADMIN: Manage user actions (block, unblock, delete, verify)';
COMMENT ON FUNCTION admin_manage_settings(INTEGER, VARCHAR, VARCHAR, JSONB, TEXT, VARCHAR) IS 'ADMIN: Manage system settings';
COMMENT ON FUNCTION get_admin_activity_log(INTEGER, INTEGER, INTEGER) IS 'ADMIN: Get admin activity log with pagination';

-- ===============================
-- ADMIN SYSTEM COMPLETE
-- ===============================

-- Log admin system installation
INSERT INTO admin_activity_log (admin_id, action_type, action_details) 
SELECT id, 'system_install', json_build_object(
    'version', '2.0',
    'features', json_build_array(
        'user_management',
        'system_settings',
        'activity_logging',
        'super_admin_hananel'
    ),
    'installed_at', NOW()
)
FROM users WHERE email = 'hananel12345@gmail.com' AND role = 'super_admin'
LIMIT 1;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 ADMIN SYSTEM COMPLETE! 🎉';
    RAISE NOTICE '✅ Super Admin: hananel12345@gmail.com';
    RAISE NOTICE '✅ User Management: Block, Delete, Verify';
    RAISE NOTICE '✅ System Settings: Full Configuration';
    RAISE NOTICE '✅ Activity Logging: Complete Audit Trail';
    RAISE NOTICE '✅ Security: Multi-level Admin Permissions';
    RAISE NOTICE '🚀 Ready for Admin Dashboard Implementation!';
END $$; 