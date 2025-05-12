-- File: 001_schema.sql
-- Core database schema with all tables and columns

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    preferences JSONB DEFAULT '{}',
    last_login TIMESTAMP
);

-- Categories table
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

-- Shared columns for transaction tables
CREATE OR REPLACE FUNCTION create_transaction_table(table_name text) RETURNS void AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            amount DECIMAL(10,2) NOT NULL,
            description TEXT,
            date DATE NOT NULL,
            category_id INTEGER REFERENCES categories(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_recurring BOOLEAN DEFAULT false,
            recurring_interval VARCHAR(50),
            recurring_amount DECIMAL(10,2),
            recurring_start_date DATE,
            recurring_end_date DATE,
            next_recurrence_date DATE,
            last_occurrence_date DATE,
            parent_transaction_id INTEGER,
            skip_dates DATE[],
            recurring_status VARCHAR(20) DEFAULT ''active'',
            daily_amount DECIMAL(10,2),
            deleted_at TIMESTAMP
        )', table_name);
END;
$$ LANGUAGE plpgsql;

-- Create tables
SELECT create_transaction_table('expenses');
SELECT create_transaction_table('income');

-- Add self-referential foreign keys
ALTER TABLE expenses
    ADD CONSTRAINT expenses_parent_fk 
    FOREIGN KEY (parent_transaction_id) 
    REFERENCES expenses(id);

ALTER TABLE income
    ADD CONSTRAINT income_parent_fk 
    FOREIGN KEY (parent_transaction_id) 
    REFERENCES income(id);