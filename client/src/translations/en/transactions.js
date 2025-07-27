/**
 * 💰 TRANSACTIONS TRANSLATIONS - ENGLISH
 * Complete transaction system translations
 * @version 2.0.0
 */

export default {
  // Transaction types
  types: {
    income: "Income",
    expense: "Expense",
    transfer: "Transfer",
    all: "All Types"
  },

  // Transaction fields
  fields: {
    description: "Description",
    amount: "Amount",
    category: "Category",
    date: "Date",
    type: "Type",
    tags: "Tags",
    notes: "Notes",
    receipt: "Receipt",
    recurring: "Recurring"
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
    create: {
      title: "Create Recurring Transaction",
      subtitle: "Set up automatic transactions"
    },
    edit: {
      title: "Edit Recurring Transaction",
      subtitle: "Update recurring transaction settings"
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

    // Steps
    steps: {
      basic: "Basic",
      schedule: "Schedule",
      review: "Review"
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

  // Loading states
  loading: {
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
  }
}; 