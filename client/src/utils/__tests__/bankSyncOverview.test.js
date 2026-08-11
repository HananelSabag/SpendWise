import { describe, expect, it } from 'vitest';
import { buildBankSyncOverview } from '../bankSyncOverview';

describe('buildBankSyncOverview', () => {
  const NOW = new Date('2026-07-12T10:00:00Z').getTime();

  it('summarizes connection health, import results, and enabled account scope', () => {
    const result = buildBankSyncOverview([
      {
        id: 1,
        bank_source: 'leumi',
        status: 'active',
        latest_job_status: 'completed',
        latest_job_result: { inserted: 2, processed: 20 },
        last_sync_at: '2026-07-12T08:00:00Z',
      },
      {
        id: 2,
        bank_source: 'max',
        status: 'error',
        latest_job_status: 'failed',
        latest_job_result: { imported: 1, skipped: 3 },
        last_sync_at: '2026-07-12T09:00:00Z',
      },
    ], [
      { source: 'leumi', accounts: [{ enabled: true }] },
      { source: 'max', accounts: [{ enabled: true }, { enabled: false }] },
    ], NOW);

    expect(result).toEqual(expect.objectContaining({
      connectionCount: 2,
      readyCount: 1,
      issueCount: 1,
      newCount: 3,
      processedCount: 24,
      accountCount: 3,
      enabledAccountCount: 2,
      disabledAccountCount: 1,
      lastSync: '2026-07-12T09:00:00Z',
    }));
    expect(result.institutions[1]).toEqual(expect.objectContaining({
      enabledAccountCount: 1,
      disabledAccountCount: 1,
      isIssue: true,
    }));
  });

  it('never reports a source that stopped receiving data as healthy', () => {
    // The production shape that used to render as "a sync is running now",
    // forever: active status, no error, a pending job that nobody claims, and
    // no new data for weeks.
    const result = buildBankSyncOverview([
      {
        id: 1,
        bank_source: 'leumi',
        status: 'active',
        sync_health: 'waiting_for_agent',
        latest_job_status: 'pending',
        last_sync_at: '2026-06-22T06:32:00Z',
      },
    ], [], NOW);

    expect(result.stalledCount).toBe(1);
    expect(result.workingCount).toBe(0);
    expect(result.readyCount).toBe(0);
    expect(result.institutions[0].isStalled).toBe(true);
  });

  it('handles a connection before its first account discovery', () => {
    const result = buildBankSyncOverview([
      { id: 1, bank_source: 'visa_cal', status: 'active', latest_job_status: 'pending' },
    ]);

    expect(result).toEqual(expect.objectContaining({
      workingCount: 1,
      accountCount: 0,
      enabledAccountCount: 0,
      lastSync: null,
    }));
  });
});

