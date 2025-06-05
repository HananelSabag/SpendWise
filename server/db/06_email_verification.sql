-- Email Verification Feature Migration
-- This migration adds email verification support to existing database

-- Add email_verified column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
        
        -- Set existing users as verified (grandfathering them in)
        UPDATE users SET email_verified = true WHERE id IS NOT NULL;
        
        -- Add index for email_verified lookups
        CREATE INDEX idx_users_email_verified ON users(email_verified);
    END IF;
END $$;

-- Create email verification tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for email verification tokens if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens 
ON email_verification_tokens(token, used, expires_at);

-- Add index for user lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_email_verification_user 
ON email_verification_tokens(user_id) WHERE used = false;

-- Function to clean up expired tokens (both password reset and email verification)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Delete expired password reset tokens
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW() OR used = true;
    
    -- Delete expired email verification tokens
    DELETE FROM email_verification_tokens 
    WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to clean up expired tokens daily
-- (This would need to be set up separately in your PostgreSQL instance)
-- Example: SELECT cron.schedule('cleanup-expired-tokens', '0 3 * * *', 'SELECT cleanup_expired_tokens()');