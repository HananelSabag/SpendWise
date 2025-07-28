/**
 * Export Controller - Production Ready
 * Handles data export functionality (CSV/JSON/PDF)
 * @module controllers/exportController
 */

const { User } = require('../models/User'); // ✅ FIXED: Destructure User from exports
const { asyncHandler } = require('../middleware/errorHandler');
const errorCodes = require('../utils/errorCodes');
const logger = require('../utils/logger');

/**
 * 📊 ENHANCED Export user data as CSV with analytics
 * @route GET /api/v1/export/csv
 */
const exportAsCSV = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { includeAnalytics = 'true' } = req.query;
  
  try {
    const exportData = await User.getExportData(userId);
    
    if (!exportData || !exportData.transactions || exportData.transactions.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NO_DATA',
          message: 'No transaction data available for export',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Generate enhanced CSV with analytics
    const csvContent = generateAdvancedCSV(exportData, includeAnalytics === 'true');
    
    const filename = `spendwise_export_${exportData.user.username.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
    
    logger.info('📊 Enhanced CSV export completed', { 
      userId, 
      recordCount: exportData.transactions.length,
      monthlyPeriods: exportData.monthly_summary.length,
      categories: exportData.category_analysis.length,
      includeAnalytics: includeAnalytics === 'true',
      filename 
    });
    
    res.send(csvContent);
  } catch (error) {
    logger.error('❌ Enhanced CSV export failed', { userId, error: error.message });
    throw error;
  }
});

/**
 * 🚀 Generate advanced CSV with comprehensive analytics
 */
const generateAdvancedCSV = (exportData, includeAnalytics) => {
  let csvContent = '';
  
  // Header with metadata
  csvContent += `SpendWise Enhanced Export Report\n`;
  csvContent += `Generated: ${new Date().toISOString()}\n`;
  csvContent += `User: ${exportData.user.username}\n`;
  csvContent += `Member Since: ${exportData.user.created_at}\n`;
  csvContent += `Total Transactions: ${exportData.transactions.length}\n`;
  csvContent += `Active Days: ${exportData.user.active_days}\n`;
  csvContent += `Currency: ${exportData.user.currency_preference}\n`;
  csvContent += `\n`;
  
  // Transactions section
  csvContent += `TRANSACTIONS\n`;
  csvContent += `Type,Amount,Description,Category,Date,Created At,Notes\n`;
  
  exportData.transactions.forEach(transaction => {
    const safeDescription = (transaction.description || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
    const safeNotes = (transaction.notes || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
    
    const row = [
      transaction.type,
      parseFloat(transaction.amount).toFixed(2),
      `"${safeDescription}"`,
      transaction.category || 'Uncategorized',
      transaction.date,
      new Date(transaction.created_at).toISOString().split('T')[0],
      `"${safeNotes}"`
    ].join(',');
    
    csvContent += row + '\n';
  });
  
  // Monthly summary section
  csvContent += '\n\nMONTHLY SUMMARY\n';
  csvContent += 'Month,Income,Expenses,Net Balance,Savings Rate %,Transactions\n';
  
  exportData.monthly_summary.forEach(ms => {
    const income = parseFloat(ms.monthly_income);
    const expenses = parseFloat(ms.monthly_expenses);
    const netBalance = income - expenses;
    const savingsRate = income > 0 ? ((netBalance / income) * 100).toFixed(2) : '0.00';
    
    csvContent += `${ms.month},${income.toFixed(2)},${expenses.toFixed(2)},${netBalance.toFixed(2)},${savingsRate},${ms.monthly_transactions}\n`;
  });
  
  // Category analysis section
  csvContent += '\n\nCATEGORY ANALYSIS\n';
  csvContent += 'Category,Type,Usage Count,Total Amount,Average Amount,Max Amount\n';
  
  exportData.category_analysis.forEach(ca => {
    csvContent += `${ca.category_name},${ca.type},${ca.usage_count},${parseFloat(ca.total_amount).toFixed(2)},${parseFloat(ca.avg_amount).toFixed(2)},${parseFloat(ca.max_amount).toFixed(2)}\n`;
  });
  
  // Analytics section if requested
  if (includeAnalytics && exportData.analytics) {
    csvContent += '\n\nANALYTICS & INSIGHTS\n';
    csvContent += 'Metric,Value\n';
    
    const patterns = exportData.analytics.spendingPatterns;
    csvContent += `Average Daily Spending,${patterns.avgDailySpending.toFixed(2)}\n`;
    csvContent += `Average Monthly Spending,${patterns.avgMonthlySpending.toFixed(2)}\n`;
    csvContent += `Savings Rate %,${patterns.savingsRate.toFixed(2)}\n`;
    csvContent += `Spending Trend,${patterns.trendDirection}\n`;
    
    if (patterns.biggestExpenseCategory) {
      csvContent += `Top Expense Category,${patterns.biggestExpenseCategory.category_name}\n`;
      csvContent += `Top Expense Amount,${parseFloat(patterns.biggestExpenseCategory.total_amount).toFixed(2)}\n`;
    }
    
    if (patterns.biggestIncomeCategory) {
      csvContent += `Top Income Category,${patterns.biggestIncomeCategory.category_name}\n`;
      csvContent += `Top Income Amount,${parseFloat(patterns.biggestIncomeCategory.total_amount).toFixed(2)}\n`;
    }
    
    csvContent += '\n\nINSIGHTS\n';
    csvContent += 'Type,Title,Description\n';
    
    exportData.analytics.insights.forEach(insight => {
      const safeDescription = insight.description.replace(/"/g, '""').replace(/\r?\n/g, ' ');
      csvContent += `${insight.type},${insight.title},"${safeDescription}"\n`;
    });
  }
  
  return csvContent;
};

/**
 * 📊 ENHANCED Export user data as JSON with advanced analytics
 * @route GET /api/v1/export/json
 */
const exportAsJSON = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { includeAnalytics = 'true' } = req.query;
  
  try {
    const exportData = await User.getExportData(userId);
    
    if (!exportData || !exportData.transactions || exportData.transactions.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NO_DATA',
          message: 'No transaction data available for export',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Generate advanced JSON with analytics
    const jsonData = generateAdvancedJSON(exportData, includeAnalytics === 'true');
    
    const filename = `spendwise_export_${exportData.user.username.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    logger.info('📊 Enhanced JSON export completed', { 
      userId, 
      recordCount: exportData.transactions.length,
      monthlyPeriods: exportData.monthly_summary.length,
      categories: exportData.category_analysis.length,
      includeAnalytics: includeAnalytics === 'true',
      filename 
    });
    
    res.json(jsonData);
  } catch (error) {
    logger.error('❌ Enhanced JSON export failed', { userId, error: error.message });
    throw error;
  }
});

/**
 * 🚀 Generate advanced JSON export with comprehensive analytics
 */
const generateAdvancedJSON = (exportData, includeAnalytics) => {
  const jsonData = {
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
      },
      statistics: {
        totalTransactions: exportData.user.total_transactions,
        activeDays: exportData.user.active_days,
        firstTransaction: exportData.user.first_transaction,
        lastTransaction: exportData.user.last_transaction
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
      savingsRate: parseFloat(ms.monthly_income) > 0 ? 
        ((parseFloat(ms.monthly_income) - parseFloat(ms.monthly_expenses)) / parseFloat(ms.monthly_income)) * 100 : 0
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
      totalIncome: exportData.monthly_summary.reduce((sum, ms) => sum + parseFloat(ms.monthly_income), 0),
      totalExpenses: exportData.monthly_summary.reduce((sum, ms) => sum + parseFloat(ms.monthly_expenses), 0),
      topExpenseCategory: exportData.category_analysis.filter(c => c.type === 'expense').sort((a, b) => parseFloat(b.total_amount) - parseFloat(a.total_amount))[0] || null,
      topIncomeCategory: exportData.category_analysis.filter(c => c.type === 'income').sort((a, b) => parseFloat(b.total_amount) - parseFloat(a.total_amount))[0] || null,
      currency: exportData.user.currency_preference || 'USD'
    }
  };
  
  // Add analytics if requested
  if (includeAnalytics && exportData.analytics) {
    jsonData.analytics = exportData.analytics;
  }
  
  return jsonData;
};

/**
 * Export user data as PDF (placeholder)
 * @route GET /api/v1/export/pdf
 */
const exportAsPDF = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  logger.info('PDF export requested (not implemented)', { userId });
  
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'PDF export is coming soon! Please use CSV or JSON export for now.',
      alternatives: [
        { format: 'CSV', endpoint: '/api/v1/export/csv' },
        { format: 'JSON', endpoint: '/api/v1/export/json' }
      ],
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * Get export options and metadata
 * @route GET /api/v1/export/options
 */
const getExportOptions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Get user's transaction count for better UX
  const userData = await User.findById(userId);
  
  res.json({
    success: true,
    data: {
      availableFormats: [
        {
          format: 'csv',
          name: 'CSV (Comma Separated Values)',
          description: 'Compatible with Excel, Google Sheets, and most spreadsheet applications',
          endpoint: '/api/v1/export/csv',
          available: true,
          mimeType: 'text/csv'
        },
        {
          format: 'json',
          name: 'JSON (JavaScript Object Notation)',
          description: 'Machine-readable format with complete data structure',
          endpoint: '/api/v1/export/json',
          available: true,
          mimeType: 'application/json'
        },
        {
          format: 'pdf',
          name: 'PDF (Portable Document Format)',
          description: 'Formatted report with charts and summaries',
          endpoint: '/api/v1/export/pdf',
          available: false,
          comingSoon: true,
          mimeType: 'application/pdf'
        }
      ],
      dataIncluded: [
        'All transactions (income and expenses)',
        'Transaction categories and descriptions',
        'User preferences and settings',
        'Account summary and statistics',
        'Export metadata and timestamps'
      ],
      userInfo: {
        currency: userData?.currency_preference || 'USD',
        language: userData?.language_preference || 'en'
      },
      limits: {
        maxRecords: 10000,
        retentionDays: 0
      },
      privacyNote: 'Your exported data is generated on-demand and not stored on our servers.'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = {
  exportAsCSV,
  exportAsJSON,
  exportAsPDF,
  getExportOptions
};
