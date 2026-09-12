import { describe, expect, it } from 'vitest';
import { buildTransactionFilters } from '../transactionFilters';

describe('transaction calendar boundaries', () => {
  it.each([['2026-09', '2026-09-30'], ['2024-02', '2024-02-29'], ['2026-12', '2026-12-31']])(
    'keeps both inclusive boundaries of %s', (month, end) => {
      expect(buildTransactionFilters({ filters: { month } })).toEqual({ dateFrom: `${month}-01`, dateTo: end });
    },
  );
  it('uses the Israeli month after midnight, even when UTC is still in the previous month', () => {
    expect(buildTransactionFilters({}, new Date('2026-08-31T22:00:00Z')).dateTo).toBe('2026-09-30');
  });
  it.each([['2026-08-31T22:00:00Z', '2026-09-02'], ['2026-12-31T22:30:00Z', '2027-01-02']])(
    'starts upcoming transactions tomorrow in Israel (%s)', (now, tomorrow) => {
      expect(buildTransactionFilters({ activeTab: 'upcoming' }, new Date(now))).toEqual({ dateFrom: tomorrow });
    },
  );
  it('retains source, account, search and amount filters', () => {
    expect(buildTransactionFilters({ search: 'rent', filters: { type: 'expense', source: 'visa', account: '1234', amountMin: '0', amountMax: '250', month: '2026-09' } }))
      .toMatchObject({ search: 'rent', type: 'expense', source: 'visa', account: '1234', amountMin: 0, amountMax: 250 });
  });
});
