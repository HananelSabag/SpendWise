/**
 * Dashboard Service — factual calendar activity plus current account/card facts.
 * Financial-cycle analysis intentionally lives in cycleRunwayService.
 */

const db = require('../config/db');
const { Transaction } = require('../models/Transaction');
const { INSTITUTIONS, institutionKind } = require('../config/institutions');
const { getCalendarPeriod } = require('../utils/calendarPeriod');
const { computeAvailablePeriodOffsets } = require('../utils/calendarPeriodAvailability');

async function buildDashboardData(userId, requestedOffset = 0) {
  const period = getCalendarPeriod(requestedOffset);
  const { start, end } = period;

  const [
    recentTransactions,
    balancesResult,
    perAccountResult,
    availableMonths,
  ] = await Promise.all([
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
  ]);
  const sources = [...sourceKeys].map((key) => {
    const kind = institutionKind(key);
    const accountRows = accountsBySource[key] || [];
    const activeAccountRows = accountRows.filter((row) => row.enabled !== false);
    const account = accountFacts[key] || {};
    const isBank = kind === 'bank';
    return {
      bankSource: key,
      kind,
      label: INSTITUTIONS[key]?.label || key,
      income: roundAccounts(activeAccountRows, 'income'),
      expenses: roundAccounts(activeAccountRows, 'expenses'),
      count: activeAccountRows.reduce((sum, row) => sum + row.count, 0),
      balance: isBank && account.hasBalance ? account.balance : null,
      hasBalance: isBank ? account.hasBalance === true : false,
      lastSyncedAt: account.lastSyncedAt || null,
      accounts: accountRows,
    };
  }).sort((a, b) => b.expenses - a.expenses);

  const availableOffsets = computeAvailablePeriodOffsets(availableMonths);
  const totalIncome = roundAccounts(sources, 'income');
  const totalExpenses = roundAccounts(sources, 'expenses');
  const summary = {
    total_transactions: sources.reduce((sum, source) => sum + source.count, 0),
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_balance: Math.round(((totalIncome - totalExpenses) + Number.EPSILON) * 100) / 100,
  };

  return {
    period: {
      ...period,
      minOffset: Math.min(...availableOffsets),
      availableOffsets,
    },
    summary,
    calendarActivity: null,
    categoryBreakdown: [],
    bankCosts: { feesInterest: 0, loanPayments: 0, cashWithdrawn: 0, cashWithdrawalCount: 0 },
    recurringPatterns: [],
    sources,
    recent_transactions: recentTransactions,
    metadata: { generated_at: new Date().toISOString(), model: 'dashboard_shell_v1' },
  };
}

function roundAccounts(rows, key) {
  return Math.round((rows.reduce((sum, row) => sum + (Number(row[key]) || 0), 0) + Number.EPSILON) * 100) / 100;
}

module.exports = { buildDashboardData };
