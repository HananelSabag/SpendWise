import { describe, expect, it } from 'vitest';

import { formatCycleDay } from '../cycleDate';

describe('formatCycleDay', () => {
  it('formats an engine date without shifting its calendar day', () => {
    expect(formatCycleDay('2026-07-10', 'en')).toBe('10 Jul');
  });

  it('uses the Hebrew locale when requested', () => {
    expect(formatCycleDay('2026-07-10', 'he')).toContain('10');
    expect(formatCycleDay('2026-07-10', 'he')).not.toContain('2026-07-10');
  });

  it('keeps an invalid provider value visible for diagnosis', () => {
    expect(formatCycleDay('not-a-date', 'en')).toBe('not-a-date');
  });
});
