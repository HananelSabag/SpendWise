const {
  buildCycleFromData,
  buildProjection,
  deriveBillingBoundaries,
  resolveCycleWindow,
} = require('../services/cycleRunwayService');

const row = (overrides = {}) => ({
  id: 1,
  bank_source: 'leumi',
  bank_account_number: 'bank',
  amount: 100,
  type: 'expense',
  description: 'ordinary bank row',
  date: '2026-07-12',
  bank_status: 'completed',
  bank_processed_date: null,
  ...overrides,
});

const card = (id, date, billingDate, overrides = {}) => row({
  id,
  bank_source: 'max',
  bank_account_number: '2254',
  description: `merchant ${id}`,
  date,
  bank_processed_date: billingDate,
  ...overrides,
});

const accounts = [
  { bank_source: 'leumi', account_number: 'bank', balance: 5000, enabled: true },
  { bank_source: 'max', account_number: '2254', balance: null, enabled: true },
  { bank_source: 'visa_cal', account_number: '9962', balance: null, enabled: true },
];

describe('card-billing financial cycle', () => {
  test('chooses the dominant processed date per card/month and the last provider date as boundary', () => {
    const rows = [
      card(1, '2026-05-20', '2026-06-10'),
      card(2, '2026-05-21', '2026-06-10'),
      card(3, '2026-06-20', '2026-07-10'),
      card(4, '2026-06-21', '2026-07-10'),
      card(5, '2026-07-11', '2026-07-12'),
      row({ id: 6, bank_source: 'visa_cal', bank_account_number: '9962', date: '2026-06-22', bank_processed_date: '2026-07-11' }),
      row({ id: 7, bank_source: 'visa_cal', bank_account_number: '9962', date: '2026-06-23', bank_processed_date: '2026-07-11' }),
    ];
    const boundaries = deriveBillingBoundaries(rows);
    expect(boundaries.map((item) => item.billingDate)).toEqual(['2026-06-10', '2026-07-11']);
    expect(resolveCycleWindow(boundaries, 0, '2026-07-13')).toMatchObject({
      cycleStart: '2026-07-12',
      lastDay: '2026-07-13',
      openedAfterBillingDate: '2026-07-11',
    });
    expect(resolveCycleWindow(boundaries, -1, '2026-07-13')).toMatchObject({
      cycleStart: '2026-06-11',
      lastDay: '2026-07-11',
    });
  });

  test('counts all raw income and expenses while excluding only duplicate card settlements', () => {
    const data = {
      accounts,
      rows: [
        card(1, '2026-05-20', '2026-06-10'),
        card(2, '2026-06-20', '2026-07-10'),
        card(3, '2026-07-12', '2026-08-10', { amount: 300 }),
        row({ id: 4, date: '2026-07-12', type: 'income', amount: 1000, description: 'any income' }),
        row({ id: 5, date: '2026-07-12', type: 'income', amount: 500, description: 'loan money' }),
        row({ id: 6, date: '2026-07-12', amount: 200, ledger_class: 'internal_transfer' }),
        row({ id: 7, date: '2026-07-12', amount: 900, description: 'לאומי ויזה' }),
        row({ id: 8, date: '2026-07-13', amount: 50, bank_status: 'pending' }),
      ],
    };
    const cycle = buildCycleFromData(data, 0, '2026-07-13');
    expect(cycle.cycleStart).toBe('2026-07-11');
    expect(cycle.money).toMatchObject({
      totalIncome: 1500,
      bankExpenses: 250,
      cardActivity: 300,
      spentCommitted: 550,
      netIncludingSalaryCommitted: 950,
      excludedCardSettlements: 900,
    });
    expect(cycle.expected).toEqual({ bankPending: 50, cardChargesNotYetSettled: 300, remainingKnown: 350 });
  });

  test('projection adds only explicit expected income and subtracts transparent remaining costs', () => {
    const current = {
      checkingBalance: 2500,
      lastDay: '2026-07-13',
      expected: { remainingKnown: 600, cardChargesNotYetSettled: 500, bankPending: 100 },
      money: {},
    };
    const projection = buildProjection(current, { enabled: true, expectedIncome: 1000, expectedCharge: 300 });
    expect(projection.expectedRemainingExpenses).toBe(900);
    expect(projection.projectedCheckingBalance).toBe(2600);
    expect(projection.warning).toBe('ok');
  });
});
