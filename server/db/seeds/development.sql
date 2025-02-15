-- File: development.sql
-- Sample data for development environment

-- Clear existing data
TRUNCATE categories, expenses, income RESTART IDENTITY CASCADE;

-- Default categories
INSERT INTO categories (name, description, icon, type, is_default) VALUES
('Salary', 'Regular employment income', 'briefcase', 'income', true),
('Freelance', 'Project-based income', 'laptop', 'income', true),
('Investments', 'Investment returns', 'trending-up', 'income', true),
('Rent', 'Housing expenses', 'home', 'expense', true),
('Groceries', 'Food and household items', 'shopping-cart', 'expense', true),
('Transportation', 'Bus and fuel costs', 'car', 'expense', true),
('Utilities', 'Electricity, water, internet', 'zap', 'expense', true),
('Entertainment', 'Movies, games, hobbies', 'music', 'expense', true);
('General', 'General purpose transactions', 'circle', NULL, true);
('General', 'General purpose transactions', 'circle', NULL, true);

-- Sample recurring monthly income (salary)
INSERT INTO income 
(user_id, amount, description, category_id, date, is_recurring, recurring_interval, recurring_amount) 
VALUES 
(1, 15000.00, 'Monthly Salary', 1, CURRENT_DATE, true, 'monthly', 15000.00);

-- Sample recurring monthly expense (rent)
INSERT INTO expenses 
(user_id, amount, description, category_id, date, is_recurring, recurring_interval, recurring_amount) 
VALUES 
(1, 4000.00, 'Monthly Rent', 4, CURRENT_DATE, true, 'monthly', 4000.00);

-- Sample one-time transactions
INSERT INTO expenses 
(user_id, amount, description, category_id, date) 
VALUES 
(1, 200.00, 'Grocery shopping', 5, CURRENT_DATE),
(1, 50.00, 'Bus pass', 6, CURRENT_DATE - INTERVAL '1 day'),
(1, 100.00, 'Electricity bill', 7, CURRENT_DATE - INTERVAL '2 days');

INSERT INTO income 
(user_id, amount, description, category_id, date) 
VALUES 
(1, 2500.00, 'Freelance project', 2, CURRENT_DATE - INTERVAL '2 days'),
(1, 500.00, 'Stock dividend', 3, CURRENT_DATE - INTERVAL '1 day');