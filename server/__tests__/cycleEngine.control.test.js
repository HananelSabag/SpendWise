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

  test('a linked secondary salary is labelled salary without becoming the cycle anchor', () => {
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

    expect(cycle.income.salary.total).toBe(15000);
    expect(cycle.income.other.total).toBe(189);
    expect(cycle.decisions.find((item) => item.transactionId === 10)).toMatchObject({
      classification: 'salary',
      included: false,
      reason: 'opening_salary_previous_cycle',
    });
    expect(cycle.decisions.find((item) => item.transactionId === 11)).toMatchObject({
      classification: 'salary',
      included: true,
      reason: 'linked_secondary_salary',
    });
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
