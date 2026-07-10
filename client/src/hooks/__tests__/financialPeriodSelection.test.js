import { describe, expect, it } from 'vitest';

import { clampPeriodOffset } from '../useFinancialPeriodSelection';

describe('financial-period selection bounds', () => {
  it('supports current and the previous 24 cycles only', () => {
    expect(clampPeriodOffset(0)).toBe(0);
    expect(clampPeriodOffset(-1)).toBe(-1);
    expect(clampPeriodOffset(-24)).toBe(-24);
    expect(clampPeriodOffset(-25)).toBe(-24);
    expect(clampPeriodOffset(1)).toBe(0);
    expect(clampPeriodOffset('not-a-period')).toBe(0);
  });
});

