const { buildCalendarMonthSummaryFromRows } = require('../services/calendarMonthSummaryService');

const period = { month: '2026-07', start: '2026-07-01', end: '2026-08-01', offset: 0, isCurrent: true };
const row = (overrides = {}) => ({
  id: 1, bank_source: 'leumi', bank_account_number: 'bank', amount: 100,
  type: 'expense', description: 'ordinary', date: '2026-07-05',
  bank_processed_date: null, bank_status: 'completed', ...overrides,
});
const accounts = [
  { bank_source: 'max', account_number: '2254', enabled: true },
  { bank_source: 'visa_cal', account_number: '9962', enabled: false },
];

describe('calendar month card reconciliation', () => {
  test('keeps the bank reversal visible and subtracts only same-month itemized overlap from a connected settlement', () => {
    const rows = [
      row({ id: 1, amount: 12000, description: 'לאומי ויזה', date: '2026-07-10', bank_sync_id: 'leumi:bank:122254' }),
      row({ id: 2, bank_source: 'max', bank_account_number: '2254', amount: 2000, description: 'A', date: '2026-07-03', bank_processed_date: '2026-07-10' }),
      row({ id: 3, bank_source: 'max', bank_account_number: '2254', amount: 1000, description: 'B', date: '2026-07-08', bank_processed_date: '2026-07-10', bank_status: 'pending' }),
      row({ id: 4, type: 'income', amount: 12000, description: 'installment reversal', date: '2026-07-12' }),
      row({ id: 5, amount: 2000, description: 'כרטיסי אשראי', date: '2026-07-11' }),
    ];
    const result = buildCalendarMonthSummaryFromRows(rows, accounts, rows, period);

    expect(result.totals).toMatchObject({
      income: 12000,
      expenses: 14000,
      net: -2000,
      rawExpensesBeforeAdjustments: 17000,
      rawIncomeBeforeAdjustments: 12000,
      creditCardDebitAdjustments: 3000,
      bankReversalAdjustments: 0,
    });
    expect(result.pending).toMatchObject({ income: 0, expenses: 1000, count: 1, includedInTotals: true });
    expect(result.reconciliation.adjustments).toEqual(expect.arrayContaining([
      expect.objectContaining({ cardSource: 'max', bankDebit: 12000, alreadyRepresented: 3000, adjustment: 3000, remainingBankDebit: 9000 }),
      expect.objectContaining({ cardSource: 'visa_cal', connected: false, adjustment: 0, remainingBankDebit: 2000 }),
    ]));
    expect(result.breakdown.refundsAndReversals.matchedBankReversals).toBe(12000);
    expect(result.breakdown.refundsAndReversals.matchedBankReversalsIncludedInIncome).toBe(12000);
  });

  test('prefers a completed settlement over its stale pending lifecycle copy', () => {
    const rows = [
      row({ id: 1, amount: 12744.22, description: 'לאומי ויזה', date: '2026-07-10', bank_sync_id: 'leumi:bank:582254', bank_status: 'pending' }),
      row({ id: 2, amount: 12805.22, description: 'לאומי ויזה', date: '2026-07-10', bank_sync_id: 'leumi:bank:982254', bank_status: 'completed' }),
    ];
    const result = buildCalendarMonthSummaryFromRows(rows, accounts, rows, period);
    expect(result.totals.expenses).toBe(12805.22);
    expect(result.totals.rawExpensesBeforeAdjustments).toBe(12805.22);
    expect(result.pending.count).toBe(0);
    expect(result.reconciliation.supersededPendingSettlementCount).toBe(1);
  });

  test('keeps a bank settlement as the fallback expense when the card is not connected', () => {
    const rows = [
      row({ id: 1, amount: 2665.20, description: 'כרטיסי אשראי', date: '2026-07-11' }),
    ];
    const result = buildCalendarMonthSummaryFromRows(rows, accounts, rows, period);
    expect(result.totals).toMatchObject({ income: 0, expenses: 2665.2, net: -2665.2 });
    expect(result.reconciliation.adjustments[0]).toMatchObject({ connected: false, adjustment: 0, remainingBankDebit: 2665.2 });
  });

  test('does not exclude an unrelated same-amount bank income from another account', () => {
    const rows = [
      row({ id: 1, amount: 12000, description: 'לאומי ויזה', date: '2026-07-10', bank_account_number: 'checking-a', bank_sync_id: 'leumi:a:122254' }),
      row({ id: 2, type: 'income', amount: 12000, description: 'unrelated income', date: '2026-07-12', bank_account_number: 'checking-b' }),
    ];
    const result = buildCalendarMonthSummaryFromRows(rows, accounts, rows, period);
    expect(result.totals).toMatchObject({ income: 12000, expenses: 12000, net: 0 });
    expect(result.breakdown.refundsAndReversals.matchedBankReversals).toBe(0);
  });
});
