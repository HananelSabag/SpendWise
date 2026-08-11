-- 39_agent_failover_and_sync_health.sql
--
-- WHY THIS EXISTS (real production incident, 2026-07-22 → 2026-08-11):
-- user 1 paired a personal device. From that moment the Default Host was
-- forbidden from claiming his jobs (agentClaimScope), and the paired worker
-- stopped running two days later. Every scheduled job for him sat pending,
-- expired after 6h as "transient", left the connection counters untouched,
-- and the UI kept reporting a healthy, permanently "syncing" account.
-- 20 days with zero data and zero signal.
--
-- The failover that fixes it needs one fact the schema never stored: WHICH
-- agent key the connection's ciphertext is sealed to. Without it the server
-- cannot know whether the Default Host is even able to read a connection
-- whose owner has an unreachable paired device — and guessing means either
-- silent blindness (today) or a shared host attempting credentials it must
-- not be able to open.
--
-- Values are identities, never key material:
--   'default-host'  → sealed to BANK_AGENT_PUBLIC_KEY (the shared host)
--   'device:<id>'   → sealed to that agent_devices row's public key
--   NULL            → unknown (pre-dates this column and no evidence) —
--                     treated as "no failover", the conservative side.

ALTER TABLE bank_connections
  ADD COLUMN IF NOT EXISTS credentials_sealed_to text;

COMMENT ON COLUMN bank_connections.credentials_sealed_to IS
  'Identity of the agent key the encrypted_credentials envelope is sealed to: default-host | device:<agent_devices.id> | NULL when unknown. Drives Default Host failover for an unreachable paired device.';

-- Evidence-based backfill: whoever COMPLETED the most recent sync for this
-- connection demonstrably holds the private key its ciphertext is sealed to.
-- This is stronger than looking at the user's current pairing state — it also
-- covers a user who paired, re-sealed, then unpaired.
UPDATE bank_connections c
SET credentials_sealed_to = 'default-host'
WHERE c.credentials_sealed_to IS NULL
  AND (
    SELECT j.claimed_by
    FROM bank_sync_jobs j
    WHERE j.connection_id = c.id
      AND j.status = 'done'
    ORDER BY j.finished_at DESC
    LIMIT 1
  ) = 'default-host';

-- The claim hot path filters on this column for every Default Host poll.
CREATE INDEX IF NOT EXISTS idx_bank_connections_sealed_to
  ON bank_connections (credentials_sealed_to)
  WHERE status = 'active';
