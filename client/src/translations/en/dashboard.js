/**
 * 📊 DASHBOARD TRANSLATIONS - English
 * Complete dashboard system translations for revolutionary UX
 * @version 3.0.0 - REVOLUTIONARY UPDATE
 */

export default {
  title: 'Dashboard',
  overview: 'Overview',
  welcome: 'Welcome back!',
  quickStats: 'Quick Stats',
  recentActivity: 'Recent Activity',
  balance: 'Balance',
  income: 'Income',
  expenses: 'Expenses',
  transactions: 'Transactions',
  categories: 'Categories',
  reports: 'Reports',
  settings: 'Settings',

  // ✅ FIXED: Welcome messages with time-based greetings
  welcome: {
    goodMorning: 'Good morning, {{name}}! 🌅',
    goodAfternoon: 'Good afternoon, {{name}}! ☀️',
    goodEvening: 'Good evening, {{name}}! 🌙',
    general: 'Hello, {{name}}! 👋'
  },

  // ✅ FIXED: Navigation actions
  refresh: 'Refresh',
  loading: 'Loading...',
  loadingDashboard: 'Loading dashboard...',
  reloadPage: 'Try again',

  // ✅ Labels for transaction details
  labels: {
    updated: 'Updated',
    transactionId: 'Transaction ID',
    fullDate: 'Full Date',
    aiInsights: 'AI Insights', 
    created: 'Created',
    recurring: 'Recurring',
    recurringAmount: 'Recurring Amount'
  },

  // ✅ FIXED: Account-related translations
  accounts: {
    main: 'Main Account'
  },

  account: {
    noTransactions: 'No transactions yet'
  },

  // ✅ FIXED: Common UI translations
  common: {
    hide: 'Hide',
    show: 'Show',
    categoryTypes: {
      food: 'Food & Dining',
      income: 'Income',
      transport: 'Transportation',
      entertainment: 'Entertainment',
      bills: 'Bills & Utilities'
    },
    transactions: {
      groceries: 'Groceries',
      salary: 'Salary',
      fuel: 'Fuel',
      coffee: 'Coffee',
      electricity: 'Electricity'
    }
  },

  // ✅ FIXED: Action translations for TransactionCard and other components
  actions: {
    edit: 'Edit',
    delete: 'Delete', 
    duplicate: 'Duplicate',
    editTransaction: 'Edit Transaction',
    showSummary: 'Show Summary',
    collapseSummary: 'Hide Summary',
    quickExpense: 'Quick Expense',
    quickExpenseDesc: 'Add expense instantly',
    quickIncome: 'Quick Income', 
    quickIncomeDesc: 'Add income instantly',
    addTransaction: 'Add Transaction',
    addTransactionDesc: 'Create new transaction',
    viewAnalytics: 'View Analytics',
    viewAnalyticsDesc: 'See financial insights',
    spendingBreakdown: 'Spending Breakdown',
    spendingBreakdownDesc: 'Category analysis',
    setGoal: 'Set Goal',
    setGoalDesc: 'Create financial goal',
    budgetPlanner: 'Budget Planner',
    budgetPlannerDesc: 'Plan your budget',
    currencyConverter: 'Currency Converter',
    currencyConverterDesc: 'Convert currencies',
    schedulePayment: 'Schedule Payment',
    schedulePaymentDesc: 'Set up recurring payment',
    popular: 'Popular',
    lastUsed: 'Last used {{time}}',
    executed: '{{action}} executed successfully',
    currencyConverterOpening: 'Opening currency converter...'
  },

  // ✅ FIXED: Category translations
  category: {
    uncategorized: 'Uncategorized'
  },

  // ✅ FIXED: Insights translations
  insights: {
    largeTransaction: 'Large Transaction',
    recurringPattern: 'Recurring Pattern',
    businessExpense: 'Business Expense'
  },

  // ✅ FIXED: Time periods for balance tabs  
  timePeriods: {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly'
  },

  // ✅ FIXED: Balance section translations
  balance: {
    title: 'Current Balance',
    income: 'Income',
    expenses: 'Expenses',
    net: 'Total',
    change: 'Change',
    growth: 'Growth',
    balancesHidden: 'Balances hidden',
    balancesShown: 'Balances shown',
    refreshed: 'Balance refreshed successfully'
  },

  // ✅ FIXED: Period summary translations
  periodSummary: {
    daily: 'Daily financial activity',
    weekly: 'Week summary',
    monthly: 'Month overview',
    yearly: 'Year progress'
  },
  
  // Quick Actions
  quickActions: {
    title: 'Quick Actions',
    addExpense: 'Add Expense',
    addIncome: 'Add Income', 
    transfer: 'Transfer',
    viewReports: 'View Reports',
    categories: 'Categories',
    amount: 'Amount',
    description: 'Description',
    category: 'Category',
    add: 'Add',
    cancel: 'Cancel',
    success: 'Added successfully!',
    addTransaction: 'Add Transaction',
    viewReports: 'View Reports',
    manageCategories: 'Manage Categories',
    exportData: 'Export Data',
    placeholder: {
      amount: 'Enter amount...',
      description: 'Description (optional)',
      selectCategory: 'Select category'
    }
  },

  // ✅ FIXED: Notification messages
  notifications: {
    quickExpenseCreated: 'Quick expense added successfully!',
    quickExpenseFailed: 'Failed to add quick expense',
    quickIncomeCreated: 'Quick income added successfully!',
    quickIncomeFailed: 'Failed to add quick income'
  },
  
  // ✅ FIXED: Recent Transactions (no duplicates)
  recentTransactions: {
    title: 'Recent Transactions',
    viewAll: 'View All',
    noTransactions: 'No recent transactions',
    noTransactionsDescription: 'Start tracking your finances by adding your first transaction',
    amount: 'Amount',
    category: 'Category',
    date: 'Date',
    lastUpdate: 'Last updated {time}',
    showing: 'Showing {count} transactions'
  },
  
  // Charts
  charts: {
    title: 'Financial Overview',
    expenses: 'Expenses by Category',
    income: 'Income Trends',
    balance: 'Balance Over Time'
  },

  // ✅ MISSING: Stats section
  stats: {
    title: 'Statistics',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    totalTransactions: 'Total Transactions',
    avgTransaction: 'Avg per Transaction',
    topCategory: 'Top Category'
  },

  // ✅ MISSING: Tips section
  tips: {
    title: 'Smart Tips 💡',
    savingTip: 'Saving 20% of your income will help you reach your savings goal faster',
    budgetTip: 'Track daily expenses to better control your budget',
    categoryTip: 'Dividing expenses into categories will help you identify spending patterns'
  }
}; 