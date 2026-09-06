// Synthetic data only. Totals and transaction breakdowns intentionally reconcile.
const txn = (
  id,
  amount,
  description,
  date = '2026-09-02',
  source = 'max',
  accountNumber = '1111',
) => ({
  id,
  amount,
  description,
  date,
  processedDate: date,
  source,
  accountNumber,
  pending: false,
});
const groceries = txn(1, -450, 'קניות לבית');
const services = txn(2, -750, 'שירותים ותשלומים');
const insurance = txn(3, -800, 'ביטוח רכב', '2026-09-03', 'visa_cal', '2222');
const paid = [txn(4, -600, 'קניות בסופר', '2026-08-10'), txn(5, -350, 'תחבורה', '2026-08-10')];
const debit = [
  txn(6, -120, 'בית קפה', '2026-09-03', 'max', '3333'),
  txn(7, 20, 'החזר מבית העסק', '2026-09-03', 'max', '3333'),
];

export const SETTINGS = {
  engineMode: 'automatic',
  manualAnchorDay: null,
  useEstimates: true,
  overdraftLimit: 5000,
};
export const CYCLE = {
  window: { start: '2026-08-10', end: '2026-09-10', running: true, mode: 'billing', anchorDay: 10 },
  income: {
    total: 7500,
    salary: 7500,
    other: 0,
    items: [txn(10, 7500, 'משכורת לדוגמה', '2026-08-12', 'leumi', '4444')],
  },
  expenses: {
    total: 1350,
    cards: 1050,
    direct: 300,
    directItems: [txn(11, -300, 'הוראת קבע', '2026-09-01', 'leumi', '4444')],
    events: [
      {
        source: 'max',
        accountNumber: '1111',
        chargeDate: '2026-08-10',
        total: -950,
        count: 2,
        class: 'statement',
        txns: paid,
        bankTransaction: txn(12, -950, 'חיוב כרטיס אשראי', '2026-08-10', 'leumi', '4444'),
      },
      {
        source: 'max',
        accountNumber: '3333',
        chargeDate: '2026-09-03',
        total: -100,
        count: 2,
        class: 'immediate',
        txns: debit,
      },
    ],
  },
  financing: { total: 0 },
  cards: [
    {
      source: 'max',
      accountNumber: '1111',
      settlement: { mode: 'aggregated' },
      statementDay: { day: 10, certain: true },
      included: true,
    },
    {
      source: 'visa_cal',
      accountNumber: '2222',
      settlement: { mode: 'aggregated' },
      statementDay: { day: 10, certain: true },
      included: true,
    },
    {
      source: 'max',
      accountNumber: '3333',
      settlement: { mode: 'passthrough' },
      statementDay: { certain: false },
      included: true,
    },
  ],
  nextCardForecast: {
    knownTotal: 2000,
    estimatedTotal: 2900,
    bills: [
      {
        source: 'max',
        accountNumber: '1111',
        chargeDate: '2026-09-10',
        knownAmount: 1200,
        estimatedAmount: 1900,
        lastStatementAmount: 950,
        historyCount: 3,
        knownTxns: [groceries, services],
      },
      {
        source: 'visa_cal',
        accountNumber: '2222',
        chargeDate: '2026-09-10',
        knownAmount: 800,
        estimatedAmount: 1000,
        lastStatementAmount: 1200,
        historyCount: 2,
        knownTxns: [insurance],
      },
    ],
  },
  forwardReset: {
    completionDate: '2026-09-10',
    expectedIncoming: 7500,
    knownCardOut: 2000,
    estimatedCardOut: 2900,
    knownFixedOut: 300,
    estimatedFixedOut: 350,
    stages: [
      {
        kind: 'income',
        label: 'משכורת לדוגמה',
        amount: 7500,
        date: '2026-09-09',
        certainty: 'estimated',
        status: 'scheduled',
      },
      {
        kind: 'recurring',
        label: 'הוראת קבע מאושרת',
        amount: -300,
        date: '2026-09-08',
        certainty: 'known',
      },
      {
        kind: 'recurring',
        label: 'מנוי שזוהה אוטומטית',
        amount: -50,
        date: '2026-09-09',
        certainty: 'estimated',
      },
      {
        kind: 'card',
        label: 'MAX · 1111',
        date: '2026-09-10',
        amount: -1200,
        estimatedAmount: -1900,
      },
      {
        kind: 'card',
        label: 'CAL · 2222',
        date: '2026-09-10',
        amount: -800,
        estimatedAmount: -1000,
      },
    ],
  },
};

export const GROUPS = [
  {
    id: 'demo-rule',
    label: 'הוראת קבע לבית',
    recurrenceKind: 'standing_order',
    includeInEstimate: true,
    matchers: [
      {
        transactionId: 11,
        source: 'leumi',
        accountLast4: '4444',
        description: 'הוראת קבע',
        amount: -300,
        date: '2026-09-01',
      },
    ],
  },
];
export const DECISIONS = Array.from({ length: 180 }, (_, index) => ({
  transactionId: index + 20,
  amount: index % 7 === 0 ? 2000 : -(index + 30),
  description: index % 7 === 0 ? `הכנסה לדוגמה ${index}` : `עסקה לדוגמה ${index}`,
  source: index % 2 ? 'max' : 'leumi',
  accountNumber: index % 2 ? '1111' : '4444',
  date: `2026-08-${String((index % 28) + 1).padStart(2, '0')}`,
  classification: index % 7 === 0 ? 'income' : 'expense',
  editable: true,
}));
export const LOANS = [
  {
    identifier: 'sample-loan',
    description: 'הלוואה לדוגמה',
    principal: 12000,
    repaid: 2000,
    outstanding: 10000,
    paymentDay: 12,
    paymentCount: 2,
    disbursedOn: '2026-06-01',
    payments: [
      { date: '2026-07-12', amount: -1000 },
      { date: '2026-08-12', amount: -1000 },
    ],
  },
];
