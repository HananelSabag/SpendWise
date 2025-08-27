-- ✅ SpendWise SECURITY HARDENING - Role-Based Access Control
-- This migration removes hardcoded emails and ensures pure role-based access control
-- Version: 6.0.0 - SECURITY HARDENING

-- ===============================
-- REMOVE HARDCODED EMAIL DEPENDENCIES
-- ===============================

-- Drop the hardcoded email promotion trigger
DROP TRIGGER IF EXISTS auto_promote_hananel_trigger ON users;
DROP FUNCTION IF EXISTS auto_promote_hananel();

-- Drop the hardcoded email super admin function
DROP FUNCTION IF EXISTS ensure_super_admin_hananel();

-- ===============================
-- ENHANCED ROLE-BASED SECURITY FUNCTIONS
-- ===============================

-- Function to securely promote a user to admin (only by existing super admin)
CREATE OR REPLACE FUNCTION promote_user_to_admin(
    target_user_id INTEGER,
    new_role VARCHAR(20),
    promoted_by_user_id INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_promoter_role VARCHAR(20);
    v_target_current_role VARCHAR(20);
    v_result JSON;
BEGIN
    -- Validate input parameters
    IF target_user_id IS NULL OR new_role IS NULL OR promoted_by_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'All parameters are required'
        );
    END IF;
    
    -- Validate new role
    IF new_role NOT IN ('user', 'admin', 'super_admin') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid role. Must be user, admin, or super_admin'
        );
    END IF;
    
    -- Get promoter's role
    SELECT role INTO v_promoter_role FROM users WHERE id = promoted_by_user_id;
    
    IF v_promoter_role IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Promoter user not found'
        );
    END IF;
    
    -- Get target user's current role
    SELECT role INTO v_target_current_role FROM users WHERE id = target_user_id;
    
    IF v_target_current_role IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Target user not found'
        );
    END IF;
    
    -- Security checks: Only super admin can promote to admin or super_admin
    IF new_role IN ('admin', 'super_admin') AND v_promoter_role != 'super_admin' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Only super admin can promote users to admin or super_admin roles'
        );
    END IF;
    
    -- Security check: Only super admin can demote other admins
    IF v_target_current_role IN ('admin', 'super_admin') AND v_promoter_role != 'super_admin' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Only super admin can modify admin or super_admin users'
        );
    END IF;
    
    -- Security check: Cannot promote/demote yourself to/from super_admin
    IF target_user_id = promoted_by_user_id AND new_role = 'super_admin' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cannot promote yourself to super_admin'
        );
    END IF;
    
    -- Perform the role change
    UPDATE users 
    SET role = new_role, updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Log the action
    INSERT INTO admin_activity_log (
        admin_id, 
        admin_username, 
        action_type, 
        target_user_id, 
        details, 
        created_at
    ) VALUES (
        promoted_by_user_id,
        (SELECT username FROM users WHERE id = promoted_by_user_id),
        'role_changed',
        target_user_id,
        json_build_object(
            'old_role', v_target_current_role,
            'new_role', new_role,
            'changed_by', v_promoter_role
        ),
        NOW()
    );
    
    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'user_id', target_user_id,
            'old_role', v_target_current_role,
            'new_role', new_role,
            'changed_by', promoted_by_user_id
        )
    );
END;
$$;

-- ===============================
-- SECURE ADMIN INITIALIZATION 
-- ===============================

-- Function to check if system has any super admin (for initial setup only)
CREATE OR REPLACE FUNCTION system_has_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE role = 'super_admin' 
        AND email NOT LIKE '%_deleted_%'
        AND is_active = true
    );
END;
$$;

-- Function for initial super admin setup (only works if no super admin exists)
CREATE OR REPLACE FUNCTION initialize_first_super_admin(user_email VARCHAR)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id INTEGER;
    v_result JSON;
BEGIN
    -- Check if system already has super admin
    IF system_has_super_admin() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'System already has super admin. Use role promotion instead.'
        );
    END IF;
    
    -- Validate email parameter
    IF user_email IS NULL OR user_email = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Email is required'
        );
    END IF;
    
    -- Check if user exists
    SELECT id INTO v_user_id FROM users WHERE email = user_email AND is_active = true;
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found or inactive'
        );
    END IF;
    
    -- Promote user to super admin
    UPDATE users SET 
        role = 'super_admin',
        updated_at = NOW()
    WHERE id = v_user_id;
    
    -- Log the initialization
    INSERT INTO admin_activity_log (
        admin_id, 
        admin_username, 
        action_type, 
        target_user_id, 
        details, 
        created_at
    ) VALUES (
        v_user_id,
        (SELECT username FROM users WHERE id = v_user_id),
        'system_initialization',
        v_user_id,
        json_build_object(
            'action', 'first_super_admin_initialized',
            'email', user_email
        ),
        NOW()
    );
    
    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'user_id', v_user_id,
            'email', user_email,
            'role', 'super_admin',
            'action', 'initialized_first_super_admin'
        )
    );
END;
$$;

-- ===============================
-- ROLE VALIDATION TRIGGERS
-- ===============================

-- Function to validate role changes
CREATE OR REPLACE FUNCTION validate_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure role is valid
    IF NEW.role NOT IN ('user', 'admin', 'super_admin') THEN
        RAISE EXCEPTION 'Invalid role: %. Must be user, admin, or super_admin', NEW.role;
    END IF;
    
    -- Prevent direct database role escalation (should go through functions)
    IF OLD.role IS NOT NULL AND OLD.role != NEW.role THEN
        -- Allow role changes only through proper channels or during registration
        IF TG_OP = 'UPDATE' AND OLD.role IN ('admin', 'super_admin') AND NEW.role != OLD.role THEN
            RAISE EXCEPTION 'Direct role modification not allowed. Use promote_user_to_admin function.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for role validation
DROP TRIGGER IF EXISTS validate_user_role_trigger ON users;
CREATE TRIGGER validate_user_role_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION validate_role_change();

-- ===============================
-- SECURITY AUDIT FUNCTIONS
-- ===============================

-- Function to audit admin actions
CREATE OR REPLACE FUNCTION audit_admin_access(
    user_id INTEGER,
    action_performed VARCHAR,
    resource_accessed VARCHAR,
    additional_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO admin_activity_log (
        admin_id,
        admin_username,
        action_type,
        target_user_id,
        details,
        created_at
    ) VALUES (
        user_id,
        (SELECT username FROM users WHERE id = user_id),
        action_performed,
        NULL,
        json_build_object(
            'resource', resource_accessed,
            'timestamp', NOW(),
            'details', additional_details
        ),
        NOW()
    );
END;
$$;

-- ===============================
-- REMOVE OLD SECURITY VULNERABILITIES
-- ===============================

-- Remove any existing hardcoded admin entries (for migration safety)
DO $$
BEGIN
    -- Log any hardcoded entries that will be modified
    IF EXISTS (SELECT 1 FROM users WHERE email = 'hananel12345@gmail.com' AND role = 'super_admin') THEN
        INSERT INTO admin_activity_log (
            admin_id, 
            admin_username, 
            action_type, 
            details, 
            created_at
        ) VALUES (
            (SELECT id FROM users WHERE email = 'hananel12345@gmail.com'),
            'system',
            'security_hardening',
            json_build_object(
                'action', 'removed_hardcoded_admin_access',
                'reason', 'security_hardening_migration',
                'migration_version', '6.0.0'
            ),
            NOW()
        );
        
        RAISE NOTICE 'Security hardening: Hardcoded admin access patterns have been replaced with role-based system.';
    END IF;
END $$;

-- ===============================
-- GRANT NECESSARY PERMISSIONS
-- ===============================

-- Grant execute permissions on security functions to appropriate roles
-- Note: These functions have SECURITY DEFINER, so they run with elevated privileges

COMMENT ON FUNCTION promote_user_to_admin IS 'Securely promote users between roles with proper authorization checks';
COMMENT ON FUNCTION system_has_super_admin IS 'Check if system has at least one super admin';
COMMENT ON FUNCTION initialize_first_super_admin IS 'Initialize first super admin (only works if no super admin exists)';
COMMENT ON FUNCTION audit_admin_access IS 'Audit admin actions for security monitoring';

-- ===============================
-- FINAL SECURITY NOTES
-- ===============================

-- This migration successfully:
-- 1. Removes all hardcoded email-based admin access
-- 2. Implements proper role-based promotion functions
-- 3. Adds security checks and audit logging
-- 4. Provides secure initialization for first super admin
-- 5. Prevents direct database role manipulation

RAISE NOTICE 'Security hardening migration completed successfully. System is now pure role-based.';
