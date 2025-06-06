/**
 * Export Controller - Production Ready
 * Handles data export functionality (CSV/JSON/PDF)
 * @module controllers/exportController
 */

const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const errorCodes = require('../utils/errorCodes');
const logger = require('../utils/logger');

/**
 * Export user data as CSV
 * @route GET /api/v1/export/csv
 */
const exportAsCSV = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  try {
    const exportData = await User.getExportData(userId);
    
    if (!exportData.transactions || exportData.transactions.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NO_DATA',
          message: 'No transaction data available for export',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Build CSV content with proper escaping
    let csvContent = 'Type,Amount,Description,Category,Date,Created At\n';
    
    exportData.transactions.forEach(transaction => {
      const safeDescription = (transaction.description || '')
        .replace(/"/g, '""')
        .replace(/\r?\n/g, ' ');
      
      const row = [
        transaction.type,
        parseFloat(transaction.amount).toFixed(2),
        `"${safeDescription}"`,
        transaction.category || 'Uncategorized',
        transaction.date,
        new Date(transaction.created_at).toISOString().split('T')[0]
      ].join(',');
      
      csvContent += row + '\n';
    });
    
    const filename = `spendwise_export_${exportData.user.username.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
    
    logger.info('CSV export completed', { 
      userId, 
      recordCount: exportData.transactions.length,
      filename 
    });
    
    res.send(csvContent);
  } catch (error) {
    logger.error('CSV export failed:', { userId, error: error.message });
    throw error;
  }
});

/**
 * Export user data as JSON
 * @route GET /api/v1/export/json
 */
const exportAsJSON = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  try {
    const exportData = await User.getExportData(userId);
    
    if (!exportData.transactions || exportData.transactions.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NO_DATA',
          message: 'No transaction data available for export',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Calculate summaries efficiently
    const summary = exportData.transactions.reduce((acc, t) => {
      const amount = parseFloat(t.amount);
      if (t.type === 'income') {
        acc.totalIncome += amount;
      } else {
        acc.totalExpenses += amount;
      }
      return acc;
    }, { totalIncome: 0, totalExpenses: 0 });
    
    const jsonData = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        format: 'SpendWise JSON Export'
      },
      user: {
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
        type: t.type,
        amount: parseFloat(t.amount),
        description: t.description || '',
        category: t.category || 'Uncategorized',
        date: t.date,
        createdAt: t.created_at
      })),
      summary: {
        totalTransactions: exportData.transactions.length,
        totalIncome: Math.round(summary.totalIncome * 100) / 100,
        totalExpenses: Math.round(summary.totalExpenses * 100) / 100,
        netBalance: Math.round((summary.totalIncome - summary.totalExpenses) * 100) / 100,
        currency: exportData.user.currency_preference || 'USD'
      }
    };
    
    const filename = `spendwise_export_${exportData.user.username.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    logger.info('JSON export completed', { 
      userId, 
      recordCount: exportData.transactions.length,
      filename 
    });
    
    res.json(jsonData);
  } catch (error) {
    logger.error('JSON export failed:', { userId, error: error.message });
    throw error;
  }
});

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
