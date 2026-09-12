const engine = require('../services/cycleEngine');
const txn = (amount, date, extra = {}) => ({
  amount, date, processedDate: date, identifier: 'shared', source: 'leumi',
  accountNumber: '1111', description: 'Synthetic', ...extra,
});
const forecast = (recurring) => engine.projectUpcoming({
  recurring, window: { start: '2026-09-01', end: '2026-10-01' },
  asOf: new Date('2026-08-31T12:00:00+03:00'),
});

test.each([{ source: 'yahav' }, { accountNumber: '2222' }])('does not manufacture a loan across accounts: %j', (other) => {
  const rows = [txn(10000, '2026-07-01'), txn(-500, '2026-08-01', other)];
  const prepared = engine.prepareCycleData({ bankTxns: rows });
  expect(prepared.loans).toEqual([]);
  expect(prepared.financingTxns.size).toBe(0);
});

test('isolates two real loans with the same provider identifier', () => {
  const rows = [txn(10000, '2026-07-01'), txn(-500, '2026-08-01'),
    txn(30000, '2026-07-01', { accountNumber: '2222' }), txn(-1000, '2026-08-01', { accountNumber: '2222' })];
  const loans = engine.deriveLoans(rows);
  expect(loans.map(loan => loan.outstanding)).toEqual([29000, 9500]);
  expect(new Set(loans.map(loan => loan.identity)).size).toBe(2);
});

test('a known loan does not suppress an unrelated recurring charge in another bank', () => {
  const prepared = engine.prepareCycleData({ bankTxns: [
    txn(10000, '2026-07-01'), txn(-500, '2026-08-01'),
    txn(-100, '2026-07-10', { source: 'yahav' }), txn(-100, '2026-08-10', { source: 'yahav' }),
  ] });
  expect(prepared.loans).toHaveLength(1);
  expect(prepared.recurring).toEqual([expect.objectContaining({ source: 'yahav', typicalAmount: 100 })]);
});

test('pausing one account does not pause another account with the same identifier', () => {
  const a = txn(-100, '2026-07-10', { id: 1 });
  const prepared = engine.prepareCycleData({ bankTxns: [a, txn(-100, '2026-08-10', { id: 2 }),
    txn(-300, '2026-07-10', { id: 3, accountNumber: '2222' }), txn(-300, '2026-08-10', { id: 4, accountNumber: '2222' })],
  transactionOverrides: [{ ...a, transactionId: 1, recurrenceKind: 'insurance', recurrenceEnabled: true, recurrenceIncludeEstimate: false }] });
  expect(prepared.recurring).toEqual([expect.objectContaining({ accountNumber: '2222', typicalAmount: 300 })]);
});

test.each([['2026-07-01', '2026-08-01'], ['2026-07-01', '2026-07-01']])('an outgoing payment and its return do not prove a loan (%s, %s)', (out, returned) => {
  expect(engine.deriveLoans([txn(-1000, out), txn(1000, returned)])).toEqual([]);
});

test.each([false, true])('separate monthly rhythms keep their own amounts (confirmed=%s)', (confirmed) => {
  const rows = [txn(-100, '2026-07-01'), txn(-300, '2026-07-10'), txn(-100, '2026-08-01'), txn(-300, '2026-08-10')];
  const recurring = confirmed ? engine.deriveManualRecurring(rows, [{
    ...rows[0], recurrenceEnabled: true, recurrenceKind: 'insurance', recurrenceIncludeEstimate: true,
  }]) : engine.deriveRecurringCharges(rows);
  expect(forecast(recurring).items.map(({ date, amount }) => ({ date, amount })))
    .toEqual([{ date: '2026-09-01', amount: -100 }, { date: '2026-09-10', amount: -300 }]);
});

test('pending authorizations do not change the amount of a confirmed recurring payment', () => {
  const rows = [txn(-100, '2026-07-10'), txn(-100, '2026-08-10'), txn(-900, '2026-09-10', { status: 'pending' })];
  const rules = engine.deriveManualRecurring(rows, [{ ...rows[0], recurrenceEnabled: true, recurrenceKind: 'insurance' }]);
  expect(rules[0]).toMatchObject({ signedAmount: -100, occurrences: 2 });
});
