/**
 * Export Controller - Production Ready
 * Handles data export functionality (CSV/JSON/PDF)
 * @module controllers/exportController
 */

const { User } = require('../models/User'); // ✅ FIXED: Destructure User from exports
const { asyncHandler } = require('../middleware/errorHandler');
const errorCodes = require('../utils/errorCodes');
const logger = require('../utils/logger');
const PDFDocument = require('pdfkit');
const path = require('path');

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
 * 📄 ENHANCED: Export user data as beautiful PDF report
 * @route GET /api/v1/export/pdf
 */
const exportAsPDF = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { includeAnalytics = 'true' } = req.query;
  
  try {
    logger.info('📄 PDF export requested', { userId, includeAnalytics });
    
    const exportData = await User.getExportData(userId);
    
    // ✅ ENHANCED: Validate export data before PDF generation
    if (!exportData || typeof exportData !== 'object') {
      logger.error('📄 PDF export failed - invalid export data', { userId, exportData: typeof exportData });
      return res.status(500).json({
        error: {
          code: 'INVALID_EXPORT_DATA',
          message: 'Could not retrieve user data for export',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    if (!exportData || !exportData.transactions || exportData.transactions.length === 0) {
      logger.warn('📄 PDF export failed - no data', { userId });
      return res.status(404).json({
        error: {
          code: 'NO_DATA',
          message: 'No transaction data available for PDF export',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    logger.info('📄 Generating PDF with data', { 
      userId,
      transactions: exportData.transactions.length,
      monthlyPeriods: exportData.monthly_summary.length,
      categories: exportData.category_analysis.length
    });
    
    // Generate beautiful PDF report
    const pdfBuffer = await generatePDFReport(exportData, includeAnalytics === 'true');
    
    const filename = `spendwise_report_${exportData.user.username.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    logger.info('📄 PDF export completed successfully', { 
      userId, 
      recordCount: exportData.transactions.length,
      monthlyPeriods: exportData.monthly_summary.length,
      categories: exportData.category_analysis.length,
      includeAnalytics: includeAnalytics === 'true',
      filename,
      pdfSize: pdfBuffer.length
    });
    
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('❌ PDF export failed with error', { 
      userId, 
      error: error.message, 
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      error: {
        code: 'PDF_GENERATION_FAILED',
        message: 'Failed to generate PDF report. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      }
    });
  }
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
          description: 'Professional report with charts and financial analysis',
          endpoint: '/api/v1/export/pdf',
          available: true,
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

/**
 * 🎨 Generate beautiful PDF financial report
 * @param {Object} exportData - Complete export data from database
 * @param {Boolean} includeAnalytics - Whether to include analytics section
 * @returns {Buffer} PDF buffer
 */
const generatePDFReport = async (exportData, includeAnalytics) => {
  return new Promise((resolve, reject) => {
    try {
      logger.info('📄 Starting PDF generation', { 
        userTransactions: exportData.transactions.length,
        includeAnalytics 
      });
      
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        logger.info('📄 PDF generation completed', { 
          bufferSize: pdfBuffer.length 
        });
        resolve(pdfBuffer);
      });
      doc.on('error', (err) => {
        logger.error('📄 PDF generation error', { error: err.message });
        reject(err);
      });
      
      // ✅ BEAUTIFUL HEADER SECTION
      doc.fontSize(24).fillColor('#1f2937').text('SpendWise Financial Report', 50, 50);
      doc.fontSize(12).fillColor('#6b7280').text(`Generated on ${new Date().toLocaleDateString()}`, 50, 80);
      
      // User Info Section
      doc.fontSize(16).fillColor('#374151').text('Account Summary', 50, 120);
      doc.fontSize(12).fillColor('#4b5563');
      doc.text(`Account Holder: ${exportData.user.username}`, 70, 145);
      doc.text(`Member Since: ${new Date(exportData.user.created_at).toLocaleDateString()}`, 70, 165);
      doc.text(`Currency: ${exportData.user.currency_preference}`, 70, 185);
      doc.text(`Total Transactions: ${exportData.transactions.length}`, 70, 205);
      doc.text(`Active Days: ${exportData.user.active_days}`, 70, 225);
      
      // ✅ FINANCIAL OVERVIEW SECTION
      let yPos = 260;
      doc.fontSize(16).fillColor('#374151').text('Financial Overview', 50, yPos);
      yPos += 30;
      
      // Calculate totals
      const totalIncome = exportData.monthly_summary.reduce((sum, ms) => sum + parseFloat(ms.monthly_income || 0), 0);
      const totalExpenses = exportData.monthly_summary.reduce((sum, ms) => sum + parseFloat(ms.monthly_expenses || 0), 0);
      const netBalance = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100) : 0;
      
      // Financial metrics with colors
      doc.fontSize(12);
      doc.fillColor('#059669').text(`💰 Total Income: ${totalIncome.toFixed(2)} ${exportData.user.currency_preference}`, 70, yPos);
      yPos += 20;
      doc.fillColor('#dc2626').text(`💸 Total Expenses: ${totalExpenses.toFixed(2)} ${exportData.user.currency_preference}`, 70, yPos);
      yPos += 20;
      doc.fillColor(netBalance >= 0 ? '#059669' : '#dc2626').text(`📊 Net Balance: ${netBalance.toFixed(2)} ${exportData.user.currency_preference}`, 70, yPos);
      yPos += 20;
      doc.fillColor('#3b82f6').text(`💯 Savings Rate: ${savingsRate.toFixed(1)}%`, 70, yPos);
      yPos += 40;
      
      // ✅ MONTHLY TRENDS SECTION
      if (exportData.monthly_summary.length > 0) {
        doc.fontSize(16).fillColor('#374151').text('Monthly Trends (Last 12 Months)', 50, yPos);
        yPos += 25;
        
        // Table header
        doc.fontSize(10).fillColor('#6b7280');
        doc.text('Month', 70, yPos);
        doc.text('Income', 150, yPos);
        doc.text('Expenses', 230, yPos);
        doc.text('Balance', 310, yPos);
        doc.text('Savings %', 390, yPos);
        yPos += 15;
        
        // Table rows
        doc.fontSize(9).fillColor('#374151');
        exportData.monthly_summary.slice(0, 12).forEach((ms, index) => {
          const income = parseFloat(ms.monthly_income || 0);
          const expenses = parseFloat(ms.monthly_expenses || 0);
          const balance = income - expenses;
          const monthSavings = income > 0 ? ((balance / income) * 100) : 0;
          
          // Alternating row background
          if (index % 2 === 0) {
            doc.fillColor('#f9fafb').rect(50, yPos - 5, 500, 15).fill();
          }
          
          doc.fillColor('#374151');
          doc.text(ms.month, 70, yPos);
          doc.fillColor('#059669').text(income.toFixed(2), 150, yPos);
          doc.fillColor('#dc2626').text(expenses.toFixed(2), 230, yPos);
          doc.fillColor(balance >= 0 ? '#059669' : '#dc2626').text(balance.toFixed(2), 310, yPos);
          doc.fillColor('#3b82f6').text(monthSavings.toFixed(1) + '%', 390, yPos);
          yPos += 15;
          
          // New page if needed
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }
        });
        
        yPos += 30;
      }
      
      // ✅ TOP CATEGORIES SECTION
      if (exportData.category_analysis.length > 0) {
        // Check if we need a new page
        if (yPos > 600) {
          doc.addPage();
          yPos = 50;
        }
        
        doc.fontSize(16).fillColor('#374151').text('Top Spending Categories', 50, yPos);
        yPos += 25;
        
        // Categories table
        doc.fontSize(10).fillColor('#6b7280');
        doc.text('Category', 70, yPos);
        doc.text('Type', 200, yPos);
        doc.text('Count', 280, yPos);
        doc.text('Total Amount', 340, yPos);
        doc.text('Average', 440, yPos);
        yPos += 15;
        
        exportData.category_analysis.slice(0, 10).forEach((ca, index) => {
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }
          
          // Alternating row background
          if (index % 2 === 0) {
            doc.fillColor('#f9fafb').rect(50, yPos - 5, 500, 15).fill();
          }
          
          doc.fontSize(9).fillColor('#374151');
          doc.text(ca.category_name, 70, yPos);
          doc.fillColor(ca.type === 'income' ? '#059669' : '#dc2626').text(ca.type, 200, yPos);
          doc.fillColor('#374151').text(ca.usage_count.toString(), 280, yPos);
          doc.text(parseFloat(ca.total_amount).toFixed(2), 340, yPos);
          doc.text(parseFloat(ca.avg_amount).toFixed(2), 440, yPos);
          yPos += 15;
        });
        
        yPos += 30;
      }
      
      // ✅ ANALYTICS & INSIGHTS SECTION
      if (includeAnalytics && exportData.analytics) {
        // Check if we need a new page
        if (yPos > 600) {
          doc.addPage();
          yPos = 50;
        }
        
        doc.fontSize(16).fillColor('#374151').text('Financial Insights & Analytics', 50, yPos);
        yPos += 25;
        
        // Spending patterns
        if (exportData.analytics.spendingPatterns) {
          const patterns = exportData.analytics.spendingPatterns;
          doc.fontSize(12).fillColor('#4b5563');
          doc.text(`📈 Average Daily Spending: ${patterns.avgDailySpending?.toFixed(2) || 'N/A'}`, 70, yPos);
          yPos += 20;
          doc.text(`📅 Average Monthly Spending: ${patterns.avgMonthlySpending?.toFixed(2) || 'N/A'}`, 70, yPos);
          yPos += 20;
          doc.text(`🎯 Spending Trend: ${patterns.trendDirection || 'Stable'}`, 70, yPos);
          yPos += 30;
        }
        
        // Top categories
        if (exportData.analytics.spendingPatterns?.biggestExpenseCategory) {
          doc.text(`🔥 Top Expense Category: ${exportData.analytics.spendingPatterns.biggestExpenseCategory.category_name}`, 70, yPos);
          yPos += 20;
        }
        if (exportData.analytics.spendingPatterns?.biggestIncomeCategory) {
          doc.text(`💰 Top Income Category: ${exportData.analytics.spendingPatterns.biggestIncomeCategory.category_name}`, 70, yPos);
          yPos += 30;
        }
        
        // Insights
        if (exportData.analytics.insights && exportData.analytics.insights.length > 0) {
          doc.fontSize(14).fillColor('#374151').text('💡 Financial Recommendations', 70, yPos);
          yPos += 20;
          
          exportData.analytics.insights.slice(0, 5).forEach((insight, index) => {
            if (yPos > 700) {
              doc.addPage();
              yPos = 50;
            }
            
            doc.fontSize(10).fillColor('#6b7280');
            doc.text(`${index + 1}. ${insight.title}`, 90, yPos);
            yPos += 15;
            doc.fontSize(9).fillColor('#4b5563');
            doc.text(insight.description, 100, yPos, { width: 400 });
            yPos += 25;
          });
        }
      }
      
      // ✅ FIXED: Skip footer to avoid page indexing issues entirely
      // Note: Footer can cause page switching errors, so we skip it for now
      logger.info('📄 PDF generation completed, skipping footer to avoid page switching issues');
      
      // Finalize the PDF
      doc.end();
      logger.info('📄 PDF generation completed successfully');
    } catch (error) {
      logger.error('📄 PDF generation failed', { 
        error: error.message, 
        stack: error.stack,
        exportDataValid: !!exportData,
        hasTransactions: exportData?.transactions?.length || 0,
        hasMonthlySummary: exportData?.monthly_summary?.length || 0,
        hasUser: !!exportData?.user,
        userCurrency: exportData?.user?.currency_preference
      });
      reject(error);
    }
  });
};

module.exports = {
  exportAsCSV,
  exportAsJSON,
  exportAsPDF,
  getExportOptions
};
