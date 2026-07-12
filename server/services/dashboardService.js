/**
 * Dashboard Service — factual calendar activity plus current account/card facts.
 * Financial-cycle analysis intentionally lives in cycleRunwayService.
 */

const db = require('../config/db');
const { Transaction } = require('../models/Transaction');
const { INSTITUTIONS, institutionKind } = require('../config/institutions');
const { getCalendarPeriod } = require('../utils/calendarPeriod');
const { computeAvailablePeriodOffsets } = require('../utils/calendarPeriodAvailability');
const { buildCalendarActivity } = require('./calendarActivityService');
const { buildDashboardClassifierWidgets } = require('./dashboardClassifierWidgetsService');

async function buildDashboardData(userId, requestedOffset = 0) {
  const period = getCalendarPeriod(requestedOffset);
  const { start, end } = period;

  const [
    calendarActivity,
    classifierWidgets,
    recentTransactions,
    balancesResult,
    perAccountResult,
    availableMonths,
  ] = await Promise.all([
    buildCalendarActivity(userId, period.offset),
    buildDashboardClassifierWidgets(userId, start, end),
    Transaction.getRecentForPeriod(userId, start, end, 10),
    db.query(`
      SELECT bank_source,
             SUM(balance) FILTER (WHERE balance IS NOT NULL) AS balance,
             bool_or(balance IS NOT NULL) AS has_balance,
             MAX(last_synced_at) AS last_synced_at
        FROM bank_accounts
       WHERE user_id = $1 AND enabled = true
       GROUP BY bank_source
    `, [userId]),
    db.query(`
      SELECT ba.bank_source, ba.account_number, ba.account_type, ba.balance,
             ba.enabled, ba.last_synced_at,
             COALESCE(activity.income, 0) AS income,
             COALESCE(activity.expenses, 0) AS expenses,
             COALESCE(activity.count, 0)::int AS count,
             activity.last_transaction_at
        FROM bank_accounts ba
        LEFT JOIN (
          SELECT bank_source, COALESCE(bank_account_number, '') AS account_number,
                 COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS income,
                 COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expenses,
                 COUNT(*) AS count, MAX(date) AS last_transaction_at
            FROM transactions
           WHERE user_id = $1 AND deleted_at IS NULL AND bank_source IS NOT NULL
             AND date >= $2 AND date < $3
           GROUP BY bank_source, COALESCE(bank_account_number, '')
        ) activity
          ON activity.bank_source = ba.bank_source
         AND activity.account_number = ba.account_number
       WHERE ba.user_id = $1
       ORDER BY ba.bank_source, ba.account_number
    `, [userId, start, end]),
    Transaction.getAvailableMonths(userId, 36),
  ]);

  const activityBySource = Object.fromEntries(
    classifierWidgets.sourceActivity.map((row) => [row.bank_source, row]),
  );
  const accountFacts = Object.fromEntries(
    balancesResult.rows.map((row) => [row.bank_source, {
      balance: row.has_balance ? Number(row.balance) : null,
      hasBalance: row.has_balance === true,
      lastSyncedAt: row.last_synced_at || null,
    }]),
  );
  const accountsBySource = {};
  for (const row of perAccountResult.rows) {
    const isBank = institutionKind(row.bank_source) === 'bank';
    (accountsBySource[row.bank_source] ??= []).push({
      accountNumber: row.account_number,
      accountType: row.account_type,
      enabled: row.enabled,
      balance: isBank && row.balance != null ? Number(row.balance) : null,
      income: Number(row.income) || 0,
      expenses: Number(row.expenses) || 0,
      count: Number(row.count) || 0,
      lastTransactionAt: row.last_transaction_at || null,
      lastSyncedAt: row.last_synced_at || null,
    });
  }

  const sourceKeys = new Set([
    ...Object.keys(accountFacts),
    ...Object.keys(accountsBySource),
    ...Object.keys(activityBySource),
  ]);
  const sources = [...sourceKeys].map((key) => {
    const kind = institutionKind(key);
    const activity = activityBySource[key] || {};
    const account = accountFacts[key] || {};
    const isBank = kind === 'bank';
    return {
      bankSource: key,
      kind,
      label: INSTITUTIONS[key]?.label || key,
      income: Number(activity.income) || 0,
      expenses: Number(activity.expenses) || 0,
      count: Number(activity.count) || 0,
      balance: isBank && account.hasBalance ? account.balance : null,
      hasBalance: isBank ? account.hasBalance === true : false,
      lastSyncedAt: account.lastSyncedAt || null,
      accounts: accountsBySource[key] || [],
    };
  }).sort((a, b) => b.expenses - a.expenses);

  const availableOffsets = computeAvailablePeriodOffsets(availableMonths);
  const summary = {
    total_transactions: calendarActivity.transactionCount,
    total_income: calendarActivity.income.total,
    total_expenses: calendarActivity.spending.committed,
    net_balance: calendarActivity.net.committed,
  };

  return {
    period: {
      ...calendarActivity.period,
      minOffset: Math.min(...availableOffsets),
      availableOffsets,
    },
    summary,
    calendarActivity,
    categoryBreakdown: calendarActivity.breakdown,
    bankCosts: classifierWidgets.bankCosts,
    recurringPatterns: classifierWidgets.recurringPatterns,
    sources,
    recent_transactions: recentTransactions,
    metadata: { generated_at: new Date().toISOString(), model: 'calendar_activity_v1' },
  };
}

module.exports = { buildDashboardData };
