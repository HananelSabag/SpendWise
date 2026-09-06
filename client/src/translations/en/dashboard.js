/**
 * 📊 DASHBOARD TRANSLATIONS - English
 * Complete dashboard system translations for revolutionary UX
 * @version 3.0.0 - REVOLUTIONARY UPDATE
 */

import financialCycle from './financialCycle';

export default {
  title: "Dashboard",
  overview: "Overview",
  insightsPage: {
    back: "Back"
  },
  cycleV2: financialCycle,
  overdraft: {
    eyebrow: "Checking-account limit",
    setupTitle: "What is your overdraft limit?",
    editTitle: "Update your overdraft limit",
    setupHint: "How far below zero does your bank allow you to go? For a −₪5,000 limit, enter 5000. We compare it with your expected cycle-end balance.",
    setupHintMultiple: "Enter the combined limit you want to track. The dashboard currently compares it with the combined balance of connected bank accounts.",
    limitLabel: "Overdraft limit",
    limitPlaceholder: "For example 5000",
    save: "Save limit",
    cancel: "Cancel",
    edit: "Edit overdraft limit",
    exceeded: "Projected to exceed the limit by {{amount}}",
    warning: "Only {{amount}} of room is expected to remain",
    remaining: "Expected room before the limit: {{amount}}",
    safe: "Expected room before the limit: {{amount}}",
    limitSummary: "Configured limit: {{amount}}",
    basedOnForecast: "including expected income and estimated expenses",
    basedOnKnown: "after known charges, without future income",
    used: "Projected overdraft: {{amount}}",
    limitShort: "Limit: {{amount}}",
    knownScenario: "After known charges",
    forecastScenario: "Including forecast",
    activeScenario: "selected",
    scenarioExceeded: "{{amount}} beyond the limit",
    scenarioRoom: "{{amount}} left before the limit",
    disclaimer: "Compares the cycle-end balance with the limit you entered, not a limit supplied by the bank. The account can cross its limit during the cycle even if the closing balance is within it.",
    multiAccountWarning: "With multiple accounts, this is a combined comparison only. A positive balance in one account does not cancel an excess overdraft in another.",
  },
  merchantWatch: {
    title: "Watched merchants", subtitle: "Rules you created from real transactions. They flag matches without changing your totals.",
    watch: "Watch this merchant", close: "Close", chooseRule: "Choose rule", exactDescriptionHint: "Only the same transaction description will match. This never changes categories or totals.",
    all: "Every transaction", above: "Above amount", exact: "Exact amount", amountIls: "Amount (ILS)", save: "Save watch",
    created: "Watch added to Financial Cycle", createFailed: "Could not add watch", removeFailed: "Could not remove watch", loadFailed: "Could not load watches.",
    ruleAbove: "Above {{amount}}", ruleExact: "Exactly {{amount}}", matches: "{{count}} matches", remove: "Remove watch",
    recentMatches: "Recent matches", noMatches: "No transactions match these rules yet."
  },
  quickStats: "Quick Stats",
  recentActivity: "Recent Activity",
  balance: {
    title: "Current Balance",
    subtitle: "Your current financial overview",
    income: "Income",
    expenses: "Expenses",
    net: "Total",
    change: "Change",
    growth: "Growth",
    balancesHidden: "Balances hidden",
    balancesShown: "Balances shown",
    hide: "Hide balances",
    show: "Show balances",
    refresh: "Refresh balance",
    refreshed: "Balance refreshed successfully",
    noData: "No balance data available",
    loading: "Loading balance...",
    total: "Total Balance",
    currentDay: "Current Day",
    daysInMonth: "Days in Month",
    weekElapsed: "Week Elapsed",
    lastUpdate: "Last Update",
    refreshFailed: "Failed to refresh balance",
    dataUpdated: "Balance data updated",
    tryAgain: "Please try again",
    periodSelector: "Select Period",
    hideBalances: "Hide balances",
    showBalances: "Show balances",
    spent: "spent"
  },
  income: "Income",
  expenses: "Expenses",
  periods: {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly"
  },
  transactions: "Transactions",
  categories: {
    food: "Food & Dining",
    savings: "Savings"
  },
  reports: "Reports",
  settings: "Settings",
  refresh: "Refresh",
  loading: "Loading...",
  loadingDashboard: "Loading dashboard...",
  reloadPage: "Try again",
  labels: {
    updated: "Updated",
    transactionId: "Transaction ID",
    fullDate: "Full Date",
    aiInsights: "AI Insights",
    created: "Created",
    recurring: "Recurring",
    recurringAmount: "Recurring Amount"
  },
  accounts: {
    main: "Main Account"
  },
  account: {
    noTransactions: "No transactions yet"
  },
  common: {
    noData: "No data",
    hide: "Hide",
    show: "Show",
    date: {
      today: "Today",
      yesterday: "Yesterday",
      daysAgo: "{{count}}d ago"
    },
    categoryTypes: {
      food: "Food & Dining",
      income: "Income",
      transport: "Transportation",
      entertainment: "Entertainment",
      bills: "Bills & Utilities"
    },
    transactions: {
      groceries: "Groceries",
      salary: "Salary",
      fuel: "Fuel",
      coffee: "Coffee",
      electricity: "Electricity"
    }
  },
  actions: {
    edit: "Edit",
    delete: "Delete",
    duplicate: "Duplicate",
    editTransaction: "Edit Transaction",
    showSummary: "Show Summary",
    collapseSummary: "Hide Summary",
    quickExpense: "Quick Expense",
    quickExpenseDesc: "Add expense instantly",
    quickIncome: "Quick Income",
    quickIncomeDesc: "Add income instantly",
    addTransaction: "Add Transaction",
    addTransactionDesc: "Create new transaction",
    viewAnalytics: "View Analytics",
    viewAnalyticsDesc: "See financial insights",
    spendingBreakdown: "Spending Breakdown",
    spendingBreakdownDesc: "Category analysis",
    setGoal: "Set Goal",
    setGoalDesc: "Create financial goal",
    budgetPlanner: "Budget Planner",
    budgetPlannerDesc: "Plan your budget",
    currencyConverter: "Currency Converter",
    currencyConverterDesc: "Convert currencies",
    schedulePayment: "Schedule Payment",
    schedulePaymentDesc: "Set up recurring payment",
    popular: "Popular",
    lastUsed: "Last used {{time}}",
    executed: "{{action}} executed successfully",
    currencyConverterOpening: "Opening currency converter..."
  },
  category: {
    uncategorized: "Uncategorized"
  },
  insights: {
    largeTransaction: "Large Transaction",
    recurringPattern: "Recurring Pattern",
    businessExpense: "Business Expense"
  },
  timePeriods: {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly"
  },
  quickActions: {
    title: "Quick Actions",
    subtitle: "Add transactions instantly",
    expense: "Expense",
    income: "Income",
    addExpense: "Add Expense",
    addIncome: "Add Income",
    addExpenseDesc: "Add expense instantly",
    addIncomeDesc: "Add income instantly",
    transfer: "Transfer",
    viewReports: "View Reports",
    categories: "Categories",
    amount: "Amount",
    description: "Description",
    descriptionOptional: "Description (optional)",
    descriptionPlaceholder: "What was this for? (optional)",
    enterAmount: "Enter amount",
    category: "Category",
    add: "Add",
    adding: "Adding...",
    cancel: "Cancel",
    success: "Added successfully!",
    failed: "Failed to add transaction. Please try again.",
    invalidAmount: "Please enter a valid amount",
    smartCategory: "Smart category:",
    addTransaction: "Add Transaction",
    manageCategories: "Manage Categories",
    exportData: "Export Data",
    placeholder: {
      amount: "Enter amount...",
      description: "Description (optional)",
      selectCategory: "Select category"
    },
    typeSelector: "Transaction Type",
    tip: "Enter amount and press Enter or click submit",
    back: "Back"
  },
  notifications: {
    quickExpenseCreated: "Quick expense added successfully!",
    quickExpenseFailed: "Failed to add quick expense",
    quickIncomeCreated: "Quick income added successfully!",
    quickIncomeFailed: "Failed to add quick income"
  },
  recentTransactions: {
    title: "Recent Transactions",
    viewAll: "View All",
    noTransactions: "No transactions yet",
    noTransactionsDescription: "Start tracking your finances by adding your first transaction",
    getStarted: "Start tracking your finances by adding your first transaction",
    addFirst: "Add Transaction",
    loading: "Loading transactions...",
    error: "Failed to load transactions",
    refreshed: "Transactions updated",
    refreshFailed: "Failed to refresh transactions",
    showingCount: "{{count}} recent transactions",
    seeMore: "See more",
    amount: "Amount",
    category: "Category",
    date: "Date",
    lastUpdate: "Last updated {time}",
    showing: "Showing {{count}} transactions",
    selected: "Selected {{count}}"
  },
  charts: {
    title: "Financial Overview",
    expenses: "Expenses by Category",
    income: "Income Trends",
    balance: "Balance Over Time"
  },
  stats: {
    title: "Statistics",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    totalTransactions: "Total Transactions",
    avgTransaction: "Avg per Transaction",
    topCategory: "Top Category",
    monthlyBalance: "Monthly Balance",
    positive: "Positive",
    negative: "Negative"
  },
  tips: {
    title: "Smart Tips 💡",
    subtitle: "Personalized insights for better financial health",
    savingTip: "Saving 20% of your income will help you reach your savings goal faster",
    budgetTip: "Track daily expenses to better control your budget",
    categoryTip: "Dividing expenses into categories will help you identify spending patterns",
    progressTip: "Track your progress with weekly goals and celebrate small wins",
    recurringTip: "Set up recurring transactions to save time and never miss a payment",
    reviewTip: "Review your spending monthly to identify areas for improvement",
    trendTip: "Look for spending trends to make better financial decisions",
    quickTip: "Use quick actions to add transactions in seconds",
    goalTip: "Set clear financial goals and break them into smaller milestones",
    habitTip: "Build healthy money habits by tracking small daily expenses",
    rewardTip: "Reward yourself when you reach your savings targets",
    personalTip: "Customize categories to match your personal spending style"
  },
  suggestions: {
    title: "Smart Suggestions",
    subtitle: "Quick actions based on your activity",
    accept: "Apply",
    category: "Category",
    generateNew: "Generate new",
    showing: "Showing {{count}} of {{total}}",
    transactionCreated: "Transaction added from suggestion",
    failed: "Could not apply suggestion",
    morningCoffee: "Morning coffee",
    morningCoffeeDesc: "You often buy coffee in the morning — want to log it?",
    lunchRecurring: "Set lunch as recurring",
    lunchRecurringDesc: "Make your typical lunch a recurring expense for easier tracking",
    emergencyFund: "Boost your emergency fund",
    emergencyFundDesc: "Transfer a small amount to savings to reach your goal faster",
    types: {
      transaction: "Transaction",
      recurring: "Recurring",
      budget: "Budget",
      savings: "Savings",
      insight: "Insight"
    }
  },
  confidence: {
    high: "High",
    medium: "Medium",
    low: "Low",
    explanation: "Confidence: {{value}}%"
  },
  addExpense: "Add Expense",
  addIncome: "Add Income",
  // Shared labels still used by the yearly review and cycle actions.
  cycle: {
    income: "Income",
    expenses: "Expenses",
    bankMovement: "Change in your balance",
    updateFailed: "Could not save your change — please try again",
    loan: "Loan",
    yearlyTitle: "Yearly review",
    pickYear: "Choose year",
    yearlySavings: "Savings",
    savingsRate: "Savings rate",
    monthByMonth: "Month by month",
    categoryTrends: "Top spending categories",
    noYearData: "No complete cycles for this year",
    yearlyError: "Could not load this year",
  },

  mainAccount: "Main account",
  breakdown: {
    title: "Spending by category",
    auto: "auto",
    autoHint: "\"auto\" groups are guessed from bank transaction descriptions",
    other: "Other"
  },
  manualEntry: "Manual entry",
  manualEntryActions: {
    addExpense: "One-time expense",
    addIncome: "One-time income"
  },
  dashboardError: "Dashboard Error",
  dashboardErrorMessage: "Unable to load dashboard data",
  retryingIn: "Retrying in {{countdown}}s…",
  goToProfile: "Go to profile",
  analytics: "Analytics",
  goals: "Goals",
  refreshed: "Dashboard refreshed successfully",
  refreshError: "Dashboard refresh failed",
  greetings: {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
    night: "Good night"
  },
  overviewSection: {
    quickActions: {
      title: "Quick Actions",
      security: "Security",
      share: "Share",
      smart: "Smart",
      help: "Help"
    },
    recentActivity: "Recent Activity",
    items: "Items",
    viewAll: "View All",
    achievements: {
      title: "Achievements"
    }
  },
  sections: {
    balance: "Balance",
    transactions: "Recent Transactions",
    analytics: "Analytics",
    quickActions: "Quick Actions",
    overview: "Overview"
  },
  commonElements: {
    profilePicture: "Profile Picture",
    categoryTypes: {
      food: "Food & Beverages",
      income: "Income",
      transport: "Transportation",
      entertainment: "Entertainment",
      bills: "Bills",
      shopping: "Shopping",
      health: "Health",
      education: "Education",
      travel: "Travel",
      other: "Other"
    },
    transactions: {
      groceries: "Grocery Shopping",
      salary: "Salary",
      fuel: "Car Fuel",
      coffee: "Coffee",
      electricity: "Electricity",
      water: "Water",
      gas: "Gas",
      internet: "Internet",
      phone: "Phone",
      rent: "Rent"
    }
  }
};
