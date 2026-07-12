const {
  buildCycleFromData,
  buildDailyHistory,
  buildProjection,
} = require('../services/cycleRunwayService');

const row = (overrides = {}) => ({
  id: 1,
  bank_source: 'leumi',
  bank_account_number: 'bank',
  amount: 100,
  type: 'expense',
  description: 'ordinary bank expense',
  date: '2026-07-09',
  bank_status: 'completed',
  ...overrides,
});

describe('cycle runway daily history', () => {
  test('fills empty days and counts each economic fact once', () => {
    const rows = [
      row({ id: 1, type: 'income', description: 'SALARY', amount: 10000 }),
      row({ id: 2, amount: 50 }),
      row({ id: 3, date: '2026-07-10', amount: 25, bank_status: 'pending' }),
      row({ id: 4, date: '2026-07-10', description: 'לאומי ויזה', amount: 5000, bank_sync_id: 'leumi:x:2254' }),
      row({ id: 5, date: '2026-07-11', bank_source: 'max', bank_account_number: '2254', amount: 40 }),
    ];
    const context = {
      salarySignatures: [{ id: 1, bank_source: 'leumi', bank_account_number: 'bank', normalized_description: 'salary', month_offset: -1 }],
      connectedCardSources: ['max'],
    };
    const history = buildDailyHistory(rows, context, '2026-07-09', '2026-07-13');

    expect(history).toHaveLength(4);
    expect(history[0]).toEqual(expect.objectContaining({
      salaryIncome: 10000, incomeExSalary: 0, spentActual: 50, cumulativeSpent: 50,
    }));
    expect(history[1]).toEqual(expect.objectContaining({
      spentActual: 0, spentCommitted: 25, spentPending: 25, transactionCount: 1,
    }));
    expect(history[2]).toEqual(expect.objectContaining({
      spentActual: 40, spentCommitted: 40, cumulativeSpent: 115,
    }));
    expect(history[3]).toEqual(expect.objectContaining({
      spentActual: 0, spentCommitted: 0, cumulativeNetExSalary: -115,
    }));
  });

  test('refunds reduce spend and other income increases the cycle net', () => {
    const rows = [
      row({ id: 1, bank_source: 'max', bank_account_number: '2254', amount: 120 }),
      row({ id: 2, date: '2026-07-10', bank_source: 'max', bank_account_number: '2254', type: 'income', amount: 20 }),
      row({ id: 3, date: '2026-07-10', type: 'income', description: 'PAYBOX', amount: 30 }),
    ];
    const history = buildDailyHistory(rows, { connectedCardSources: ['max'] }, '2026-07-09', '2026-07-11');
    expect(history[1]).toEqual(expect.objectContaining({
      spentActual: -20,
      incomeExSalary: 30,
      cumulativeSpent: 100,
      cumulativeIncome: 30,
      cumulativeNetExSalary: -70,
    }));
  });

  test('projection stays separate from facts and falls back to the last salary', () => {
    const current = {
      checkingBalance: 2500,
      salaryDate: '2026-07-09',
      lastDay: '2026-07-12',
      money: { salaryInWindow: 10000 },
    };
    const projection = buildProjection(current, { enabled: true, expectedCharge: 3000, expectedChargeLabel: 'Card bill' });
    expect(projection.expectedSalary).toEqual({ amount: 10000, date: '2026-08-09', source: 'last_salary' });
    expect(projection.expectedCharge).toEqual({ amount: 3000, date: null, label: 'Card bill' });
    expect(projection.projectedCheckingBalance).toBe(9500);
    expect(projection.isPlanningOnly).toBe(true);
    expect(current.checkingBalance).toBe(2500);
  });

  test('derives current and previous cycles from one shared ledger snapshot', () => {
    const data = {
      rows: [
        row({ id: 1, date: '2026-06-09', type: 'income', description: 'SALARY', amount: 9000 }),
        row({ id: 2, date: '2026-06-10', amount: 100 }),
        row({ id: 3, date: '2026-07-09', type: 'income', description: 'SALARY', amount: 10000 }),
        row({ id: 4, date: '2026-07-10', amount: 50 }),
      ],
      salarySignatures: [{
        id: 1,
        bank_source: 'leumi',
        bank_account_number: 'bank',
        normalized_description: 'salary',
        month_offset: -1,
      }],
      accounts: [{ bank_source: 'leumi', account_number: 'bank', balance: 2500, enabled: true }],
      transactionOverrides: [],
    };

    const current = buildCycleFromData(data, 0);
    const previous = buildCycleFromData(data, -1);

    expect(current).toEqual(expect.objectContaining({
      anchor: 'salary', cycleStart: '2026-07-09', checkingBalance: 2500,
    }));
    expect(current.money).toEqual(expect.objectContaining({ salaryInWindow: 10000, spentCommitted: 50 }));
    expect(previous).toEqual(expect.objectContaining({
      anchor: 'salary', cycleStart: '2026-06-09', checkingBalance: null,
    }));
    expect(previous.money).toEqual(expect.objectContaining({ salaryInWindow: 9000, spentCommitted: 100 }));
    expect(data.rows).toHaveLength(4);
  });
});
