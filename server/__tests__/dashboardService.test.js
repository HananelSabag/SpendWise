jest.mock('../models/Transaction', () => ({ Transaction: { getRecent: jest.fn() } }));
const { Transaction } = require('../models/Transaction');
const { buildDashboardData, invalidateDashboardCache } = require('../services/dashboardService');

beforeEach(() => { Transaction.getRecent.mockReset(); invalidateDashboardCache(99); });
afterEach(() => { jest.useRealTimers(); });

test('reuses reads across numeric/string user IDs, then expires after 15 seconds', async () => {
  jest.useFakeTimers();
  Transaction.getRecent.mockResolvedValue([{ id: 1 }]);
  await buildDashboardData(99);
  jest.advanceTimersByTime(14_999);
  await buildDashboardData('99');
  expect(Transaction.getRecent).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(1);
  await buildDashboardData(99);
  expect(Transaction.getRecent).toHaveBeenCalledTimes(2);
});

test('simultaneous dashboard reads share one database query', async () => {
  let finish;
  Transaction.getRecent.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  const first = buildDashboardData(99);
  const second = buildDashboardData(99);
  expect(Transaction.getRecent).toHaveBeenCalledTimes(1);
  finish([{ id: 1 }]);
  expect(await first).toEqual(await second);
});

test('an older SELECT cannot restore stale data after invalidation', async () => {
  let finishOld;
  Transaction.getRecent.mockImplementationOnce(() => new Promise((resolve) => { finishOld = resolve; }))
    .mockResolvedValueOnce([{ id: 2 }]);
  const old = buildDashboardData(99);
  invalidateDashboardCache('99');
  const fresh = await buildDashboardData(99);
  finishOld([{ id: 1 }]);
  await old;
  expect(await buildDashboardData(99)).toEqual(fresh);
  expect(Transaction.getRecent).toHaveBeenCalledTimes(2);
});

test('a failed read is released so the next attempt can recover', async () => {
  Transaction.getRecent.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
  await expect(buildDashboardData(99)).rejects.toThrow('offline');
  expect((await buildDashboardData(99)).recent_transactions).toEqual([]);
});
