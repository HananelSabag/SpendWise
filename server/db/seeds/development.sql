-- Seed Categories
INSERT INTO categories (name, description, is_default) VALUES
('Groceries', 'Daily food and household items', true),
('Bills', 'Monthly recurring bills', true),
('Transportation', 'Public transport and fuel', true),
('Entertainment', 'Movies, games, and hobbies', true);

-- Seed Test User
INSERT INTO users (email, username, password_hash) VALUES
('demo@example.com', 'demo_user', '$2b$10$xxxxxxxxxxx') -- We'll generate this hash properly
ON CONFLICT (email) DO NOTHING;

-- Seed Sample Expenses
INSERT INTO expenses (user_id, amount, description, category_id, date) VALUES
(1, 50.00, 'Grocery shopping', 1, CURRENT_DATE),
(1, 30.00, 'Bus pass', 3, CURRENT_DATE - INTERVAL '1 day'),
(1, 100.00, 'Electricity bill', 2, CURRENT_DATE - INTERVAL '2 days');

-- Seed Sample Income
INSERT INTO income (user_id, amount, description, date, is_recurring) VALUES
(1, 3000.00, 'Monthly salary', CURRENT_DATE, true),
(1, 500.00, 'Freelance work', CURRENT_DATE - INTERVAL '15 days', false);