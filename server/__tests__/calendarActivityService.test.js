const { buildCalendarActivityFromData } = require('../services/calendarActivityService');

const row = (overrides = {}) => ({
  id: 1,
  bank_source: 'leumi',
  bank_account_number: 'bank',
  amount: 100,
  type: 'expense',
  description: 'ordinary bank payment',
  date: '2026-07-09',
  bank_status: 'completed',
  ...overrides,
});

const data = (rows) => ({
  rows,
  salarySignatures: [{
    id: 1,
    bank_source: 'leumi',
    bank_account_number: 'bank',
    normalized_description: 'salary',
    month_offset: -1,
  }],
  connectedCardSources: ['max'],
  debitScopeRows: [],
  transactionOverrides: [],
});

describe('calendar activity facts', () => {
  test('keeps salary in the month it actually reached the bank', () => {
    const result = buildCalendarActivityFromData(data([
      row({ id: 1, type: 'income', description: 'SALARY', amount: 13327.75, date: '2026-07-09' }),
      row({ id: 2, amount: 250, date: '2026-07-10' }),
    ]), 0, new Date('2026-07-12T12:00:00Z'));
    expect(result.income).toEqual({ total: 13327.75, salary: 13327.75, other: 0 });
    expect(result.spending.committed).toBe(250);
    expect(result.net.committed).toBe(13077.75);
  });

  test('shows transfers as activity without treating them as earned income or spend', () => {
    const result = buildCalendarActivityFromData(data([
      row({ id: 1, type: 'income', amount: 500, ledger_class: 'internal_transfer' }),
      row({ id: 2, type: 'expense', amount: 200, ledger_class: 'internal_transfer' }),
    ]), 0, new Date('2026-07-12T12:00:00Z'));
    expect(result.income.total).toBe(0);
    expect(result.spending.committed).toBe(0);
    expect(result.events.transfers).toEqual({ incoming: 500, outgoing: 200, count: 2 });
  });

  test('does not present card settlements as user transfers', () => {
    const result = buildCalendarActivityFromData(data([
      row({ id: 1, amount: 12000, description: 'לאומי ויזה', bank_sync_id: 'leumi:x:2254' }),
      row({ id: 2, amount: 50, bank_source: 'max', bank_account_number: '2254', description: 'merchant' }),
    ]), 0, new Date('2026-07-12T12:00:00Z'));
    expect(result.events.transfers).toEqual({ incoming: 0, outgoing: 0, count: 0 });
    expect(result.spending.committed).toBe(50);
  });
});
