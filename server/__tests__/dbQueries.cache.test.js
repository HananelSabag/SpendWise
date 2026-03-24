/**
 * DashboardCache unit tests.
 * Tests the in-memory LRU cache used by DBQueries without hitting the database.
 */

jest.mock('../config/db', () => ({
  query: jest.fn(),
  getPerformanceStats: jest.fn().mockReturnValue({})
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

const { DashboardCache } = require('../utils/dbQueries');

beforeEach(() => {
  DashboardCache.cache.clear();
});

// ─────────────────────────────────────────────────────
// generateKey
// ─────────────────────────────────────────────────────
describe('DashboardCache.generateKey', () => {
  it('uses "today" when no date is supplied', () => {
    const key = DashboardCache.generateKey(1);
    expect(key).toBe('dashboard:1:today');
  });

  it('formats a Date object to YYYY-MM-DD', () => {
    const key = DashboardCache.generateKey(7, new Date('2024-06-15T12:00:00Z'));
    expect(key).toBe('dashboard:7:2024-06-15');
  });

  it('formats a date string correctly', () => {
    const key = DashboardCache.generateKey(42, '2024-01-01');
    expect(key).toBe('dashboard:42:2024-01-01');
  });

  it('includes the userId in the key', () => {
    const key1 = DashboardCache.generateKey(1, '2024-06-01');
    const key2 = DashboardCache.generateKey(2, '2024-06-01');
    expect(key1).not.toBe(key2);
    expect(key1).toContain(':1:');
    expect(key2).toContain(':2:');
  });
});

// ─────────────────────────────────────────────────────
// get / set  (TTL behaviour via fake timers)
// ─────────────────────────────────────────────────────
describe('DashboardCache.get / set — TTL', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  it('returns null for a missing key', () => {
    expect(DashboardCache.get('nonexistent')).toBeNull();
  });

  it('returns the stored data immediately after set', () => {
    const data = { balance: 100 };
    DashboardCache.set('k1', data);
    expect(DashboardCache.get('k1')).toEqual(data);
  });

  it('returns null after TTL (2 min) has expired', () => {
    const data = { balance: 200 };
    DashboardCache.set('k2', data);

    // Advance time past the 2-minute TTL
    jest.advanceTimersByTime(2 * 60 * 1000 + 1);

    expect(DashboardCache.get('k2')).toBeNull();
  });

  it('returns data if time has NOT yet exceeded TTL', () => {
    const data = { balance: 300 };
    DashboardCache.set('k3', data);

    // Advance time just under TTL
    jest.advanceTimersByTime(2 * 60 * 1000 - 100);

    expect(DashboardCache.get('k3')).toEqual(data);
  });

  it('removes a stale entry from the Map on get', () => {
    DashboardCache.set('stale_key', { x: 1 });
    jest.advanceTimersByTime(2 * 60 * 1000 + 1);
    DashboardCache.get('stale_key');
    expect(DashboardCache.cache.has('stale_key')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────
// invalidateUser
// ─────────────────────────────────────────────────────
describe('DashboardCache.invalidateUser', () => {
  it('removes all keys belonging to the given userId', () => {
    DashboardCache.set('dashboard:5:2024-01-01', { a: 1 });
    DashboardCache.set('dashboard:5:today', { a: 2 });
    DashboardCache.set('dashboard:9:today', { b: 1 }); // different user

    DashboardCache.invalidateUser(5);

    expect(DashboardCache.cache.has('dashboard:5:2024-01-01')).toBe(false);
    expect(DashboardCache.cache.has('dashboard:5:today')).toBe(false);
    // Other user's data must survive
    expect(DashboardCache.cache.has('dashboard:9:today')).toBe(true);
  });

  it('does nothing when userId has no cached entries', () => {
    DashboardCache.set('dashboard:3:today', { x: 1 });
    DashboardCache.invalidateUser(99); // no entries for user 99
    expect(DashboardCache.cache.size).toBe(1);
  });
});

// ─────────────────────────────────────────────────────
// getStats
// ─────────────────────────────────────────────────────
describe('DashboardCache.getStats', () => {
  it('reports size = 0 on empty cache', () => {
    const stats = DashboardCache.getStats();
    expect(stats.size).toBe(0);
    expect(stats.maxSize).toBe(500);
    expect(stats.utilization).toBe(0);
  });

  it('reports correct size after adding entries', () => {
    DashboardCache.set('a', 1);
    DashboardCache.set('b', 2);
    const stats = DashboardCache.getStats();
    expect(stats.size).toBe(2);
  });

  it('reports utilization as a percentage', () => {
    for (let i = 0; i < 50; i++) {
      DashboardCache.set(`key_${i}`, i);
    }
    const stats = DashboardCache.getStats();
    expect(stats.utilization).toBe(10); // 50/500 * 100
  });
});

// ─────────────────────────────────────────────────────
// LRU eviction
// ─────────────────────────────────────────────────────
describe('DashboardCache LRU eviction', () => {
  it('evicts the oldest entry when maxSize is exceeded', () => {
    const originalMax = DashboardCache.maxSize;
    // Temporarily shrink maxSize for this test
    DashboardCache.maxSize = 3;

    DashboardCache.set('first', 1);
    DashboardCache.set('second', 2);
    DashboardCache.set('third', 3);
    // This 4th set should evict 'first'
    DashboardCache.set('fourth', 4);

    expect(DashboardCache.cache.has('first')).toBe(false);
    expect(DashboardCache.cache.has('second')).toBe(true);
    expect(DashboardCache.cache.has('fourth')).toBe(true);

    // Restore
    DashboardCache.maxSize = originalMax;
  });
});
