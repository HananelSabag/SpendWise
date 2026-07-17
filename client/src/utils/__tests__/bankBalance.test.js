import { describe, expect, it } from 'vitest';

import { computeBankBalance, projectBalanceAfterNextBills } from '../bankBalance';

describe('computeBankBalance', () => {
  it('sums only enabled bank accounts and excludes credit-card companies', () => {
    const result = computeBankBalance([
      {
        source: 'leumi',
        kind: 'bank',
        last_sync: '2026-07-17T08:00:00Z',
        accounts: [
          { account_number: '111', balance: '1250.50', enabled: true },
          { account_number: '222', balance: 900, enabled: false },
        ],
      },
      {
        source: 'max',
        kind: 'credit_card',
        last_sync: '2026-07-17T09:00:00Z',
        accounts: [{ account_number: '2254', balance: 999999, enabled: true }],
      },
    ]);

    expect(result.bankAccounts).toEqual([
      { source: 'leumi', accountNumber: '111', balance: 1250.5 },
    ]);
    expect(result.totalRealBalance).toBe(1250.5);
    expect(result.lastSync.toISOString()).toBe('2026-07-17T09:00:00.000Z');
  });

  it('keeps unavailable and malformed balances out of the total', () => {
    const result = computeBankBalance([
      {
        source: 'yahav',
        kind: 'bank',
        accounts: [
          { account_number: '333', balance: null, enabled: true },
          { account_number: '444', balance: 'not-a-number', enabled: true },
        ],
      },
    ]);

    expect(result.hasRealBalance).toBe(false);
    expect(result.totalRealBalance).toBe(0);
    expect(result.bankAccounts.every((account) => account.balance === null)).toBe(true);
  });

  it('reports when a displayed total excludes an unavailable account', () => {
    const result = computeBankBalance([
      {
        source: 'leumi',
        kind: 'bank',
        accounts: [
          { account_number: '111', balance: -250, enabled: true },
          { account_number: '222', balance: null, enabled: true },
        ],
      },
    ]);

    expect(result.totalRealBalance).toBe(-250);
    expect(result.someBalancesUnavailable).toBe(true);
    expect(result.multiAccount).toBe(true);
  });
});

describe('projectBalanceAfterNextBills', () => {
  it('uses only future movements and does not subtract an already-settled card bill again', () => {
    const cycle = {
      window: { running: true },
      projection: { upcomingTotal: -1000 },
      nextCardForecast: {
        salaryAmount: 13000,
        knownTotal: 300,
        estimatedTotal: 15000,
        bills: [{ chargeDate: '2026-08-10' }],
      },
    };

    expect(projectBalanceAfterNextBills(5000, cycle)).toBe(2000);
    expect(projectBalanceAfterNextBills(5000, cycle, false)).toBe(16700);
  });

  it('does not show the forward forecast on a completed cycle', () => {
    expect(projectBalanceAfterNextBills(5000, {
      window: { running: false },
      nextCardForecast: { salaryAmount: 13000, estimatedTotal: 12000, bills: [{}] },
    })).toBeNull();
  });
});
