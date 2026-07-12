function israelDateKey(now) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function formatFinancialPeriod(period, language = 'en', now = new Date()) {
  if (!period?.start || !period?.end) return '';
  const start = new Date(`${period.start}T12:00:00`);
  const end = period.isCurrent
    ? new Date(`${israelDateKey(now)}T12:00:00`)
    : new Date(`${period.end}T12:00:00`);
  if (!period.isCurrent) end.setDate(end.getDate() - 1);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';

  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: start.getFullYear() === end.getFullYear() ? undefined : 'numeric',
  });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export function normalizeAvailablePeriodOffsets(period) {
  const provided = Array.isArray(period?.availableOffsets)
    ? period.availableOffsets.filter((value) => Number.isInteger(value) && value <= 0)
    : [];
  if (provided.length) return [...new Set([0, ...provided])].sort((a, b) => b - a);

  const minOffset = Math.min(0, Number(period?.minOffset ?? 0));
  return Array.from({ length: Math.abs(minOffset) + 1 }, (_, index) => -index);
}

export function nearestAvailablePeriodOffset(requestedOffset, availableOffsets) {
  const requested = Number(requestedOffset) || 0;
  const offsets = [...new Set(availableOffsets || [0])];
  return offsets.sort((a, b) => {
    const distance = Math.abs(a - requested) - Math.abs(b - requested);
    return distance || b - a;
  })[0] ?? 0;
}
