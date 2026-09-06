import { describe, expect, it } from 'vitest';

import { getCycleProjection, getCycleUpcoming } from '../cycleProjection';

describe('getCycleProjection', () => {
  it('keeps an unavailable balance unknown and falls back from nullable estimates', () => {
    expect(getCycleProjection(null, null).afterKnown).toBeNull();
    const result = getCycleProjection(
      { knownCardOut: 100, knownFixedOut: 50, estimatedCardOut: null, estimatedFixedOut: null },
      1000,
    );
    expect(result.afterKnown).toBe(850);
    expect(result.forecast).toBe(850);
  });
  it('keeps known-only conservative and includes expected income only in forecast', () => {
    const result = getCycleProjection(
      {
        knownCardOut: 6000,
        knownFixedOut: 1000,
        estimatedCardOut: 7000,
        estimatedFixedOut: 1500,
        expectedIncoming: 12000,
        knownNetChange: -7000,
        estimatedNetChange: 3500,
      },
      5000,
    );

    expect(result.afterKnown).toBe(-2000);
    expect(result.forecast).toBe(8500);
    expect(result.expectedIncome).toBe(12000);
    expect(result.forecastExtraOut).toBe(1500);
  });

  it('falls back to the visible inputs when an older API omits net fields', () => {
    const result = getCycleProjection(
      {
        knownCardOut: 100,
        fixedOut: 50,
        estimatedCardOut: 120,
        estimatedFixedOut: 70,
        expectedIncoming: 500,
      },
      1000,
    );

    expect(result.afterKnown).toBe(850);
    expect(result.forecast).toBe(1310);
  });

  it('derives the result from visible inputs when cached net fields are stale', () => {
    const result = getCycleProjection(
      {
        knownCardOut: 6929.28,
        knownFixedOut: 1086.44,
        estimatedCardOut: 8661.6,
        estimatedFixedOut: 2331.31,
        expectedIncoming: 13327.75,
        knownNetChange: -1,
        estimatedNetChange: -8015.72,
      },
      5680.3,
    );

    expect(result.afterKnown).toBeCloseTo(-2335.42);
    expect(result.forecast).toBeCloseTo(8015.14);
  });
});

describe('getCycleUpcoming', () => {
  const reset = {
    completionDate: '2026-09-10',
    knownCardOut: 200,
    estimatedCardOut: 250.01,
    knownFixedOut: 30,
    estimatedFixedOut: 40,
    expectedIncoming: 1000,
    stages: [
      {
        kind: 'card',
        date: '2026-09-10',
        amount: -200,
        estimatedAmount: -250,
        certainty: 'estimated',
      },
      { kind: 'recurring', date: '2026-09-08', amount: -30, certainty: 'known' },
      { kind: 'recurring', date: '2026-09-09', amount: -10, certainty: 'estimated' },
      { kind: 'income', date: '2026-09-07', amount: 1000, certainty: 'known' },
    ],
  };

  it.each([false, true])(
    'makes the visible timeline equal the headline equation (forecast=%s)',
    (forecast) => {
      const rows = getCycleUpcoming(reset, forecast);
      const projection = getCycleProjection(reset, 500);
      expect(rows.reduce((sum, row) => sum + row.amount, 0)).toBeCloseTo(
        forecast ? projection.estimatedNetChange : projection.knownNetChange,
        2,
      );
      expect(rows.map((row) => row.date)).toEqual(rows.map((row) => row.date).sort());
      if (!forecast) expect(rows.every((row) => !row.estimated && row.amount < 0)).toBe(true);
      else expect(rows.find((row) => row.kind === 'card_recurring').amount).toBe(-0.01);
    },
  );

  it('shows a known provider refund even with expected income switched off', () => {
    const refund = { kind: 'card', date: '2026-09-10', amount: 100, estimatedAmount: 100 };
    expect(getCycleUpcoming({ stages: [refund] }, false)).toEqual([
      { ...refund, key: 'stage-0', estimated: false },
    ]);
  });
});
