-- Verification and reset tokens now live only in their dedicated tables and
-- are stored as SHA-256 hashes. Clear the obsolete plaintext users column.
UPDATE users SET verification_token = NULL WHERE verification_token IS NOT NULL;
