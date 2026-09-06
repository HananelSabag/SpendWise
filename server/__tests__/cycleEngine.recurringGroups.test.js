const { deriveManualRecurring, projectUpcoming, prepareCycleData } = require('../services/cycleEngine');

describe('manual recurring groups', () => {
  test.each([true, false])('a user-controlled loan rule owns projection without counting its disbursement (enabled=%s)', (enabled) => {
    const bankTxns = [
      { id: 1, source: 'leumi', accountNumber: '1', identifier: 'loan', description: 'Loan', amount: 10000, date: '2026-06-10' },
      { id: 2, source: 'leumi', accountNumber: '1', identifier: 'loan', description: 'Repayment', amount: -500, date: '2026-07-10' },
      { id: 3, source: 'leumi', accountNumber: '1', identifier: 'loan', description: 'Repayment', amount: -500, date: '2026-08-10' },
    ];
    const prepared = prepareCycleData({ bankTxns, cards: [], transactionOverrides: [{
      ...bankTxns[2], transactionId: 3, classification: 'expense', recurrenceKind: 'loan_repayment',
      recurrenceEnabled: true, recurrenceIncludeEstimate: enabled,
    }] });
    expect(prepared.loans).toHaveLength(1);
    expect(prepared.projectedLoans).toEqual([]);
    const projection = projectUpcoming({
      window: { start: '2026-09-01', end: '2026-10-01' }, asOf: new Date('2026-09-01T12:00:00+03:00'),
      loans: prepared.projectedLoans, recurring: prepared.recurring,
    });
    expect(projection.items.map((item) => item.amount)).toEqual(enabled ? [-500] : []);
  });
  test('a changed monthly payment day does not create a second payment rhythm', () => {
    const result = projectUpcoming({
      window: { start: '2026-09-01', end: '2026-10-01' }, asOf: new Date('2026-09-01T12:00:00+03:00'),
      recurring: [{ manuallyConfirmed: true, signedAmount: -100, paymentDay: 17, dates: ['2026-05-14', '2026-06-14', '2026-07-17', '2026-08-17'] }],
    });
    expect(result.items.map((item) => item.date)).toEqual(['2026-09-17']);
  });

  test('preserves two genuinely concurrent monthly payment days', () => {
    const result = projectUpcoming({
      window: { start: '2026-09-01', end: '2026-10-01' }, asOf: new Date('2026-08-31T12:00:00+03:00'),
      recurring: [{ manuallyConfirmed: true, signedAmount: -100, paymentDay: 10, dates: ['2026-07-01', '2026-07-10', '2026-08-01', '2026-08-10'] }],
    });
    expect(result.items.map((item) => item.date)).toEqual(['2026-09-01', '2026-09-10']);
  });
  test('a monthly payment drifting between dates is not projected several times', () => {
    const projection = projectUpcoming({
      window: { start: '2026-09-01', end: '2026-10-01' },
      asOf: new Date('2026-09-01T12:00:00+03:00'),
      recurring: [{ manuallyConfirmed: true, signedAmount: 1500, dates: ['2026-06-14', '2026-07-17', '2026-08-20'], paymentDay: 20 }],
    });
    expect(projection.items).toHaveLength(1);
    expect(projection.items[0]).toMatchObject({ date: '2026-09-20', amount: 1500 });
  });

  test('pausing a confirmed rule also suppresses its automatically detected repeat', () => {
    const bankTxns = ['2026-06-10', '2026-07-10', '2026-08-10'].map((date, index) => ({
      id: index + 1, source: 'leumi', accountNumber: '1234', identifier: 'insurance',
      description: 'Insurance', amount: -100, date, status: 'completed',
    }));
    const prepared = prepareCycleData({ bankTxns, cards: [], transactionOverrides: [{
      ...bankTxns[0], transactionId: 1, classification: 'expense', recurrenceKind: 'insurance',
      recurrenceEnabled: true, recurrenceIncludeEstimate: false,
    }] });
    expect(prepared.recurring).toEqual([]);
  });
  test('links different provider descriptions into one named rule', () => {
    const txns = [
      { id: 1, source: 'leumi', accountNumber: '1', identifier: 'a', description: 'Loan old', amount: -1000, date: '2026-06-11' },
      { id: 2, source: 'leumi', accountNumber: '1', identifier: 'b', description: 'Loan new', amount: -1100, date: '2026-07-11' },
    ];
    const shared = {
      recurrenceEnabled: true,
      recurrenceKind: 'loan_repayment',
      recurrenceGroupId: 'f2e271f6-c928-4f35-8839-23b09943c340',
      recurrenceLabel: 'Family loan',
      recurrenceIncludeEstimate: true,
      source: 'leumi',
      accountNumber: '1',
    };
    const result = deriveManualRecurring(txns, [
      { ...shared, transactionId: 1, identifier: 'a', description: 'Loan old', amount: -1000, date: '2026-06-11' },
      { ...shared, transactionId: 2, identifier: 'b', description: 'Loan new', amount: -1100, date: '2026-07-11' },
    ]);
    expect(result).toEqual([expect.objectContaining({
      description: 'Family loan',
      occurrences: 2,
      typicalAmount: 1050,
      signedAmount: -1050,
      recurrenceGroupId: shared.recurrenceGroupId,
    })]);
  });

  test('keeps a rule visible to management but out of projection when disabled there', () => {
    const result = deriveManualRecurring([], [{
      transactionId: 1,
      source: 'leumi', accountNumber: '1', identifier: 'a', description: 'Optional',
      amount: -50, date: '2026-07-01', recurrenceEnabled: true,
      recurrenceKind: 'recurring_bill', recurrenceIncludeEstimate: false,
    }]);
    expect(result).toEqual([]);
  });
});
