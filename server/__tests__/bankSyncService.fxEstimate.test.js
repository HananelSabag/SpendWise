jest.mock('../services/exchangeRateService', () => ({
  getRepresentativeRates: jest.fn(async () => new Map([['USD', {
    rate: 3.025,
    source: 'boi_representative',
    asOf: '2026-07-13T12:22:03Z',
  }]])),
}));

const { ingestAccounts } = require('../services/bankSyncService');

describe('bank sync pending FX estimates', () => {
  test('persists a transparent ILS estimate instead of skipping the pending row', async () => {
    const calls = [];
    const client = {
      query: jest.fn(async (sql, params) => {
        calls.push({ sql, params });
        if (sql.includes('SELECT account_number FROM bank_accounts')) return { rows: [] };
        if (sql.includes('SELECT id, bank_processed_date')) return { rows: [] };
        return { rows: [] };
      }),
    };

    const result = await ingestAccounts(client, 34, 'max', [{
      account_number: '4297',
      txns: [{
        charged_amount: 0,
        original_amount: -12.91,
        original_currency: 'USD',
        date: '2026-07-12T19:52:12.000Z',
        description: 'aliexpress',
        status: 'pending',
      }],
    }]);

    const insert = calls.find(({ sql }) => sql.includes('INSERT INTO transactions\n'));
    expect(insert.params).toEqual(expect.arrayContaining([
      39.05, 'expense', 'aliexpress', 12.91, 'USD', 'ILS', true,
      3.025, 'boi_representative', '2026-07-13T12:22:03Z',
    ]));
    expect(insert.sql).toContain('amount_is_estimated');
    expect(result).toEqual({ inserted: 1, skipped: 0 });
  });
});

