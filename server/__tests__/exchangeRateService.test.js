const { parseRepresentativeRates } = require('../services/exchangeRateService');

describe('exchange rate service', () => {
  test('normalizes Bank of Israel rates to one original-currency unit', () => {
    const rates = parseRepresentativeRates({ exchangeRates: [
      { key: 'USD', currentExchangeRate: 3.025, unit: 1, lastUpdate: '2026-07-13T12:22:03Z' },
      { key: 'JPY', currentExchangeRate: 1.866, unit: 100, lastUpdate: '2026-07-13T12:22:03Z' },
    ] });
    expect(rates.get('USD')).toMatchObject({ rate: 3.025, source: 'boi_representative' });
    expect(rates.get('JPY').rate).toBeCloseTo(0.01866, 8);
  });
});

