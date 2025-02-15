-- Database schema for SpendWise - Initial Structure
-- File: init.sql

-- Users: Store user account information
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    preferences JSONB DEFAULT '{}'::jsonb,
    last_login TIMESTAMP
);

-- Categories: Expense and income categories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    icon VARCHAR(50),
    type VARCHAR(50) DEFAULT 'expense',
    is_default BOOLEAN DEFAULT false
);

-- Expenses: Track individual and recurring expenses
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_recurring BOOLEAN DEFAULT false,
    recurring_interval VARCHAR(50),
    recurring_amount DECIMAL(10,2),
    next_recurrence_date DATE,
    last_processed_date DATE,
    daily_amount DECIMAL(10,2)
);

-- Income: Track income sources and amounts
CREATE TABLE IF NOT EXISTS income (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_recurring BOOLEAN DEFAULT false,
    recurring_interval VARCHAR(50),
    recurring_amount DECIMAL(10,2),
    next_recurrence_date DATE,
    last_processed_date DATE,
    daily_amount DECIMAL(10,2)
);