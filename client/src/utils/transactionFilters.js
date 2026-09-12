// API dates are Israeli calendar days, not UTC conversions of local midnight.
const bankingDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit',
});
const dayKey = (year, month, day) => new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);

export function buildTransactionFilters({ filters = {}, search = '', activeTab = 'all' } = {}, now = new Date()) {
  const result = {};
  if (filters.type && filters.type !== 'all') result.type = filters.type;
  if (search || filters.search) result.search = search || filters.search;
  if (filters.source && filters.source !== 'all') {
    result.source = filters.source;
    if (filters.account) result.account = filters.account;
  }
  for (const key of ['amountMin', 'amountMax']) {
    const amount = Number.parseFloat(filters[key]);
    if (Number.isFinite(amount)) result[key] = amount;
  }
  const parts = Object.fromEntries(bankingDate.formatToParts(now).map(({ type, value }) => [type, value]));
  const year = Number(parts.year), month = Number(parts.month), day = Number(parts.day);
  if (activeTab === 'upcoming') {
    result.dateFrom = dayKey(year, month, day + 1);
  } else if (/^\d{4}-(0[1-9]|1[0-2])$/.test(filters.month || '')) {
    const [selectedYear, selectedMonth] = filters.month.split('-').map(Number);
    result.dateFrom = dayKey(selectedYear, selectedMonth, 1);
    result.dateTo = dayKey(selectedYear, selectedMonth + 1, 0);
  } else {
    result.dateTo = dayKey(year, month + 1, 0);
  }
  return result;
}
