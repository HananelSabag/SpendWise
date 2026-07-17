/** Format the engine's YYYY-MM-DD dates without letting UTC shift the calendar day. */
export function formatCycleDay(value, language = 'en') {
  if (!value) return '';
  const isoDay = String(value).slice(0, 10);
  const date = new Date(`${isoDay}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export default formatCycleDay;
