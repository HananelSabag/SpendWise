-- Migration 09: Bank sync integration
-- Adds two columns to transactions so the bank scraper can push transactions
-- directly into SpendWise with reliable deduplication.
--
--   bank_sync_id  — unique identifier from the bank scraper (source:identifier).
--                   NULL for manually-entered transactions. The partial unique
--                   index ensures no duplicate scraped transaction per user.
--   bank_source   — which bank produced this row (yahav, isracard, max, etc.)
--                   Stored even when bank_sync_id is NULL so soft-dedup queries
--                   can filter by source without a string parse.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS bank_sync_id  TEXT,
  ADD COLUMN IF NOT EXISTS bank_source   TEXT;

-- Partial unique index: one bank_sync_id per user (NULLs are excluded so
-- manual transactions are not constrained).
CREATE UNIQUE INDEX IF NOT EXISTS transactions_user_bank_sync_id_uidx
  ON transactions (user_id, bank_sync_id)
  WHERE bank_sync_id IS NOT NULL;

-- Regular index so soft-dedup lookups (by source+date+amount+description)
-- don't do full table scans.
CREATE INDEX IF NOT EXISTS transactions_bank_source_idx
  ON transactions (user_id, bank_source, date)
  WHERE bank_source IS NOT NULL;
