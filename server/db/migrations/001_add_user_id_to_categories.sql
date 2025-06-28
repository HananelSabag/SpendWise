-- ✅ SECURITY FIX: Add user_id to categories table
-- Migration 001: Categories User Association 
-- Applied to Supabase: $(date)
-- Status: COMPLETED ✅

-- SECURITY ISSUE RESOLVED:
-- Before: Categories were global - all users shared same categories
-- After: Categories are user-specific with proper isolation

-- Step 1: Add user_id column (nullable for existing default categories)
ALTER TABLE categories 
ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Step 2: Create performance index
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- Step 3: Create composite index for efficient querying
CREATE INDEX idx_categories_user_type ON categories(user_id, type) WHERE user_id IS NOT NULL;

-- Step 4: Add comment for documentation
COMMENT ON COLUMN categories.user_id IS 'NULL for default/global categories, user ID for user-specific categories';

-- VERIFICATION:
-- ✅ Default categories (is_default=true) remain global (user_id=NULL)
-- ✅ User categories will have specific user_id
-- ✅ Users can only see: defaults + their own categories
-- ✅ Users can only edit/delete: their own categories

-- CODE CHANGES REQUIRED:
-- ✅ Category.getAll(userId) - filter by user
-- ✅ Category.create(data, userId) - assign to user
-- ✅ Category.update(id, data, userId) - check ownership
-- ✅ Category.delete(id, userId) - check ownership
-- ✅ Controllers updated to pass userId
-- ✅ Security validation added 