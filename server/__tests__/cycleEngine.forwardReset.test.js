const engine = require('../services/cycleEngine');

function income(id, amount, date, description) {
  return {
    id,
    amount,
    date,
    processedDate: date,
    status: 'completed',
    description,
    source: 'bank',
    accountNumber: '1234',
  };
}

describe('forward reset cycle primitives', () => {
  test('does not repeat a final lump sum, but keeps regular payments that include interest', () => {
    const result = engine.projectUpcoming({
      window: { start: '2026-09-06', end: '2026-10-10' },
      asOf: new Date('2026-09-06T12:00:00+03:00'),
      loans: [
        { identifier: 'paid', principal: 18000, outstanding: 0, paymentDay: 14, lastPaymentAmount: -18000, payments: [{ amount: -18000 }] },
        { identifier: 'overpaid', principal: 9000, outstanding: -100, paymentDay: 12, lastPaymentAmount: -8000, payments: [{ amount: -1100 }, { amount: -8000 }] },
        { identifier: 'open', outstanding: 20000, paymentDay: 11, lastPaymentAmount: -1000 },
        { identifier: 'interest', principal: 3000, outstanding: -300, paymentDay: 13, lastPaymentAmount: -1100, payments: [{ amount: -1100 }, { amount: -1100 }, { amount: -1100 }] },
      ],
    });
    expect(result.items.map((item) => item.amount)).toEqual([-1000, -1100]);
  });

  test('manual forecast includes obligations after the last expected salary through the cycle end', () => {
    const txn = { ...income(1, -300, '2026-08-08', 'Insurance'), identifier: 'insurance' };
    const cycle = engine.buildCycle({
      bankTxns: [txn], cards: [],
      window: { start: '2026-08-10', end: '2026-09-10', running: true, mode: 'manual', anchorDay: 10, salary: { amount: 0, txn: null } },
      asOf: new Date('2026-09-06T12:00:00+03:00'),
      fundingForecast: { streams: [{ expectedDate: '2026-09-07', expectedAmount: 5000 }] },
      transactionOverrides: [{ ...txn, transactionId: 1, classification: 'expense', recurrenceEnabled: true, recurrenceKind: 'insurance', recurrenceIncludeEstimate: true }],
    });
    expect(cycle.forwardReset).toMatchObject({ completionDate: '2026-09-10', knownFixedOut: 300, expectedIncoming: 5000 });
  });
  test('automatic billing windows use the latest monthly statement day', () => {
    const anchorDay = engine.latestStatementDay([
      { view: { settlement: { mode: 'aggregated' }, statementDay: { day: 2, certain: true } } },
      { view: { settlement: { mode: 'aggregated' }, statementDay: { day: 10, certain: true } } },
      { view: { settlement: { mode: 'passthrough' }, statementDay: { day: null, certain: false } } },
    ]);
    const running = engine.buildBillingCycleWindows(anchorDay, {
      asOf: new Date('2026-07-22T12:00:00+03:00'),
      months: 3,
    }).find((window) => window.running);

    expect(anchorDay).toBe(10);
    expect(running).toMatchObject({
      start: '2026-07-10',
      end: '2026-08-10',
      mode: 'billing',
      anchorDay: 10,
    });
  });

  test('does not invent an automatic boundary from an uncertain card day', () => {
    expect(engine.latestStatementDay([{
      included: true,
      view: { settlement: { mode: 'aggregated' }, statementDay: { day: 17, certain: false } },
    }])).toBeNull();
  });

  test('every linked salary inside a billing window is received income', () => {
    const signatures = [
      { id: 1, normalizedDescription: 'salary a', cycleAnchor: true },
      { id: 2, normalizedDescription: 'salary b', cycleAnchor: false },
    ];
    const bankTxns = [
      income(1, 10000, '2026-07-11', 'salary a'),
      income(2, 15000, '2026-07-15', 'salary b'),
      { ...income(3, 700, '2026-07-18', 'refund'), amount: -700 },
    ];
    const window = {
      start: '2026-07-10', end: '2026-08-10', running: true, mode: 'billing',
      salary: { date: '2026-07-10', amount: 0, txn: null }, closingSalary: null,
    };
    const cycle = engine.buildCycle({
      bankTxns,
      cards: [],
      window,
      asOf: new Date('2026-07-22T12:00:00+03:00'),
      salarySignatures: signatures,
      fundingForecast: { streams: [], expectedTotal: 0 },
    });

    expect(cycle.income.salary.total).toBe(25000);
    expect(cycle.income.total).toBe(25000);
    expect(cycle.expenses.direct.total).toBe(700);
  });

  test('a manual day stays stable and clamps to short months', () => {
    const windows = engine.buildFixedDayWindows(31, {
      asOf: new Date('2026-03-15T12:00:00+02:00'),
      months: 3,
    });
    const running = windows.find((window) => window.running);

    expect(running).toMatchObject({
      start: '2026-02-28',
      end: '2026-03-31',
      mode: 'manual',
      anchorDay: 31,
    });
  });

  test('a joint account keeps both salaries in one funding forecast', () => {
    const signatures = [
      { id: 1, normalizedDescription: 'salary a', displayDescription: 'Salary A', cycleAnchor: true },
      { id: 2, normalizedDescription: 'salary b', displayDescription: 'Salary B', cycleAnchor: false },
    ];
    const bankTxns = [
      income(1, 10000, '2026-05-01', 'salary a'),
      income(2, 10000, '2026-06-01', 'salary a'),
      income(3, 10000, '2026-07-01', 'salary a'),
      income(4, 15000, '2026-05-05', 'salary b'),
      income(5, 15000, '2026-06-05', 'salary b'),
      income(6, 15000, '2026-07-05', 'salary b'),
    ];

    const forecast = engine.buildFundingForecast(bankTxns, signatures, {
      asOf: new Date('2026-07-19T12:00:00+03:00'),
    });

    expect(forecast).toMatchObject({
      expectedTotal: 25000,
      start: '2026-08-01',
      end: '2026-08-05',
    });
    expect(forecast.streams).toHaveLength(2);
    expect(forecast.streams.map((stream) => stream.primary)).toEqual([true, false]);
  });

  test('keeps an automatically inferred recurring debit out of known charges', () => {
    const bankTxns = [
      { id: 10, amount: -100, date: '2026-05-25', processedDate: '2026-05-25', status: 'completed', description: 'Possible repeat', identifier: 'repeat-1', source: 'leumi', accountNumber: '1' },
      { id: 11, amount: -100, date: '2026-06-25', processedDate: '2026-06-25', status: 'completed', description: 'Possible repeat', identifier: 'repeat-1', source: 'leumi', accountNumber: '1' },
    ];
    const cycle = engine.buildCycle({
      bankTxns,
      cards: [],
      window: { start: '2026-07-10', end: '2026-08-10', running: true, mode: 'manual', anchorDay: 10, salary: { date: '2026-07-10', amount: 0, txn: null } },
      asOf: new Date('2026-07-22T12:00:00+03:00'),
      fundingForecast: { streams: [], expectedTotal: 0 },
    });

    expect(cycle.forwardReset.knownFixedOut).toBe(0);
    expect(cycle.forwardReset.estimatedFixedOut).toBe(100);
    expect(cycle.forwardReset.knownNetChange).toBe(0);
    expect(cycle.forwardReset.estimatedNetChange).toBe(-100);
  });

  test('closed-cycle averages include zero-activity calendar days and expose peak days', () => {
    const summary = engine.summarizeClosedCycle([
      { included: true, impactLine: 'income', impactAmount: 900, date: '2026-06-01' },
      { included: true, impactLine: 'expenses', impactAmount: 300, date: '2026-06-10' },
      { included: true, impactLine: 'expenses', impactAmount: 600, date: '2026-06-10' },
      { included: false, impactLine: 'expenses', impactAmount: 5000, date: '2026-06-11' },
    ], { start: '2026-06-01', end: '2026-07-01' }, {
      income: 900,
      expenses: 900,
      net: 0,
    });

    expect(summary).toMatchObject({
      calendarDays: 30,
      activeDays: 2,
      averageIncomePerDay: 30,
      averageExpensePerDay: 30,
      averageNetPerDay: 0,
    });
    expect(summary.peakExpenseDay).toMatchObject({ date: '2026-06-10', expenses: 900 });
    expect(summary.bestDay).toMatchObject({ date: '2026-06-01', net: 900 });
    expect(summary.worstDay).toMatchObject({ date: '2026-06-10', net: -900 });
  });
});
