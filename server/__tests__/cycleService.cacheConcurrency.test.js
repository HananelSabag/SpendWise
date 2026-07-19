jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../config/institutions', () => ({ institutionKind: () => 'bank' }));
jest.mock('../utils/logger', () => ({ warn: jest.fn() }));
jest.mock('../services/cycleEngine', () => ({
  ilDate: () => '2026-07-19',
  addMonths: (date) => date,
  prepareCycleData: () => ({ loans: [], recurring: [], reversals: [] }),
  buildFixedDayWindows: () => [{
    start: '2026-07-01',
    end: '2026-08-01',
    running: true,
    salary: { signature: null },
  }],
  buildFundingForecast: () => ({ streams: [], expectedTotal: 0, start: null, end: null }),
  buildCycle: ({ bankTxns, window }) => ({ window, marker: bankTxns[0].description }),
}));

const db = require('../config/db');
const {
  getCurrentFinancialCycle,
  invalidateCycleCache,
  invalidateCycleDerivedData,
} = require('../services/cycleService');

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function transactionRow(description) {
  return {
    id: 1,
    bank_source: 'hapoalim',
    bank_account_number: '1234',
    amount: 100,
    type: 'income',
    description,
    date: '2026-07-02',
    bank_processed_date: '2026-07-02',
    bank_status: 'completed',
  };
}

describe('financial-cycle cache concurrency', () => {
  beforeEach(() => {
    db.query.mockReset();
    invalidateCycleCache(7);
    invalidateCycleCache(8);
  });

  test('an invalidation prevents an older in-flight read from repopulating the cache', async () => {
    const firstTransactions = deferred();
    let transactionReads = 0;
    db.query.mockImplementation((sql) => {
      if (sql.includes('FROM transactions')) {
        transactionReads += 1;
        return transactionReads === 1
          ? firstTransactions.promise
          : Promise.resolve({ rows: [transactionRow('fresh')] });
      }
      if (sql.includes('FROM financial_cycle_settings')) {
        return Promise.resolve({ rows: [{ engine_mode: 'manual', manual_anchor_day: 1 }] });
      }
      if (sql.includes('SELECT language_preference')) {
        return Promise.resolve({ rows: [{ language_preference: 'en' }] });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    const oldRead = getCurrentFinancialCycle(7);
    await Promise.resolve();
    invalidateCycleCache(7);
    firstTransactions.resolve({ rows: [transactionRow('stale')] });
    await expect(oldRead).resolves.toMatchObject({ current: { marker: 'stale' } });

    await expect(getCurrentFinancialCycle(7)).resolves.toMatchObject({
      current: { marker: 'fresh' },
    });
    expect(transactionReads).toBe(2);
  });

  test('another user invalidating does not suppress this user cache fill', async () => {
    const transactions = deferred();
    let transactionReads = 0;
    db.query.mockImplementation((sql) => {
      if (sql.includes('FROM transactions')) {
        transactionReads += 1;
        return transactions.promise;
      }
      if (sql.includes('FROM financial_cycle_settings')) {
        return Promise.resolve({ rows: [{ engine_mode: 'manual', manual_anchor_day: 1 }] });
      }
      if (sql.includes('SELECT language_preference')) {
        return Promise.resolve({ rows: [{ language_preference: 'en' }] });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    const firstRead = getCurrentFinancialCycle(7);
    await Promise.resolve();
    invalidateCycleCache(8);
    transactions.resolve({ rows: [transactionRow('isolated')] });
    await expect(firstRead).resolves.toMatchObject({ current: { marker: 'isolated' } });

    await expect(getCurrentFinancialCycle(7)).resolves.toMatchObject({
      current: { marker: 'isolated' },
    });
    expect(transactionReads).toBe(1);
  });

  test('derived-data invalidation clears persisted cycle aggregates for only that user', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 3, rows: [] });

    await expect(invalidateCycleDerivedData(7)).resolves.toBeUndefined();

    expect(db.query).toHaveBeenCalledWith(
      'DELETE FROM financial_cycle_aggregates WHERE user_id = $1',
      [7],
    );
  });

  test('derived-data invalidation tolerates a rolling deploy without the aggregate table', async () => {
    db.query.mockRejectedValueOnce(Object.assign(new Error('missing relation'), { code: '42P01' }));

    await expect(invalidateCycleDerivedData(7)).resolves.toBeUndefined();
  });

  test('derived-data invalidation does not report a committed mutation as failed', async () => {
    db.query.mockRejectedValueOnce(Object.assign(new Error('database unavailable'), { code: '08006' }));

    await expect(invalidateCycleDerivedData(7)).resolves.toBeUndefined();
    expect(require('../utils/logger').warn).toHaveBeenCalledWith(
      'Could not invalidate persisted financial-cycle aggregates',
      expect.objectContaining({ userId: 7, error: 'database unavailable' }),
    );
  });
});
