/**
 * 🏷️ CATEGORIES TRANSLATIONS - ENGLISH
 * Comprehensive translations for Category Manager system
 * @version 3.0.0 - NEW CATEGORY ARCHITECTURE
 */

export default {
  // Main titles
  title: 'Category Manager',
  subtitle: 'Manage your {{count}} spending categories',

  // Actions
  actions: {
    create: 'Create Category',
    edit: 'Edit Category',
    delete: 'Delete Category',
    duplicate: 'Duplicate Category',
    pin: 'Pin Category',
    unpin: 'Unpin Category',
    show: 'Show Category', 
    hide: 'Hide Category',
    export: 'Export Categories',
    import: 'Import Categories',
    refresh: 'Refresh'
  },

  // Form fields
  fields: {
    name: {
      label: 'Category Name',
      placeholder: 'Enter category name...',
      description: 'Choose a descriptive name for your category'
    },
    description: {
      label: 'Description',
      placeholder: 'Optional description...',
      description: 'Add details about this category (optional)'
    },
    icon: {
      label: 'Icon',
      search: 'Search icons...',
      suggestions: 'AI Suggestions',
      selected: 'Selected Icon',
      selectedDescription: 'This icon will represent your category'
    },
    color: {
      label: 'Color'
    },
    type: {
      label: 'Category Type'
    },
    pinned: {
      label: 'Pin to Top',
      description: 'Show this category at the top of lists'
    },
    hidden: {
      label: 'Hide Category',
      description: 'Hide this category from normal views'
    }
  },

  // Category types
  types: {
    income: 'Income',
    expense: 'Expense',
    both: 'Both',
    incomeDescription: 'For income and earnings',
    expenseDescription: 'For expenses and costs',
    bothDescription: 'For both income and expenses'
  },

  // Color categories
  colors: {
    primary: 'Primary',
    secondary: 'Secondary',
    neutral: 'Neutral'
  },

  // Icon categories
  iconCategories: {
    general: 'General',
    finance: 'Finance',
    lifestyle: 'Lifestyle',
    entertainment: 'Entertainment',
    technology: 'Technology',
    transport: 'Transport',
    health: 'Health'
  },

  // View modes
  viewModes: {
    grid: 'Grid View',
    list: 'List View',
    analytics: 'Analytics View'
  },

  // Form sections
  sections: {
    basicInfo: 'Basic Information',
    visual: 'Visual Customization',
    advanced: 'Advanced Options',
    preview: 'Preview'
  },

  // Form states
  form: {
    addCategory: 'Add New Category',
    editCategory: 'Edit Category',
    duplicateCategory: 'Duplicate Category',
    editingCategory: 'Editing {{name}}',
    saving: 'Saving...',
    create: 'Create',
    update: 'Update',
    cancel: 'Cancel',
    unsaved: 'Unsaved',
    invalid: 'Invalid',
    valid: 'Valid',
    unsavedChanges: 'You have unsaved changes. Are you sure you want to cancel?',
    validationFailed: 'Please fix the validation errors before saving',
    createSuccess: 'Category created successfully',
    updateSuccess: 'Category updated successfully',
    submitFailed: 'Failed to save category. Please try again.'
  },

  // Validation messages
  validation: {
    name: {
      required: 'Category name is required',
      tooShort: 'Name must be at least {{min}} characters',
      tooLong: 'Name cannot exceed {{max}} characters',
      invalidCharacters: 'Name can only contain letters, numbers, spaces, hyphens, underscores, and ampersands',
      duplicate: 'A category with this name already exists'
    },
    description: {
      tooLong: 'Description cannot exceed {{max}} characters'
    },
    icon: {
      required: 'Icon is required',
      invalid: 'Selected icon is not valid'
    },
    color: {
      required: 'Color is required',
      invalid: 'Color must be a valid hex code (e.g., #3B82F6)'
    },
    type: {
      required: 'Category type is required',
      invalid: 'Invalid category type selected'
    }
  },

  // Search and filters
  search: {
    placeholder: 'Search categories...',
    noResults: 'No categories found matching "{{query}}"',
    noCategories: 'No categories found'
  },

  filters: {
    showHidden: 'Show Hidden',
    hideHidden: 'Hide Hidden',
    all: 'All Categories',
    income: 'Income Only',
    expense: 'Expense Only',
    pinned: 'Pinned Only'
  },

  // Sorting
  sort: {
    label: 'Sort by',
    name: 'Name',
    type: 'Type',
    usage: 'Usage',
    created: 'Date Created',
    updated: 'Last Updated'
  },

  // Groups
  groups: {
    all: 'All Categories',
    pinned: 'Pinned Categories',
    unpinned: 'Regular Categories',
    income: 'Income Categories',
    expense: 'Expense Categories',
    both: 'Mixed Categories'
  },

  // Lists
  list: {
    empty: {
      title: 'No Categories Found',
      description: 'Start by creating your first category to organize your transactions.',
      createFirst: 'Create First Category'
    },
    groupCount: '{{count}} categories ({{selected}} selected)'
  },

  // Grid
  grid: {
    empty: {
      title: 'No Categories Found',
      description: 'Start by creating your first category to organize your transactions.',
      createFirst: 'Create First Category'
    }
  },

  // Selection
  selection: {
    count: '{{count}} selected',
    summary: 'Categories selected',
    clear: 'Clear Selection'
  },

  // Status indicators
  status: {
    pinned: 'Pinned to top',
    hidden: 'Hidden from view',
    active: 'Active category',
    unused: 'Unused category'
  },

  // Analytics
  analytics: {
    title: 'Category Analytics',
    subtitle: 'Insights and trends for {{timeRange}}',
    refresh: 'Refresh Data',
    export: 'Export Data',
    
    // Cards
    cards: {
      totalCategories: 'Total Categories',
      activeCategories: 'Active Categories',
      avgTransactions: 'Avg Transactions',
      optimization: 'Recommendations'
    },

    // Sections
    topCategories: 'Most Used Categories',
    recommendations: 'Optimization Tips',
    growing: 'Growing Categories',
    declining: 'Declining Categories',
    detailedView: 'Detailed Analytics',
    detailedDescription: 'Comprehensive analytics data and charts coming soon.',

    // Data
    transactions: 'transactions',
    total: 'Total',
    recentActivity: 'Recent activity',
    noRecommendations: 'No optimization recommendations at this time.',
    noGrowingCategories: 'No growing categories in this period.',
    noDecliningCategories: 'No declining categories in this period.',

    // View modes
    viewModes: {
      overview: 'Overview',
      detailed: 'Detailed',
      trends: 'Trends'
    }
  },

  // Export
  export: {
    json: 'Export as JSON',
    csv: 'Export as CSV', 
    report: 'Export Report'
  },

  // Modals
  modals: {
    create: {
      title: 'Create New Category'
    },
    edit: {
      title: 'Edit Category'
    }
  },

  // Notifications
  notifications: {
    createSuccess: 'Category "{{name}}" created successfully',
    updateSuccess: 'Category "{{name}}" updated successfully',
    deleteSuccess: 'Category deleted successfully',
    createFailed: 'Failed to create category',
    updateFailed: 'Failed to update category',
    deleteFailed: 'Failed to delete category',
    pinSuccess: 'Category pinned successfully',
    unpinSuccess: 'Category unpinned successfully',
    hideSuccess: 'Category hidden successfully',
    showSuccess: 'Category shown successfully'
  },

  // Confirmations
  confirmations: {
    delete: 'Are you sure you want to delete "{{name}}"? This action cannot be undone.',
    deleteMultiple: 'Are you sure you want to delete {{count}} categories? This action cannot be undone.',
    hide: 'Are you sure you want to hide "{{name}}"?',
    show: 'Are you sure you want to show "{{name}}"?'
  },

  // Preview
  preview: {
    sampleName: 'Sample Category',
    sampleDescription: 'This is how your category will appear'
  },

  // Icon selector
  iconSelector: {
    aiSuggestions: 'AI Suggestions',
    searchPlaceholder: 'Search icons...',
    noResults: 'No icons found for "{{query}}"',
    noIcons: 'No icons in this category',
    selected: 'Selected',
    selectedDescription: 'This icon will represent your category'
  },

  // Bulk operations (for future use)
  bulk: {
    selected: '{{count}} categories selected',
    deleteSelected: 'Delete Selected',
    hideSelected: 'Hide Selected',
    showSelected: 'Show Selected',
    pinSelected: 'Pin Selected',
    unpinSelected: 'Unpin Selected',
    exportSelected: 'Export Selected',
    
    deleteSuccess: '{{count}} categories deleted successfully',
    hideSuccess: '{{count}} categories hidden successfully',
    showSuccess: '{{count}} categories shown successfully',
    pinSuccess: '{{count}} categories pinned successfully',
    unpinSuccess: '{{count}} categories unpinned successfully',
    
    deleteFailed: 'Failed to delete selected categories',
    hideFailed: 'Failed to hide selected categories',
    showFailed: 'Failed to show selected categories',
    pinFailed: 'Failed to pin selected categories',
    unpinFailed: 'Failed to unpin selected categories'
  }
}; 