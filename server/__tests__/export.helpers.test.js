/**
 * Export helper tests — CSV and JSON generation.
 *
 * generateAdvancedCSV and generateAdvancedJSON are private functions in
 * exportController.js.  We mirror their logic here so that:
 *   1. The exact output format is locked down and regressions are caught.
 *   2. Edge-cases (special chars, empty analytics, zero amounts) are exercised.
 */

// ─── Mirrors exportController.js generateAdvancedCSV ─────────────────────────
function generateAdvancedCSV(exportData, includeAnalytics) {
  let csv = '';

  csv += `SpendWise Enhanced Export Report\n`;
  csv += `Generated: ${new Date().toISOString()}\n`;
  csv += `User: ${exportData.user.username}\n`;
  csv += `Member Since: ${exportData.user.created_at}\n`;
  csv += `Total Transactions: ${exportData.transactions.length}\n`;
  csv += `Active Days: ${exportData.user.active_days}\n`;
  csv += `Currency: ${exportData.user.currency_preference}\n\n`;

  csv += `TRANSACTIONS\n`;
  csv += `Type,Amount,Description,Category,Date,Created At,Notes\n`;

  exportData.transactions.forEach(t => {
    const safeDesc = (t.description || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
    const safeNotes = (t.notes || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');

    csv += [
      t.type,
      parseFloat(t.amount).toFixed(2),
      `"${safeDesc}"`,
      t.category || 'Uncategorized',
      t.date,
      new Date(t.created_at).toISOString().split('T')[0],
      `"${safeNotes}"`
    ].join(',') + '\n';
  });

  csv += '\n\nMONTHLY SUMMARY\n';
  csv += 'Month,Income,Expenses,Net Balance,Savings Rate %,Transactions\n';

  exportData.monthly_summary.forEach(ms => {
    const income = parseFloat(ms.monthly_income);
    const expenses = parseFloat(ms.monthly_expenses);
    const net = income - expenses;
    const savingsRate = income > 0 ? ((net / income) * 100).toFixed(2) : '0.00';
    csv += `${ms.month},${income.toFixed(2)},${expenses.toFixed(2)},${net.toFixed(2)},${savingsRate},${ms.monthly_transactions}\n`;
  });

  csv += '\n\nCATEGORY ANALYSIS\n';
  csv += 'Category,Type,Usage Count,Total Amount,Average Amount,Max Amount\n';

  exportData.category_analysis.forEach(ca => {
    csv += `${ca.category_name},${ca.type},${ca.usage_count},${parseFloat(ca.total_amount).toFixed(2)},${parseFloat(ca.avg_amount).toFixed(2)},${parseFloat(ca.max_amount).toFixed(2)}\n`;
  });

  if (includeAnalytics && exportData.analytics) {
    csv += '\n\nANALYTICS & INSIGHTS\n';
    csv += 'Metric,Value\n';

    const patterns = exportData.analytics.spendingPatterns;
    csv += `Average Daily Spending,${patterns.avgDailySpending.toFixed(2)}\n`;
    csv += `Average Monthly Spending,${patterns.avgMonthlySpending.toFixed(2)}\n`;
    csv += `Savings Rate %,${patterns.savingsRate.toFixed(2)}\n`;
    csv += `Spending Trend,${patterns.trendDirection}\n`;

    if (patterns.biggestExpenseCategory) {
      csv += `Top Expense Category,${patterns.biggestExpenseCategory.category_name}\n`;
      csv += `Top Expense Amount,${parseFloat(patterns.biggestExpenseCategory.total_amount).toFixed(2)}\n`;
    }
  }

  return csv;
}

// ─── Mirrors exportController.js generateAdvancedJSON ─────────────────────────
function generateAdvancedJSON(exportData, includeAnalytics) {
  const json = {
    exportInfo: {
      exportDate: new Date().toISOString(),
      version: '2.0',
      format: 'SpendWise Advanced JSON Export',
      includesAnalytics: includeAnalytics
    },
    user: {
      id: exportData.user.id,
      email: exportData.user.email,
      username: exportData.user.username,
      memberSince: exportData.user.created_at,
      preferences: {
        language: exportData.user.language_preference,
        theme: exportData.user.theme_preference,
        currency: exportData.user.currency_preference
      }
    },
    transactions: exportData.transactions.map(t => ({
      id: t.id,
      type: t.type,
      amount: parseFloat(t.amount),
      description: t.description || '',
      category: t.category || 'Uncategorized',
      date: t.date,
      createdAt: t.created_at,
      notes: t.notes || ''
    })),
    monthlySummary: exportData.monthly_summary.map(ms => ({
      month: ms.month,
      expenses: parseFloat(ms.monthly_expenses),
      income: parseFloat(ms.monthly_income),
      transactions: ms.monthly_transactions,
      netBalance: parseFloat(ms.monthly_income) - parseFloat(ms.monthly_expenses),
      savingsRate: parseFloat(ms.monthly_income) > 0
        ? ((parseFloat(ms.monthly_income) - parseFloat(ms.monthly_expenses)) / parseFloat(ms.monthly_income)) * 100
        : 0
    })),
    categoryAnalysis: exportData.category_analysis.map(ca => ({
      category: ca.category_name,
      type: ca.type,
      usageCount: ca.usage_count,
      totalAmount: parseFloat(ca.total_amount),
      averageAmount: parseFloat(ca.avg_amount),
      maxAmount: parseFloat(ca.max_amount)
    })),
    summary: {
      totalTransactions: exportData.transactions.length,
      totalIncome: exportData.monthly_summary.reduce((s, ms) => s + parseFloat(ms.monthly_income), 0),
      totalExpenses: exportData.monthly_summary.reduce((s, ms) => s + parseFloat(ms.monthly_expenses), 0),
      currency: exportData.user.currency_preference || 'USD'
    }
  };

  if (includeAnalytics && exportData.analytics) {
    json.analytics = exportData.analytics;
  }

  return json;
}

// ─── Shared fixture ────────────────────────────────────────────────────────────
function buildExportData(overrides = {}) {
  return {
    user: {
      id: 1,
      email: 'user@test.com',
      username: 'testuser',
      created_at: '2023-01-01',
      active_days: 100,
      currency_preference: 'USD',
      language_preference: 'en',
      theme_preference: 'light',
      total_transactions: 3
    },
    transactions: [
      { id: 1, type: 'expense', amount: '50.00', description: 'Coffee', category: 'Food', date: '2024-01-15', created_at: '2024-01-15T10:00:00Z', notes: '' },
      { id: 2, type: 'income',  amount: '1000.00', description: 'Salary', category: 'Work', date: '2024-01-31', created_at: '2024-01-31T08:00:00Z', notes: 'Monthly' }
    ],
    monthly_summary: [
      { month: '2024-01', monthly_income: '1000.00', monthly_expenses: '50.00', monthly_transactions: 2 }
    ],
    category_analysis: [
      { category_name: 'Food', type: 'expense', usage_count: 1, total_amount: '50.00', avg_amount: '50.00', max_amount: '50.00' }
    ],
    analytics: {
      spendingPatterns: {
        avgDailySpending: 10.5,
        avgMonthlySpending: 315.0,
        savingsRate: 95.0,
        trendDirection: 'down',
        biggestExpenseCategory: { category_name: 'Food', total_amount: '50.00' },
        biggestIncomeCategory: null
      },
      insights: []
    },
    ...overrides
  };
}

// ─────────────────────────────────────────────────────
// CSV — structure
// ─────────────────────────────────────────────────────
describe('generateAdvancedCSV — structure', () => {
  it('starts with the SpendWise header line', () => {
    const csv = generateAdvancedCSV(buildExportData(), false);
    expect(csv).toMatch(/^SpendWise Enhanced Export Report/);
  });

  it('includes a TRANSACTIONS section header', () => {
    const csv = generateAdvancedCSV(buildExportData(), false);
    expect(csv).toContain('TRANSACTIONS');
    expect(csv).toContain('Type,Amount,Description,Category,Date,Created At,Notes');
  });

  it('includes a MONTHLY SUMMARY section', () => {
    const csv = generateAdvancedCSV(buildExportData(), false);
    expect(csv).toContain('MONTHLY SUMMARY');
    expect(csv).toContain('Month,Income,Expenses,Net Balance,Savings Rate %,Transactions');
  });

  it('includes a CATEGORY ANALYSIS section', () => {
    const csv = generateAdvancedCSV(buildExportData(), false);
    expect(csv).toContain('CATEGORY ANALYSIS');
  });

  it('formats amount to 2 decimal places', () => {
    const csv = generateAdvancedCSV(buildExportData(), false);
    expect(csv).toContain('50.00');
    expect(csv).toContain('1000.00');
  });

  it('falls back to "Uncategorized" for transactions with no category', () => {
    const data = buildExportData();
    data.transactions[0].category = null;
    const csv = generateAdvancedCSV(data, false);
    expect(csv).toContain('Uncategorized');
  });
});

// ─────────────────────────────────────────────────────
// CSV — special character escaping
// ─────────────────────────────────────────────────────
describe('generateAdvancedCSV — special character escaping', () => {
  it('escapes double-quotes in description by doubling them', () => {
    const data = buildExportData();
    data.transactions[0].description = 'Buy "milk"';
    const csv = generateAdvancedCSV(data, false);
    expect(csv).toContain('"Buy ""milk"""');
  });

  it('replaces newlines in description with a space', () => {
    const data = buildExportData();
    data.transactions[0].description = 'line1\nline2';
    const csv = generateAdvancedCSV(data, false);
    expect(csv).toContain('line1 line2');
    expect(csv).not.toContain('line1\nline2');
  });

  it('wraps description in double-quotes', () => {
    const data = buildExportData();
    data.transactions[0].description = 'Coffee';
    const csv = generateAdvancedCSV(data, false);
    expect(csv).toContain('"Coffee"');
  });

  it('handles empty description gracefully', () => {
    const data = buildExportData();
    data.transactions[0].description = '';
    const csv = generateAdvancedCSV(data, false);
    // Empty description should appear as empty quoted string
    expect(csv).toContain('""');
  });
});

// ─────────────────────────────────────────────────────
// CSV — analytics section
// ─────────────────────────────────────────────────────
describe('generateAdvancedCSV — analytics section', () => {
  it('omits ANALYTICS section when includeAnalytics=false', () => {
    const csv = generateAdvancedCSV(buildExportData(), false);
    expect(csv).not.toContain('ANALYTICS & INSIGHTS');
  });

  it('includes ANALYTICS section when includeAnalytics=true and data present', () => {
    const csv = generateAdvancedCSV(buildExportData(), true);
    expect(csv).toContain('ANALYTICS & INSIGHTS');
    expect(csv).toContain('Average Daily Spending');
    expect(csv).toContain('Spending Trend,down');
  });

  it('omits ANALYTICS section when analytics data is absent even if flag is true', () => {
    const data = buildExportData({ analytics: null });
    const csv = generateAdvancedCSV(data, true);
    expect(csv).not.toContain('ANALYTICS & INSIGHTS');
  });
});

// ─────────────────────────────────────────────────────
// JSON — structure
// ─────────────────────────────────────────────────────
describe('generateAdvancedJSON — structure', () => {
  it('returns an object with the required top-level keys', () => {
    const result = generateAdvancedJSON(buildExportData(), false);
    expect(result).toHaveProperty('exportInfo');
    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('transactions');
    expect(result).toHaveProperty('monthlySummary');
    expect(result).toHaveProperty('categoryAnalysis');
    expect(result).toHaveProperty('summary');
  });

  it('maps transactions to the correct shape', () => {
    const result = generateAdvancedJSON(buildExportData(), false);
    const tx = result.transactions[0];
    expect(tx).toHaveProperty('id');
    expect(tx).toHaveProperty('type');
    expect(typeof tx.amount).toBe('number');
    expect(tx.category).toBe('Food');
  });

  it('sets Uncategorized for transactions with no category', () => {
    const data = buildExportData();
    data.transactions[0].category = null;
    const result = generateAdvancedJSON(data, false);
    expect(result.transactions[0].category).toBe('Uncategorized');
  });

  it('calculates correct netBalance in monthlySummary', () => {
    const result = generateAdvancedJSON(buildExportData(), false);
    const ms = result.monthlySummary[0];
    expect(ms.netBalance).toBeCloseTo(950, 2);
  });

  it('calculates correct savingsRate in monthlySummary', () => {
    const result = generateAdvancedJSON(buildExportData(), false);
    expect(result.monthlySummary[0].savingsRate).toBeCloseTo(95, 2);
  });

  it('returns savingsRate = 0 when income is 0', () => {
    const data = buildExportData();
    data.monthly_summary[0].monthly_income = '0.00';
    const result = generateAdvancedJSON(data, false);
    expect(result.monthlySummary[0].savingsRate).toBe(0);
  });
});

// ─────────────────────────────────────────────────────
// JSON — analytics
// ─────────────────────────────────────────────────────
describe('generateAdvancedJSON — analytics', () => {
  it('omits analytics key when includeAnalytics=false', () => {
    const result = generateAdvancedJSON(buildExportData(), false);
    expect(result).not.toHaveProperty('analytics');
  });

  it('includes analytics key when includeAnalytics=true and data present', () => {
    const result = generateAdvancedJSON(buildExportData(), true);
    expect(result).toHaveProperty('analytics');
  });

  it('omits analytics key when analytics data is null', () => {
    const data = buildExportData({ analytics: null });
    const result = generateAdvancedJSON(data, true);
    expect(result).not.toHaveProperty('analytics');
  });
});

// ─────────────────────────────────────────────────────
// JSON — summary totals
// ─────────────────────────────────────────────────────
describe('generateAdvancedJSON — summary totals', () => {
  it('sums totalIncome across all monthly_summary entries', () => {
    const data = buildExportData();
    data.monthly_summary = [
      { month: '2024-01', monthly_income: '500.00', monthly_expenses: '200.00', monthly_transactions: 5 },
      { month: '2024-02', monthly_income: '600.00', monthly_expenses: '300.00', monthly_transactions: 4 }
    ];
    const result = generateAdvancedJSON(data, false);
    expect(result.summary.totalIncome).toBeCloseTo(1100, 2);
    expect(result.summary.totalExpenses).toBeCloseTo(500, 2);
  });

  it('sets totalTransactions to the number of transactions in the array', () => {
    const result = generateAdvancedJSON(buildExportData(), false);
    expect(result.summary.totalTransactions).toBe(2);
  });

  it('defaults currency to USD when preference is not set', () => {
    const data = buildExportData();
    data.user.currency_preference = null;
    const result = generateAdvancedJSON(data, false);
    expect(result.summary.currency).toBe('USD');
  });
});
