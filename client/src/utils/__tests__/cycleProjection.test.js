import { describe, expect, it } from 'vitest';

import { getCycleProjection } from '../cycleProjection';

describe('getCycleProjection', () => {
  it('keeps known-only conservative and includes expected income only in forecast', () => {
    const result = getCycleProjection({
      knownCardOut: 6000,
      knownFixedOut: 1000,
      estimatedCardOut: 7000,
      estimatedFixedOut: 1500,
      expectedIncoming: 12000,
      knownNetChange: -7000,
      estimatedNetChange: 3500,
    }, 5000);

    expect(result.afterKnown).toBe(-2000);
    expect(result.forecast).toBe(8500);
    expect(result.expectedIncome).toBe(12000);
    expect(result.forecastExtraOut).toBe(1500);
  });

  it('falls back to the visible inputs when an older API omits net fields', () => {
    const result = getCycleProjection({
      knownCardOut: 100,
      fixedOut: 50,
      estimatedCardOut: 120,
      estimatedFixedOut: 70,
      expectedIncoming: 500,
    }, 1000);

    expect(result.afterKnown).toBe(850);
    expect(result.forecast).toBe(1310);
  });

  it('derives the result from visible inputs when cached net fields are stale', () => {
    const result = getCycleProjection({
      knownCardOut: 6929.28,
      knownFixedOut: 1086.44,
      estimatedCardOut: 8661.60,
      estimatedFixedOut: 2331.31,
      expectedIncoming: 13327.75,
      knownNetChange: -1,
      estimatedNetChange: -8015.72,
    }, 5680.30);

    expect(result.afterKnown).toBeCloseTo(-2335.42);
    expect(result.forecast).toBeCloseTo(8015.14);
  });
});
