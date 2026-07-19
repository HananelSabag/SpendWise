const engine = require('../services/cycleEngine');

function txn(id, amount, date, description, extra = {}) {
  return {
    id,
    amount,
    date,
    processedDate: date,
    status: 'completed',
    description,
    source: extra.source || 'bank',
    accountNumber: extra.accountNumber || '1234',
    identifier: extra.identifier || String(id),
    ...extra,
  };
}

describe('financial-cycle Control decisions', () => {
  test('a debit-card refund reduces expenses and exposes the suppressed bank copy', () => {
    const salary = txn(1, 1000, '2026-07-01', 'salary');
    const bankRefund = txn(2, 18, '2026-07-12', 'debit card refund');
    const historyBank = txn(4, -10, '2026-06-12', 'older debit card charge');
    const historyCard = txn(5, -10, '2026-06-01', 'older purchase', {
      source: 'max',
      accountNumber: '8345',
      processedDate: '2026-06-12',
    });
    const cardRefund = txn(3, 18, '2026-07-09', 'Big Apple', {
      source: 'max',
      accountNumber: '8345',
      processedDate: '2026-07-12',
    });
    const cycle = engine.buildCycle({
      bankTxns: [historyBank, salary, bankRefund],
      cards: [{ source: 'max', accountNumber: '8345', txns: [historyCard, cardRefund] }],
      window: {
        start: '2026-07-01',
        end: '2026-08-01',
        running: true,
        salary: { txn: salary, date: salary.date, amount: salary.amount },
      },
      salarySignature: { normalizedDescription: 'salary' },
      salarySignatures: [{ normalizedDescription: 'salary' }],
      asOf: new Date('2026-07-19T12:00:00+03:00'),
    });

    expect(cycle.expenses.cards.total).toBe(-18);
    expect(cycle.expenses.total).toBe(-18);
    expect(cycle.operatingNet).toBe(18);
    expect(cycle.bankMovement).toBe(1018);

    expect(cycle.decisions.find((item) => item.transactionId === 3)).toMatchObject({
      classification: 'refund',
      included: true,
      impactLine: 'expenses',
      impactAmount: -18,
    });
    expect(cycle.decisions.find((item) => item.transactionId === 2)).toMatchObject({
      classification: 'card_settlement',
      included: false,
      reason: 'bank_copy_suppressed',
      bankEffect: 18,
    });
  });

  test('a linked secondary salary joins the opening reset instead of becoming current income', () => {
    const primary = txn(10, 17000, '2026-07-01', 'state salary');
    const secondary = txn(11, 15000, '2026-07-05', 'mobileye salary');
    const transfer = txn(12, 189, '2026-07-05', 'incoming transfer');
    const signatures = [
      { id: 1, normalizedDescription: 'state salary', cycleAnchor: true },
      { id: 2, normalizedDescription: 'mobileye salary', cycleAnchor: false },
    ];
    const cycle = engine.buildCycle({
      bankTxns: [primary, secondary, transfer],
      cards: [],
      window: {
        start: '2026-07-01',
        end: '2026-08-01',
        running: true,
        salary: { txn: primary, date: primary.date, amount: primary.amount },
      },
      salarySignature: signatures[0],
      salarySignatures: signatures,
    });

    expect(cycle.income.salary.total).toBe(0);
    expect(cycle.income.other.total).toBe(189);
    expect(cycle.decisions.find((item) => item.transactionId === 10)).toMatchObject({
      classification: 'salary',
      included: false,
      reason: 'opening_salary_previous_cycle',
    });
    expect(cycle.decisions.find((item) => item.transactionId === 11)).toMatchObject({
      classification: 'salary',
      included: false,
      reason: 'opening_salary_previous_cycle',
    });
  });

  test('a closed joint cycle carries the next secondary salary across the primary boundary', () => {
    const opening = txn(20, 17000, '2026-06-01', 'state salary');
    const closing = txn(21, 17700, '2026-07-01', 'state salary');
    const partner = txn(22, 15300, '2026-07-05', 'mobileye salary');
    const signatures = [
      { id: 1, normalizedDescription: 'state salary', cycleAnchor: true },
      { id: 2, normalizedDescription: 'mobileye salary', cycleAnchor: false },
    ];
    const cycle = engine.buildCycle({
      bankTxns: [opening, closing, partner],
      cards: [],
      window: {
        start: '2026-06-01',
        end: '2026-07-01',
        running: false,
        salary: { txn: opening, date: opening.date, amount: opening.amount },
        closingSalary: { txn: closing, date: closing.date, amount: closing.amount },
      },
      salarySignature: signatures[0],
      salarySignatures: signatures,
    });

    expect(cycle.income.salary.total).toBe(33000);
    expect(cycle.decisions.find((item) => item.transactionId === 22)).toMatchObject({
      classification: 'salary',
      included: true,
      reason: 'linked_secondary_salary',
      bankEffect: 0,
    });
  });

  test('a secondary salary before the primary closes the same work period', () => {
    const openingPrimary = txn(30, 17000, '2026-06-10', 'state salary');
    const closingPrimary = txn(31, 17700, '2026-07-10', 'state salary');
    const openingPartner = txn(32, 15000, '2026-06-05', 'mobileye salary');
    const closingPartner = txn(33, 15300, '2026-07-05', 'mobileye salary');
    const nextPartner = txn(34, 15400, '2026-08-05', 'mobileye salary');
    const signatures = [
      { id: 1, normalizedDescription: 'state salary', monthOffset: -1, cycleAnchor: true },
      { id: 2, normalizedDescription: 'mobileye salary', monthOffset: -1, cycleAnchor: false },
    ];
    const cycle = engine.buildCycle({
      bankTxns: [openingPartner, openingPrimary, closingPartner, closingPrimary, nextPartner],
      cards: [],
      window: {
        start: '2026-06-10',
        end: '2026-07-10',
        running: false,
        salary: { txn: openingPrimary, date: openingPrimary.date, amount: openingPrimary.amount },
        closingSalary: { txn: closingPrimary, date: closingPrimary.date, amount: closingPrimary.amount },
      },
      salarySignature: signatures[0],
      salarySignatures: signatures,
    });

    expect(cycle.income.salary.total).toBe(33000);
    expect(cycle.income.salary.items.map((item) => item.id)).toEqual([31, 33]);
    expect(cycle.decisions.find((item) => item.transactionId === 33)).toMatchObject({
      included: true,
      reason: 'linked_secondary_salary',
    });
  });

  test('an arrived secondary salary is removed from a late primary reset forecast', () => {
    const primary = txn(40, 17000, '2026-06-10', 'state salary');
    const openingPartner = txn(41, 15000, '2026-06-05', 'mobileye salary');
    const arrivedPartner = txn(42, 15300, '2026-07-05', 'mobileye salary');
    const signatures = [
      { id: 1, normalizedDescription: 'state salary', monthOffset: -1, cycleAnchor: true },
      { id: 2, normalizedDescription: 'mobileye salary', monthOffset: -1, cycleAnchor: false },
    ];
    const asOf = new Date('2026-07-15T12:00:00+03:00');
    const [window] = engine.buildWindows([{
      date: primary.date, amount: primary.amount, txn: primary,
    }], { asOf });
    const bankTxns = [openingPartner, primary, arrivedPartner];
    const fundingForecast = engine.buildFundingForecast(bankTxns, signatures, { asOf });
    const cycle = engine.buildCycle({
      bankTxns,
      cards: [],
      window,
      asOf,
      salarySignature: signatures[0],
      salarySignatures: signatures,
      fundingForecast,
    });

    expect(cycle.income.salary.items.map((item) => item.id)).toEqual([42]);
    expect(cycle.forwardReset.expectedIncoming).toBe(17000);
    expect(cycle.forwardReset.completionDate).toBe('2026-07-10');
    expect(cycle.forwardReset.stages.filter((stage) => stage.kind === 'income')).toEqual([
      expect.objectContaining({ label: 'state salary', amount: 17000, status: 'late' }),
    ]);
  });

  test('a user override changes interpretation but never literal bank movement', () => {
    const salary = txn(20, 1000, '2026-07-01', 'salary');
    const incoming = txn(21, 100, '2026-07-03', 'own transfer');
    const cycle = engine.buildCycle({
      bankTxns: [salary, incoming],
      cards: [],
      window: {
        start: '2026-07-01',
        end: '2026-08-01',
        running: true,
        salary: { txn: salary, date: salary.date, amount: salary.amount },
      },
      salarySignature: { normalizedDescription: 'salary' },
      salarySignatures: [{ normalizedDescription: 'salary' }],
      transactionOverrides: [{ transactionId: 21, classification: 'transfer' }],
    });

    expect(cycle.income.total).toBe(0);
    expect(cycle.bankMovement).toBe(1100);
    expect(cycle.decisions.find((item) => item.transactionId === 21)).toMatchObject({
      classification: 'transfer',
      included: false,
      automatic: false,
      reason: 'user_override',
    });
  });
});
