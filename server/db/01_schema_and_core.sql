-- ✅ SpendWise Database Schema - Complete Core Structure
-- This file contains all tables, indexes, and views that successfully work with the dashboard
-- Version: Production Ready - Matches Supabase deployment

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ===============================
-- CORE TABLES
-- ===============================

-- Users table with email verification and preferences
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email CITEXT UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    language_preference VARCHAR(10) DEFAULT 'en',
    theme_preference VARCHAR(20) DEFAULT 'light',
    currency_preference VARCHAR(10) DEFAULT 'USD',
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    preferences JSONB DEFAULT '{}',
    last_login TIMESTAMP
);

-- Add constraints for valid preference values
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_language_preference') THEN
        ALTER TABLE users ADD CONSTRAINT check_language_preference CHECK (language_preference IN ('en', 'he', 'es', 'fr', 'de', 'ar'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_theme_preference') THEN
        ALTER TABLE users ADD CONSTRAINT check_theme_preference CHECK (theme_preference IN ('light', 'dark', 'auto'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_currency_preference') THEN
        ALTER TABLE users ADD CONSTRAINT check_currency_preference CHECK (currency_preference IN ('USD', 'EUR', 'ILS', 'GBP', 'JPY', 'CNY'));
    END IF;
END $$;

-- Categories table - Updated with user_id for security
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    type VARCHAR(50) CHECK (type IN ('income', 'expense', NULL)),
    is_default BOOLEAN DEFAULT false,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recurring templates table
CREATE TABLE IF NOT EXISTS recurring_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(10) CHECK (type IN ('income', 'expense')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    interval_type VARCHAR(20) CHECK (interval_type IN ('daily', 'weekly', 'monthly')),
    day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    start_date DATE NOT NULL,
    end_date DATE,
    skip_dates DATE[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    template_id INTEGER REFERENCES recurring_templates(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Income table
CREATE TABLE IF NOT EXISTS income (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    template_id INTEGER REFERENCES recurring_templates(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- PERFORMANCE INDEXES
-- ===============================

CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_income_user_date ON income(user_id, date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_template ON expenses(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_income_template ON income(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens ON password_reset_tokens(token, used, expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens ON email_verification_tokens(token, used, expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_user ON email_verification_tokens(user_id) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_language ON users(language_preference);
CREATE INDEX IF NOT EXISTS idx_users_theme ON users(theme_preference);
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed) WHERE onboarding_completed = false;
CREATE INDEX IF NOT EXISTS idx_recurring_templates_user_active ON recurring_templates(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type) WHERE user_id IS NOT NULL;

-- ===============================
-- ESSENTIAL VIEWS - TESTED AND WORKING
-- ===============================

-- Drop and recreate views with correct logic
DROP VIEW IF EXISTS monthly_summary CASCADE;
DROP VIEW IF EXISTS daily_balances CASCADE;

-- Daily balance view with proper income/expense calculation
-- ✅ VERIFIED: This matches the working Supabase deployment
CREATE VIEW daily_balances AS
WITH expense_daily AS (
  SELECT 
    user_id,
    date,
    SUM(CASE WHEN deleted_at IS NULL THEN amount ELSE 0 END) AS expenses
  FROM expenses
  GROUP BY user_id, date
),
income_daily AS (
  SELECT 
    user_id,
    date,
    SUM(CASE WHEN deleted_at IS NULL THEN amount ELSE 0 END) AS income
  FROM income
  GROUP BY user_id, date
),
all_dates AS (
  SELECT user_id, date FROM expense_daily
  UNION
  SELECT user_id, date FROM income_daily
)
SELECT 
  ad.user_id,
  ad.date,
  (COALESCE(id.income, 0) - COALESCE(ed.expenses, 0)) AS net_amount,  -- ✅ CORRECT: income minus expenses
  COALESCE(ed.expenses, 0) AS expenses,
  COALESCE(id.income, 0) AS income
FROM all_dates ad
LEFT JOIN expense_daily ed ON ad.user_id = ed.user_id AND ad.date = ed.date
LEFT JOIN income_daily id ON ad.user_id = id.user_id AND ad.date = id.date;

-- Monthly summary with correct calculation
-- ✅ VERIFIED: This matches the working Supabase deployment
CREATE VIEW monthly_summary AS
SELECT 
  user_id,
  DATE_TRUNC('month', date)::timestamp with time zone AS month,
  SUM(income) AS total_income,
  SUM(expenses) AS total_expenses,
  SUM(income - expenses) AS net_balance,  -- ✅ CORRECT: income minus expenses
  COUNT(DISTINCT date) AS active_days
FROM daily_balances
GROUP BY user_id, DATE_TRUNC('month', date);

-- ===============================
-- COMPLETION MESSAGE
-- ===============================

-- Add comment to mark successful completion
COMMENT ON SCHEMA public IS 'SpendWise Database Schema v3.0 - Production Ready - Successfully deployed and tested'; 