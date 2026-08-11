/**
 * Build the SQL scope and audit label for an agent job claim.
 *
 * The shared Default Host may claim only users who do not have a REACHABLE
 * personal device. A paired device may claim only its own user's jobs.
 * Keeping this policy in a pure helper makes the privacy boundary directly
 * unit-testable instead of burying it inside an Express route.
 *
 * FAILOVER (added after the 2026-07/08 blackout — see migration 39):
 * a paired device that stops reporting used to black-hole its owner's syncs
 * forever, because the Default Host was excluded by pairing alone. It now
 * takes over, but ONLY for connections whose ciphertext is sealed to the
 * Default Host's own key (`credentials_sealed_to = 'default-host'`).
 * That condition is the privacy line: if the shared host already holds a
 * readable envelope, syncing it exposes nothing new. A connection sealed to
 * the device's key is never claimed by the shared host — it is surfaced to
 * the user as "your computer is offline" instead.
 */

// A device polls every ~30 minutes. Three hours of silence means it is off,
// and still leaves room to rescue the job before the 6h pending expiry.
const DEVICE_STALE_HOURS = 3;

function auditDeviceLabel(label, userId) {
  return String(label || userId)
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, 80);
}

function buildAgentClaimScope(agentScope, limit) {
  if (agentScope?.global === true) {
    return {
      scopeClause: `AND (
        NOT EXISTS (
          SELECT 1 FROM agent_devices d
          WHERE d.user_id = j2.user_id AND d.status = 'active'
        )
        OR (
          c2.credentials_sealed_to = 'default-host'
          AND NOT EXISTS (
            SELECT 1 FROM agent_devices d
            WHERE d.user_id = j2.user_id AND d.status = 'active'
              AND d.last_seen_at > NOW() - ($3 || ' hours')::interval
          )
        )
      )`,
      params: [limit, 'default-host', String(DEVICE_STALE_HOURS)],
    };
  }

  const userId = Number(agentScope?.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('Paired agent scope requires a valid user id');
  }

  return {
    scopeClause: 'AND j2.user_id = $3',
    params: [limit, `device:${auditDeviceLabel(agentScope.label, userId)}`, userId],
  };
}

module.exports = { buildAgentClaimScope, auditDeviceLabel, DEVICE_STALE_HOURS };
