const { buildCalendarActivityFromRows } = require('../services/calendarActivityService');

const row = (overrides = {}) => ({
  id: 1,
  bank_source: 'leumi',
  bank_account_number: 'bank',
  amount: 100,
  type: 'expense',
  description: 'raw bank row',
  date: '2026-07-09',
  bank_status: 'completed',
  ...overrides,
});

describe('raw calendar cash flow', () => {
  test('sums every bank income and expense on its factual date', () => {
    const result = buildCalendarActivityFromRows([
      row({ id: 1, type: 'income', amount: 13327.75, description: 'salary' }),
      row({ id: 2, type: 'income', amount: 12805.22, description: 'loan disbursement', bank_status: 'pending' }),
      row({ id: 3, amount: 1086.44, description: 'loan repayment' }),
      row({ id: 4, amount: 12805.22, description: 'לאומי ויזה' }),
      row({ id: 5, amount: 500, ledger_class: 'internal_transfer' }),
    ], 0, new Date('2026-07-13T12:00:00Z'));

    expect(result.bankCashFlow).toEqual({
      income: 26132.97,
      expenses: 14391.66,
      net: 11741.31,
      pendingIncome: 12805.22,
      pendingExpenses: 0,
      count: 5,
    });
  });

  test('keeps itemized card and manual activity separate from bank net', () => {
    const result = buildCalendarActivityFromRows([
      row({ id: 1, type: 'income', amount: 1000 }),
      row({ id: 2, bank_source: 'max', bank_account_number: '2254', amount: 300 }),
      row({ id: 3, bank_source: 'max', bank_account_number: '2254', type: 'income', amount: 20 }),
      row({ id: 4, bank_source: null, bank_account_number: null, amount: 50 }),
    ], 0, new Date('2026-07-13T12:00:00Z'));

    expect(result.bankCashFlow.net).toBe(1000);
    expect(result.cardActivity).toEqual({ charges: 300, refunds: 20, netCharges: 280, pendingCharges: 0, count: 2 });
    expect(result.manualActivity.expenses).toBe(50);
  });
});
