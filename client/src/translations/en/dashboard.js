/**
 * 📊 DASHBOARD TRANSLATIONS - ENGLISH
 * Complete dashboard system translations for revolutionary UX
 * @version 3.0.0 - REVOLUTIONARY UPDATE
 */

export default {
  // Welcome messages
  welcome: {
    title: "Welcome back, {{name}}!",
    subtitle: "Here's your financial overview",
    greeting: {
      morning: "Good morning, {{name}}!",
      afternoon: "Good afternoon, {{name}}!",  
      evening: "Good evening, {{name}}!"
    }
  },

  // View modes
  viewModes: {
    overview: "Overview",
    analytics: "Analytics", 
    goals: "Goals",
    insights: "Insights"
  },

  // Smart insights
  insights: {
    title: "Smart Insights",
    available: "available",
    categories: {
      optimization: "Optimization",
      spending: "Spending Alert", 
      goals: "Goal Progress",
      trends: "Trend Analysis"
    },
    
    // Insight types
    savingsOpportunity: {
      title: "Savings Opportunity Detected",
      description: "Based on your spending patterns, you could save more by optimizing your subscription expenses."
    },
    spendingAlert: {
      title: "Budget Alert",
      description: "Your food & dining expenses are 20% higher than usual this month."
    },
    goalAchievement: {
      title: "Goal Achievement!",
      description: "Congratulations! You're ahead of schedule on your emergency fund goal."
    },

    // Insight metrics
    potential: "Potential Savings",
    thisMonth: "This Month",
    overBudget: "Over Budget", 
    category: "Category",
    completed: "Completed",
    ahead: "Ahead of Schedule",

    // Insight actions  
    optimize: "Optimize Now",
    adjustBudget: "Adjust Budget",
    viewGoals: "View Goals",
    
    // Detailed insights
    detailedTitle: "Detailed Insights",
    comingSoon: "Advanced AI-powered insights coming soon!"
  },

  // Financial health
  healthScore: {
    title: "Financial Health",
    tooltip: "Your overall financial wellness score",
    outOf100: "/ 100",
    levels: {
      excellent: "Excellent",
      good: "Good", 
      fair: "Fair",
      poor: "Needs Improvement"
    }
  },

  health: {
    savingsRate: "Savings Rate",
    budgetControl: "Budget Control",
    expenseRatio: "Expense Ratio", 
    diversification: "Diversification"
  },

  // Balance panel
  balance: {
    title: "Account Balance",
    available: "Available Balance",
    pending: "Pending",
    invested: "Invested",
    savings: "Savings",
    totalAssets: "Total Assets",
    
    trends: {
      title: "Recent Trends",
      thisMonth: "This Month",
      lastMonth: "Last Month",
      change: "Change",
      growth: "Growth"
    },

    insights: {
      title: "Balance Insights",
      cashFlow: "Cash Flow",
      savingsGoal: "Savings Goal",
      spendingPattern: "Spending Pattern"
    }
  },

  // Quick actions
  quickActions: {
    title: "Quick Actions",
    addIncome: {
      title: "Add Income",
      description: "Record salary, freelance, or other income"
    },
    addExpense: {
      title: "Add Expense", 
      description: "Log purchases, bills, or other expenses"
    },
    viewAnalytics: {
      title: "View Analytics",
      description: "Detailed spending and income analysis"
    },
    setGoals: {
      title: "Set Goals",
      description: "Create and track financial goals"
    },
    schedulePayment: {
      title: "Schedule Payment",
      description: "Set up recurring or future payments"
    },
    exportData: {
      title: "Export Data",
      description: "Download your financial data"
    },

    // Smart suggestions
    smartSuggestion: {
      title: "Smart Suggestion",
      description: "AI-powered recommendation based on your habits",
      action: "Learn More"
    },

    moreActions: "More Actions",
    comingSoon: "Feature coming soon!"
  },

  // Statistics
  stats: {
    title: "Financial Statistics",
    subtitle: "Your financial overview for {{period}}",
    
    // Metrics
    totalIncome: "Total Income",
    totalExpenses: "Total Expenses", 
    netWorth: "Net Worth",
    savingsRate: "Savings Rate",
    expenseRatio: "Expense Ratio",
    budgetUtilization: "Budget Used",
    
    // Trends
    trends: {
      up: "Up from last period",
      down: "Down from last period", 
      same: "Same as last period"
    }
  },

  // Recent transactions
  recentTransactions: {
    title: "Recent Transactions",
    subtitle: "{{count}} recent transactions",
    
    // Empty states
    noTransactions: "No transactions yet",
    noTransactionsDesc: "Start by adding your first transaction",
    noFilteredTransactions: "No transactions match your filter",
    
    // Stats
    showing: "Showing {{shown}} of {{total}}",
    lastUpdate: "Last updated {{time}}",
    activeDays: "active days"
  },

  // Charts
  charts: {
    title: "Charts & Analytics",
    subtitle: "Financial data for {{period}}",
    
    types: {
      bar: "Bar Chart",
      line: "Line Chart", 
      area: "Area Chart",
      pie: "Pie Chart"
    },
    
    noData: "No Data Available",
    noDataDescription: "Add some transactions to see your charts",
    animations: "Animations",
    dataPoints: "{{count}} data points"
  },

  // Analytics section
  analytics: {
    title: "Advanced Analytics",
    comingSoon: "Comprehensive analytics dashboard coming soon!"
  },

  // Goals section  
  goals: {
    title: "Financial Goals",
    comingSoon: "Goal tracking and management coming soon!"
  },

  // Calendar
  calendar: {
    title: "Transaction Calendar",
    month: "Month",
    week: "Week", 
    today: "Today",
    transactions: "transactions",
    income: "Income",
    expenses: "Expenses"
  },

  // Filters
  filters: {
    all: "All",
    income: "Income",
    expenses: "Expenses"
  },

  // Actions
  actions: {
    addTransaction: "Add Transaction",
    refresh: "Refresh",
    export: "Export",
    viewAll: "View All",
    hideAmounts: "Hide Amounts",
    showAmounts: "Show Amounts",
    clearFilter: "Clear Filter"
  },

  // Loading states
  loading: {
    dashboard: "Loading your dashboard...",
    transactions: "Loading transactions...",
    analytics: "Loading analytics...",
    refreshing: "Refreshing data..."
  },

  // Success messages
  success: {
    dataRefreshed: "Dashboard refreshed successfully",
    transactionAdded: "Transaction added successfully",
    goalCreated: "Goal created successfully",
    exportCompleted: "Data exported successfully"
  },

  // Error messages
  errors: {
    refreshFailed: "Failed to refresh dashboard data",
    loadingFailed: "Failed to load dashboard",
    connectionError: "Connection error - please try again",
    dataUnavailable: "Dashboard data temporarily unavailable"
  },

  // Time periods
  periods: {
    today: "Today",
    week: "This Week",
    month: "This Month", 
    quarter: "This Quarter",
    year: "This Year",
    custom: "Custom Range"
  },

  // Performance metrics
  performance: {
    title: "Performance Metrics",
    monthlyGrowth: "Monthly Growth",
    savingsGoal: "Savings Goal Progress",
    budgetAdherence: "Budget Adherence",
    expenseOptimization: "Expense Optimization"
  }
}; 