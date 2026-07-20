import { describe, expect, it } from 'vitest';

import { resolveSelectedCycle } from '../InsightsPage';

describe('resolveSelectedCycle', () => {
  it('falls back to the rebuilt running window when a settings change invalidates the old start', () => {
    const rebuilt = [
      { window: { start: '2026-06-10', running: false } },
      { window: { start: '2026-07-10', running: true } },
    ];

    expect(resolveSelectedCycle(rebuilt, '2026-07-09')).toBe(rebuilt[1]);
  });

  it('keeps an explicitly selected window while it still exists', () => {
    const cycles = [
      { window: { start: '2026-06-10', running: false } },
      { window: { start: '2026-07-10', running: true } },
    ];

    expect(resolveSelectedCycle(cycles, '2026-06-10')).toBe(cycles[0]);
  });
});
