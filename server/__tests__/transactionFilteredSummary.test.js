jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../utils/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }));

const db = require('../config/db');
const { Transaction } = require('../models/Transaction');

describe('Transaction.getFilteredSummary', () => {
  beforeEach(() => {
    db.query.mockReset();
    db.query.mockResolvedValue({
      rows: [{ count: 4, total_income: '1000.00', total_expenses: '280.00' }],
    });
  });

  it('excludes itemized credit-card rows from the unscoped cash-flow summary', async () => {
    const result = await Transaction.getFilteredSummary(7, {
      creditCardSources: ['max', 'visa_cal', 'isracard', 'amex'],
    });

    const [sql, values] = db.query.mock.calls[0];
    expect(sql).toContain('t.bank_source = ANY($2::text[])');
    expect(sql).toContain('COUNT(*)::int AS count');
    expect(sql).toMatch(/SUM\(amount\) FILTER \(WHERE type = 'expense' AND \(t\.bank_source IS NULL/);
    expect(sql).not.toMatch(/WHERE t\.user_id = \$1 AND t\.deleted_at IS NULL AND \(t\.bank_source IS NULL/);
    expect(values).toEqual([7, ['max', 'visa_cal', 'isracard', 'amex']]);
    expect(result).toEqual({ count: 4, totalIncome: 1000, totalExpenses: 280 });
  });

  it('keeps card activity in totals when that card source is selected explicitly', async () => {
    await Transaction.getFilteredSummary(7, {
      bankSource: 'max',
      creditCardSources: ['max', 'visa_cal', 'isracard', 'amex'],
    });

    const [sql, values] = db.query.mock.calls[0];
    expect(sql).toContain('t.bank_source = $2');
    expect(sql).not.toContain('ANY(');
    expect(values).toEqual([7, 'max']);
  });
});
