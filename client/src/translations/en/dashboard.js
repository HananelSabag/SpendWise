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

  // ✅ ADDED: Missing account-related translations
  accounts: {
    main: 'Main Account'
  },

  account: {
    noTransactions: 'No transactions yet'
  },

  // ✅ ADDED: Common UI translations
  common: {
    hide: '🙈 Hide',
    show: '👁️ Show'
  },

  // ✅ ADDED: Time periods for balance tabs  
  timePeriods: {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly'
  },

  // ✅ ADDED: Balance section translations
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

  // ✅ ADDED: Period summary translations
  periodSummary: {
    daily: 'Daily financial activity',
    weekly: 'Week summary',
    monthly: 'Month overview',
    yearly: 'Year progress'
  },
  
  // Quick Actions
  quickActions: {
    title: 'Quick Actions',
    addTransaction: 'Add Transaction',
    viewReports: 'View Reports',
    manageCategories: 'Manage Categories',
    exportData: 'Export Data'
  },

  // ✅ ADDED: Quick Action Buttons
  actions: {
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

  // ✅ ADDED: Notification messages
  notifications: {
    quickExpenseCreated: 'Quick expense added successfully!',
    quickExpenseFailed: 'Failed to add quick expense',
    quickIncomeCreated: 'Quick income added successfully!',
    quickIncomeFailed: 'Failed to add quick income'
  },
  
  // Recent Transactions
  recentTransactions: {
    title: 'Recent Transactions',
    viewAll: 'View All',
    noTransactions: 'No recent transactions',
    noTransactionsDescription: 'Start tracking your finances by adding your first transaction',
    amount: 'Amount',
    category: 'Category',
    date: 'Date'
  },
  
  // Charts
  charts: {
    title: 'Financial Overview',
    expenses: 'Expenses by Category',
    income: 'Income Trends',
    balance: 'Balance Over Time'
  }
}; 