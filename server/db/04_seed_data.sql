-- Sample data for development - DISABLED IN PRODUCTION

-- Production safety check - ALWAYS PREVENT IN PRODUCTION
DO $$
BEGIN
    IF current_setting('custom.environment', true) = 'production' THEN
        RAISE EXCEPTION 'Cannot run seed data in production environment';
    END IF;
    
    -- Additional safety - check if we're in a live environment
    IF current_database() NOT LIKE '%test%' AND current_database() NOT LIKE '%dev%' THEN
        RAISE NOTICE 'WARNING: This appears to be a live database. Seed data execution cancelled.';
        RETURN; -- Exit without executing
    END IF;
END $$;

-- Development test user - ONLY FOR DEVELOPMENT
INSERT INTO users (id, email, username, password_hash) VALUES
(1, 'dev-test@localhost.com', 'Development User', '$2b$10$K4KEHneHMsTHqCX7dXJf8eOKRHMXM/vJmfLHb8g7RcvYYNDLVqGqC') -- Password: 'dev123test'
ON CONFLICT (id) DO NOTHING;

-- Reset the sequence to continue from 2
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Default categories
INSERT INTO categories (name, icon, type, is_default) VALUES
('Salary', 'briefcase', 'income', true),
('Freelance', 'laptop', 'income', true),
('Rent', 'home', 'expense', true),
('Groceries', 'shopping-cart', 'expense', true),
('Transportation', 'car', 'expense', true),
('Utilities', 'zap', 'expense', true),
('Entertainment', 'music', 'expense', true),
('General', 'circle', NULL, true);

-- Sample recurring templates (after user exists)
INSERT INTO recurring_templates (user_id, type, amount, description, category_id, interval_type, day_of_month, start_date) VALUES
(1, 'income', 15000, 'Monthly Salary', 1, 'monthly', 10, CURRENT_DATE),
(1, 'expense', 4000, 'Monthly Rent', 3, 'monthly', 1, CURRENT_DATE);

-- Generate initial transactions
SELECT generate_recurring_transactions();

-- Add some one-time transactions
INSERT INTO expenses (user_id, amount, description, date, category_id) VALUES
(1, 250, 'Grocery shopping', CURRENT_DATE, 4),
(1, 80, 'Bus card', CURRENT_DATE - INTERVAL '1 day', 5);

-- Verify everything worked
DO $$
BEGIN
    RAISE NOTICE 'Seed data loaded successfully!';
    RAISE NOTICE 'Users: %, Categories: %, Templates: %',
        (SELECT COUNT(*) FROM users),
        (SELECT COUNT(*) FROM categories),
        (SELECT COUNT(*) FROM recurring_templates);
END $$;