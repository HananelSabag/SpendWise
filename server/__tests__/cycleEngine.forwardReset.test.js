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
