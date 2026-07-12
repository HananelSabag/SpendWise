import { describe, expect, it } from 'vitest';
import { getForeignExchangeMetadata } from '../financialMetadata';

describe('getForeignExchangeMetadata', () => {
  it('explains captured provider FX facts without inventing a market rate', () => {
    expect(getForeignExchangeMetadata({
      amount: 61.72,
      original_amount: 20,
      original_currency: 'usd',
      charged_currency: 'ils',
    })).toEqual({
      originalAmount: 20,
      originalCurrency: 'USD',
      chargedAmount: 61.72,
      chargedCurrency: 'ILS',
      effectiveRate: 3.086,
    });
  });

  it('stays hidden for same-currency or incomplete metadata', () => {
    expect(getForeignExchangeMetadata({ amount: 50, original_amount: 50, original_currency: 'ILS', charged_currency: 'ILS' })).toBeNull();
    expect(getForeignExchangeMetadata({ amount: 50, original_currency: 'USD' })).toBeNull();
  });
});
