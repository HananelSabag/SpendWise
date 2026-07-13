const {
  ingestAccounts,
  calendarDateInTz,
  normalizeProcessedDate,
  normalizeBankStatus,
  normalizeOptionalAmount,
  normalizeCurrency,
  normalizePositiveInteger,
  buildPayloadFxRates,
  estimatePendingFx,
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

  test('estimates a zero-valued foreign pending authorization in ILS', () => {
    const payloadRates = buildPayloadFxRates([{
      account_number: '4297',
      txns: [
        { charged_amount: -78.04, charged_currency: 'ILS', original_amount: -25.9, original_currency: 'USD' },
        { charged_amount: -212.63, charged_currency: 'ILS', original_amount: -69.68, original_currency: 'USD' },
      ],
    }]);
    const representativeRates = new Map([['USD', {
      rate: 3.025, source: 'boi_representative', asOf: '2026-07-13T12:22:03Z',
    }]]);
    expect(estimatePendingFx({
      charged_amount: 0,
      original_amount: -12.91,
      original_currency: 'USD',
      status: 'pending',
    }, '4297', representativeRates, payloadRates)).toEqual({
      chargedAmount: -39.05,
      rate: 3.025,
      source: 'boi_representative',
      asOf: '2026-07-13T12:22:03Z',
    });
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
    const [payload] = JSON.parse(upsert.params[1]);
    expect(payload.date).toBe('2026-07-09');
    expect(payload.transaction_datetime).toBe('2026-07-08T21:00:00.000Z');
    expect(payload.notes).toBe('Monthly salary');
    expect(payload).toMatchObject({
      original_amount: 120,
      original_currency: 'USD',
      charged_currency: 'ILS',
      txn_kind: 'installments',
      installment_number: 5,
      installment_total: 10,
      amount_is_estimated: false,
      fx_rate_used: null,
      fx_rate_source: null,
      fx_rate_as_of: null,
    });
    expect(upsert.sql).toContain('amount               = EXCLUDED.amount');
    expect(upsert.sql).toContain('date                 = EXCLUDED.date');
    expect(upsert.sql).toContain('transaction_datetime = EXCLUDED.transaction_datetime');
    expect(upsert.sql).toContain('installment_number   = COALESCE');
  });

  test('a uniquely matched settled bank re-key updates the pending row instead of inserting', async () => {
    const calls = [];
    const client = {
      query: jest.fn(async (sql, params) => {
        calls.push({ sql, params });
        if (sql.includes('SELECT account_number FROM bank_accounts')) return { rows: [] };
        if (sql.includes('pending lifecycle inventory')) return { rows: [{
          id: 2470, bank_account_number: '1234', amount: 387.29, type: 'expense',
          description: 'Debit purchase', date: '2026-07-02',
          bank_sync_id: 'leumi:1234:old:61616', bank_status: 'pending',
        }] };
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
        if (sql.includes('pending lifecycle inventory')) return { rows: [{
          id: 10, bank_account_number: '1234', amount: 25, type: 'expense',
          description: 'Ambiguous movement', date: '2026-07-02',
          bank_sync_id: 'leumi:1234:old:123', bank_status: 'pending',
        }] };
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
      .flatMap(({ params }) => JSON.parse(params[1]).map((payload) => payload.bank_sync_id));
    expect(ids).toEqual([
      'leumi:797-43483_78:2026-07-10:e1086.44:43483',
      'leumi:797-43483_78:2026-07-12:e1046.45:43483',
    ]);
    expect(new Set(ids).size).toBe(2);
    expect(calls.filter(({ sql }) => sql.includes('promote legacy pending bank id'))).toHaveLength(0);
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
      .flatMap(({ params }) => JSON.parse(params[1]).map((payload) => payload.bank_sync_id));
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
        if (sql.includes('pending lifecycle inventory')) return { rows: [{
          id: 900, bank_account_number: '2254', amount: 384.95, type: 'expense',
          description: 'Pending purchase', date: '2026-07-12',
          bank_sync_id: null, bank_status: 'pending', amount_is_estimated: false,
          original_amount: null, original_currency: null,
        }] };
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
    expect(candidate.params).toEqual([
      1, 'max', '2254', 384.95, 'expense', 'Pending purchase', '2026-07-12',
      'max:2254:final-123', null, null,
    ]);
    const repair = calls.find(({ sql }) => sql.includes('UPDATE transactions SET'));
    expect(repair.params[0]).toBe(900);
    expect(repair.params[1]).toBe('max:2254:final-123');
    expect(repair.params[10]).toBe('completed');
    expect(result).toEqual({ inserted: 0, skipped: 1 });
  });

  test('batches hundreds of identified provider rows into bounded database calls', async () => {
    const client = {
      query: jest.fn(async (sql, params) => {
        if (sql.includes('SELECT account_number FROM bank_accounts')) return { rows: [] };
        if (sql.includes('pending lifecycle inventory')) return { rows: [] };
        if (sql.includes('batch identified transaction upsert')) {
          return { rows: JSON.parse(params[1]).map(() => ({ was_inserted: true })) };
        }
        return { rows: [] };
      }),
    };
    const txns = Array.from({ length: 300 }, (_, index) => ({
      charged_amount: -(index + 1),
      date: '2026-07-12T09:00:00.000Z',
      description: `Purchase ${index + 1}`,
      status: 'completed',
      identifier: `provider-${index + 1}`,
    }));

    await expect(ingestAccounts(client, 1, 'max', [{ account_number: '2254', txns }]))
      .resolves.toEqual({ inserted: 300, skipped: 0 });
    expect(client.query.mock.calls.filter(([sql]) => sql.includes('batch identified transaction upsert')))
      .toHaveLength(2);
    expect(client.query).toHaveBeenCalledTimes(5);
  });
});
