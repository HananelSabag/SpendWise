/**
 * 💰 TRANSACTIONS TRANSLATIONS - ENGLISH
 * Complete transaction system translations
 * @version 2.0.0
 */

export default {
  // Page titles and navigation
  title: "Transactions",
  subtitle: "Manage your financial transactions",
  total: "total",
  loading: "Loading transactions...",
  
  // Transaction types
  types: {
    income: "Income",
    expense: "Expense",
    transfer: "Transfer",
    all: "All Types"
  },
  // Aliases for legacy keys used in some components
  transaction: {
    type: {
      income: "Income",
      expense: "Expense"
    }
  },

  // Transaction fields
  fields: {
    description: {
      label: "Description",
      placeholder: "Enter transaction description"
    },
    amount: {
      label: "Amount",
      placeholder: "0.00",
      helper: "Enter the transaction amount"
    },
    category: {
      label: "Category", 
      placeholder: "Select a category",
      search: "Search categories...",
      createNew: "Create new category",
      helper: "Choose a category from the list or create a new one"
    },
    date: {
      label: "Date",
      helper: "Transaction date",
      helperWithTime: "Transaction date and time"
    },
    type: {
      label: "Transaction Type",
      helper: "Choose whether this is income or expense"
    },
    tags: {
      label: "Tags",
      placeholder: "Add tags...",
      helper: "Tags for organization and sorting (optional)"
    },
    notes: {
      label: "Notes",
      placeholder: "Additional notes...",
      helper: "Additional information about the transaction (optional)"
    },
    receipt: "Receipt",
    recurring: {
      title: "Recurring Transaction",
      description: "Set up a transaction that repeats regularly",
      frequency: "Frequency",
      interval: "Repeat Every",
      endType: "End Type",
      endDate: "End Date",
      maxOccurrences: "Number of Occurrences"
    },
    advanced: {
      title: "Advanced Settings"
    }
  },

  // Frequencies
  frequencies: {
    daily: "Daily",
    weekly: "Weekly", 
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly"
  },

  // End types
  endTypes: {
    never: "Never",
    date: "On Date",
    occurrences: "After Count"
  },

  // Placeholders
  placeholders: {
    description: "Enter transaction description",
    amount: "0.00",
    selectCategory: "Select a category",
    recurringDescription: "Monthly subscription, Weekly groceries, etc.",
    searchTransactions: "Search transactions...",
    addTags: "Add tags...",
    notes: "Additional notes..."
  },

  // Actions
  actions: {
    add: "Add Transaction",
    addTransaction: "Add Transaction",
    edit: "Edit Transaction",
    delete: "Delete Transaction",
    duplicate: "Duplicate",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    next: "Next",
    previous: "Previous",
    create: "Create",
    update: "Update",
    filter: "Filter",
    sort: "Sort",
    search: "Search",
    export: "Export",
    import: "Import",
    refresh: "Refresh",
    clearFilters: "Clear Filters",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    bulkActions: "Bulk Actions",
    viewDetails: "View Details"
  },

  // Labels
  labels: {
    recurring: "Recurring",
    oneTime: "One-time",
    template: "Template",
    noDescription: "No description",
    uncategorized: "Uncategorized",
    noReceipt: "No receipt",
    hasReceipt: "Has receipt",
    verified: "Verified",
    pending: "Pending",
    failed: "Failed"
  },

  // View modes
  viewMode: {
    cards: "Cards",
    list: "List",
    compact: "Compact",
    table: "Table"
  },

  // Search and filters
  search: {
    placeholder: "Search by description, category, or amount...",
    noResults: "No transactions found",
    results: "{{count}} results found"
  },

  filter: {
    title: "Filters",
    types: "Transaction Types",
    categories: "Categories",
    dateRange: "Date Range",
    amountRange: "Amount Range",
    status: "Status",
    tags: "Tags",
    hasReceipt: "Has Receipt",
    isRecurring: "Is Recurring"
  },

  // Sorting
  sort: {
    title: "Sort By",
    date: "Date",
    amount: "Amount",
    description: "Description",
    category: "Category",
    type: "Type",
    status: "Status",
    created: "Created Date"
  },

  // Date ranges
  dateRange: {
    title: "Date Range",
    all: "All Time",
    today: "Today",
    yesterday: "Yesterday",
    week: "This Week",
    lastWeek: "Last Week",
    month: "This Month",
    lastMonth: "Last Month",
    quarter: "This Quarter",
    year: "This Year",
    custom: "Custom Range"
  },

  // Statistics
  statistics: {
    total: "Total",
    income: "Income",
    expenses: "Expenses",
    net: "Net",
    average: "Average",
    count: "Count",
    highest: "Highest",
    lowest: "Lowest"
  },

  // Empty states
  emptyStates: {
    noTransactions: "No transactions yet",
    noTransactionsDesc: "Start by adding your first transaction",
    noResults: "No matching transactions",
    noResultsDesc: "Try adjusting your search or filters",
    noRecurring: "No recurring transactions",
    noRecurringDesc: "Set up recurring transactions to automate your finances"
  },

  // Selection
  selection: {
    count: "{{count}} selected",
    none: "None selected",
    all: "All selected"
  },

  // Recurring transactions
  recurring: {
    title: "Recurring Transactions",
    description: "Manage your recurring transactions and templates",
    manage: "Manage Recurring",
    tooltip: "Recurring Transaction",
    create: {
      title: "Create Recurring Transaction",
      subtitle: "Set up automatic transactions"
    },
    edit: {
      title: "Edit Recurring Transaction",
      subtitle: "Update recurring transaction settings"
    },
    steps: {
      setup: {
        title: "Setup Recurring Transaction",
        description: "Configure the recurring transaction details"
      },
      preview: {
        title: "Preview",
        description: "Review the settings before saving"
      },
      confirm: {
        title: "Confirm Creation",
        description: "Confirm creating the recurring transaction"
      }
    },
    modal: {
      createTitle: "Create Recurring Transaction",
      editTitle: "Edit Recurring Transaction"
    },
    
    // Frequency
    frequency: {
      title: "Frequency",
      daily: "Daily",
      weekly: "Weekly",
      biweekly: "Bi-weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      yearly: "Yearly",
      custom: "Custom"
    },

    // Interval
    interval: {
      title: "Repeat Every",
      every: "Every",
      daily: "{{count}} day",
      daily_plural: "{{count}} days",
      weekly: "{{count}} week",
      weekly_plural: "{{count}} weeks",
      monthly: "{{count}} month",
      monthly_plural: "{{count}} months",
      yearly: "{{count}} year",
      yearly_plural: "{{count}} years"
    },

    // End types
    endType: {
      title: "End Date",
      never: "Never",
      neverDesc: "Continue indefinitely",
      date: "On Date",
      dateDesc: "End on a specific date",
      occurrences: "After Count",
      occurrencesDesc: "End after a number of occurrences"
    },

    // Other fields
    startDate: "Start Date",
    endDate: "End Date",
    maxOccurrences: "Number of Occurrences",
    isActive: "Active",
    nextDate: "Next Transaction",
    lastDate: "Last Transaction",
    
    // Summary
    summary: {
      title: "Summary",
      preview: "Preview Upcoming Transactions"
    },

    // Preview
    preview: {
      title: "Upcoming Transactions",
      moreTransactions: "...and more"
    },

    // Actions
    pause: "Pause",
    resume: "Resume",
    skip: "Skip Next",
    
    // Count
    occurrencesCount: "{{count}} occurrence",
    occurrencesCount_plural: "{{count}} occurrences"
  },

  // Short keys used by RecurringTransactionsManager
  recurringShort: {
    loading: "Loading recurring transactions..."
  },

  // Delete confirmations
  delete: {
    title: "Delete Transaction",
    description: "Are you sure you want to delete this transaction?",
    warning: "This action cannot be undone.",
    confirm: "Delete Transaction",
    
    recurring: {
      title: "Delete Recurring Transaction",
      options: "What would you like to delete?",
      single: "This Occurrence Only",
      singleDescription: "Delete only this single transaction",
      future: "This and Future",
      futureDescription: "Delete this and all future occurrences",
      all: "All Occurrences",
      allDescription: "Delete all past and future occurrences",
      allWarning: "This will delete ALL occurrences of this recurring transaction.",
      futureWarning: "This will delete this occurrence and all future ones."
    }
  },

  // Transaction status
  status: {
    completed: "Completed",
    pending: "Pending",
    failed: "Failed",
    cancelled: "Cancelled",
    scheduled: "Scheduled",
    processing: "Processing"
  },

  // Categories
  categories: {
    title: "Categories",
    add: "Add Category",
    edit: "Edit Category",
    delete: "Delete Category",
    income: "Income Categories",
    expense: "Expense Categories",
    uncategorized: "Uncategorized",
    
    // Default categories
    salary: "Salary",
    freelance: "Freelance",
    investment: "Investment",
    business: "Business",
    gifts: "Gifts",
    other: "Other",
    
    food: "Food & Dining",
    transportation: "Transportation",
    shopping: "Shopping",
    entertainment: "Entertainment",
    bills: "Bills & Utilities",
    healthcare: "Healthcare",
    education: "Education",
    travel: "Travel",
    home: "Home & Garden",
    personal: "Personal Care"
  },

  // Tags
  tags: {
    title: "Tags",
    add: "Add Tag",
    popular: "Popular Tags",
    recent: "Recent Tags",
    business: "Business",
    personal: "Personal",
    essential: "Essential",
    luxury: "Luxury",
    subscription: "Subscription",
    onetime: "One-time",
    tax: "Tax Deductible"
  },

  // Validation
  validation: {
    descriptionRequired: "Description is required",
    amountRequired: "Amount is required and must be greater than 0",
    amountInvalid: "Please enter a valid amount",
    categoryRequired: "Category is required",
    dateRequired: "Date is required",
    dateInvalid: "Please enter a valid date",
    startDateRequired: "Start date is required",
    endDateRequired: "End date is required",
    endDateAfterStart: "End date must be after start date",
    occurrencesRequired: "Number of occurrences is required",
    intervalRequired: "Interval must be at least 1",
    pleaseFixErrors: "Please fix the errors above"
  },

  // Success messages
  success: {
    transactionAdded: "Transaction added successfully",
    transactionUpdated: "Transaction updated successfully",
    transactionDeleted: "Transaction deleted successfully",
    recurringCreated: "Recurring transaction created successfully",
    recurringUpdated: "Recurring transaction updated successfully",
    transactionsImported: "{{count}} transactions imported successfully",
    dataExported: "Data exported successfully",
    refreshed: "Transactions refreshed"
  },

  // Error messages
  errors: {
    addingFailed: "Failed to add transaction",
    updatingFailed: "Failed to update transaction",
    deletingFailed: "Failed to delete transaction",
    loadingFailed: "Failed to load transactions",
    savingFailed: "Failed to save transaction",
    importFailed: "Failed to import transactions",
    exportFailed: "Failed to export data",
    refreshFailed: "Failed to refresh transactions",
    invalidFile: "Invalid file format",
    networkError: "Network error occurred",
    serverError: "Server error occurred"
  },

  // Loading states (renamed to avoid clobbering top-level "loading")
  loadingStates: {
    loading: "Loading transactions...",
    saving: "Saving transaction...",
    deleting: "Deleting transaction...",
    importing: "Importing transactions...",
    exporting: "Exporting data...",
    refreshing: "Refreshing..."
  },

  // Export/Import
  export: {
    title: "Export Transactions",
    format: "Export Format",
    dateRange: "Date Range",
    categories: "Categories",
    includeRecurring: "Include Recurring",
    includeDeleted: "Include Deleted",
    fileName: "File Name",
    download: "Download",
    csv: "CSV File",
    excel: "Excel File",
    pdf: "PDF Report",
    json: "JSON Data"
  },

  import: {
    title: "Import Transactions",
    selectFile: "Select File",
    fileFormat: "File Format",
    mapping: "Column Mapping",
    preview: "Preview",
    import: "Import",
    skipDuplicates: "Skip Duplicates",
    updateExisting: "Update Existing"
  },

  // Receipts
  receipts: {
    title: "Receipt",
    upload: "Upload Receipt",
    view: "View Receipt",
    download: "Download",
    delete: "Delete Receipt",
    dragDrop: "Drag and drop receipt here or click to upload",
    maxSize: "Maximum file size: 10MB",
    supportedFormats: "Supported formats: JPG, PNG, PDF"
  },

  // Analytics
  analytics: {
    title: "Transaction Analytics",
    trends: "Trends",
    categories: "Category Breakdown",
    monthly: "Monthly Analysis",
    comparison: "Period Comparison",
    insights: "Insights"
  },

  // Modals
  modals: {
    add: {
      title: "Add New Transaction",
      subtitle: "Create a new transaction to track expenses and income",
      success: {
        title: "Transaction Added",
        message: "Your transaction has been successfully added to your account."
      }
    },
    edit: {
      edit: {
        title: "Edit Transaction",
        subtitle: "Update transaction details"
      }
    },
    delete: {
      title: "Delete Transaction",
      subtitle: "Are you sure you want to delete this transaction?",
      warning: "This action cannot be undone."
    }
  },

  // Tabs
  tabs: {
    oneTime: {
      title: "One-time Transaction",
      subtitle: "Single transaction",
      description: "Create a single transaction that will be executed once"
    },
    recurring: {
      title: "Recurring Transaction", 
      subtitle: "Automatic transaction",
      description: "Create a template that will generate transactions automatically in the future"
    }
  },

  // Form header tab labels (used by modal header selector)
  formTabs: {
    oneTime: {
      title: "One-time Transaction",
      subtitle: "Single transaction",
      description: "Create a single transaction that will be executed once"
    },
    recurring: {
      title: "Recurring Transaction",
      subtitle: "Automatic transaction",
      description: "Create a template that will generate transactions automatically in the future"
    },
    changeWarning: "Changing the tab will reset the form. Continue?"
  },

  // Badges
  badges: {
    advanced: "Advanced"
  },

  // Forms
  form: {
    addTransaction: "Add Transaction",
    cancel: "Cancel",
    create: "Create Transaction",
    save: "Save Changes",
    update: "Update Transaction",
    selectType: "Choose the type of transaction you want to create",
    oneTimeSubtitle: "One-time transaction details",
    recurringSubtitle: "Set up template for automatic transactions",
    createTemplate: "Create Template",
    updateTemplate: "Update Template",
    editTransaction: "Edit Transaction",
    editingTransaction: "Editing Transaction",
    unsaved: "Unsaved",
    invalid: "Invalid",
    valid: "Valid",
    saving: "Saving...",
    createSuccess: "Transaction created successfully",
    recurringCreateSuccess: "Recurring transaction template created successfully!",
    editMode: "In edit mode - cannot change transaction type",
    unsavedChanges: "You have unsaved changes"
  },

  // Date picker
  datePicker: {
    today: "Today",
    yesterday: "Yesterday", 
    thisWeek: "This Week",
    lastWeek: "Last Week",
    thisMonth: "This Month",
    lastMonth: "Last Month"
  },

  // Notes suggestions
  notes: {
    suggestions: {
      receipt: "Has receipt",
      business: "Business expense", 
      personal: "Personal expense",
      gift: "Gift",
      emergency: "Emergency"
    }
  },

  // Upcoming Transactions
  upcoming: {
    title: 'Upcoming Transactions',
    subtitle: 'Your scheduled transactions',
    loading: 'Loading upcoming transactions...',
    noUpcoming: 'No Upcoming Transactions',
    noUpcomingDesc: 'No future transactions scheduled. Set up recurring transactions to see them here.',
    nextCount: 'Next {{count}} transactions',
    manage: 'Manage',
    manageRecurring: 'Manage Recurring',
    transactions: 'transactions',
    totalAmount: 'Total',
    showingNext: 'Showing next {{count}} transactions',
    viewAll: 'View All',
    totalTransactions: 'Total Upcoming',
    expectedIncome: 'Expected Income',
    expectedExpenses: 'Expected Expenses',
    tomorrow: 'Tomorrow',
    thisWeek: 'This Week',
    later: 'Later'
  },

  // Enhanced Recurring Manager
  recurringManager: {
    title: 'Recurring Transactions Manager',
    subtitle: 'Manage your recurring transactions',
    active: 'Active',
    paused: 'Paused',
    total: 'Total',
    totalAmount: 'Total Monthly',
    avgAmount: 'Average Amount',
    addNew: 'Add New',
    addFirst: 'Add First Template',
    created: 'Created',
    totalRuns: 'Total Runs',
    lastRun: 'Last Run',
    nextRun: 'Next Run',
    never: 'Never',
    indefinite: 'Indefinite',
    endDate: 'End Date',
    confirmDelete: 'Delete "{{name}}"?',
    deleteSuccess: 'Template deleted successfully',
    deleteFailed: 'Failed to delete template',
    statusUpdated: 'Status updated successfully',
    statusUpdateFailed: 'Failed to update status',
    templateSaved: 'Template saved successfully',
    noRecurring: 'No Recurring Templates',
    noRecurringDesc: 'Create recurring transactions to automate your finance tracking',
    noMatches: 'No Matching Templates',
    noMatchesDesc: 'Try adjusting your filters',
    loading: 'Loading templates...',
    loadError: 'Failed to load recurring transactions',
    searchPlaceholder: 'Search templates...',
    templates: 'Templates',
    upcoming: 'Upcoming',
    upcomingTitle: 'Upcoming Transactions',
    upcomingDesc: 'Your upcoming recurring transactions will appear here',
    filter: {
      allStatus: 'All Status',
      active: 'Active Only',
      paused: 'Paused Only',
      allTypes: 'All Types'
    },
    frequency: {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly'
    }
  },

    // Modern page features
  stats: {
    totalTransactions: "Total Transactions",
    totalIncome: "Total Income",
    totalExpenses: "Total Expenses",
    recurringTransactions: "Recurring",
    netAmount: "Net Amount",
    averageTransaction: "Average Transaction"
  },

  // Additional labels
  count: "transactions",
  net: "Net",

  tabs: {
    all: "All Transactions",
    upcoming: "Upcoming",
    recurring: "Recurring"
  },

  advancedFilters: "Advanced Filters",
  selected: "selected",
  bulkActions: "Choose an action to apply to selected transactions",
  noDescription: "No description",
  autoGenerating: "Auto-generating...",

  

  empty: {
    title: "No Transactions Found",
    description: "Start tracking your finances by adding your first transaction."
  }
}; 