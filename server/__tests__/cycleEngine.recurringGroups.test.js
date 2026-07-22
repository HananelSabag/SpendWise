const { deriveManualRecurring } = require('../services/cycleEngine');

describe('manual recurring groups', () => {
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
