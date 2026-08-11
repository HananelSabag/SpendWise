/**
 * Bank Connection Health — the honest answer to "is this actually syncing?"
 *
 * WHY: `bank_connections.status` only ever moves when an agent REPORTS a
 * failure. A job nobody claims expires as `transient`, which deliberately
 * leaves the connection's counters untouched — so a connection whose agent
 * has been gone for three weeks still reads `active / 0 failures / no error`,
 * and the UI cheerfully renders "syncing now" forever (real incident,
 * 2026-07-22 → 2026-08-11). Health therefore has to be derived from TIME and
 * from who can actually reach the credentials, not from the status column.
 *
 * Pure functions, no DB — the route feeds them rows so this stays testable.
 *
 * @module services/bankConnectionHealth
 */

// A pending job older than this was not picked up by anybody: the scheduler
// enqueues at claim time, so a live agent claims within one poll (~30 min).
const PENDING_GRACE_MINUTES = 90;

// Two daily targets (07:00 / 19:00 Asia/Jerusalem) are 12h apart. Missing two
// in a row is the first moment we can be sure this is a fault, not a late run.
const STALLED_HOURS = 26;

const HEALTH = {
  ERROR: 'error',
  PAUSED: 'paused',
  NEEDS_CREDENTIALS: 'needs_credentials',
  AGENT_OFFLINE: 'agent_offline',
  WAITING_FOR_AGENT: 'waiting_for_agent',
  STALLED: 'stalled',
  SYNCING: 'syncing',
  QUEUED: 'queued',
  OK: 'ok',
};

function hoursSince(value, now) {
  if (!value) return null;
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return null;
  return (now.getTime() - then) / 3_600_000;
}

/**
 * Can the agent that is currently responsible for this user open this
 * connection's sealed credentials?
 *
 * `credentials_sealed_to` is an identity, not key material: 'default-host',
 * 'device:<id>', or NULL for connections that pre-date the column. NULL is
 * treated as readable — we refuse to nag a user about a mismatch we cannot
 * actually prove.
 *
 * @param {string|null} sealedTo
 * @param {{paired: boolean, deviceId?: number|null}} agent
 * @returns {boolean}
 */
function credentialsReadableByAgent(sealedTo, agent = {}) {
  if (!sealedTo) return true;
  if (agent.paired) {
    // A paired user's device is the ONLY reader; the shared host never
    // claims a device-sealed connection.
    return sealedTo === `device:${agent.deviceId}`;
  }
  return sealedTo === 'default-host';
}

/**
 * Derive the real state of one connection.
 *
 * @param {object} row - a bank_connections row joined with its latest job
 * @param {object} [context]
 * @param {Date}   [context.now]
 * @param {object} [context.agent] - { paired, deviceId, deviceStale }
 * @returns {{sync_health: string, hours_since_sync: number|null,
 *            waiting_minutes: number|null, credentials_readable: boolean}}
 */
function deriveSyncHealth(row = {}, { now = new Date(), agent = {} } = {}) {
  const hoursSinceSync = hoursSince(row.last_sync_at, now);
  // A connection that has never synced is measured from when it was created —
  // a bank linked two minutes ago is not "stalled", it is simply new.
  const hoursSinceData = hoursSinceSync ?? hoursSince(row.created_at, now);
  // A pending job with no timestamp is treated as brand new, never as ancient.
  const pendingHours = row.latest_job_status === 'pending'
    ? (hoursSince(row.latest_job_requested_at, now) ?? 0)
    : null;
  const waitingMinutes = pendingHours === null ? null : Math.round(pendingHours * 60);
  const credentialsReadable = credentialsReadableByAgent(row.credentials_sealed_to, agent);

  const base = {
    hours_since_sync: hoursSinceSync === null ? null : Number(hoursSinceSync.toFixed(2)),
    waiting_minutes: waitingMinutes,
    credentials_readable: credentialsReadable,
  };

  // Explicit states first — a user-actionable fault outranks any timing signal.
  if (row.status === 'error') return { ...base, sync_health: HEALTH.ERROR };
  if (row.status === 'paused') return { ...base, sync_health: HEALTH.PAUSED };
  if (row.latest_job_status === 'running') return { ...base, sync_health: HEALTH.SYNCING };

  // Nothing will ever sync while the responsible agent cannot open the
  // envelope — say so instead of queueing jobs that are certain to fail.
  if (!credentialsReadable) return { ...base, sync_health: HEALTH.NEEDS_CREDENTIALS };

  // The user's own machine is the only claimer and it stopped reporting.
  if (agent.paired && agent.deviceStale) return { ...base, sync_health: HEALTH.AGENT_OFFLINE };

  const staleData = hoursSinceData === null || hoursSinceData >= STALLED_HOURS;
  const unclaimed = waitingMinutes !== null && waitingMinutes >= PENDING_GRACE_MINUTES;

  // A queued job that nobody picked up is the sharpest evidence available:
  // report it even when the data is not old enough to count as stalled yet.
  if (unclaimed) return { ...base, sync_health: HEALTH.WAITING_FOR_AGENT };
  if (staleData) return { ...base, sync_health: HEALTH.STALLED };
  if (waitingMinutes !== null) return { ...base, sync_health: HEALTH.QUEUED };
  return { ...base, sync_health: HEALTH.OK };
}

/**
 * Agent context for one user, from their active device row (if any).
 *
 * @param {object|null} device - { id, label, last_seen_at } or null
 * @param {number} staleHours
 * @param {Date} [now]
 */
function buildAgentContext(device, staleHours, now = new Date()) {
  if (!device) return { paired: false, deviceId: null, deviceStale: false, lastSeenAt: null };
  const idleHours = hoursSince(device.last_seen_at, now);
  return {
    paired: true,
    deviceId: device.id,
    label: device.label || null,
    lastSeenAt: device.last_seen_at || null,
    // A device that has never reported at all is treated as unreachable.
    deviceStale: idleHours === null || idleHours >= staleHours,
    idleHours: idleHours === null ? null : Number(idleHours.toFixed(2)),
  };
}

module.exports = {
  HEALTH,
  PENDING_GRACE_MINUTES,
  STALLED_HOURS,
  deriveSyncHealth,
  credentialsReadableByAgent,
  buildAgentContext,
};
