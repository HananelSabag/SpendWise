/**
 * Groups a flat array of transactions by month → day.
 * Pure function — no side effects, easily testable.
 *
 * @param {Array} transactions - Flat list of transaction objects
 * @param {Object} options
 * @param {boolean} options.rtl - Use Hebrew locale for date formatting
 * @returns {Object} monthGroups keyed by "YYYY-MM"
 */
export function groupTransactionsByDate(transactions, { rtl = false } = {}) {
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    return {};
  }

  const locale = rtl ? 'he-IL' : 'en-US';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Sort newest first
  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  const monthGroups = {};

  sorted.forEach(transaction => {
    const date = new Date(transaction.date);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthTitle = date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

    if (!monthGroups[monthKey]) {
      monthGroups[monthKey] = {
        title: monthTitle,
        date,
        totalIncome: 0,
        totalExpenses: 0,
        count: 0,
        days: {}
      };
    }

    // Determine day group key
    let dayGroupKey;
    let dayGroupTitle;

    if (dateOnly.getTime() === today.getTime()) {
      dayGroupKey = 'today';
      dayGroupTitle = 'Today';
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      dayGroupKey = 'yesterday';
      dayGroupTitle = 'Yesterday';
    } else {
      dayGroupKey = dateOnly.toDateString();
      dayGroupTitle = date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
    }

    if (!monthGroups[monthKey].days[dayGroupKey]) {
      monthGroups[monthKey].days[dayGroupKey] = {
        title: dayGroupTitle,
        date,
        transactions: [],
        totalIncome: 0,
        totalExpenses: 0,
        count: 0
      };
    }

    const amount = Math.abs(parseFloat(transaction.amount) || 0);
    const isIncome = transaction.type === 'income';

    monthGroups[monthKey].days[dayGroupKey].transactions.push(transaction);
    monthGroups[monthKey].days[dayGroupKey].count += 1;
    monthGroups[monthKey].count += 1;

    if (isIncome) {
      monthGroups[monthKey].days[dayGroupKey].totalIncome += amount;
      monthGroups[monthKey].totalIncome += amount;
    } else {
      monthGroups[monthKey].days[dayGroupKey].totalExpenses += amount;
      monthGroups[monthKey].totalExpenses += amount;
    }
  });

  return monthGroups;
}
