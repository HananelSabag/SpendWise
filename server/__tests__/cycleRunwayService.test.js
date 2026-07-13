const {
  buildCycleFromData,
  buildProjection,
  deriveBillingBoundaries,
  reduceCycleRows,
  resolveCycleWindow,
} = require('../services/cycleRunwayService');

const row = (overrides = {}) => ({
  id: 1,
  bank_source: 'leumi',
  bank_account_number: 'bank',
  amount: 100,
  type: 'expense',
  description: 'ordinary bank row',
  notes: '',
  date: '2026-07-12',
  bank_status: 'completed',
  bank_processed_date: null,
  ledger_class: null,
  settlement_card_source: null,
  settlement_card_account: null,
  txn_kind: null,
  installment_number: null,
  installment_total: null,
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

const settlement = (id, amount, date, source, account, overrides = {}) => row({
  id,
  amount,
  date,
  bank_processed_date: date,
  description: 'card settlement',
  ledger_class: 'card_settlement',
  settlement_card_source: source,
  settlement_card_account: account,
  ...overrides,
});

const accounts = [
  { bank_source: 'leumi', account_number: 'bank', balance: 5000, enabled: true },
  { bank_source: 'max', account_number: '2254', balance: null, enabled: true },
  { bank_source: 'visa_cal', account_number: '9962', balance: null, enabled: true },
];

describe('card-billing financial cycle', () => {
  test('uses completed provider statement dates, ignores pending noise, and preserves observed shifts', () => {
    const rows = [
      card(1, '2026-05-20', '2026-06-10'),
      card(2, '2026-05-21', '2026-06-10'),
      card(3, '2026-06-20', '2026-07-10'),
      card(4, '2026-06-21', '2026-07-10'),
      card(5, '2026-07-11', '2026-07-12', { bank_status: 'pending' }),
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

  test('separates cycle activity, financing cash, and known upcoming card commitments', () => {
    const data = {
      accounts,
      rows: [
        card(1, '2026-05-20', '2026-06-10'),
        card(2, '2026-06-20', '2026-07-10'),
        card(3, '2026-07-12', '2026-08-10', { amount: 300 }),
        card(4, '2026-06-20', '2026-08-10', {
          amount: 200, txn_kind: 'installments', installment_number: 2, installment_total: 6,
        }),
        card(5, '2026-07-12', '2026-07-12', { amount: 50, bank_status: 'pending' }),
        row({ id: 6, type: 'income', amount: 1000, description: 'ordinary income' }),
        row({ id: 7, type: 'income', amount: 500, description: 'loan proceeds', ledger_class: 'loan_disbursement' }),
        row({ id: 8, amount: 100 }),
      ],
    };
    const cycle = buildCycleFromData(data, 0, '2026-07-13');
    expect(cycle.money).toMatchObject({
      totalIncome: 1000,
      financingInflows: 500,
      bankExpenses: 100,
      cardActivity: 350,
      spentCommitted: 450,
      netIncludingSalaryCommitted: 550,
    });
    expect(cycle.expected).toMatchObject({
      cardChargesPosted: 500,
      cardChargesPending: 50,
      cardChargesNotYetSettled: 550,
      remainingKnown: 550,
    });
    expect(cycle.cardBillingCycles).toHaveLength(1);
    expect(cycle.cardBillingCycles[0]).toMatchObject({ billingDate: '2026-08-10', total: 550 });
  });

  test('reconciles a connected settlement partially and counts an unconnected settlement in full', () => {
    const onlyMaxConnected = accounts.filter((account) => account.bank_source !== 'visa_cal');
    const rows = [
      card(1, '2026-07-12', '2026-07-12', { amount: 600 }),
      settlement(2, 1000, '2026-07-12', 'max', '2254'),
      settlement(3, 300, '2026-07-12', 'visa_cal', '9962'),
    ];
    const reduced = reduceCycleRows(rows, onlyMaxConnected, {
      cycleStart: '2026-07-11', cycleEndExclusive: '2026-07-14',
    });
    expect(reduced.totals).toMatchObject({
      cardExpensesPosted: 600,
      bankExpensesPosted: 700,
      excludedCardSettlements: 600,
      unmatchedCardSettlements: 700,
    });
    expect(reduced.spentCommitted).toBe(1300);
  });

  test('counts debit-card bank activity once and excludes the card enrichment copy', () => {
    const rows = [
      row({
        id: 1, amount: 80, description: 'כרטיס דביט', notes: 'הכרטיס המסתיים ב-8345', ledger_class: 'debit_direct',
      }),
      card(2, '2026-07-12', '2026-07-12', {
        bank_account_number: '8345', amount: 80, description: 'Debit card purchase', notes: 'Debit card',
      }),
    ];
    const reduced = reduceCycleRows(rows, [
      ...accounts,
      { bank_source: 'max', account_number: '8345', balance: null, enabled: true },
    ], { cycleStart: '2026-07-11', cycleEndExclusive: '2026-07-14' });
    expect(reduced.spentCommitted).toBe(80);
    expect(reduced.totals).toMatchObject({
      bankExpensesPosted: 80,
      cardExpensesPosted: 0,
      debitEnrichmentExcluded: 80,
      transactionCount: 1,
    });
  });

  test('places installments on their billing date while ordinary purchases keep their purchase date', () => {
    const rows = [
      card(1, '2026-05-20', '2026-07-10', {
        amount: 100, txn_kind: 'installments', installment_number: 2, installment_total: 4,
      }),
      card(2, '2026-06-20', '2026-08-10', {
        amount: 200, txn_kind: 'installments', installment_number: 3, installment_total: 4,
      }),
      card(3, '2026-06-20', '2026-08-10', { amount: 300, txn_kind: 'normal' }),
    ];
    const reduced = reduceCycleRows(rows, accounts, {
      cycleStart: '2026-06-11', cycleEndExclusive: '2026-07-11',
    });
    expect(reduced.totals.cardExpensesPosted).toBe(400);
  });

  test('refunds improve net without being silently clamped away', () => {
    const rows = [
      card(1, '2026-07-12', '2026-08-10', { amount: 100 }),
      card(2, '2026-07-12', '2026-08-10', { amount: 150, type: 'income' }),
    ];
    const reduced = reduceCycleRows(rows, accounts, {
      cycleStart: '2026-07-11', cycleEndExclusive: '2026-07-14',
    });
    expect(reduced.spentCommitted).toBe(100);
    expect(reduced.totalIncome).toBe(150);
    expect(reduced.netCommitted).toBe(50);
  });

  test('counts confirmed salary and ordinary income while separating non-economic cash transfers', () => {
    const rows = [
      row({ id: 1, type: 'income', amount: 8000, description: 'New Employer' }),
      row({ id: 2, type: 'income', amount: 250, description: 'Freelance refund' }),
      row({ id: 3, type: 'income', amount: 3000, description: 'Broker transfer', ledger_class: 'security_transfer' }),
      row({ id: 4, type: 'income', amount: 1200, description: 'Own account', ledger_class: 'internal_transfer' }),
    ];
    const cycle = buildCycleFromData({
      accounts,
      rows,
      salarySignatures: [{
        id: 7,
        bank_source: 'leumi',
        bank_account_number: 'bank',
        normalized_description: 'new employer',
        month_offset: 0,
      }],
    }, 0, '2026-07-13');
    expect(cycle.money).toMatchObject({
      totalIncome: 8250,
      salaryInWindow: 8000,
      incomeExSalary: 250,
      transferInflows: 4200,
      netIncludingSalaryCommitted: 8250,
    });
  });

  test('does not count an identical pending bank copy when its completed fact exists', () => {
    const duplicate = {
      amount: 90,
      description: 'Same merchant',
      date: '2026-07-12',
      bank_source: 'leumi',
      bank_account_number: 'bank',
    };
    const reduced = reduceCycleRows([
      row({ id: 1, ...duplicate, bank_status: 'pending' }),
      row({ id: 2, ...duplicate, bank_status: 'completed' }),
    ], accounts, { cycleStart: '2026-07-11', cycleEndExclusive: '2026-07-14' });
    expect(reduced.spentCommitted).toBe(90);
    expect(reduced.totals.transactionCount).toBe(1);
  });

  test('falls back to the calendar window when no billing evidence exists', () => {
    expect(resolveCycleWindow([], 0, '2026-07-13')).toMatchObject({
      anchor: 'calendar_fallback', cycleStart: '2026-07-01', lastDay: '2026-07-13',
    });
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
