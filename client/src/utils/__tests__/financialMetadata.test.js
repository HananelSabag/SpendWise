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
      estimated: false,
      rateSource: null,
      rateAsOf: null,
    });
  });

  it('keeps temporary pending FX estimates visibly distinct from final issuer amounts', () => {
    expect(getForeignExchangeMetadata({
      amount: 39.05,
      original_amount: 12.91,
      original_currency: 'USD',
      charged_currency: 'ILS',
      amount_is_estimated: true,
      fx_rate_source: 'boi_representative',
      fx_rate_as_of: '2026-07-13T12:00:00.000Z',
    })).toMatchObject({
      estimated: true,
      rateSource: 'boi_representative',
      rateAsOf: '2026-07-13T12:00:00.000Z',
    });
  });

  it('stays hidden for same-currency or incomplete metadata', () => {
    expect(getForeignExchangeMetadata({ amount: 50, original_amount: 50, original_currency: 'ILS', charged_currency: 'ILS' })).toBeNull();
    expect(getForeignExchangeMetadata({ amount: 50, original_currency: 'USD' })).toBeNull();
  });
});
