const { getCalendarPeriod } = require('./calendarPeriod');

function monthIndex(monthKey) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(monthKey || ''));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return year * 12 + month - 1;
}

/** Offsets for calendar months that contain ledger facts; current month is always available. */
function computeAvailablePeriodOffsets(monthKeys, now = new Date(), maxLookback = 24) {
  const currentIndex = monthIndex(getCalendarPeriod(0, now).month);
  const offsets = new Set([0]);

  for (const monthKey of monthKeys || []) {
    const index = monthIndex(monthKey);
    if (index === null) continue;
    const offset = index - currentIndex;
    if (offset <= 0 && offset >= -Math.abs(maxLookback)) offsets.add(offset);
  }

  return [...offsets].sort((a, b) => b - a);
}

module.exports = { computeAvailablePeriodOffsets, monthIndex };
