const engine = require('../services/cycleEngine');

const bank = (id, amount, date, description = 'bank') => ({
  id, source: 'yahav', accountNumber: '123', amount, date, processedDate: date,
  status: 'completed', description,
});

const card = (id, amount, date, processedDate) => ({
  id, source: 'isracard', accountNumber: '9999', amount, date, processedDate,
  status: 'completed', description: 'merchant', originalCurrency: 'ILS',
});

describe('cycle reconciliation invariant', () => {
  test('salary signatures remain scoped to the linked bank account', () => {
    const linked = bank(1, 1000, '2026-07-01', 'acme payroll');
    const otherAccount = {
      ...bank(2, 900, '2026-07-01', 'acme payroll'),
      accountNumber: '456',
    };

    expect(engine.findSalaryEvents([linked, otherAccount], {
      normalizedDescription: 'acme payroll',
      bankSource: 'yahav',
      accountNumber: '123',
    }).map((event) => event.txn.id)).toEqual([1]);
  });

  test('a reviewed bonus stays income but no longer inflates the salary line', () => {
    const salary = bank(1, 1000, '2026-07-01', 'acme payroll');
    const bonus = bank(2, 500, '2026-07-02', 'acme payroll bonus');
    const cycle = engine.buildCycle({
      bankTxns: [salary, bonus],
      window: {
        start: '2026-07-01', end: '2026-08-01', running: true,
        salary: { date: '2026-07-01', amount: 1000, txn: salary },
      },
      salarySignature: {
        normalizedDescription: 'acme payroll', bankSource: 'yahav', accountNumber: '123',
      },
      salaryClassifications: [{ transactionId: 2, classification: 'bonus' }],
    });

    expect(cycle.income.salary.total).toBe(1000);
    expect(cycle.income.other.total).toBe(500);
    expect(cycle.income.total).toBe(1500);
  });

  test('an unreconciled card event stays visible but cannot change bank movement', () => {
    const salary = bank(1, 1000, '2026-07-01', 'salary');
    const directExpense = bank(2, -100, '2026-07-03', 'rent');
    const cycle = engine.buildCycle({
      bankTxns: [salary, directExpense],
      cards: [{ source: 'isracard', accountNumber: '9999', txns: [
        // Older statement evidence makes the July event a complete cycle rather than the
        // deliberately excluded first/partial statement in a newly scraped card history.
        card(4, -10, '2026-04-23', '2026-05-12'),
        card(5, -12, '2026-05-23', '2026-06-12'),
        // The purchase itself is in July, so this statement belongs to the July salary cycle.
        card(3, -24.31, '2026-07-11', '2026-07-12'),
      ] }],
      window: {
        start: '2026-07-01', end: '2026-08-01', running: true,
        salary: { date: '2026-07-01', amount: 1000, txn: salary },
      },
      asOf: new Date('2026-07-17T12:00:00+03:00'),
      salarySignature: { normalizedDescription: 'salary' },
    });

    expect(cycle.expenses.total).toBe(100);
    expect(cycle.bankMovement).toBe(900);
    expect(cycle.unreconciledCardEvents).toHaveLength(1);
    expect(cycle.unreconciledCardEvents[0].total).toBe(-24.31);
  });
});
