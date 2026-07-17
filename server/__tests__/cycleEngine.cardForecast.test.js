const { estimateNextCardBills, SETTLEMENT_MODES } = require('../services/cycleEngine');

function cardView({ mode = SETTLEMENT_MODES.AGGREGATED, futureTotal = -300 } = {}) {
  return {
    source: 'max',
    accountNumber: '2254',
    view: {
      settlement: { mode },
      statementDay: { certain: mode === SETTLEMENT_MODES.AGGREGATED, day: 10 },
      events: [
        { class: 'statement', chargeDate: '2026-06-10', total: -1000, count: 10, partial: false },
        { class: 'statement', chargeDate: '2026-07-10', total: -1200, count: 12, partial: false },
        {
          class: 'statement', chargeDate: '2026-08-10', total: futureTotal, count: 3,
          partial: false, future: true,
          txns: [{ id: 'future-1', amount: futureTotal, date: '2026-07-15' }],
        },
      ],
    },
  };
}

describe('next card-bill forecast', () => {
  test('uses recent complete statements until the future bill has fully accumulated', () => {
    const result = estimateNextCardBills([cardView()], {
      afterDate: '2026-08-09',
      asOf: new Date('2026-07-17T12:00:00+03:00'),
    });

    expect(result.bills).toEqual([expect.objectContaining({
      source: 'max',
      accountNumber: '2254',
      chargeDate: '2026-08-10',
      knownAmount: 300,
      knownTxns: [{ id: 'future-1', amount: -300, date: '2026-07-15' }],
      historicalAverage: 1100,
      historyCount: 2,
      estimatedAmount: 1100,
      certainty: 'estimated',
    })]);
    expect(result.estimatedTotal).toBe(1100);
  });

  test('never forecasts less than charges already assigned to the next bill', () => {
    const result = estimateNextCardBills([cardView({ futureTotal: -1400 })], {
      afterDate: '2026-08-09',
      asOf: new Date('2026-07-17T12:00:00+03:00'),
    });

    expect(result.bills[0]).toEqual(expect.objectContaining({
      knownAmount: 1400,
      estimatedAmount: 1400,
      certainty: 'known',
    }));
  });

  test('does not invent a monthly statement for a passthrough debit card', () => {
    const result = estimateNextCardBills([cardView({ mode: SETTLEMENT_MODES.PASSTHROUGH })], {
      afterDate: '2026-08-09',
      asOf: new Date('2026-07-17T12:00:00+03:00'),
    });

    expect(result.bills).toEqual([]);
    expect(result.estimatedTotal).toBe(0);
  });
});
