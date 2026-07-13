const {
  ingestAccounts,
  calendarDateInTz,
  normalizeProcessedDate,
  normalizeBankStatus,
  normalizeOptionalAmount,
  normalizeCurrency,
  normalizePositiveInteger,
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

  test('normalizes provider financial metadata conservatively', () => {
    expect(normalizeOptionalAmount(-20)).toBe(20);
    expect(normalizeOptionalAmount('not-money')).toBeNull();
    expect(normalizeCurrency('₪')).toBe('ILS');
    expect(normalizeCurrency(' usd ')).toBe('USD');
    expect(normalizePositiveInteger(5)).toBe(5);
    expect(normalizePositiveInteger(0)).toBeNull();
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
        original_amount: -120,
        original_currency: 'usd',
        charged_currency: '₪',
        txn_kind: 'installments',
        installment_number: 5,
        installment_total: 10,
      }],
    }]);

    const upsert = calls.find(({ sql }) => sql.includes('INSERT INTO transactions'));
    expect(upsert.params[4]).toBe('2026-07-09');
    expect(upsert.params[5]).toBe('2026-07-08T21:00:00.000Z');
    expect(upsert.params[12]).toBe('Monthly salary');
    expect(upsert.params.slice(13)).toEqual([120, 'USD', 'ILS', 'installments', 5, 10]);
    expect(upsert.sql).toContain('amount              = EXCLUDED.amount');
    expect(upsert.sql).toContain('date                = EXCLUDED.date');
    expect(upsert.sql).toContain('transaction_datetime = EXCLUDED.transaction_datetime');
    expect(upsert.sql).toContain('installment_number  = COALESCE');
  });

  test('a uniquely matched settled bank re-key updates the pending row instead of inserting', async () => {
    const calls = [];
    const client = {
      query: jest.fn(async (sql, params) => {
        calls.push({ sql, params });
        if (sql.includes('SELECT account_number FROM bank_accounts')) return { rows: [] };
        if (sql.includes('pending-to-settled rekey candidate')) return { rows: [{ id: 2470 }] };
        return { rows: [] };
      }),
    };

    const result = await ingestAccounts(client, 1, 'leumi', [{
      account_number: '1234',
      type: 'checking',
      balance: 1000,
      txns: [{
        charged_amount: -387.29,
        date: '2026-07-02T09:00:00.000Z',
        description: 'Debit purchase',
        notes: 'Settled bank movement',
        status: 'completed',
        identifier: '61616',
      }],
    }]);

    const candidate = calls.find(({ sql }) => sql.includes('pending-to-settled rekey candidate'));
    expect(candidate.params.slice(-2)).toEqual(['leumi:1234:2026-07-02:e387.29:61616', '61616']);

    const repair = calls.find(({ sql }) => sql.includes('UPDATE transactions SET'));
    expect(repair.params[0]).toBe(2470);
    expect(repair.params[1]).toBe('leumi:1234:2026-07-02:e387.29:61616');
    expect(repair.params[10]).toBe('completed');
    expect(calls.some(({ sql }) => sql.includes('INSERT INTO transactions\n'))).toBe(false);
    expect(result).toEqual({ inserted: 0, skipped: 1 });
  });

  test('an ambiguous pending re-key match is not repaired automatically', async () => {
    const calls = [];
    const client = {
      query: jest.fn(async (sql, params) => {
        calls.push({ sql, params });
        if (sql.includes('SELECT account_number FROM bank_accounts')) return { rows: [] };
        if (sql.includes('pending-to-settled rekey candidate')) {
          return { rows: [{ id: 10 }, { id: 11 }] };
        }
        if (sql.includes('INSERT INTO transactions')) return { rows: [{ was_inserted: true }] };
        return { rows: [] };
      }),
    };

    const result = await ingestAccounts(client, 1, 'leumi', [{
      account_number: '1234',
      txns: [{
        charged_amount: -25,
        date: '2026-07-02T09:00:00.000Z',
        description: 'Ambiguous movement',
        status: 'completed',
        identifier: '123',
      }],
    }]);

    expect(calls.some(({ sql }) => sql.includes('INSERT INTO transactions'))).toBe(true);
    expect(calls.some(({ sql }) => sql.includes('UPDATE transactions SET'))).toBe(false);
    expect(result).toEqual({ inserted: 1, skipped: 0 });
  });

  test('keeps simultaneous bank pending rows with the same provider identifier distinct', async () => {
    const calls = [];
    const client = {
      query: jest.fn(async (sql, params) => {
        calls.push({ sql, params });
        if (sql.includes('SELECT account_number FROM bank_accounts')) return { rows: [] };
        if (sql.includes('INSERT INTO transactions')) return { rows: [{ was_inserted: true }] };
        return { rows: [] };
      }),
    };

    await ingestAccounts(client, 1, 'leumi', [{
      account_number: '797-43483_78',
      txns: [
        { charged_amount: -1086.44, date: '2026-07-10T12:00:00.000Z',
          description: 'פרעון הלוואה', status: 'pending', identifier: 43483 },
        { charged_amount: -1046.45, date: '2026-07-12T12:00:00.000Z',
          description: 'פרעון הלוואה', status: 'pending', identifier: 43483 },
      ],
    }]);

    const ids = calls.filter(({ sql }) => sql.includes('INSERT INTO transactions'))
      .map(({ params }) => params[7]);
    expect(ids).toEqual([
      'leumi:797-43483_78:2026-07-10:e1086.44:43483',
      'leumi:797-43483_78:2026-07-12:e1046.45:43483',
    ]);
    expect(new Set(ids).size).toBe(2);
    expect(calls.filter(({ sql }) => sql.includes('promote legacy pending bank id'))).toHaveLength(2);
  });

  test('keeps completed bank rows with a reused provider identifier distinct by date', async () => {
    const calls = [];
    const client = {
      query: jest.fn(async (sql, params) => {
        calls.push({ sql, params });
        if (sql.includes('SELECT account_number FROM bank_accounts')) return { rows: [] };
        if (sql.includes('pending-to-settled rekey candidate')) return { rows: [] };
        if (sql.includes('INSERT INTO transactions')) return { rows: [{ was_inserted: true }] };
        return { rows: [] };
      }),
    };

    await ingestAccounts(client, 1, 'leumi', [{
      account_number: '797-43483_78',
      txns: [
        { charged_amount: -76.49, date: '2026-07-09T21:00:00.000Z',
          description: 'First movement', status: 'completed', identifier: 42209 },
        { charged_amount: -70, date: '2026-06-30T21:00:00.000Z',
          description: 'Second movement', status: 'completed', identifier: 42209 },
      ],
    }]);

    const ids = calls.filter(({ sql }) => sql.includes('INSERT INTO transactions'))
      .map(({ params }) => params[7]);
    expect(ids).toEqual([
      'leumi:797-43483_78:2026-07-10:e76.49:42209',
      'leumi:797-43483_78:2026-07-01:e70.00:42209',
    ]);
    expect(new Set(ids).size).toBe(2);
  });

  test('promotes one exact identifier-less card pending row when the completed fact arrives', async () => {
    const calls = [];
    const client = {
      query: jest.fn(async (sql, params) => {
        calls.push({ sql, params });
        if (sql.includes('SELECT account_number FROM bank_accounts')) return { rows: [] };
        if (sql.includes('card pending-to-settled rekey candidate')) return { rows: [{ id: 900 }] };
        return { rows: [] };
      }),
    };

    const result = await ingestAccounts(client, 1, 'max', [{
      account_number: '2254',
      txns: [{
        charged_amount: -384.95,
        date: '2026-07-12T09:00:00.000Z',
        description: 'Pending purchase',
        status: 'completed',
        identifier: 'final-123',
      }],
    }]);

    const candidate = calls.find(({ sql }) => sql.includes('card pending-to-settled rekey candidate'));
    expect(candidate.params).toEqual([1, 'max', '2254', 384.95, 'expense', 'Pending purchase', '2026-07-12', 'max:2254:final-123']);
    const repair = calls.find(({ sql }) => sql.includes('UPDATE transactions SET'));
    expect(repair.params[0]).toBe(900);
    expect(repair.params[1]).toBe('max:2254:final-123');
    expect(repair.params[10]).toBe('completed');
    expect(result).toEqual({ inserted: 0, skipped: 1 });
  });
});
