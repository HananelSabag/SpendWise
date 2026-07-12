/**
 * 📊 DASHBOARD TRANSLATIONS - English
 * Complete dashboard system translations for revolutionary UX
 * @version 3.0.0 - REVOLUTIONARY UPDATE
 */

export default {
  title: "Dashboard",
  overview: "Overview",
  runway: {
    currentTitle: "Current cycle",
    inChecking: "in checking",
    balanceUnavailable: "Balance unavailable",
    sinceSalary: "Since paycheck · {{date}}",
    byMonth: "By month",
    spentSince: "Spent since",
    incomeExSalary: "Income (excl. salary)",
    pending: "Pending",
    pendingIncluded: "includes {{amount}} still pending",
    dailyAvgSpent: "Avg spend/day",
    daysInCycle: "{{n}} days in cycle",
    salaryReceived: "Salary received",
    dailyHistory: "Daily history",
    needsSalary: "No salary detected yet — mark it to anchor the cycle to your payday.",
    fallbackNote: "Showing by calendar month until there's a prior salary to anchor on.",
  },
  monthlyAccounting: {
    previousMonth: "Previous month summary",
    status: { open: "Open month", closed: "Closed month", awaitingSalary: "Waiting for salary", awaitingSettlement: "Card charges still settling", needsReview: "Needs review" },
    actualIncome: "Actual income", spending: "Spending", actualNet: "Actual net",
    itemizedCard: "Itemized card spending", bankCardCharge: "Card spending from bank charge", bankDirect: "Direct bank spending", pending: "Pending",
    avgDailySpend: "Average spend/day", avgDailyIncome: "Average income/day", cardVerification: "Card verification", matched: "Matched", difference: "Difference {{amount}}",
    salarySearch: "Looking for salary deposits…", noSalaryCandidate: "No matching income found yet. This month will close after salary arrives and syncs.",
    chooseSalary: "Which deposit is your salary?", chooseSalaryHint: "Choose once so future salaries can be assigned to the previous work month.", salarySaveFailed: "Could not save. Please try again."
  },
  salaryReview: {
    title: "Two deposits look like salary", description: "Both map to {{month}} from the same employer. Classify each so a bonus does not create a false salary cycle.",
    salary: "Salary", bonus: "Bonus / extra", other: "Other income", moreReviews: "{{count}} more reviews after this",
    storedHint: "The choice is stored with the transaction and can be changed later.", save: "Save classification", saveFailed: "Save failed."
  },
  dailyFlow: {
    eyebrow: "Salary to salary", title: "What happened each day", subtitle: "Facts only — no forecast and no double-counted card settlement.",
    current: "Current", previous: "Previous", days: "{{count}} days", out: "Out", incomeExSalary: "In, ex salary", cycleNet: "Cycle net",
    outToday: "Out today", inToday: "In today", cumulativeNet: "Cumulative net", dailyOut: "Daily out", dailyIncomeExSalary: "Income excluding salary",
    ledger: "Daily ledger", items: "{{count}} items", salaryReceived: "Salary received", stillPending: "{{amount}} still pending",
    needsReview: "{{count}} needs review", refund: "refund", noActivity: "No activity in this cycle."
  },
  projection: {
    eyebrow: "Optional planning", title: "What remains after expected events", subtitle: "This layer never changes transactions or factual totals. It only lets you test a scenario.",
    enable: "Enable planning", factualHint: "The current balance remains a bank fact; the planned number is always labelled separately.",
    expectedSalary: "Expected salary", manualCharge: "Manual expected charge", amount: "Amount", date: "Date", chargeLabel: "Charge label", chargePlaceholder: "e.g. unconnected card",
    salarySuggestion: "Leave blank to use the last salary for planning: {{amount}}", realBalance: "Real balance now", expectedNet: "Expected in minus out", plannedBalance: "Planned balance",
    saved: "Plan saved.", saveFailed: "Could not save.", saving: "Saving…", save: "Save plan"
  },
  insightsPage: {
    back: "Back", title: "Months & insights", subtitle: "Your full financial story, away from the home dashboard",
    recurringTitle: "Recurring patterns", recurringSubtitle: "Merchants seen in at least two months — a useful signal, not a guaranteed bill.",
    months: "{{count}} months", noPatterns: "Not enough history to detect patterns yet.", transactionsTitle: "Transactions in this calendar month",
    transactionCount: "{{count}} transactions by factual purchase or bank date", noTransactions: "No transactions in this calendar month."
  },
  merchantWatch: {
    title: "Watched merchants", subtitle: "Rules you created from real transactions. They flag matches without changing your totals.",
    watch: "Watch this merchant", close: "Close", chooseRule: "Choose rule", exactDescriptionHint: "Only the same transaction description will match. This never changes categories or totals.",
    all: "Every transaction", above: "Above amount", exact: "Exact amount", amountIls: "Amount (ILS)", save: "Save watch",
    created: "Watch added to Insights", createFailed: "Could not add watch", removeFailed: "Could not remove watch", loadFailed: "Could not load watches.",
    ruleAbove: "Above {{amount}}", ruleExact: "Exactly {{amount}}", matches: "{{count}} matches", remove: "Remove watch",
    recentMatches: "Recent matches", noMatches: "No transactions match these rules yet."
  },
  welcome: {
    goodMorning: "Good morning, {{name}}! 🌅",
    goodAfternoon: "Good afternoon, {{name}}! ☀️",
    goodEvening: "Good evening, {{name}}! 🌙",
    general: "Hello, {{name}}! 👋"
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
  periodSummary: {
    daily: "Daily financial activity",
    weekly: "Week summary",
    monthly: "Month overview",
    yearly: "Year progress"
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
    showingCount: "Showing {{count}} of {{total}}",
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
  period: {
    title: "This calendar month",
    selectedTitle: "Selected calendar month",
    cashFlowHint: "Income and committed spending for this calendar month",
    soFar: "so far",
    runningHint: "Calendar-month activity through today",
    current: "Current month",
    previous: "Previous month",
    periodsAgo: "{{count}} months ago",
    navigator: "Calendar month navigator",
    older: "Older month",
    newer: "Newer month",
    now: "Now",
    last: "Last",
    twoAgo: "2 ago",
    backToCurrent: "Back to current month",
    income: "Income",
    expenses: "Expenses",
    net: "Net"
  },
  moneyModel: {
    title: "How this calendar month is counted",
    subtitle: "Each purchase or bank expense is counted once on its factual date.",
    cashflowSubtitle: "These rows add up exactly to committed spending. Pending amounts are included as subsets.",
    bankDirect: "Direct bank spending - completed",
    bankDirectPending: "Direct bank spending - pending",
    bankDirectHint: "Cash flow that really left or entered your bank account.",
    statementSubtitle: "Card purchases use their factual purchase date. Summarized settlements are verification only when itemized detail exists.",
    cardPurchases: "Card purchases - completed",
    cardPurchasesPending: "Card purchases - pending",
    cardPurchasesHint: "Itemized purchases from connected credit companies, counted by purchase date.",
    manual: "Manual entries",
    manualHint: "One-time transactions you added yourself.",
    committedTotal: "Committed spending",
    compositionMismatch: "The displayed parts do not match the committed total. Refresh or review the sync before relying on this number.",
    settlementHint: "A summarized bank card settlement is kept as statement-verification evidence and is not added again when itemized purchases are connected.",
    settlementsExcluded: "{{amount}} in bank card-payment withdrawals is not counted again because the card purchases are connected.",
    settlementsCounted: "{{amount}} in card-payment withdrawals is counted from the bank because no card-company purchase detail is connected."
  },
  mainAccount: "Main account",
  sourcesOverview: {
    banksTitle: "Bank accounts",
    cardsTitle: "Credit companies",
    bankActivityTitle: "Current accounts",
    cardActivityTitle: "Card activity",
    manage: "Manage",
    connectMore: "Connect a source",
    balance: "Available balance",
    balanceUnavailable: "Balance not available",
    balanceUnavailableHint: "This bank doesn't share a balance — activity still syncs",
    charges: "Charges this period",
    txnCount: "{{count}} synced",
    staleWarning: "Not synced in over a day",
    neverSynced: "Not synced yet",
    syncedAgo: "Synced {{time}}",
    syncedRecently: "Synced recently",
    cardExplainer: "Card charges appear here per purchase, then as one summarized charge in your bank account",
    accountAsOf: "{{count}} transactions · as of {{date}}",
    accountNoActivity: "No transactions this period",
    chargedLabel: "charged"
  },
  bankCosts: {
    title: "Bank account charges",
    subtitle: "Fees, repayments and cash withdrawals counted in the selected calendar month",
    feesInterest: "Fees & Interest",
    loanPayments: "Loan Payments",
    cashWithdrawn: "Cash Withdrawn"
  },
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
