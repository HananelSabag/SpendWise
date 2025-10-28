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
      
      // ✅ STUNNING HEADER WITH GRADIENT EFFECT
      doc.rect(0, 0, 612, 100).fillAndStroke('#1e40af', '#3b82f6');
      doc.fontSize(28).fillColor('#ffffff').text('SpendWise Financial Report', 50, 30);
      doc.fontSize(14).fillColor('#e0e7ff').text(`Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 65);
      
      // ✅ ACCOUNT SUMMARY CARD WITH BACKGROUND
      doc.rect(40, 120, 532, 140).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fontSize(18).fillColor('#1e40af').text('Account Summary', 60, 140);
      
      // Two-column layout for user info
      doc.fontSize(12).fillColor('#374151');
      doc.text(`Account Holder: ${exportData.user.username}`, 70, 170);
      doc.text(`Member Since: ${new Date(exportData.user.created_at).toLocaleDateString()}`, 70, 190);
      doc.text(`Primary Currency: ${exportData.user.currency_preference}`, 70, 210);
      
      // Right column
      doc.text(`Total Transactions: ${exportData.transactions.length}`, 320, 170);
      doc.text(`Active Days: ${exportData.user.active_days}`, 320, 190);
      doc.text(`Report Period: Last 12 Months`, 320, 210);
      
      // ✅ FINANCIAL OVERVIEW WITH STUNNING CARDS
      let yPos = 290;
      doc.fontSize(18).fillColor('#1e40af').text('Financial Overview', 50, yPos);
      yPos += 40;
      
      // Calculate totals
      const totalIncome = exportData.monthly_summary.reduce((sum, ms) => sum + parseFloat(ms.monthly_income || 0), 0);
      const totalExpenses = exportData.monthly_summary.reduce((sum, ms) => sum + parseFloat(ms.monthly_expenses || 0), 0);
      const netBalance = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100) : 0;
      
      // ✅ INCOME CARD
      doc.rect(50, yPos, 240, 70).fillAndStroke('#ecfdf5', '#10b981');
      doc.fontSize(14).fillColor('#065f46').text('TOTAL INCOME', 70, yPos + 15);
      doc.fontSize(20).fillColor('#047857').text(`${totalIncome.toFixed(2)} ${exportData.user.currency_preference}`, 70, yPos + 35);
      
      // ✅ EXPENSES CARD
      doc.rect(320, yPos, 240, 70).fillAndStroke('#fef2f2', '#ef4444');
      doc.fontSize(14).fillColor('#7f1d1d').text('TOTAL EXPENSES', 340, yPos + 15);
      doc.fontSize(20).fillColor('#dc2626').text(`${totalExpenses.toFixed(2)} ${exportData.user.currency_preference}`, 340, yPos + 35);
      
      yPos += 90;
      
      // ✅ NET BALANCE CARD
      const balanceColor = netBalance >= 0 ? '#10b981' : '#ef4444';
      const balanceBg = netBalance >= 0 ? '#ecfdf5' : '#fef2f2';
      const balanceText = netBalance >= 0 ? '#065f46' : '#7f1d1d';
      
      doc.rect(50, yPos, 240, 70).fillAndStroke(balanceBg, balanceColor);
      doc.fontSize(14).fillColor(balanceText).text('NET BALANCE', 70, yPos + 15);
      doc.fontSize(20).fillColor(balanceColor).text(`${netBalance.toFixed(2)} ${exportData.user.currency_preference}`, 70, yPos + 35);
      
      // ✅ SAVINGS RATE CARD
      doc.rect(320, yPos, 240, 70).fillAndStroke('#eff6ff', '#3b82f6');
      doc.fontSize(14).fillColor('#1e3a8a').text('SAVINGS RATE', 340, yPos + 15);
      doc.fontSize(20).fillColor('#2563eb').text(`${savingsRate.toFixed(1)}%`, 340, yPos + 35);
      
      yPos += 100;
      
      // ✅ MONTHLY TRENDS WITH BEAUTIFUL TABLE
      if (exportData.monthly_summary.length > 0) {
        doc.fontSize(18).fillColor('#1e40af').text('Monthly Trends (Last 12 Months)', 50, yPos);
        yPos += 30;
        
        // Table header with background
        doc.rect(50, yPos, 510, 25).fillAndStroke('#1e40af', '#1e40af');
        doc.fontSize(11).fillColor('#ffffff');
        doc.text('Month', 70, yPos + 8);
        doc.text('Income', 150, yPos + 8);
        doc.text('Expenses', 230, yPos + 8);
        doc.text('Balance', 310, yPos + 8);
        doc.text('Savings %', 430, yPos + 8);
        yPos += 25;
        
        // Table rows with alternating backgrounds
        doc.fontSize(10);
        exportData.monthly_summary.slice(0, 12).forEach((ms, index) => {
          const income = parseFloat(ms.monthly_income || 0);
          const expenses = parseFloat(ms.monthly_expenses || 0);
          const balance = income - expenses;
          const monthSavings = income > 0 ? ((balance / income) * 100) : 0;
          
          // Alternating row background
          const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
          doc.rect(50, yPos, 510, 20).fillAndStroke(bgColor, '#e2e8f0');
          
          doc.fillColor('#374151');
          doc.text(ms.month, 70, yPos + 6);
          doc.fillColor('#059669').text(`+${income.toFixed(2)}`, 150, yPos + 6);
          doc.fillColor('#dc2626').text(`-${expenses.toFixed(2)}`, 230, yPos + 6);
          doc.fillColor(balance >= 0 ? '#059669' : '#dc2626').text(balance.toFixed(2), 310, yPos + 6);
          doc.fillColor('#3b82f6').text(monthSavings.toFixed(1) + '%', 430, yPos + 6);
          yPos += 20;
          
          // New page if needed
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }
        });
        
        yPos += 30;
      }
      
      // ✅ TOP CATEGORIES WITH BEAUTIFUL DESIGN
      if (exportData.category_analysis.length > 0) {
        // Check if we need a new page
        if (yPos > 600) {
          doc.addPage();
          yPos = 50;
        }
        
        doc.fontSize(18).fillColor('#1e40af').text('Top Spending Categories', 50, yPos);
        yPos += 30;
        
        // Categories table header
        doc.rect(50, yPos, 510, 25).fillAndStroke('#1e40af', '#1e40af');
        doc.fontSize(11).fillColor('#ffffff');
        doc.text('Category', 70, yPos + 8);
        doc.text('Type', 180, yPos + 8);
        doc.text('Count', 240, yPos + 8);
        doc.text('Total Amount', 300, yPos + 8);
        doc.text('Average', 420, yPos + 8);
        yPos += 25;
        
        exportData.category_analysis.slice(0, 10).forEach((ca, index) => {
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }
          
          // Alternating row background
          const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
          doc.rect(50, yPos, 510, 20).fillAndStroke(bgColor, '#e2e8f0');
          
          doc.fontSize(10).fillColor('#374151');
          doc.text(ca.category_name, 70, yPos + 6);
          
          // Type with badge-like appearance
          const typeColor = ca.type === 'income' ? '#059669' : '#dc2626';
          const typeBg = ca.type === 'income' ? '#ecfdf5' : '#fef2f2';
          doc.rect(180, yPos + 3, 50, 14).fillAndStroke(typeBg, typeColor);
          doc.fillColor(typeColor).text(ca.type.toUpperCase(), 185, yPos + 6);
          
          doc.fillColor('#374151');
          doc.text(ca.usage_count.toString(), 250, yPos + 6);
          doc.text(parseFloat(ca.total_amount).toFixed(2), 300, yPos + 6);
          doc.text(parseFloat(ca.avg_amount).toFixed(2), 420, yPos + 6);
          yPos += 20;
        });
        
        yPos += 30;
      }
      
      // ✅ ANALYTICS & INSIGHTS SECTION - ENHANCED LAYOUT
      if (includeAnalytics && exportData.analytics && exportData.analytics.spendingPatterns) {
        // Check if we need a new page
        if (yPos > 550) {
          doc.addPage();
          yPos = 50;
        }
        
        doc.fontSize(18).fillColor('#1e40af').text('Financial Insights & Analytics', 50, yPos);
        yPos += 35;
        
        const patterns = exportData.analytics.spendingPatterns;
        
        // ✅ TWO-COLUMN LAYOUT FOR STATISTICS CARDS
        // Left Column - Spending Averages
        doc.rect(50, yPos, 240, 90).fillAndStroke('#f0f9ff', '#3b82f6');
        doc.fontSize(12).fillColor('#1e40af').text('SPENDING AVERAGES', 70, yPos + 15);
        doc.fontSize(10).fillColor('#374151');
        doc.text(`Daily: ${patterns.avgDailySpending?.toFixed(2) || 'N/A'} ${exportData.user.currency_preference}`, 70, yPos + 40);
        doc.text(`Monthly: ${patterns.avgMonthlySpending?.toFixed(2) || 'N/A'} ${exportData.user.currency_preference}`, 70, yPos + 60);
        
        // Right Column - Financial Summary
        doc.rect(320, yPos, 240, 90).fillAndStroke('#fef3c7', '#f59e0b');
        doc.fontSize(12).fillColor('#92400e').text('FINANCIAL SUMMARY', 340, yPos + 15);
        doc.fontSize(10).fillColor('#374151');
        doc.text(`Total Income: ${patterns.totalIncome?.toFixed(2) || 'N/A'} ${exportData.user.currency_preference}`, 340, yPos + 40);
        doc.text(`Total Expenses: ${patterns.totalExpenses?.toFixed(2) || 'N/A'} ${exportData.user.currency_preference}`, 340, yPos + 60);
        
        yPos += 110;
        
        // ✅ SECOND ROW - Trend and Top Categories
        // Left Column - Spending Trend
        const trendColor = patterns.trendDirection === 'increasing' ? '#dc2626' : 
                          patterns.trendDirection === 'decreasing' ? '#059669' : '#3b82f6';
        const trendBg = patterns.trendDirection === 'increasing' ? '#fef2f2' : 
                        patterns.trendDirection === 'decreasing' ? '#ecfdf5' : '#eff6ff';
        
        doc.rect(50, yPos, 240, 70).fillAndStroke(trendBg, trendColor);
        doc.fontSize(12).fillColor(trendColor).text('SPENDING TREND', 70, yPos + 15);
        doc.fontSize(14).fillColor(trendColor).text(patterns.trendDirection?.toUpperCase() || 'STABLE', 70, yPos + 40);
        
        // Right Column - Savings Rate
        const savingsColor = patterns.savingsRate >= 20 ? '#059669' : 
                            patterns.savingsRate >= 10 ? '#3b82f6' : '#dc2626';
        const savingsBg = patterns.savingsRate >= 20 ? '#ecfdf5' : 
                         patterns.savingsRate >= 10 ? '#eff6ff' : '#fef2f2';
        
        doc.rect(320, yPos, 240, 70).fillAndStroke(savingsBg, savingsColor);
        doc.fontSize(12).fillColor(savingsColor).text('SAVINGS RATE', 340, yPos + 15);
        doc.fontSize(20).fillColor(savingsColor).text(`${patterns.savingsRate?.toFixed(1) || '0'}%`, 340, yPos + 35);
        
        yPos += 90;
        
        // ✅ TOP CATEGORIES ROW
        if (patterns.biggestExpenseCategory || patterns.biggestIncomeCategory) {
          // Left - Top Expense
          if (patterns.biggestExpenseCategory) {
            doc.rect(50, yPos, 240, 60).fillAndStroke('#fef2f2', '#dc2626');
            doc.fontSize(11).fillColor('#7f1d1d').text('TOP EXPENSE CATEGORY', 70, yPos + 12);
            doc.fontSize(13).fillColor('#dc2626').text(patterns.biggestExpenseCategory.category_name || 'N/A', 70, yPos + 32);
          }
          
          // Right - Top Income
          if (patterns.biggestIncomeCategory) {
            doc.rect(320, yPos, 240, 60).fillAndStroke('#ecfdf5', '#059669');
            doc.fontSize(11).fillColor('#065f46').text('TOP INCOME SOURCE', 340, yPos + 12);
            doc.fontSize(13).fillColor('#059669').text(patterns.biggestIncomeCategory.category_name || 'N/A', 340, yPos + 32);
          }
          
          yPos += 80;
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
