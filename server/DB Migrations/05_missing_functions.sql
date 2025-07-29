-- ✅ SpendWise FINAL Missing Functions and Fixes
-- This file adds missing database functions and ensures admin access
-- Version: FINAL - Missing Functions Complete

-- ===============================
-- ENSURE SUPER ADMIN ACCESS FOR HANANEL
-- ===============================

-- Function to setup super admin user
CREATE OR REPLACE FUNCTION ensure_super_admin_hananel()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id INTEGER;
    v_result JSON;
BEGIN
    -- Check if hananel user exists
    SELECT id INTO v_user_id FROM users WHERE email = 'hananel12345@gmail.com';
    
    IF v_user_id IS NULL THEN
        -- Create hananel as super admin
        INSERT INTO users (
            email, 
            username, 
            role, 
            email_verified, 
            password_hash,
            first_name,
            last_name,
            created_at,
            updated_at
        ) VALUES (
            'hananel12345@gmail.com',
            'hananel',
            'super_admin',
            true,
            '$2b$12$dummy.hash.for.super.admin.access',
            'Hananel',
            'Admin',
            NOW(),
            NOW()
        ) RETURNING id INTO v_user_id;
        
        v_result = json_build_object(
            'action', 'created',
            'user_id', v_user_id,
            'email', 'hananel12345@gmail.com',
            'role', 'super_admin'
        );
    ELSE
        -- Update existing user to super admin
        UPDATE users SET 
            role = 'super_admin',
            email_verified = true,
            updated_at = NOW()
        WHERE id = v_user_id;
        
        v_result = json_build_object(
            'action', 'updated',
            'user_id', v_user_id,
            'email', 'hananel12345@gmail.com',
            'role', 'super_admin'
        );
    END IF;
    
    RETURN v_result;
END;
$$;

-- Execute the function to ensure super admin access
SELECT ensure_super_admin_hananel() as result;

-- ===============================
-- MISSING STATUS HANDLING FUNCTIONS
-- ===============================

-- Function to determine user status
CREATE OR REPLACE FUNCTION get_user_status(
    p_user_id INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_blocked_count INTEGER;
    v_email_verified BOOLEAN;
BEGIN
    -- Check for active restrictions
    SELECT COUNT(*) INTO v_blocked_count
    FROM user_restrictions 
    WHERE user_id = p_user_id 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- Check email verification
    SELECT email_verified INTO v_email_verified
    FROM users WHERE id = p_user_id;
    
    -- Determine status
    IF v_blocked_count > 0 THEN
        RETURN 'blocked';
    ELSIF NOT v_email_verified THEN
        RETURN 'pending';
    ELSE
        RETURN 'active';
    END IF;
END;
$$;

-- Update the admin users overview function to include status
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
                    'first_name', u.first_name,
                    'last_name', u.last_name,
                    'role', u.role,
                    'email_verified', u.email_verified,
                    'onboarding_completed', u.onboarding_completed,
                    'created_at', u.created_at,
                    'last_login', u.last_login,
                    'language_preference', u.language_preference,
                    'currency_preference', u.currency_preference,
                    'status', get_user_status(u.id),
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
                    SUM(amount) as total_amount
                FROM transactions 
                GROUP BY user_id
            ) stats ON u.id = stats.user_id
            LEFT JOIN (
                SELECT 
                    user_id,
                    COUNT(*) as restriction_count,
                    json_agg(restriction_type) as restriction_types
                FROM user_restrictions
                WHERE is_active = true
                GROUP BY user_id
            ) restrictions ON u.id = restrictions.user_id
        ),
        'summary', (
            SELECT json_build_object(
                'total_users', COUNT(*),
                'active_users', COUNT(*) FILTER (WHERE get_user_status(id) = 'active'),
                'blocked_users', COUNT(*) FILTER (WHERE get_user_status(id) = 'blocked'),
                'pending_users', COUNT(*) FILTER (WHERE get_user_status(id) = 'pending'),
                'admin_users', COUNT(*) FILTER (WHERE role IN ('admin', 'super_admin')),
                'verified_users', COUNT(*) FILTER (WHERE email_verified = true)
            )
            FROM users
        ),
        'pagination', json_build_object(
            'limit', p_limit,
            'offset', p_offset,
            'total_count', (SELECT COUNT(*) FROM users)
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- ===============================
-- LOG SUCCESSFUL SETUP
-- ===============================

-- Log admin system update
INSERT INTO admin_activity_log (admin_id, action_type, action_details) 
SELECT id, 'system_update', json_build_object(
    'version', '2.1',
    'features_added', json_build_array(
        'super_admin_hananel_ensured',
        'user_status_function',
        'enhanced_users_overview'
    ),
    'updated_at', NOW()
)
FROM users WHERE email = 'hananel12345@gmail.com' AND role = 'super_admin'
LIMIT 1;

-- Success message
SELECT 'Admin system updated successfully' as message; 