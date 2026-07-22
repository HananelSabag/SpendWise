jest.mock('../middleware/auth', () => ({ auth: (_req, _res, next) => next() }));
jest.mock('../utils/logger', () => ({ error: jest.fn() }));
jest.mock('../services/cycleService', () => ({
  getFinancialCycles: jest.fn(),
  getCurrentFinancialCycle: jest.fn(),
  getYearReview: jest.fn(),
  getAvailableCycleYears: jest.fn(),
  saveCreditClassification: jest.fn(),
  saveTransactionOverride: jest.fn(),
  deleteTransactionOverride: jest.fn(),
  saveCycleSettings: jest.fn(),
}));

const cycleService = require('../services/cycleService');
const router = require('../routes/cycleRoutes');

function routeHandler(path, method) {
  const layer = router.stack.find((candidate) => (
    candidate.route?.path === path && candidate.route.methods[method]
  ));
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

function responseDouble() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('financial-cycle route validation', () => {
  beforeEach(() => jest.clearAllMocks());

  test.each([
    ['put', '/transactions/:transactionId/classification', '12junk', { classification: 'exclude' }],
    ['delete', '/transactions/:transactionId/classification', '12.5', undefined],
    ['put', '/credits/:transactionId/classification', '2147483648', { class: 'income' }],
  ])('rejects malformed or out-of-range transaction ids', async (method, path, transactionId, body) => {
    const res = responseDouble();
    await routeHandler(path, method)(
      { params: { transactionId }, body, user: { id: 7 } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(cycleService.saveTransactionOverride).not.toHaveBeenCalled();
    expect(cycleService.deleteTransactionOverride).not.toHaveBeenCalled();
    expect(cycleService.saveCreditClassification).not.toHaveBeenCalled();
  });

  test('cycle responses expose only masked account suffixes and omit raw loan transactions', async () => {
    const txn = {
      id: 42,
      date: '2026-07-01',
      processedDate: '2026-07-01',
      description: 'salary',
      amount: 1000,
      source: 'leumi',
      accountNumber: '12345678',
      status: 'completed',
    };
    const cycle = {
      window: {
        index: 0,
        start: '2026-07-01',
        end: '2026-08-01',
        running: true,
        salary: { date: '2026-07-01', amount: 1000, txn },
      },
      income: {
        salary: { total: 1000, items: [txn] },
        other: { total: 0, items: [] },
        total: 1000,
      },
      expenses: {
        cards: { total: 0, events: [] },
        direct: { total: 0, items: [] },
        total: 0,
      },
      operatingNet: 1000,
      financing: { total: 0, items: [] },
      bankMovement: 1000,
      timingAdjustment: 0,
      projection: null,
      forwardReset: null,
      closedInsights: null,
      nextCardForecast: {
        bills: [{ accountNumber: '99887766', knownTxns: [txn] }],
      },
      needsReview: [{
        txn,
        amount: 1000,
        matchedBill: { accountNumber: '99887766' },
      }],
      reversals: [],
      partials: [],
      unreconciledCardEvents: [],
      cards: [{ source: 'max', accountNumber: '99887766' }],
      decisions: [{
        transactionId: 42,
        accountNumber: '12345678',
        linkedTo: { source: 'max', accountNumber: '99887766' },
      }],
    };
    cycleService.getFinancialCycles.mockResolvedValue({
      status: 'ok',
      cycles: [cycle],
      loans: [{
        identifier: 'loan',
        payments: [{ date: '2026-07-01', amount: -100, txn }],
      }],
      totalOutstanding: 900,
      recurring: [],
      salaryTracking: {
        status: 'scheduled',
        last: { date: '2026-07-01', amount: 1000, txn },
        events: [{ date: '2026-07-01', amount: 1000, txn }],
      },
      salaryChange: null,
      signatures: [{ id: 1, accountNumber: '12345678' }],
      fundingForecast: { streams: [{ accountNumber: '12345678' }] },
      settings: { engineMode: 'automatic', manualAnchorDay: null },
    });

    const res = responseDouble();
    await routeHandler('/', 'get')(
      { query: {}, user: { id: 7 } },
      res,
      jest.fn(),
    );

    const data = res.json.mock.calls[0][0].data;
    expect(data.cycles[0].income.items[0].accountNumber).toBe('5678');
    expect(data.cycles[0].nextCardForecast.bills[0].accountNumber).toBe('7766');
    expect(data.cycles[0].needsReview[0].matchedBill.accountNumber).toBe('7766');
    expect(data.cycles[0].cards[0].accountNumber).toBe('7766');
    expect(data.cycles[0].decisions[0].linkedTo.accountNumber).toBe('7766');
    expect(data.loans[0].payments[0]).toEqual({ date: '2026-07-01', amount: -100 });
    expect(data.salaryTracking.last.txn.accountNumber).toBe('5678');
    expect(data.signatures[0].accountNumber).toBe('5678');
    expect(data.fundingForecast.streams[0]).toMatchObject({ accountLast4: '5678' });
    expect(data.fundingForecast.streams[0]).not.toHaveProperty('accountNumber');
  });

  test('maps a detailed recurring debit choice to a persisted expense rule', async () => {
    cycleService.saveTransactionOverride.mockResolvedValue({ transactionId: 42 });
    const res = responseDouble();
    await routeHandler('/transactions/:transactionId/classification', 'put')(
      {
        params: { transactionId: '42' },
        body: { classification: 'loan_repayment', reason: 'user_control' },
        user: { id: 7 },
      },
      res,
      jest.fn(),
    );

    expect(cycleService.saveTransactionOverride).toHaveBeenCalledWith(
      7,
      42,
      'expense',
      'user_control',
      {
        recurrenceKind: 'loan_repayment',
        recurrenceEnabled: true,
        recurrenceGroupId: null,
        recurrenceLabel: null,
        recurrenceIncludeEstimate: undefined,
      },
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
