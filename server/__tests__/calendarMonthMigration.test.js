const fs = require('fs');
const path = require('path');

const foundation = fs.readFileSync(
  path.join(__dirname, '..', 'DB Migrations', '21_calendar_month_accounting.sql'),
  'utf8',
);
const removal = fs.readFileSync(
  path.join(__dirname, '..', 'DB Migrations', '22_remove_billing_cycle_day.sql'),
  'utf8',
);
const monthlyService = fs.readFileSync(
  path.join(__dirname, '..', 'services', 'monthlyAccountingService.js'),
  'utf8',
);
const { getCalendarPeriod } = require('../utils/calendarPeriod');

describe('calendar-month accounting migrations', () => {
  test('creates salary signatures without mutating transaction facts', () => {
    expect(foundation).toContain('CREATE TABLE IF NOT EXISTS salary_signatures');
    expect(foundation).toContain('month_offset SMALLINT NOT NULL DEFAULT -1');
    expect(foundation).toContain('CREATE TABLE IF NOT EXISTS transaction_month_overrides');
    expect(foundation).not.toMatch(/UPDATE\s+transactions/i);
  });

  test('removes the obsolete cycle day in a separate final migration', () => {
    expect(removal).toMatch(/ALTER TABLE users DROP COLUMN IF EXISTS billing_cycle_day/i);
  });

  test('calendar boundaries and daily divisor are stable', () => {
    const current = getCalendarPeriod(0, new Date('2026-07-11T12:00:00+03:00'));
    const previous = getCalendarPeriod(-1, new Date('2026-07-11T12:00:00+03:00'));
    expect(current).toMatchObject({ start: '2026-07-01', end: '2026-08-01', daysElapsed: 11 });
    expect(previous).toMatchObject({ start: '2026-06-01', end: '2026-07-01', daysElapsed: 30 });
  });

  test('never estimates salary or net', () => {
    expect(monthlyService).not.toMatch(/salary_estimate|estimatedIncome|net:\s*\{[^}]*estimated/);
    expect(monthlyService).toContain('actualIncome - committed');
  });
});
