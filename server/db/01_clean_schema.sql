-- SpendWise Clean Schema
-- Optimized for simple recurring transactions

-- Drop existing schema (for clean start)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    preferences JSONB DEFAULT '{}',
    last_login TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    type VARCHAR(50) CHECK (type IN ('income', 'expense', NULL)),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recurring templates table (NEW!)
CREATE TABLE recurring_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(10) CHECK (type IN ('income', 'expense')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    
    -- Recurring settings
    interval_type VARCHAR(20) CHECK (interval_type IN ('daily', 'weekly', 'monthly')),
    day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    
    -- Period
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table (simplified)
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    
    -- Link to recurring template
    template_id INTEGER REFERENCES recurring_templates(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Income table (same structure)
CREATE TABLE income (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    
    -- Link to recurring template
    template_id INTEGER REFERENCES recurring_templates(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_income_user_date ON income(user_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_template ON expenses(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX idx_income_template ON income(template_id) WHERE template_id IS NOT NULL;