const {
  ingestAccounts,
  calendarDateInTz,
  normalizeProcessedDate,
  normalizeBankStatus,
} = require('../services/bankSyncService');

describe('bank sync statement metadata', () => {
  test('keeps an Israeli local-midnight payment on the same calendar day', () => {
    expect(calendarDateInTz(new Date('2026-07-09T21:00:00.000Z'))).toBe('2026-07-10');
  });

  test('normalizes a valid processed date and rejects malformed input', () => {
    expect(normalizeProcessedDate('2026-07-10T00:00:00.000Z')).toBe('2026-07-10');
    expect(normalizeProcessedDate('not-a-date')).toBeNull();
    expect(normalizeProcessedDate(null)).toBeNull();
  });

  test('accepts only scraper-supported transaction statuses', () => {
    expect(normalizeBankStatus('pending')).toBe('pending');
    expect(normalizeBankStatus('completed')).toBe('completed');
    expect(normalizeBankStatus('unknown')).toBeNull();
  });

  test('a deduped Israeli-midnight row repairs its old UTC date and enriches notes', async () => {
    const calls = [];
    const client = {
      query: jest.fn(async (sql, params) => {
        calls.push({ sql, params });
        if (sql.includes('SELECT account_number FROM bank_accounts')) return { rows: [] };
        if (sql.includes('INSERT INTO transactions')) return { rows: [{ was_inserted: false }] };
        return { rows: [] };
      }),
    };

    await ingestAccounts(client, 1, 'leumi', [{
      account_number: '1234',
      type: 'checking',
      balance: 50,
      txns: [{
        charged_amount: 13327.75,
        date: '2026-07-08T21:00:00.000Z',
        processed_date: '2026-07-08T21:00:00.000Z',
        description: 'Salary transfer',
        notes: 'Monthly salary',
        status: 'completed',
        identifier: 'salary-1',
      }],
    }]);

    const upsert = calls.find(({ sql }) => sql.includes('INSERT INTO transactions'));
    expect(upsert.params[4]).toBe('2026-07-09');
    expect(upsert.params[5]).toBe('2026-07-08T21:00:00.000Z');
    expect(upsert.params[12]).toBe('Monthly salary');
    expect(upsert.sql).toContain('amount              = EXCLUDED.amount');
    expect(upsert.sql).toContain('date                = EXCLUDED.date');
    expect(upsert.sql).toContain('transaction_datetime = EXCLUDED.transaction_datetime');
  });
});
