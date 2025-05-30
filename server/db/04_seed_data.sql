-- Sample data for development

-- Test user with specific ID
INSERT INTO users (id, email, username, password_hash) VALUES
(1, 'test@example.com', 'Test User', '$2b$10$YourHashHere')
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