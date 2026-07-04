/**
 * Financial period helper — the user's real financial month derived from their
 * `billing_cycle_day` (e.g. the 11th, matching salary day) instead of a rolling
 * `CURRENT_DATE - INTERVAL 'N days'` window. Returns a half-open range
 * [start, end) where end is the next occurrence of cycleDay (exclusive).
 *
 * Dates are computed and returned as plain 'YYYY-MM-DD' strings in the app's
 * timezone. The previous version built JS Dates with the LOCAL constructor and
 * then `toISOString()`'d them — which shifted every boundary back a day on any
 * server whose clock isn't UTC (e.g. cycleDay 11 → "June 10"). Working purely
 * in calendar-component/string space removes that whole class of tz bug.
 *
 * @module utils/financialPeriod
 */

const PERIOD_TZ = process.env.PERIOD_TIMEZONE || process.env.SYNC_TIMEZONE || 'Asia/Jerusalem';

// Last calendar day (28–31) of a given month. month1 is 1-based (1 = Jan).
function lastDayOfMonth(year, month1) {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

// 'YYYY-MM-DD' for (year, month1, day), clamping day to the last real day of
// that month — e.g. cycleDay 31 in February → the 28th/29th.
function ymd(year, month1, day) {
  const dd = Math.min(day, lastDayOfMonth(year, month1));
  return `${year}-${String(month1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

// Calendar year/month/day of `date` in the app timezone (not the server's).
function partsInTz(date) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: PERIOD_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date).reduce((acc, x) => { acc[x.type] = x.value; return acc; }, {});
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day) };
}

/**
 * The financial period containing `date`, for a user whose month starts on
 * `cycleDay`. Returns { start, end } as 'YYYY-MM-DD' strings; end is exclusive.
 */
function getPeriodContaining(cycleDay, date) {
  const { y, m, d } = partsInTz(date);

  // If we're before this month's cycle day, the current period started last month.
  let sy = y, sm = m;
  if (d < cycleDay) {
    sm = m - 1;
    if (sm < 1) { sm = 12; sy = y - 1; }
  }

  let ey = sy, em = sm + 1;
  if (em > 12) { em = 1; ey = ey + 1; }

  return { start: ymd(sy, sm, cycleDay), end: ymd(ey, em, cycleDay) };
}

/** The current financial period for `today` (defaults to now). */
function getCurrentPeriod(cycleDay, today = new Date()) {
  return getPeriodContaining(cycleDay, today);
}

// Accepts an already-formatted 'YYYY-MM-DD' string (new path) or a Date (legacy
// callers, e.g. the calendar-month summary) and normalises to a SQL date string.
function toSqlDate(date) {
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

module.exports = { getCurrentPeriod, getPeriodContaining, toSqlDate };
