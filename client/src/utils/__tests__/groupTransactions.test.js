import { describe, it, expect } from 'vitest';
import { groupTransactionsByDate } from '../groupTransactions';

const makeTransaction = (overrides = {}) => ({
  id: Math.random(),
  amount: '100',
  type: 'expense',
  description: 'Test',
  date: new Date().toISOString().split('T')[0], // today
  category: null,
  ...overrides
});

describe('groupTransactionsByDate', () => {
  it('returns empty object for empty array', () => {
    expect(groupTransactionsByDate([])).toEqual({});
  });

  it('returns empty object for null input', () => {
    expect(groupTransactionsByDate(null)).toEqual({});
  });

  it('returns empty object for non-array input', () => {
    expect(groupTransactionsByDate('bad')).toEqual({});
  });

  it('groups a single transaction into correct month', () => {
    const tx = makeTransaction({ date: '2025-03-15' });
    const result = groupTransactionsByDate([tx]);
    expect(result['2025-03']).toBeDefined();
    expect(result['2025-03'].count).toBe(1);
  });

  it('groups transactions from same month together', () => {
    const txs = [
      makeTransaction({ date: '2025-03-10' }),
      makeTransaction({ date: '2025-03-20' }),
      makeTransaction({ date: '2025-03-01' })
    ];
    const result = groupTransactionsByDate(txs);
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['2025-03'].count).toBe(3);
  });

  it('separates transactions into different months', () => {
    const txs = [
      makeTransaction({ date: '2025-03-15' }),
      makeTransaction({ date: '2025-02-10' }),
      makeTransaction({ date: '2024-12-01' })
    ];
    const result = groupTransactionsByDate(txs);
    expect(Object.keys(result)).toHaveLength(3);
    expect(result['2025-03']).toBeDefined();
    expect(result['2025-02']).toBeDefined();
    expect(result['2024-12']).toBeDefined();
  });

  it('accumulates income totals correctly', () => {
    const txs = [
      makeTransaction({ date: '2025-03-15', amount: '200', type: 'income' }),
      makeTransaction({ date: '2025-03-16', amount: '300', type: 'income' })
    ];
    const result = groupTransactionsByDate(txs);
    expect(result['2025-03'].totalIncome).toBe(500);
    expect(result['2025-03'].totalExpenses).toBe(0);
  });

  it('accumulates expense totals correctly', () => {
    const txs = [
      makeTransaction({ date: '2025-03-15', amount: '50', type: 'expense' }),
      makeTransaction({ date: '2025-03-16', amount: '75', type: 'expense' })
    ];
    const result = groupTransactionsByDate(txs);
    expect(result['2025-03'].totalExpenses).toBe(125);
    expect(result['2025-03'].totalIncome).toBe(0);
  });

  it('groups same-day transactions into same day bucket', () => {
    const txs = [
      makeTransaction({ id: 1, date: '2025-03-15' }),
      makeTransaction({ id: 2, date: '2025-03-15' }),
      makeTransaction({ id: 3, date: '2025-03-16' })
    ];
    const result = groupTransactionsByDate(txs);
    const dayKeys = Object.keys(result['2025-03'].days);
    expect(dayKeys).toHaveLength(2);
    const march15 = Object.values(result['2025-03'].days).find(d => d.count === 2);
    expect(march15).toBeDefined();
    expect(march15.count).toBe(2);
  });

  it('sorts transactions newest-first within months', () => {
    const txs = [
      makeTransaction({ id: 1, date: '2025-03-01' }),
      makeTransaction({ id: 2, date: '2025-03-20' }),
      makeTransaction({ id: 3, date: '2025-03-10' })
    ];
    const result = groupTransactionsByDate(txs);
    const days = Object.values(result['2025-03'].days);
    // First day group should be the most recent date
    expect(days[0].date >= days[1].date).toBe(true);
  });

  it('works correctly when merging multiple pages of transactions', () => {
    // Simulates load-more: page 1 is month A, page 2 is month A + B
    const page1 = [
      makeTransaction({ date: '2025-03-20' }),
      makeTransaction({ date: '2025-03-15' })
    ];
    const page2 = [
      makeTransaction({ date: '2025-03-05' }),
      makeTransaction({ date: '2025-02-28' })
    ];
    const allTransactions = [...page1, ...page2];
    const result = groupTransactionsByDate(allTransactions);

    expect(result['2025-03'].count).toBe(3);
    expect(result['2025-02'].count).toBe(1);
  });
});
