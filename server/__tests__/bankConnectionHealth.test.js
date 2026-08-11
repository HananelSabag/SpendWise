const {
  HEALTH,
  STALLED_HOURS,
  PENDING_GRACE_MINUTES,
  deriveSyncHealth,
  credentialsReadableByAgent,
  buildAgentContext,
} = require('../services/bankConnectionHealth');

const NOW = new Date('2026-08-11T15:00:00Z');
const hoursAgo = (h) => new Date(NOW.getTime() - h * 3_600_000).toISOString();

describe('bank connection health', () => {
  test('reproduces the real 20-day blackout instead of reporting it as healthy', () => {
    // Exactly the production row: active, zero failures, no error, a fresh
    // scheduled job re-queued every 6h — and no data since 2026-07-22.
    const row = {
      status: 'active',
      consecutive_failures: 0,
      last_error: null,
      last_sync_at: hoursAgo(20 * 24),
      latest_job_status: 'pending',
      latest_job_requested_at: hoursAgo(4),
      credentials_sealed_to: 'default-host',
    };
    const health = deriveSyncHealth(row, { now: NOW, agent: { paired: false } });
    expect(health.sync_health).toBe(HEALTH.WAITING_FOR_AGENT);
    expect(health.hours_since_sync).toBeGreaterThan(STALLED_HOURS);
  });

  test('a paired device that stopped reporting is named as the cause', () => {
    const agent = buildAgentContext(
      { id: 5, label: 'Hananel-PC', last_seen_at: hoursAgo(19 * 24) },
      3,
      NOW,
    );
    expect(agent.deviceStale).toBe(true);
    const health = deriveSyncHealth(
      { status: 'active', last_sync_at: hoursAgo(19 * 24), credentials_sealed_to: 'device:5' },
      { now: NOW, agent },
    );
    expect(health.sync_health).toBe(HEALTH.AGENT_OFFLINE);
  });

  test('credentials sealed to another agent outrank every timing signal', () => {
    // Pairing a device leaves existing connections sealed to the shared host:
    // the device cannot open them, so no amount of waiting will ever help.
    const agent = buildAgentContext({ id: 9, last_seen_at: hoursAgo(0.1) }, 3, NOW);
    const health = deriveSyncHealth(
      {
        status: 'active',
        last_sync_at: hoursAgo(1),
        credentials_sealed_to: 'default-host',
        latest_job_status: 'pending',
        latest_job_requested_at: hoursAgo(0.1),
      },
      { now: NOW, agent },
    );
    expect(health.sync_health).toBe(HEALTH.NEEDS_CREDENTIALS);
    expect(credentialsReadableByAgent('default-host', agent)).toBe(false);
    expect(credentialsReadableByAgent('device:9', agent)).toBe(true);
  });

  test('a connection that pre-dates the sealed-to column is never nagged', () => {
    expect(credentialsReadableByAgent(null, { paired: true, deviceId: 5 })).toBe(true);
    expect(credentialsReadableByAgent(null, { paired: false })).toBe(true);
  });

  test('healthy, running and freshly queued states are left alone', () => {
    const base = { status: 'active', credentials_sealed_to: 'default-host' };
    const agent = { paired: false };
    expect(deriveSyncHealth({ ...base, last_sync_at: hoursAgo(3) }, { now: NOW, agent }).sync_health)
      .toBe(HEALTH.OK);
    expect(deriveSyncHealth(
      { ...base, last_sync_at: hoursAgo(3), latest_job_status: 'running' },
      { now: NOW, agent },
    ).sync_health).toBe(HEALTH.SYNCING);
    expect(deriveSyncHealth(
      {
        ...base,
        last_sync_at: hoursAgo(3),
        latest_job_status: 'pending',
        latest_job_requested_at: hoursAgo(0.2),
      },
      { now: NOW, agent },
    ).sync_health).toBe(HEALTH.QUEUED);
  });

  test('a job only counts as unclaimed after the grace window', () => {
    const row = {
      status: 'active',
      last_sync_at: hoursAgo(2),
      latest_job_status: 'pending',
      latest_job_requested_at: new Date(NOW.getTime() - (PENDING_GRACE_MINUTES + 1) * 60_000).toISOString(),
      credentials_sealed_to: 'default-host',
    };
    expect(deriveSyncHealth(row, { now: NOW, agent: { paired: false } }).sync_health)
      .toBe(HEALTH.WAITING_FOR_AGENT);
  });

  test('paused and error keep their explicit meaning', () => {
    expect(deriveSyncHealth({ status: 'paused' }, { now: NOW }).sync_health).toBe(HEALTH.PAUSED);
    expect(deriveSyncHealth({ status: 'error' }, { now: NOW }).sync_health).toBe(HEALTH.ERROR);
  });

  test('a source that never synced at all reads as stalled, not ok', () => {
    expect(deriveSyncHealth(
      { status: 'active', last_sync_at: null, credentials_sealed_to: 'default-host' },
      { now: NOW, agent: { paired: false } },
    ).sync_health).toBe(HEALTH.STALLED);
  });
});
