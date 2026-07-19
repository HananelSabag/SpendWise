jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const engine = require('../services/cycleEngine');
const {
  loadCreditClassifications,
  loadTransactionOverrides,
  saveCreditClassification,
  saveTransactionOverride,
  deleteTransactionOverride,
} = require('../services/cycleService');

describe('credit classifications', () => {
  beforeEach(() => db.query.mockReset());

  test('loads persisted answers using our transaction id', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ transaction_id: 42, class: 'financing', reason: 'matches_recent_bill' }],
    });

    await expect(loadCreditClassifications(7)).resolves.toEqual([{
      transactionId: 42,
      class: 'financing',
      reason: 'matches_recent_bill',
    }]);
    expect(db.query.mock.calls[0][1]).toEqual([7]);
  });

  test('upserts only a live settled bank credit owned by the authenticated user', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{
        transaction_id: 42,
        class: 'income',
        reason: 'matches_recent_bill',
        updated_at: '2026-07-17T08:00:00.000Z',
      }],
    });

    const saved = await saveCreditClassification(7, 42, 'income', 'matches_recent_bill');

    expect(saved).toMatchObject({ transactionId: 42, class: 'income' });
    expect(db.query.mock.calls[0][1]).toEqual([42, 7, 'income', 'matches_recent_bill']);
    expect(db.query.mock.calls[0][0]).toContain("t.type = 'income'");
    expect(db.query.mock.calls[0][0]).toContain("COALESCE(t.bank_status, 'completed') = 'completed'");
  });

  test('returns null when the transaction is not an owned eligible credit', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(saveCreditClassification(7, 99, 'financing')).resolves.toBeNull();
  });

  test('loads and saves auditable cycle overrides without mutating the transaction', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{
          transaction_id: 42,
          classification: 'refund',
          reason: 'user_control',
          updated_at: '2026-07-19T08:00:00.000Z',
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          transaction_id: 42,
          classification: 'refund',
          reason: 'user_control',
          updated_at: '2026-07-19T08:00:00.000Z',
        }],
      })
      .mockResolvedValueOnce({ rowCount: 1 });

    await expect(loadTransactionOverrides(7)).resolves.toEqual([{
      transactionId: 42,
      classification: 'refund',
      reason: 'user_control',
      updatedAt: '2026-07-19T08:00:00.000Z',
    }]);
    await expect(saveTransactionOverride(7, 42, 'refund', 'user_control')).resolves.toMatchObject({
      transactionId: 42,
      classification: 'refund',
    });
    await expect(deleteTransactionOverride(7, 42)).resolves.toBe(true);
    expect(db.query.mock.calls[1][0]).toContain('cycle_transaction_overrides');
    expect(db.query.mock.calls[1][0]).not.toContain('UPDATE transactions');
  });

  test('the engine applies the answer to the exact transaction, not every reused identifier', () => {
    const bankTxns = [
      { id: 1, amount: 1000, date: '2026-07-09', processedDate: '2026-07-09', status: 'completed', description: 'salary', identifier: 'salary' },
      { id: 2, amount: 100, date: '2026-07-10', processedDate: '2026-07-10', status: 'completed', description: 'credit A', identifier: 'reused' },
      { id: 3, amount: 50, date: '2026-07-11', processedDate: '2026-07-11', status: 'completed', description: 'credit B', identifier: 'reused' },
    ];
    const cycle = engine.buildCycle({
      bankTxns,
      cards: [],
      window: { start: '2026-07-09', end: '2026-08-09', running: false },
      salarySignature: { normalizedDescription: 'salary' },
      creditClassifications: [{ transactionId: 2, class: 'financing' }],
    });

    // The salary at the opening boundary belongs to the previous cycle; the unclassified
    // second credit is the only current income.
    expect(cycle.income.total).toBe(50);
    expect(cycle.financing.total).toBe(100);
    expect(cycle.bankMovement).toBe(1150);
  });
});
