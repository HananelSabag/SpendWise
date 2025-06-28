-- Migration: Organized Hebrew-English Categories (18 total)
-- Structure: 9 Hebrew + 9 English (4 income + 4 expense + 1 general per language)
-- Date: 2025-01-27

DO $$
BEGIN
  -- Clean existing default categories
  DELETE FROM categories WHERE is_default = true;
  
  -- Hebrew Categories (9 total)
  INSERT INTO categories (name, icon, type, is_default, created_at) VALUES
  
  -- Hebrew Income (4)
  ('משכורת', 'dollar-sign', 'income', true, NOW()),
  ('עבודה עצמאית', 'user', 'income', true, NOW()),
  ('השקעות', 'trending-up', 'income', true, NOW()),
  ('הכנסה מהירה', 'zap', 'income', true, NOW()),
  
  -- Hebrew Expenses (4)
  ('מכולת', 'shopping-cart', 'expense', true, NOW()),
  ('תחבורה', 'car', 'expense', true, NOW()),
  ('בידור', 'film', 'expense', true, NOW()),
  ('הוצאה מהירה', 'zap', 'expense', true, NOW()),
  
  -- Hebrew General (1)
  ('כללי', 'circle', 'expense', true, NOW()),
  
  -- English Categories (9 total)
  
  -- English Income (4)
  ('Salary', 'dollar-sign', 'income', true, NOW()),
  ('Freelance', 'user', 'income', true, NOW()),
  ('Investments', 'trending-up', 'income', true, NOW()),
  ('Quick Income', 'zap', 'income', true, NOW()),
  
  -- English Expenses (4)
  ('Groceries', 'shopping-cart', 'expense', true, NOW()),
  ('Transportation', 'car', 'expense', true, NOW()),
  ('Entertainment', 'film', 'expense', true, NOW()),
  ('Quick Expense', 'zap', 'expense', true, NOW()),
  
  -- English General (1)
  ('General', 'circle', 'expense', true, NOW());
  
  RAISE NOTICE 'Created % organized default categories', 
    (SELECT COUNT(*) FROM categories WHERE is_default = true);
  
END $$; 