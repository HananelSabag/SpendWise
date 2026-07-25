import { describe, expect, it } from 'vitest';

import { getOverdraftRunway } from '../overdraftRunway';

describe('getOverdraftRunway', () => {
  it('reports an exact projected breach against the configured facility', () => {
    expect(getOverdraftRunway(-6000, 5000)).toMatchObject({
      remaining: -1000,
      exceededBy: 1000,
      used: 6000,
      usedPercent: 120,
      status: 'exceeded',
    });
  });

  it('warns before the projected balance reaches the facility', () => {
    expect(getOverdraftRunway(-4000, 5000)).toMatchObject({
      remaining: 1000,
      exceededBy: 0,
      usedPercent: 80,
      status: 'warning',
    });
  });

  it('keeps positive balances safely above the facility boundary', () => {
    expect(getOverdraftRunway(2000, 5000)).toMatchObject({
      remaining: 7000,
      used: 0,
      usedPercent: 0,
      status: 'safe',
    });
  });

  it('distinguishes an unconfigured limit from a zero facility', () => {
    expect(getOverdraftRunway(-100, null)).toMatchObject({
      configured: false,
      status: 'unknown',
    });
    expect(getOverdraftRunway(-100, 0)).toMatchObject({
      configured: true,
      exceededBy: 100,
      status: 'exceeded',
    });
  });
});
