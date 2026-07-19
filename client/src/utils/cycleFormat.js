/**
 * Presentation helpers shared across the financial-cycle UI.
 *
 * These existed as three or four near-identical private copies (`signed`, `formatWindow`,
 * `SOURCE_NAME`) that had already drifted apart — one `formatWindow` used en-GB, another en-US;
 * one brand map knew Leumi, another did not. Centralising them keeps the dashboard card and the
 * cycle page reading the same window and the same brand names, and gives every amount one correct
 * signed format.
 */

// U+2212 MINUS SIGN, not an ASCII hyphen: the sign belongs before the currency symbol
// (−₪1,234), never stranded between the symbol and the digits (₪-1,234) the way a raw
// formatCurrency(-1234) renders it.
const MINUS = '−';

/**
 * Format a value that carries meaning in its sign.
 * Negatives always read "−₪X". Positives read "₪X" by default, or "+₪X" when `signPositive`
 * is set — used for in/out flow rows where the leading + is informative. Zero is unsigned.
 */
export function signedCurrency(value, formatCurrency, { signPositive = false } = {}) {
  const amount = Number(value) || 0;
  const magnitude = formatCurrency(Math.abs(amount));
  if (amount < 0) return `${MINUS}${magnitude}`;
  if (amount > 0 && signPositive) return `+${magnitude}`;
  return magnitude;
}

/**
 * A readable salary-to-salary window. The end is exclusive, so a closed cycle shows its real last
 * day (end − 1) while a running cycle keeps the projected next-salary date. The year is shown only
 * when the window straddles two of them, so a same-year window stays short ("9 Jul – 9 Aug").
 */
export function formatCycleWindow(window, language = 'en') {
  if (!window?.start || !window?.end) return '';
  const start = new Date(`${window.start}T12:00:00`);
  const end = new Date(`${window.end}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
  if (!window.running) end.setDate(end.getDate() - 1);
  const formatter = new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: start.getFullYear() === end.getFullYear() ? undefined : 'numeric',
  });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

// Short, loud card brands — the number is the information, the logo is quiet.
const CARD_SHORT_NAME = { max: 'MAX', visa_cal: 'CAL', isracard: 'Isracard', amex: 'Amex', leumi: 'Leumi' };

/** Brand short code for a card/bank source ("MAX", "CAL"), falling back to the upper-cased source. */
export function cardShortName(source) {
  return CARD_SHORT_NAME[source] || String(source || '').toUpperCase();
}

/** Never expose more than the last four digits of an account number. */
export function last4(value) {
  return String(value || '').slice(-4);
}
