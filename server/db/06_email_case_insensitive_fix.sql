-- Email Case Sensitivity Fix
-- This migration ensures emails are case-insensitive throughout the system

-- Step 1: Normalize existing emails to lowercase
UPDATE users SET email = LOWER(email);

-- Step 2: Remove the original case-sensitive unique constraint
ALTER TABLE users DROP CONSTRAINT users_email_key;

-- Step 3: Add a case-insensitive unique constraint using a functional index
CREATE UNIQUE INDEX users_email_lower_unique ON users (LOWER(email));

-- Step 4: Add a comment to document the change
COMMENT ON INDEX users_email_lower_unique IS 'Case-insensitive unique constraint for email addresses';

-- Step 5: Add a check constraint to ensure emails are stored in lowercase
ALTER TABLE users ADD CONSTRAINT email_lowercase_check CHECK (email = LOWER(email));

-- Step 6: Create a function to automatically normalize emails on insert/update
CREATE OR REPLACE FUNCTION normalize_email()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email = LOWER(TRIM(NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to automatically normalize emails
CREATE TRIGGER normalize_email_trigger
    BEFORE INSERT OR UPDATE OF email ON users
    FOR EACH ROW
    EXECUTE FUNCTION normalize_email();

-- Step 8: Update any existing password reset tokens and verification tokens 
-- to ensure they reference the correct user records
-- (This is mainly for completeness, shouldn't be necessary with the current implementation) 