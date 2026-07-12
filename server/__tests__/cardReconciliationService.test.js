const {
  reconcile,
  deriveDebitCardAccounts,
  dateKey,
} = require('../services/cardReconciliationService');

const txn = (overrides = {}) => ({
  id: 1,
  bank_source: 'max',
  bank_account_number: '2254',
  amount: 100,
  type: 'expense',
  description: 'merchant',
  date: '2026-06-20',
  bank_processed_date: '2026-07-10',
  bank_status: 'completed',
  ...overrides,
});

describe('card reconciliation', () => {
  test('normalizes database timestamps in Israel time, not UTC', () => {
    expect(dateKey(new Date('2026-07-09T21:00:00.000Z'))).toBe('2026-07-10');
  });

  test('separates Max monthly statement, immediate batch, unprocessed rows, and pending bank amount', () => {
    const rows = [
      txn({ id: 1, amount: 1000, date: '2026-06-12' }),
      txn({ id: 2, amount: 5000, date: '2026-06-20' }),
      txn({ id: 3, amount: 5746.88, date: '2026-07-08' }),
      txn({ id: 4, amount: 239.8, date: '2026-06-10', bank_processed_date: null }),
      txn({ id: 5, amount: 299.56, date: '2026-06-11', bank_processed_date: null }),
      txn({ id: 6, amount: 230.88, date: '2026-07-04', bank_processed_date: '2026-07-05' }),
      txn({ id: 7, amount: 67.6, date: '2026-07-04', bank_processed_date: '2026-07-05' }),
      txn({ id: 8, amount: 7.76, date: '2026-07-04', bank_processed_date: '2026-07-05' }),
      txn({ id: 100, bank_source: 'leumi', bank_account_number: 'bank', amount: 12744.22,
        description: 'לאומי ויזה', date: '2026-07-10', bank_processed_date: '2026-07-10',
        bank_status: 'pending', bank_sync_id: 'leumi:bank:122254' }),
      txn({ id: 101, bank_source: 'leumi', bank_account_number: 'bank', amount: 306.24,
        description: 'לאומי ויזה', date: '2026-07-05', bank_processed_date: '2026-07-05',
        bank_sync_id: 'leumi:bank:132254' }),
    ];
    const report = reconcile(rows);
    const max = report.cards.find((card) => card.cardAccount === '2254');
    expect(max.statements).toHaveLength(1);
    expect(max.monthly).toMatchObject({
      statementDate: '2026-07-10', itemizedTotal: 11746.88,
      unprocessedCandidateTotal: 539.36, status: 'partial',
    });
    expect(max.immediate).toEqual([expect.objectContaining({
      processedDate: '2026-07-05', bankAmount: 306.24, itemizedAmount: 306.24, status: 'matched',
    })]);
  });

  test('keeps Cal historical settlement unavailable and forming statement separate', () => {
    const rows = [
      txn({ id: 1, bank_source: 'visa_cal', bank_account_number: '9962', amount: 800,
        date: '2026-07-01', bank_processed_date: '2026-07-10' }),
      txn({ id: 2, bank_source: 'visa_cal', bank_account_number: '9962', amount: 900,
        date: '2026-07-05', bank_processed_date: '2026-07-10' }),
      txn({ id: 3, bank_source: 'visa_cal', bank_account_number: '9962', amount: 675.7,
        date: '2026-07-09', bank_processed_date: '2026-07-10' }),
      txn({ id: 4, bank_source: 'visa_cal', bank_account_number: '9962', amount: 700,
        date: '2026-07-10', bank_processed_date: '2026-07-10', bank_status: 'pending' }),
      txn({ id: 100, bank_source: 'leumi', bank_account_number: 'bank', amount: 4734.66,
        description: 'כרטיסי אשראי-י', date: '2026-06-10', bank_processed_date: '2026-06-10',
        bank_sync_id: 'leumi:bank:987654' }),
      txn({ id: 101, bank_source: 'leumi', bank_account_number: 'bank', amount: 2665.2,
        description: 'כרטיסי אשראי-י', date: '2026-07-10', bank_processed_date: '2026-07-10',
        bank_sync_id: 'leumi:bank:8547' }),
    ];
    const cal = reconcile(rows).cards[0];
    expect(cal.pending).toMatchObject({ itemizedPending: 700, count: 1 });
    expect(cal.statements).toEqual([
      expect.objectContaining({
        statementDate: '2026-07-10', status: 'partial',
        pendingCandidateTotal: 700, pendingCandidateCount: 1,
      }),
    ]);
    expect(cal.unmatchedBankSettlements).toEqual([
      expect.objectContaining({ amount: 4734.66, status: 'unavailable' }),
    ]);
    expect(cal.unmatchedItemizedGroups).toEqual([]);
  });

  test('does not mislabel a multi-row immediate batch as the monthly statement', () => {
    const rows = [
      ...[0, 1, 2, 3, 4].map((day, index) => txn({
        id: index + 1, amount: index === 4 ? 94.13 : 50,
        date: `2026-07-0${day + 1}`, bank_processed_date: '2026-07-07',
      })),
      txn({ id: 100, bank_source: 'leumi', bank_account_number: 'bank', amount: 294.13,
        description: 'לאומי ויזה', date: '2026-07-07', bank_processed_date: '2026-07-07',
        bank_sync_id: 'leumi:bank:882254' }),
    ];
    const max = reconcile(rows).cards[0];
    expect(max.statements).toHaveLength(0);
    expect(max.immediate).toEqual([expect.objectContaining({ bankAmount: 294.13, status: 'matched' })]);
  });

  test('debit card is included even with no credit itemized rows and bank-only spend is valid', () => {
    const rows = [
      txn({ id: 1, bank_source: 'max', bank_account_number: '8345', amount: 240.98,
        description: 'ALIEXPRESS', date: '2026-06-03', bank_processed_date: '2026-06-03' }),
      txn({ id: 2, bank_source: 'leumi', bank_account_number: 'bank', amount: 240.98,
        description: 'כרטיס דביט', notes: 'בכרטיס המסתיים ב-8345', date: '2026-06-05' }),
      txn({ id: 3, bank_source: 'leumi', bank_account_number: 'bank', amount: 88,
        description: 'כרטיס דביט', notes: '', date: '2026-06-05' }),
      txn({ id: 4, bank_source: 'leumi', bank_account_number: 'bank', amount: 454,
        description: 'כרטיס דביט', notes: '', date: '2026-07-09',
        bank_status: 'pending' }),
    ];
    expect(deriveDebitCardAccounts(rows)).toEqual([{ source: 'max', account: '8345' }]);
    const debit = reconcile(rows).cards.find((card) => card.cardAccount === '8345');
    expect(debit.isDebitCard).toBe(true);
    expect(debit.debit.matchedPairs).toHaveLength(1);
    expect(debit.debit.bankOnly).toEqual(expect.arrayContaining([
      expect.objectContaining({ amount: 88, pending: false }),
      expect.objectContaining({ amount: 454, pending: true }),
    ]));
    expect(debit.debit.status).toBe('matched');
  });
});
