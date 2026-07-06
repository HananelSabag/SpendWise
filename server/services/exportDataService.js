/**
 * Export data aggregation — builds the full analytics payload consumed by
 * exportController's CSV/JSON/PDF formatters.
 *
 * Moved out of models/User.js: this is export-specific reporting logic
 * (transactions, monthly summaries, category breakdowns, spending trends),
 * not user-identity data — it only ever needs User.findById for the
 * profile fields embedded in the export.
 * @module services/exportDataService
 */

const db = require('../config/db');
const { User } = require('../models/User');
const logger = require('../utils/logger');

/**
 * Build the complete export dataset for a user: profile info, all
 * transactions, monthly summary, category/source breakdown, and derived
 * spending analytics (averages, savings rate, trend direction).
 */
async function getExportData(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Transactions for export. Category system is gone — the meaningful
    // grouping is now the SOURCE-provided raw_category (e.g. Max), falling
    // back to the institution, then "Manual" for one-time entries.
    const transactionsQuery = `
      SELECT
        t.id, t.type, t.amount, t.description,
        t.date, t.created_at, t.updated_at, t.notes,
        t.raw_category, t.bank_source, t.bank_account_number,
        COALESCE(NULLIF(t.raw_category, ''), t.bank_source, 'Manual') AS category
      FROM transactions t
      WHERE t.user_id = $1 AND t.deleted_at IS NULL
      ORDER BY t.created_at DESC
    `;

    const transactionsResult = await db.query(transactionsQuery, [userId]);

    // ✅ FIXED: Get monthly summary from single transactions table
    const monthlySummaryQuery = `
      SELECT
        TO_CHAR(DATE_TRUNC('month', t.date), 'YYYY-MM') as month,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as monthly_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as monthly_expenses,
        COUNT(*) as monthly_transactions
      FROM transactions t
      WHERE t.user_id = $1
        AND t.deleted_at IS NULL
        AND t.date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', t.date)
      ORDER BY DATE_TRUNC('month', t.date) DESC
    `;

    const monthlySummaryResult = await db.query(monthlySummaryQuery, [userId]);

    // Breakdown by source-provided category / institution (replaces the
    // removed category taxonomy). Same output columns as before so the
    // export formatters (CSV/JSON/PDF) need no changes.
    const categoryAnalysisQuery = `
      SELECT
        COALESCE(NULLIF(t.raw_category, ''), t.bank_source, 'Manual') AS category_name,
        t.type,
        COUNT(*) as usage_count,
        SUM(t.amount) as total_amount,
        AVG(t.amount) as avg_amount,
        MAX(t.amount) as max_amount
      FROM transactions t
      WHERE t.user_id = $1 AND t.deleted_at IS NULL
      GROUP BY COALESCE(NULLIF(t.raw_category, ''), t.bank_source, 'Manual'), t.type
      ORDER BY total_amount DESC
    `;

    const categoryAnalysisResult = await db.query(categoryAnalysisQuery, [userId]);

    // ✅ FIX: Calculate real analytics from transactions instead of hardcoded zeros
    const transactions = transactionsResult.rows;

    // Calculate active days
    const uniqueDays = new Set(transactions.map(t => t.date?.toISOString?.()?.split('T')[0] || ''));
    const activeDays = uniqueDays.size;

    // Get first and last transaction dates
    const sortedDates = transactions.map(t => new Date(t.date || t.created_at)).sort((a, b) => a - b);
    const firstTransaction = sortedDates[0] || null;
    const lastTransaction = sortedDates[sortedDates.length - 1] || null;

    // Calculate spending patterns from actual data
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Calculate averages
    const daysSinceFirst = firstTransaction
      ? Math.max(1, Math.ceil((Date.now() - firstTransaction.getTime()) / (1000 * 60 * 60 * 24)))
      : 1;

    const avgDailySpending = totalExpenses / daysSinceFirst;
    const avgMonthlySpending = totalExpenses / Math.max(1, monthlySummaryResult.rows.length);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Calculate trend (compare last 3 months vs previous 3 months)
    const recentMonths = monthlySummaryResult.rows.slice(0, 3);
    const previousMonths = monthlySummaryResult.rows.slice(3, 6);
    const recentAvg = recentMonths.reduce((sum, m) => sum + parseFloat(m.monthly_expenses || 0), 0) / Math.max(1, recentMonths.length);
    const previousAvg = previousMonths.reduce((sum, m) => sum + parseFloat(m.monthly_expenses || 0), 0) / Math.max(1, previousMonths.length);

    let trendDirection = 'stable';
    if (recentAvg > previousAvg * 1.1) trendDirection = 'increasing';
    else if (recentAvg < previousAvg * 0.9) trendDirection = 'decreasing';

    // Get top categories by amount (not just first match!)
    const expenseCategories = categoryAnalysisResult.rows.filter(c => c.type === 'expense');
    const incomeCategories = categoryAnalysisResult.rows.filter(c => c.type === 'income');

    // ✅ Build comprehensive export data with REAL analytics
    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.created_at,
        language_preference: user.language_preference,
        theme_preference: user.theme_preference,
        currency_preference: user.currency_preference,
        total_transactions: transactions.length,
        active_days: activeDays,
        first_transaction: firstTransaction,
        last_transaction: lastTransaction
      },
      transactions,
      monthly_summary: monthlySummaryResult.rows,
      category_analysis: categoryAnalysisResult.rows,
      analytics: {
        spendingPatterns: {
          avgDailySpending: parseFloat(avgDailySpending.toFixed(2)),
          avgMonthlySpending: parseFloat(avgMonthlySpending.toFixed(2)),
          totalIncome: parseFloat(totalIncome.toFixed(2)),
          totalExpenses: parseFloat(totalExpenses.toFixed(2)),
          savingsRate: parseFloat(savingsRate.toFixed(2)),
          trendDirection,
          biggestExpenseCategory: expenseCategories[0] || null,
          biggestIncomeCategory: incomeCategories[0] || null
        },
        insights: []
      },
      exportDate: new Date().toISOString(),
      totalTransactions: transactions.length
    };

    logger.info('✅ Enhanced export data generated', {
      userId,
      transactions: exportData.transactions.length,
      monthlyPeriods: exportData.monthly_summary.length,
      categories: exportData.category_analysis.length,
      hasAnalytics: !!exportData.analytics
    });

    return exportData;
  } catch (error) {
    logger.error('❌ Enhanced export data retrieval failed', { userId, error: error.message });
    throw error;
  }
}

module.exports = { getExportData };
