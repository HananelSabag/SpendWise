const { buildWidgets } = require('../services/dashboardClassifierWidgetsService');

const row = (overrides = {}) => ({
  id: 1, bank_source: 'leumi', bank_account_number: 'bank', amount: 100,
  type: 'expense', description: 'ordinary', date: '2026-07-01', bank_status: 'completed',
  ...overrides,
});

describe('dashboard classifier widgets', () => {
  test('costs and source activity count unique economic facts only', () => {
    const rows = [
      row({ id: 1, description: 'פרעון הלוואה', amount: 1086.44 }),
      row({ id: 2, description: 'משיכת מזומן', amount: 600 }),
      row({ id: 3, description: 'עמלה', amount: 18.16 }),
      row({ id: 4, description: 'לאומי ויזה', amount: 12000, bank_sync_id: 'leumi:bank:122254' }),
      row({ id: 5, bank_source: 'max', bank_account_number: '2254', description: 'merchant', amount: 50 }),
      row({ id: 6, description: 'כרטיס דביט', amount: 88, notes: 'בכרטיס המסתיים ב-8345' }),
      row({ id: 7, bank_source: 'max', bank_account_number: '8345', description: 'GOOGLE', amount: 88 }),
    ];
    const result = buildWidgets(rows, rows, { debitCardAccounts: [{ source: 'max', account: '8345' }] });
    expect(result.bankCosts).toEqual({
      feesInterest: 18.16, loanPayments: 1086.44, cashWithdrawn: 600, cashWithdrawalCount: 1,
    });
    expect(result.sourceActivity.find((item) => item.bank_source === 'leumi').expenses).toBe(1792.6);
    expect(result.sourceActivity.find((item) => item.bank_source === 'max').expenses).toBe(50);
  });

  test('recurring patterns exclude settlements, debit copies, loans, fees, and cash', () => {
    const history = [
      row({ id: 1, bank_source: 'max', bank_account_number: '2254', description: 'NETFLIX', amount: 55, date: '2026-06-01' }),
      row({ id: 2, bank_source: 'max', bank_account_number: '2254', description: 'NETFLIX', amount: 57, date: '2026-07-01' }),
      row({ id: 3, description: 'פרעון הלוואה', date: '2026-06-11' }),
      row({ id: 4, description: 'פרעון הלוואה', date: '2026-07-11' }),
    ];
    const result = buildWidgets(history, history, {});
    expect(result.recurringPatterns).toEqual([expect.objectContaining({
      description: 'NETFLIX', occurrences: 2, active_months: 2, average_amount: 56,
    })]);
  });
});
