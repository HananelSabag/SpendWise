const db = require('../config/db');
const { getPeriodForOffset, toSqlDate } = require('../utils/financialPeriod');

function normalizeCycleDay(value) {
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= 31 ? day : 1;
}

function normalizePeriodOffset(value) {
  const offset = Number(value);
  if (!Number.isInteger(offset)) return 0;
  return Math.max(-24, Math.min(0, offset));
}

async function getUserFinancialCycle(userId, requestedOffset = 0) {
  const result = await db.query(
    'SELECT billing_cycle_day FROM users WHERE id = $1 AND is_active = true',
    [userId],
    'user_financial_cycle'
  );

  const cycleDay = normalizeCycleDay(result.rows[0]?.billing_cycle_day);
  const offset = normalizePeriodOffset(requestedOffset);
  const { start, end } = getPeriodForOffset(cycleDay, offset);

  return {
    cycleDay,
    cycleDaySet: true,
    offset,
    isCurrent: offset === 0,
    start: toSqlDate(start),
    end: toSqlDate(end),
  };
}

module.exports = {
  getUserFinancialCycle,
  normalizeCycleDay,
  normalizePeriodOffset,
};
