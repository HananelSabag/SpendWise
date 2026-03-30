/**
 * recurringService tests
 *
 * Pure function tests (no mocks needed):
 *   calculateRecurringDates, calculateRecurringDatesInRange, calculateUpcomingDates
 *
 * Async function tests (DB + Transaction.create mocked):
 *   generateTransactionsFromTemplate, generateCurrentMonthTransactions,
 *   generateUpcomingTransactions
 */

// ─── Mocks must be declared before any require() ──────────────────────────────
jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../models/Transaction', () => ({
  Transaction: { create: jest.fn() }
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

const db = require('../config/db');
const { Transaction } = require('../models/Transaction');
const {
  calculateRecurringDates,
  calculateRecurringDatesInRange,
  calculateUpcomingDates,
  generateTransactionsFromTemplate,
  generateCurrentMonthTransactions,
  generateUpcomingTransactions
} = require('../services/recurringService');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateStr(d) {
  return d.toISOString().split('T')[0];
}

function makeTemplate(overrides = {}) {
  return {
    id: 1,
    user_id: 10,
    name: 'Test Template',
    description: 'Test',
    amount: 100,
    type: 'expense',
    category_id: 5,
    interval_type: 'monthly',
    day_of_month: 15,
    day_of_week: null,
    start_date: '2024-01-01',
    end_date: null,
    skip_dates: [],
    is_active: true,
    timezone: 'UTC',
    preferred_time: '09:00',
    ...overrides
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateRecurringDates — monthly
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateRecurringDates — monthly', () => {
  it('returns the 15th of each month within a 60-day window', () => {
    const template = makeTemplate({ interval_type: 'monthly', day_of_month: 15 });
    const from = new Date('2024-06-01');
    const dates = calculateRecurringDates(template, from, 60);
    const strs = dates.map(dateStr);
    expect(strs).toContain('2024-06-15');
    expect(strs).toContain('2024-07-15');
    // No date outside the 60-day window
    dates.forEach(d => expect(d <= new Date(from.getTime() + 60 * 86400000)).toBe(true));
  });

  it('respects end_date and does not generate beyond it', () => {
    const template = makeTemplate({ end_date: '2024-06-20' });
    const from = new Date('2024-06-01');
    const dates = calculateRecurringDates(template, from, 60);
    dates.forEach(d => expect(d <= new Date('2024-06-20')).toBe(true));
  });

  it('skips dates in skip_dates', () => {
    const template = makeTemplate({ skip_dates: ['2024-06-15'] });
    const from = new Date('2024-06-01');
    const dates = calculateRecurringDates(template, from, 60);
    const strs = dates.map(dateStr);
    expect(strs).not.toContain('2024-06-15');
  });

  it('returns empty array when start_date is beyond window', () => {
    const template = makeTemplate({ start_date: '2025-01-01' });
    const from = new Date('2024-01-01');
    const dates = calculateRecurringDates(template, from, 30);
    expect(dates).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateRecurringDates — weekly
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateRecurringDates — weekly', () => {
  it('returns only Mondays (day_of_week=1) in a 30-day window', () => {
    const template = makeTemplate({
      interval_type: 'weekly',
      day_of_week: 1, // Monday
      day_of_month: null
    });
    const from = new Date('2024-06-03'); // Monday
    const dates = calculateRecurringDates(template, from, 30);
    dates.forEach(d => expect(d.getDay()).toBe(1));
    expect(dates.length).toBeGreaterThanOrEqual(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateRecurringDates — daily
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateRecurringDates — daily', () => {
  it('returns one date per day for a 7-day window', () => {
    const template = makeTemplate({ interval_type: 'daily', day_of_month: null });
    const from = new Date('2024-06-01');
    const dates = calculateRecurringDates(template, from, 7);
    expect(dates.length).toBe(8); // inclusive: day 0 through day 7
    // Each consecutive pair should differ by 1 day
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] - dates[i - 1]).toBe(86400000);
    }
  });

  it('caps at 101 entries as safety measure (break fires after push)', () => {
    // The guard is `if (dates.length > 100) break` — runs after the push,
    // so the array can hold at most 101 entries before stopping.
    const template = makeTemplate({ interval_type: 'daily', day_of_month: null });
    const from = new Date('2024-01-01');
    const dates = calculateRecurringDates(template, from, 500);
    expect(dates.length).toBeLessThanOrEqual(101);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateRecurringDatesInRange
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateRecurringDatesInRange', () => {
  it('returns the 15th if it falls within the range (monthly)', () => {
    const template = makeTemplate({ interval_type: 'monthly', day_of_month: 15 });
    const start = new Date('2024-06-01');
    const end = new Date('2024-06-30');
    const dates = calculateRecurringDatesInRange(template, start, end);
    const strs = dates.map(dateStr);
    expect(strs).toContain('2024-06-15');
    expect(strs).toHaveLength(1);
  });

  it('returns empty array when day_of_month is outside the range', () => {
    const template = makeTemplate({ interval_type: 'monthly', day_of_month: 28 });
    const start = new Date('2024-06-01');
    const end = new Date('2024-06-20'); // before the 28th
    const dates = calculateRecurringDatesInRange(template, start, end);
    expect(dates).toHaveLength(0);
  });

  it('returns every day in range for daily templates', () => {
    const template = makeTemplate({ interval_type: 'daily', day_of_month: null });
    const start = new Date('2024-06-10');
    const end = new Date('2024-06-12');
    const dates = calculateRecurringDatesInRange(template, start, end);
    expect(dates).toHaveLength(3); // 10, 11, 12
  });

  it('caps at 51 entries as safety measure (break fires after push)', () => {
    // Same pattern: `if (dates.length > 50) break` → max 51 entries.
    const template = makeTemplate({ interval_type: 'daily', day_of_month: null });
    const start = new Date('2024-01-01');
    const end = new Date('2024-06-30');
    const dates = calculateRecurringDatesInRange(template, start, end);
    expect(dates.length).toBeLessThanOrEqual(51);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateUpcomingDates
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateUpcomingDates', () => {
  it('generates monthly occurrences on the correct day', () => {
    const template = makeTemplate({ interval_type: 'monthly', day_of_month: 10 });
    const start = new Date('2024-06-01');
    const end = new Date('2024-09-01');
    const dates = calculateUpcomingDates(template, start, end);
    dates.forEach(d => expect(d.getDate()).toBe(10));
    expect(dates.length).toBeGreaterThanOrEqual(3);
  });

  it('generates weekly occurrences on the correct day of week', () => {
    const template = makeTemplate({
      interval_type: 'weekly',
      day_of_week: 3, // Wednesday
      day_of_month: null
    });
    const start = new Date('2024-06-03'); // Monday
    const end = new Date('2024-07-01');
    const dates = calculateUpcomingDates(template, start, end);
    dates.forEach(d => expect(d.getDay()).toBe(3));
    expect(dates.length).toBeGreaterThanOrEqual(4);
  });

  it('generates daily occurrences', () => {
    const template = makeTemplate({ interval_type: 'daily', day_of_month: null });
    const start = new Date('2024-06-01');
    const end = new Date('2024-06-07');
    const dates = calculateUpcomingDates(template, start, end);
    expect(dates.length).toBe(7);
  });

  it('respects future start_date from template', () => {
    const template = makeTemplate({
      interval_type: 'monthly',
      day_of_month: 1,
      start_date: '2024-08-01' // in the future relative to our window start
    });
    const start = new Date('2024-06-01');
    const end = new Date('2024-09-01');
    const dates = calculateUpcomingDates(template, start, end);
    // No dates before template start_date
    dates.forEach(d => expect(d >= new Date('2024-08-01')).toBe(true));
  });

  it('skips dates in skip_dates', () => {
    const skipDate = '2024-06-10';
    const template = makeTemplate({
      interval_type: 'monthly',
      day_of_month: 10,
      skip_dates: [skipDate]
    });
    const start = new Date('2024-06-01');
    const end = new Date('2024-09-01');
    const dates = calculateUpcomingDates(template, start, end);
    expect(dates.map(dateStr)).not.toContain(skipDate);
  });

  it('returns early (after 1 push) for unknown interval_type', () => {
    // The switch/default branch returns immediately after the first date is pushed.
    // This is an edge case — the DB CHECK constraint prevents invalid interval_type
    // in practice, so this just documents real behavior.
    const template = makeTemplate({ interval_type: 'yearly' });
    const start = new Date('2024-06-01');
    const end = new Date('2024-09-01');
    const dates = calculateUpcomingDates(template, start, end);
    // Exactly 1 date is pushed before default: return
    expect(dates).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateTransactionsFromTemplate (mocked DB + Transaction.create)
// ─────────────────────────────────────────────────────────────────────────────
describe('generateTransactionsFromTemplate', () => {
  it('creates transactions for dates that do not yet exist in DB', async () => {
    const template = makeTemplate({ interval_type: 'daily', day_of_month: null });

    // No existing transactions
    db.query.mockResolvedValue({ rows: [] });
    Transaction.create.mockResolvedValue({ id: 99, type: 'expense', amount: 100 });

    const result = await generateTransactionsFromTemplate(template);

    expect(Transaction.create).toHaveBeenCalled();
    expect(result.length).toBeGreaterThan(0);
  });

  it('skips dates that already have a transaction', async () => {
    const template = makeTemplate({ interval_type: 'daily', day_of_month: null });

    // All dates already exist
    db.query.mockResolvedValue({ rows: [{ id: 1 }] });

    const result = await generateTransactionsFromTemplate(template);

    expect(Transaction.create).not.toHaveBeenCalled();
    expect(result).toHaveLength(0);
  });

  it('throws when DB query fails', async () => {
    const template = makeTemplate({ interval_type: 'daily', day_of_month: null });
    db.query.mockRejectedValue(new Error('DB connection lost'));

    await expect(generateTransactionsFromTemplate(template)).rejects.toThrow('DB connection lost');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateCurrentMonthTransactions (mocked)
// ─────────────────────────────────────────────────────────────────────────────
describe('generateCurrentMonthTransactions', () => {
  it('creates a transaction for the correct day when none exists', async () => {
    const template = makeTemplate({ interval_type: 'monthly', day_of_month: 15 });
    const start = new Date('2024-06-01');
    const end = new Date('2024-06-30');

    db.query.mockResolvedValue({ rows: [] });
    Transaction.create.mockResolvedValue({ id: 55, type: 'expense', amount: 100 });

    const result = await generateCurrentMonthTransactions(template, start, end);

    expect(Transaction.create).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(55);
  });

  it('returns empty array (no throw) when DB fails', async () => {
    const template = makeTemplate({ interval_type: 'monthly', day_of_month: 15 });
    db.query.mockRejectedValue(new Error('timeout'));

    const result = await generateCurrentMonthTransactions(
      template,
      new Date('2024-06-01'),
      new Date('2024-06-30')
    );

    expect(result).toHaveLength(0); // fail-safe: empty, not a throw
  });

  it('skips creation if transaction already exists', async () => {
    const template = makeTemplate({ interval_type: 'monthly', day_of_month: 15 });
    db.query.mockResolvedValue({ rows: [{ id: 10 }] }); // already exists

    const result = await generateCurrentMonthTransactions(
      template,
      new Date('2024-06-01'),
      new Date('2024-06-30')
    );

    expect(Transaction.create).not.toHaveBeenCalled();
    expect(result).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateUpcomingTransactions (mocked)
// ─────────────────────────────────────────────────────────────────────────────
describe('generateUpcomingTransactions', () => {
  it('returns virtual upcoming objects (is_virtual=true) for dates not in DB', async () => {
    const template = makeTemplate({ interval_type: 'monthly', day_of_month: 15 });
    db.query.mockResolvedValue({ rows: [] }); // no existing

    const result = await generateUpcomingTransactions(template);

    expect(result.length).toBeGreaterThan(0);
    result.forEach(t => {
      expect(t.is_virtual).toBe(true);
      expect(t.status).toBe('upcoming');
      expect(typeof t.id).toBe('string');
      expect(t.id).toMatch(/^upcoming_/);
    });
  });

  it('skips dates that already have a real transaction in DB', async () => {
    const template = makeTemplate({ interval_type: 'monthly', day_of_month: 15 });
    db.query.mockResolvedValue({ rows: [{ id: 1 }] }); // all dates exist

    const result = await generateUpcomingTransactions(template);
    expect(result).toHaveLength(0);
  });

  it('returns empty array (no throw) when DB fails', async () => {
    const template = makeTemplate({ interval_type: 'monthly', day_of_month: 15 });
    db.query.mockRejectedValue(new Error('timeout'));

    const result = await generateUpcomingTransactions(template);
    expect(result).toHaveLength(0);
  });

  it('does NOT call Transaction.create (upcoming are virtual, not saved)', async () => {
    const template = makeTemplate({ interval_type: 'monthly', day_of_month: 15 });
    db.query.mockResolvedValue({ rows: [] });

    await generateUpcomingTransactions(template);

    expect(Transaction.create).not.toHaveBeenCalled();
  });
});
