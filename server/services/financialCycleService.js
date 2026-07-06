const db = require('../config/db');
const { getCurrentPeriod, toSqlDate } = require('../utils/financialPeriod');

function normalizeCycleDay(value) {
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= 31 ? day : 1;
}

async function getUserFinancialCycle(userId) {
  const result = await db.query(
    'SELECT billing_cycle_day FROM users WHERE id = $1 AND is_active = true',
    [userId],
    'user_financial_cycle'
  );

  const cycleDay = normalizeCycleDay(result.rows[0]?.billing_cycle_day);
  const { start, end } = getCurrentPeriod(cycleDay);

  return {
    cycleDay,
    cycleDaySet: true,
    start: toSqlDate(start),
    end: toSqlDate(end),
  };
}

module.exports = {
  getUserFinancialCycle,
  normalizeCycleDay,
};
