import { describe, expect, it } from 'vitest';
import { formatFinancialPeriod } from '../financialPeriod';

describe('formatFinancialPeriod', () => {
  it('uses the final inclusive day for a closed half-open period', () => {
    expect(formatFinancialPeriod({
      start: '2026-06-01', end: '2026-07-01', isCurrent: false,
    }, 'en')).toBe('Jun 1 – Jun 30');
  });

  it('returns an empty label for incomplete periods', () => {
    expect(formatFinancialPeriod({ start: '2026-06-01' }, 'en')).toBe('');
  });

  it('ends the current calendar range on today in Israel', () => {
    expect(formatFinancialPeriod({
      start: '2026-07-01', end: '2026-08-01', isCurrent: true,
    }, 'en', new Date('2026-07-12T21:30:00Z'))).toBe('Jul 1 – Jul 13');
  });
});
