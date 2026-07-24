import { describe, expect, it, vi } from 'vitest';

import { shouldPersistQuery } from '../queryPersistence';

function query(root, { status = 'success', stale = false } = {}) {
  return {
    queryKey: [root, 7],
    state: { status },
    isStale: vi.fn(() => stale),
  };
}

describe('shouldPersistQuery', () => {
  it('keeps only compact dashboard recovery data', () => {
    expect(shouldPersistQuery(query('dashboard'))).toBe(true);
    expect(shouldPersistQuery(query('bankSyncStats'))).toBe(true);
  });

  it('does not persist transaction or financial-cycle histories', () => {
    expect(shouldPersistQuery(query('transactions'))).toBe(false);
    expect(shouldPersistQuery(query('cycles'))).toBe(false);
  });

  it('rejects stale and unsuccessful data', () => {
    expect(shouldPersistQuery(query('dashboard', { stale: true }))).toBe(false);
    expect(shouldPersistQuery(query('dashboard', { status: 'error' }))).toBe(false);
  });
});
