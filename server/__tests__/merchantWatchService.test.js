jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const { createWatch, parseAmount } = require('../services/merchantWatchService');

describe('merchant watch rules', () => {
  beforeEach(() => db.query.mockReset());

  test('all-transaction rules do not carry an amount', () => {
    expect(parseAmount(500, 'all')).toBeNull();
  });

  test('threshold amounts are positive and rounded', () => {
    expect(parseAmount('500.129', 'above')).toBe(500.13);
    expect(() => parseAmount(0, 'exact')).toThrow(/amount must be between/);
  });

  test('creates a rule from an owned ledger transaction and normalizes its description', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 42, description: '  BIT   PAYMENT  ', amount: '500.00' }] })
      .mockResolvedValueOnce({ rows: [{ id: 7, display_merchant: 'BIT   PAYMENT', condition: 'exact', amount: '500.00' }] });

    const saved = await createWatch(3, { transactionId: 42, condition: 'exact' });

    expect(saved.id).toBe(7);
    expect(db.query.mock.calls[1][1]).toEqual([3, 'BIT   PAYMENT', 'bit payment', 'exact', 500, 42]);
  });

  test('cannot create a rule from another users transaction', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(createWatch(3, { transactionId: 99 })).rejects.toMatchObject({ statusCode: 404 });
  });
});

