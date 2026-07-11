const TZ = process.env.PERIOD_TIMEZONE || process.env.SYNC_TIMEZONE || 'Asia/Jerusalem';

function getCalendarPeriod(offset = 0, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now).map((part) => [part.type, part.value]));
  const safeOffset = Math.max(-36, Math.min(1, Number(offset) || 0));
  const base = Number(parts.year) * 12 + Number(parts.month) - 1 + safeOffset;
  const year = Math.floor(base / 12);
  const month = ((base % 12) + 12) % 12 + 1;
  const nextBase = base + 1;
  const nextYear = Math.floor(nextBase / 12);
  const nextMonth = ((nextBase % 12) + 12) % 12 + 1;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    start: `${year}-${String(month).padStart(2, '0')}-01`,
    end: `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`,
    isCurrent: safeOffset === 0,
    offset: safeOffset,
    daysInMonth,
    daysElapsed: safeOffset === 0 ? Number(parts.day) : daysInMonth,
  };
}

module.exports = { getCalendarPeriod, TZ };
