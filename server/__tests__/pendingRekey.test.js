/**
 * Pending-to-settled repair.
 *
 * When a hold settles, the provider re-reports it as a new row. If we fail to recognise the
 * predecessor the ledger keeps both — a pending copy and its settled twin — and the user's
 * spending is silently overstated. These tests pin the two ways that recognition broke on real
 * data, and the one case where being too eager would destroy a genuine transaction.
 */

const {
  calendarKey,
  dateDistance,
  rawIdentifierOf,
  identifierVanished,
  couldMatchPendingRekey,
} = require('../services/bankSyncService');

/** The real Leumi withdrawal: pending id 416173003 came back settled as 160717. */
const leumiPending = {
  id: 14315,
  bank_account_number: '797-43483_78',
  amount: '500.00',
  type: 'expense',
  description: 'משיכה עם קוד י',
  date: '2026-07-16',
  bank_sync_id: 'leumi:797-43483_78:2026-07-16:e500.00:416173003',
  bank_status: 'pending',
};
const leumiSettled = {
  accountNumber: '797-43483_78',
  amount: 500,
  type: 'expense',
  description: 'משיכה עם קוד י',
  date: '2026-07-16',
  bankSyncId: 'leumi:797-43483_78:2026-07-16:e500.00:160717',
  rawIdentifier: '160717',
};

/** The real Max hold: cards publish no identifier until the charge is final. */
const maxPending = {
  id: 7754,
  bank_account_number: '2254',
  amount: '825.00',
  type: 'expense',
  description: 'BIT',
  date: '2026-07-12',
  bank_sync_id: null,
  bank_status: 'pending',
  amount_is_estimated: false,
  original_amount: '825.00',
  original_currency: 'ILS',
};
const maxSettled = {
  accountNumber: '2254',
  amount: 825,
  type: 'expense',
  description: 'BIT',
  date: '2026-07-12',
  bankSyncId: 'max:2254:74350156194007087996700',
  rawIdentifier: '74350156194007087996700',
  originalAmount: 825,
  originalCurrency: 'ILS',
};

const scrapeWithout = (...ids) => ({ identifiers: new Set(ids), earliest: '2026-04-01' });

describe('calendarKey / dateDistance', () => {
  test('reads a pg DATE without losing the day to the local offset', () => {
    // node-postgres returns DATE columns as a Date at LOCAL midnight. Going through
    // toISOString() here would report the previous day for any UTC+N machine.
    const pgDate = new Date(2026, 6, 12);
    expect(calendarKey(pgDate)).toBe('2026-07-12');
    expect(calendarKey('2026-07-12')).toBe('2026-07-12');
    expect(calendarKey('2026-07-12T09:24:59.000Z')).toBe('2026-07-12');
    expect(calendarKey(null)).toBeNull();
    expect(calendarKey(new Date('nonsense'))).toBeNull();
  });

  test('a pg Date and a scraper string are the same day, not infinitely apart', () => {
    // This is the regression that silently disabled the entire repair path: String(pgDate)
    // sliced to "Sun Jul 12", Date.parse rejected it, and every candidate scored Infinity.
    expect(dateDistance(new Date(2026, 6, 12), '2026-07-12')).toBe(0);
    expect(dateDistance(new Date(2026, 6, 14), '2026-07-12')).toBe(2);
    expect(dateDistance(new Date(2026, 6, 12), '2026-07-12')).toBeLessThanOrEqual(3);
  });
});

describe('identifierVanished', () => {
  test('true once the bank stops listing the old id', () => {
    expect(identifierVanished(leumiPending, scrapeWithout('160717'))).toBe(true);
  });

  test('false while the bank still lists it — that row is simply still pending', () => {
    expect(identifierVanished(leumiPending, scrapeWithout('416173003', '160717'))).toBe(false);
  });

  test('false for a row older than the scrape reached — absent means unlooked-at, not settled', () => {
    expect(identifierVanished(leumiPending, { identifiers: new Set(['160717']), earliest: '2026-08-01' })).toBe(false);
  });

  test('rawIdentifierOf reads the provider id back out of a composite sync id', () => {
    expect(rawIdentifierOf('leumi:797-43483_78:2026-07-16:e500.00:416173003')).toBe('416173003');
    expect(rawIdentifierOf('max:2254:74350156194007087996700')).toBe('74350156194007087996700');
    expect(rawIdentifierOf(null)).toBeNull();
  });
});

describe('couldMatchPendingRekey', () => {
  test('matches a card hold, which carries no identifier at all', () => {
    expect(couldMatchPendingRekey(maxPending, maxSettled, true, null)).toBe(true);
  });

  test('matches a card hold read straight from pg, where date is a Date object', () => {
    // The exact shape pendingInventory used to return, and the exact reason the repair never ran.
    const fromPg = { ...maxPending, date: new Date(2026, 6, 12) };
    expect(couldMatchPendingRekey(fromPg, maxSettled, true, null)).toBe(true);
  });

  test('matches a bank re-key that shares no suffix, once the old id is gone', () => {
    // 416173003 -> 160717: suffix matching cannot see this, only the vanished id can.
    expect(couldMatchPendingRekey(leumiPending, leumiSettled, false, scrapeWithout('160717'))).toBe(true);
  });

  test('still matches the classic suffix re-key (45061616 -> 61616)', () => {
    const pending = { ...leumiPending, bank_sync_id: 'leumi:797-43483_78:2026-07-16:e500.00:45061616' };
    const settled = { ...leumiSettled, bankSyncId: 'leumi:x:61616', rawIdentifier: '61616' };
    expect(couldMatchPendingRekey(pending, settled, false, null)).toBe(true);
  });

  test('NEVER swallows a second genuine withdrawal of the same amount on the same day', () => {
    // Two real ₪500 withdrawals: the bank keeps listing both ids, so the pending one has not
    // vanished and must not be treated as the other one's predecessor.
    const bothStillListed = scrapeWithout('416173003', '160717');
    expect(couldMatchPendingRekey(leumiPending, leumiSettled, false, bothStillListed)).toBe(false);
  });

  test('rejects a different amount, description, account or direction', () => {
    const scrape = scrapeWithout('160717');
    expect(couldMatchPendingRekey({ ...leumiPending, amount: '400.00' }, leumiSettled, false, scrape)).toBe(false);
    expect(couldMatchPendingRekey({ ...leumiPending, description: 'משהו אחר' }, leumiSettled, false, scrape)).toBe(false);
    expect(couldMatchPendingRekey({ ...leumiPending, bank_account_number: 'other' }, leumiSettled, false, scrape)).toBe(false);
    expect(couldMatchPendingRekey({ ...leumiPending, type: 'income' }, leumiSettled, false, scrape)).toBe(false);
  });

  test('rejects a settlement more than three days from the hold', () => {
    const scrape = scrapeWithout('160717');
    expect(couldMatchPendingRekey({ ...leumiPending, date: '2026-07-01' }, leumiSettled, false, scrape)).toBe(false);
  });

  test('never repairs an already-settled row', () => {
    const settledRow = { ...leumiPending, bank_status: 'completed' };
    expect(couldMatchPendingRekey(settledRow, leumiSettled, false, scrapeWithout('160717'))).toBe(false);
  });
});
