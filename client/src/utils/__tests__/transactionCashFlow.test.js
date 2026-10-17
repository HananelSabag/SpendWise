import { describe, expect, it } from 'vitest';

import {
  summarizeTransactionCashFlow,
  transactionTotalsContribution,
} from '../transactionCashFlow';

describe('transaction cash-flow totals', () => {
  it('counts bank and manual rows while excluding itemized credit-card rows', () => {
    const result = summarizeTransactionCashFlow([
      { type: 'income', amount: '1000', bank_source: 'leumi' },
      { type: 'expense', amount: '250', bank_source: 'leumi' },
      { type: 'expense', amount: '30', bank_source: null },
      { type: 'expense', amount: '200', bank_source: 'max' },
    ]);

    expect(result).toEqual({ totalIncome: 1000, totalExpenses: 280 });
  });

  it('includes itemized card activity when a credit-card source is selected', () => {
    const result = summarizeTransactionCashFlow([
      { type: 'expense', amount: '200', bank_source: 'max' },
      { type: 'income', amount: '25', bank_source: 'max' },
    ], { includeCreditCardActivity: true });

    expect(result).toEqual({ totalIncome: 25, totalExpenses: 200 });
  });

  it('turns invalid amounts into a zero contribution instead of NaN', () => {
    expect(transactionTotalsContribution({ type: 'expense', amount: 'not-a-number' }))
      .toEqual({ income: 0, expenses: 0 });
  });
});
