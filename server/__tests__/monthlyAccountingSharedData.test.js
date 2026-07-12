const { buildMonthFromData } = require('../services/monthlyAccountingService');

const transaction = (overrides = {}) => ({
  id: 1,
  bank_source: 'leumi',
  bank_account_number: 'bank',
  amount: 100,
  type: 'expense',
  description: 'ordinary bank expense',
  notes: '',
  date: '2026-07-10',
  bank_status: 'completed',
  ...overrides,
});

describe('monthly accounting shared snapshot', () => {
  test('builds a month without double-counting a connected card settlement', () => {
    const data = {
      rows: [
        transaction({
          id: 1,
          type: 'income',
          description: 'SALARY',
          amount: 10000,
          date: '2026-07-09',
        }),
        transaction({
          id: 2,
          bank_source: 'max',
          bank_account_number: '2254',
          amount: 120,
          description: 'STORE',
        }),
        transaction({
          id: 3,
          description: 'לאומי ויזה',
          amount: 120,
          bank_sync_id: 'leumi:x:2254',
        }),
      ],
      salarySignatures: [{
        id: 1,
        bank_source: 'leumi',
        bank_account_number: 'bank',
        normalized_description: 'salary',
        month_offset: -1,
      }],
      connectedCardSources: ['max'],
      debitScopeRows: [],
      transactionOverrides: [],
    };

    const july = buildMonthFromData(data, 0);

    expect(july.month).toBe('2026-07');
    expect(july.income.actual).toBe(0);
    expect(july.spending).toEqual(expect.objectContaining({ cardPosted: 120, committed: 120 }));
    expect(july.transactionCount).toBe(3);
    expect(data.rows).toHaveLength(3);
  });
});

