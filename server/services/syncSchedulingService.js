/**
 * Sync Scheduling Service — "enqueue-on-claim"
 *
 * Why this exists: the old design created scheduled sync jobs from an
 * in-process node-cron inside the Render dyno. On the free tier the dyno
 * sleeps, in-process cron fires nothing while asleep, and the cron times
 * were registered without a timezone (so even awake, they targeted UTC).
 * Live-DB evidence: not a single trigger='schedule' job was ever created.
 *
 * The fix: jobs are only ever CONSUMED when the local agent polls
 * POST /bank-agent/jobs/claim (every ~30 min from the user's PC). So the
 * poll itself is the perfect scheduler tick — it wakes the dyno, and we
 * enqueue whatever is due right before claiming. No cron, no keep-alive
 * dependency, no timezone drift.
 *
 * "Due" means: the most recent daily target time (07:00 / 18:00
 * Asia/Jerusalem by default, override with SYNC_TARGET_HOURS="7,18") has
 * passed, and the connection hasn't completed a sync since that instant.
 * A brand-new connection (never synced) is due immediately.
 *
 * @module services/syncSchedulingService
 */

const db = require('../config/db');
const logger = require('../utils/logger');

const SYNC_TIMEZONE = process.env.SYNC_TIMEZONE || 'Asia/Jerusalem';

function targetHours() {
  const raw = process.env.SYNC_TARGET_HOURS || '7,18';
  const hours = raw.split(',')
    .map((h) => parseInt(h.trim(), 10))
    .filter((h) => Number.isInteger(h) && h >= 0 && h <= 23);
  return hours.length > 0 ? hours : [7, 18];
}

// Offset (ms) of `timeZone` relative to UTC at the given instant.
// Uses Intl only — no timezone library needed.
function tzOffsetMs(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]));
  const asUTC = Date.UTC(
    Number(p.year), Number(p.month) - 1, Number(p.day),
    p.hour === '24' ? 0 : Number(p.hour), Number(p.minute), Number(p.second),
  );
  return asUTC - date.getTime();
}

/**
 * The most recent target instant (as a UTC Date) that has already passed.
 * E.g. with targets [7, 18]: at 06:30 Israel time → yesterday 18:00;
 * at 07:05 → today 07:00; at 19:00 → today 18:00.
 */
function lastTargetInstant(now = new Date()) {
  const offset = tzOffsetMs(now, SYNC_TIMEZONE);
  const local = new Date(now.getTime() + offset); // wall clock in target tz, expressed in UTC fields
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();

  const candidates = [];
  for (const dayShift of [0, -1]) {
    for (const h of targetHours()) {
      // Wall time (y, m, d+dayShift, h:00) in the target tz → UTC instant
      candidates.push(new Date(Date.UTC(y, m, d + dayShift, h, 0, 0) - offset));
    }
  }
  const passed = candidates.filter((c) => c.getTime() <= now.getTime());
  return passed.length > 0
    ? new Date(Math.max(...passed.map((c) => c.getTime())))
    : new Date(now.getTime() - 24 * 3600_000); // degenerate config safety net
}

/**
 * Expire stale pending jobs and enqueue trigger='schedule' jobs for every
 * active connection whose last completed sync predates the most recent
 * target instant. Called from the agent claim endpoint. Never throws —
 * enqueue problems must not block the agent from claiming existing jobs.
 *
 * @returns {Promise<{enqueued: number, expired: number}>}
 */
async function enqueueDueJobs(now = new Date()) {
  try {
    // Fail stale jobs so they don't block new syncs forever. Two cases:
    //  • pending >6h  — the agent never picked it up (machine off for hours).
    //  • running >15m — a worker claimed it but died before posting a result.
    //    A real sync finishes in minutes (the agent hard-caps each scrape), and
    //    the enqueue below skips any connection with a pending/running job — so
    //    a zombie 'running' job would otherwise block that connection's syncs.
    //    The agent never re-polls mid-run (single-instance lock), so a 'running'
    //    job seen at claim time is always from a previous, dead run.
    const expired = await db.query(`
      UPDATE bank_sync_jobs
      SET status='failed', finished_at=NOW(),
          result = CASE
            WHEN status='pending'
              THEN '{"error":"expired — sync agent did not pick this up in time","transient":true}'::jsonb
            ELSE '{"error":"expired — worker claimed the job but never reported a result","transient":true}'::jsonb
          END
      WHERE (status='pending' AND requested_at < NOW() - INTERVAL '6 hours')
         OR (status='running' AND COALESCE(started_at, requested_at) < NOW() - INTERVAL '15 minutes')
      RETURNING id
    `, [], 'bank_sync_expire_stale');

    const dueSince = lastTargetInstant(now);
    const result = await db.query(`
      INSERT INTO bank_sync_jobs (connection_id, user_id, trigger)
      SELECT c.id, c.user_id, 'schedule'
      FROM bank_connections c
      WHERE c.status = 'active'
        AND (c.last_sync_at IS NULL OR c.last_sync_at < $1)
        AND NOT EXISTS (
          SELECT 1 FROM bank_sync_jobs j
          WHERE j.connection_id = c.id AND j.status IN ('pending','running')
        )
      RETURNING id
    `, [dueSince], 'bank_sync_enqueue_on_claim');

    const enqueued = result.rowCount || 0;
    if (enqueued > 0) {
      logger.info('sync-scheduling: enqueued due jobs', { enqueued, dueSince: dueSince.toISOString() });
    }
    return { enqueued, expired: expired.rowCount || 0 };
  } catch (err) {
    logger.error('sync-scheduling: enqueue failed (claim continues)', { error: err.message });
    return { enqueued: 0, expired: 0 };
  }
}

module.exports = { enqueueDueJobs, lastTargetInstant, tzOffsetMs };
