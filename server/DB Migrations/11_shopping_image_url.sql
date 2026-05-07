-- Add image_url column to shopping_items (TEXT to support base64 data URLs)
ALTER TABLE shopping_items
  ADD COLUMN IF NOT EXISTS image_url TEXT;
