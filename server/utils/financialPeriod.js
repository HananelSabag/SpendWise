/**
 * Financial period helper — computes the user's real financial month from
 * their `billing_cycle_day` (e.g. the 10th, matching salary day) instead of
 * a rolling `CURRENT_DATE - INTERVAL 'N days'` window. A rolling window
 * drifts a little further every time it's queried and has no relationship
 * to when the user actually gets paid or when major charges land — this
 * gives a fixed, stable period boundary instead.
 *
 * @module utils/financialPeriod
 */

function lastDayOfMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

// Builds a Date for (year, monthIndex, day), clamping day to the last real
// day of that month — e.g. cycleDay=31 in a February period → Feb 28/29.
function clampDate(year, monthIndex, day) {
  const last = lastDayOfMonth(year, monthIndex);
  return new Date(year, monthIndex, Math.min(day, last));
}

/**
 * The financial period containing `date`, for a user whose month starts on
 * `cycleDay`. Returns a half-open range [start, end) — end is the next
 * occurrence of cycleDay, exclusive.
 */
function getPeriodContaining(cycleDay, date) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();

  const start = d >= cycleDay
    ? clampDate(y, m, cycleDay)
    : clampDate(y, m - 1, cycleDay);

  const end = clampDate(start.getFullYear(), start.getMonth() + 1, cycleDay);

  return { start, end };
}

/** The current financial period for `today` (defaults to now). */
function getCurrentPeriod(cycleDay, today = new Date()) {
  return getPeriodContaining(cycleDay, today);
}

function toSqlDate(date) {
  return date.toISOString().split('T')[0];
}

module.exports = { getCurrentPeriod, getPeriodContaining, toSqlDate };
