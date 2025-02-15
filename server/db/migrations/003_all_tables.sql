-- Complete all table structures

-- Update users table with additional fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Update categories table
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'expense',
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Create complete expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    receipt_url TEXT,
    transaction_type VARCHAR(50) DEFAULT 'one_time',
    frequency VARCHAR(50),
    next_date DATE,
    is_recurring BOOLEAN DEFAULT false
);

-- Create complete income table
CREATE TABLE IF NOT EXISTS income (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_recurring BOOLEAN DEFAULT false,
    transaction_type VARCHAR(50) DEFAULT 'one_time',
    frequency VARCHAR(50),
    next_date DATE,
    source_type TEXT
);
-- Update expenses table
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Update income table
ALTER TABLE income
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;