/**
 * 📄 PAGES TRANSLATIONS - ENGLISH
 * Page titles, subtitles and descriptions
 * @version 1.0.0
 */

export default {
  // Transaction pages
  transactions: {
    title: 'Transactions',
    subtitle: 'Manage all your financial transactions',
    description: 'View, add, and edit transactions',
    noTransactions: 'No transactions yet',
    loadingTransactions: 'Loading transactions...'
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview of your financial status',
    description: 'Insights and quick actions'
  },

  // Analytics
  analytics: {
    title: 'Analytics',
    subtitle: 'Real-time insights from your financial data',
    description: 'Charts, reports and analysis',
    healthTitle: 'Financial Health',
    healthDesc: 'Comprehensive analysis of your financial well-being with personalized recommendations',
    insightsTitle: 'Smart Insights',
    insightsDesc: 'AI-powered insights and spending forecasts to help you make better financial decisions',
    dataUpdated: 'Data updated:',
    realTime: 'Real-time',
    showingPeriod: 'Showing {{days}} day period',
    period: { '7d': '7D', '30d': '30D', '3m': '3M', '1y': '1Y' },
    errorTitle: 'Failed to Load Analytics',
    errorMessage: 'Unable to fetch analytics data',
    retry: 'Retry',
    health: 'Financial Health',
    level: {
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      poor: 'Poor'
    },
    savingsRate: 'Savings Rate',
    lastNDays: 'Last {{days}} days',
    categoriesUsed: 'Categories Used',
    activeCategories: 'Active categories',
    financialSummaryPeriod: 'Financial Summary ({{days}} days)',
    income: 'Income',
    expenses: 'Expenses',
    netBalance: 'Net Balance',
    transactionInsights: 'Transaction Insights',
    totalTransactions: 'Total Transactions',
    avgTransaction: 'Avg. Transaction',
    recentTransactions: 'Recent Transactions',
    transactionFallback: 'Transaction'
  },

  // Categories
  categories: {
    title: 'Categories',
    subtitle: 'Manage your expense and income categories',
    description: 'Organize and customize your categories'
  },

  // Profile
  profile: {
    title: 'Profile',
    subtitle: 'User settings and personal preferences',
    description: 'Manage your profile and preferences'
  },

  // Settings
  settings: {
    title: 'Settings',
    subtitle: 'Customize your app experience',
    description: 'Theme, language, notifications and more'
  },

  // Goals
  goals: {
    title: 'Goals',
    subtitle: 'Set and track financial goals',
    description: 'Savings targets, spending limits and more'
  },

  // Budget
  budget: {
    title: 'Budget',
    subtitle: 'Plan and manage your budget',
    description: 'Spending limits and monitoring'
  },

  // Blocked page
  blocked: {
    title: 'Your account is blocked',
    description: 'Your account has been temporarily blocked. If this is a mistake, please contact support.',
    reasonTitle: 'Reason',
    expiresAt: 'Block active until: {{date}}',
    logout: 'Log out',
    contact: 'Contact Support'
  }
}; 