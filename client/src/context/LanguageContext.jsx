// client/src/context/LanguageContext.jsx
// Enhanced language context with complete organized translations

import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Complete organized translations object
const translations = {
  // === ENGLISH TRANSLATIONS ===

  // Common/Shared
  common: {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    retry: 'Retry',
    reset: 'Reset',
    search: 'Search',
    filter: 'Filter',
    filters: 'Filters',
    all: 'All',
    none: 'None',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    continue: 'Continue',
    active: 'Active',
    balance: 'Balance',
    amount: 'Amount',
    description: 'Description',
    category: 'Category',
    date: 'Date',
    today: 'Today',
    last7Days: 'Last 7 Days',
    last30Days: 'Last 30 Days',
    last90Days: 'Last 90 Days',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    selectDate: 'Select Date',
    invalidDate: 'Invalid date',
    toggleTheme: 'Toggle Theme',
    toggleLanguage: 'Toggle Language',
    openUserMenu: 'Open User Menu',
    openMenu: 'Open Menu',
    closeMenu: 'Close Menu',
    floatingMenu: 'Floating Menu',
    accessibility: 'Accessibility',
    statement: 'Statement',
    compliance: 'Compliance',
    hide: 'Hide',
    show: 'Show',
    menu: 'Menu',
    notSet: 'Not set',
    saving: 'Saving...',
    copyright: '© {{year}} SpendWise. All rights reserved.',
    period: 'Period',
    summary: 'Summary'
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    profile: 'Profile',
    settings: 'Settings',
    reports: 'Reports',
    logout: 'Logout'
  },

  // Authentication
  auth: {
    // Page titles
    welcomeBack: 'Welcome Back',
    loginSubtitle: 'Sign in to continue to your account',
    createAccount: 'Create Account',
    registerSubtitle: 'Join thousands of users managing their finances',
    startJourney: 'Start Your Financial Journey',
    joinThousands: 'Join thousands who are already saving smarter',

    // Form fields
    email: 'Email',
    emailPlaceholder: 'Enter your email address',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Confirm your password',
    username: 'Username',
    usernamePlaceholder: 'Choose a username',

    // Actions
    signIn: 'Sign In',
    signUp: 'Sign Up',
    logout: 'Logout',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot Password?',
    agreeToTerms: 'I agree to the Terms of Service and Privacy Policy',

    // Links
    noAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    signUpNow: 'Sign up now',
    signInNow: 'Sign in now',

    // Messages
    invalidCredentials: 'Invalid email or password',
    welcomeTitle: 'Welcome to Smart Finance',
    welcomeDescription: 'Take control of your financial future with intelligent expense tracking',

    // Benefits
    benefit1: 'Bank-level Security',
    benefit2: 'Real-time Analytics',
    benefit3: 'Smart Insights',

    // Stats
    activeUsers: 'Active Users',
    savedMoney: 'Saved',
    rating: 'Rating',

    // Password requirements
    passwordLength: 'At least 8 characters',
    passwordNumber: 'Contains a number',
    passwordUpper: 'Contains uppercase letter',
    passwordLower: 'Contains lowercase letter',
    weak: 'Weak',
    fair: 'Fair',
    good: 'Good',
    strong: 'Strong',
    veryStrong: 'Very Strong',

    // Steps
    accountInfo: 'Account Info',
    security: 'Security',

    // Features showcase
    features: {
      title: 'Smart Finance Management',
      subtitle: 'Experience the future of personal finance',
      secure: 'Secure & Private',
      secureDesc: 'Your data is encrypted and protected',
      fast: 'Lightning Fast',
      fastDesc: 'Real-time updates and tracking',
      smart: 'Smart Analytics',
      smartDesc: 'Intelligent insights for better decisions',
      feature1: 'Track expenses effortlessly',
      feature2: 'Set and achieve financial goals',
      feature3: 'Get personalized insights'
    }
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview of your finances',

    greeting: {
      morning: 'Good Morning',
      afternoon: 'Good Afternoon',
      evening: 'Good Evening',
      night: 'Good Night'
    },

    balance: {
      title: 'Balance Overview',
      income: 'Income',
      expenses: 'Expenses',
      total: 'Net Balance',
      error: 'Unable to load balance data',
      backToToday: 'Back to today',
      tooltip: 'Click the calendar to jump to any date',

      periods: {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        yearly: 'Yearly'
      }
    },

    transactions: {
      recent: 'Recent Transactions',
      viewAll: 'View All',
      noTransactions: 'No transactions yet',
      noTransactionsDesc: 'Start tracking your finances by adding your first transaction',
      fetchError: 'Unable to load transactions'
    },

    quickActions: {
      title: 'Quick Add',
      fast: 'Quick Entry',
      placeholder: 'Enter amount',
      addExpense: 'Add Expense',
      addIncome: 'Add Income',
      defaultDescription: 'Quick transaction',
      added: 'Added!',
      subtitle: 'Fast transaction entry', // ✅ Added missing
      todayWarning: 'Transaction will be added to today, not the displayed date',
      switchToToday: 'Transaction added! Switch to today\'s view to see it?'
    },

    stats: {
      dailyAverage: 'Daily Average',
      monthlyGoal: 'Monthly Goal',
      recurringActive: 'Active Recurring',
      savedThisMonth: 'Saved This Month'
    },

    tips: {
      title: 'Finance Tip',
      content: 'Track your daily expenses to identify spending patterns and potential savings opportunities.'
    }
  },

  // Transactions
  transactions: {
    title: 'Transactions',
    subtitle: 'Manage all your income and expenses',
    description: 'View and manage all your transactions',
    all: 'All',
    income: 'Income',
    expense: 'Expenses',
    searchPlaceholder: 'Search transactions...',
    // Add missing translations
    showing: 'Showing',
    of: 'of',
    results: 'results',
    filtered: 'filtered from',
    totalTransactions: 'total transactions',
    noSearchResults: 'No transactions found for "{{term}}"',
    noTransactionsOfType: 'No {{type}} transactions found',
    noTransactions: 'No transactions for this period',
    noTransactionsDesc: 'Your transactions will appear here once you add them',
    noMatchingTransactions: 'No matching transactions',
    tryDifferentSearch: 'Try a different search term or filter',
    addTransaction: 'Add Transaction',
    addNew: 'Add New',
    editTransaction: 'Edit Transaction',
    editTitle: 'Edit transaction details',
    deleteConfirm: 'Delete Transaction',
    selectDate: 'Select Date',
    selectCategory: 'Select category',
    date: 'Date',
    endsOn: 'Ends On',
    updateFuture: 'Apply to all future occurrences',
    updateFutureDesc: 'This will update all future occurrences of this recurring transaction',
    recurring: 'Recurring',
    recurringTransactions: 'Recurring Transactions',
    recurringSection: {
      title: 'Recurring Transactions',
      management: 'Manage your recurring income and expenses',
      impact: 'Monthly Impact'
    },
    noRecurringTransactions: 'No recurring transactions',
    createRecurringNote: 'When you create recurring transactions, you\'ll be able to manage them here.',
    recurringNote: 'This is a recurring {{type}}. When editing, you can choose to update just this occurrence or all future occurrences.',
    frequency: 'Frequency',
    frequencies: {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      oneTime: 'One-time',
      null: 'One-time'
    },
    filters: {
      title: 'Filters',
      type: 'Transaction Type',
      showAll: 'Show All',
      filterButton: 'Filter',
      amountRange: 'Amount Range',
      dateRange: 'Date Range',
      minAmount: 'Min Amount',
      maxAmount: 'Max Amount',
      startDate: 'Start Date',
      endDate: 'End Date',
      recurringType: 'Transaction Type',
      all: 'All Types',
      recurring: 'Recurring',
      oneTime: 'One-time',
      quickRanges: 'Quick Ranges',
      commonAmounts: 'Common Amounts',
      clearAll: 'Clear All' // Add missing translation
    },
    fetchError: 'Failed to load transactions',
    deleteError: 'Failed to delete transaction',
    updateError: 'Failed to update transaction',
    items: 'transactions',
    endOfList: 'End of transaction history',
    tip: 'Try adding new transactions using the button above',
    // Add missing translations
    paused: 'Transaction paused',
    resumed: 'Transaction resumed',
    pause: 'Pause',
    resume: 'Resume',
    skipDates: 'Skip Dates',
    monthlyTotal: 'monthly total',
    active: 'active',
    recurringInfo: {
      title: 'About Recurring Transactions',
      description: 'Recurring transactions are automatically generated based on their frequency. You can modify or stop them at any time.'
    }
  },
  // Transaction Card
  transactionCard: {
    editButton: 'Edit transaction',
    deleteButton: 'Delete transaction',
    nextOccurrence: 'Next Occurrence',
    frequency: 'Frequency',
    dailyEquivalent: 'Daily Equivalent',
    startDate: 'Start Date',
    noScheduled: 'Not scheduled',
    hideDetails: 'Hide Details',
    showDetails: 'Show Details'
  },

  // Transaction Actions/Forms
  actions: {
    title: 'Add Transaction',
    buttontitle: 'Add New Transaction',
    detailedTransaction: 'Detailed Transaction',
    chooseAction: 'Choose your action below',
    smart: 'Smart',
    oneClick: 'One-click add',
    smartDefaults: 'Smart defaults',
    customize: 'Fully customizable',
    quickActions: 'Quick Actions', // ✅ Added missing translation
    allOptions: 'All Transaction Options',
    directEntry: 'Direct entry',
    fullCustomization: 'Full customization',
    transactionAdded: 'Your transaction has been added successfully!',
    recurringExpense: 'Recurring Expense',
    recurringExpenseDesc: 'Set up automatic monthly expenses',
    recurringIncome: 'Recurring Income',
    recurringIncomeDesc: 'Set up automatic monthly income',
    recurringOptions: 'Recurring options',
    
    // Quick actions
    quickExpense: 'Quick Expense',
    quickExpenseDesc: 'Add ₪100 expense instantly',
    quickIncome: 'Quick Income', 
    quickIncomeDesc: 'Add ₪1000 income instantly',
    quickRecurring: 'Quick Recurring',
    quickRecurringDesc: 'Add monthly recurring expense',
    
    // Default descriptions
    defaultExpense: 'Quick expense',
    defaultIncome: 'Quick income',
    defaultRecurringExpense: 'Monthly recurring expense',
    defaultRecurringIncome: 'Monthly recurring income',
    
    added: 'Added!',
    
    // Transaction types
    oneTimeExpense: 'One-time Expense',
    oneTimeExpenseDesc: 'Add a single expense transaction',
    recurringExpense: 'Recurring Expense',
    recurringExpenseDesc: 'Set up a repeating expense',
    oneTimeIncome: 'One-time Income',
    oneTimeIncomeDesc: 'Add a single income transaction',
    recurringIncome: 'Recurring Income',
    recurringIncomeDesc: 'Set up a repeating income',

    // Form
    fillDetails: 'Fill in transaction details',
    selectType: 'Select transaction type',
    amount: 'Amount',
    description: 'Description',
    descriptionPlaceholder: 'Enter description',
    selectCategory: 'Select Category',
    category: 'Category',
    date: 'Date',
    frequency: 'Frequency',
    endDate: 'End Date',
    recurringOptions: 'Recurring Options',
    recurring: 'Recurring',

    // Actions
    add: 'Add Transaction',
    addIncome: 'Add Income',
    addExpense: 'Add Expense',
    success: 'Success!',

    // Frequencies
    frequencies: {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      oneTime: 'One-time'
    },

    // Errors
    errors: {
      addingTransaction: 'Error adding transaction',
      invalidAmount: 'Please enter a valid amount',
      invalidDate: 'Please enter a valid date',
      formErrors: 'Please correct the errors in the form'
    }
  },

  // Categories
  categories: {
    title: 'Categories',
    addNew: 'Add New Category',
    userCategories: 'My Categories',
    defaultCategories: 'Default Categories',
    name: 'Name',
    description: 'Description',
    type: 'Type',
    icon: 'Icon',
    create: 'Create Category',
    edit: 'Edit Category',
    delete: 'Delete Category',
    deleteConfirm: 'Are you sure you want to delete this category?',
    default: 'Default',
    noUserCategories: 'No custom categories yet. Create your first category!',
    createSuccess: 'Category created successfully',
    updateSuccess: 'Category updated successfully',
    deleteSuccess: 'Category deleted successfully',
    deleteError: 'Cannot delete this category',
    descriptionPlaceholder: 'Enter category description (optional)',
    manageCategories: 'Manage Categories',
    Salary: 'Salary',
    Freelance: 'Freelance',
    Investments: 'Investments',
    Rent: 'Rent',
    Groceries: 'Groceries',
    Transportation: 'Transportation',
    Utilities: 'Utilities',
    Entertainment: 'Entertainment',
    General: 'General'
  },

  // Profile
  profile: {
    title: 'Profile',
    personalInformation: 'Personal Information',
    profilePhoto: 'Profile Photo',
    username: 'Username',
    email: 'Email',
    phone: 'Phone',
    location: 'Location',
    website: 'Website',
    emailNotEditable: 'Email cannot be changed',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    changePhoto: 'Change Photo',
    uploadPhoto: 'Upload Photo',
    photoHelper: 'JPG, PNG or GIF. Max size 5MB',
    uploading: 'Uploading...',
    photoUploaded: 'Photo uploaded successfully',

    save: 'Save Changes',
    cancel: 'Cancel',
    updateSuccess: 'Profile updated successfully',
    updateError: 'Failed to update profile',
    accountInfo: 'Account Information',
    accountStatus: 'Account Status',
    verified: 'Verified',
    memberSince: 'Member Since',
    lastLogin: 'Last Login',

    tabs: {
      general: 'General',
      security: 'Security',
      preferences: 'Preferences',
      billing: 'Billing'
    },

    stats: {
      totalTransactions: 'Total Transactions',
      thisMonth: 'This Month',
      activeDays: 'Member For',
      successRate: 'Success Rate',
      days: 'days',
      months: 'months',
      years: 'years'
    },

    quickActions: 'Quick Actions',
    exportData: 'Export Data',
    notifications: 'Notifications',
    comingSoon: 'Coming Soon',
    logoutConfirm: 'Confirm Logout',
    logoutConfirmDesc: 'Are you sure you want to logout?',

    // Settings
    preferences: 'Preferences',
    appPreferences: 'App Preferences',
    securitySettings: 'Security Settings',
    billingSettings: 'Billing & Subscription',
    language: 'Language',
    currency: 'Currency',
    theme: 'Theme',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    languageChanged: 'Language changed successfully',
    currencyChanged: 'Currency changed successfully',
    themeChanged: 'Theme changed successfully',
    passwordChanged: 'Password changed successfully',
    incorrectPassword: 'Current password is incorrect',
    passwordChangeError: 'Failed to change password',
    updatePassword: 'Update Password',
    additionalSecurity: 'Additional Security',
    additionalSecurityDesc: 'Two-factor authentication and other security features coming soon',

    // Custom preferences
    customPreferences: 'Custom Preferences',
    customPreferencesTitle: 'Manage Custom Settings',
    addNewPreference: 'Add New Preference',
    preferenceKey: 'Setting Name',
    preferenceType: 'Data Type',
    preferenceValue: 'Value',
    addPreference: 'Add Setting',
    noCustomPreferences: 'No custom preferences yet',
    preferenceAdded: 'Preference added successfully',
    preferenceRemoved: 'Preference removed successfully',
    saveCustomPreferences: 'Save Custom Preferences',
    customPreferencesSaved: 'Custom preferences saved successfully',

    // Type options
    typeString: 'Text',
    typeNumber: 'Number',
    typeBoolean: 'True/False',
    typeJson: 'JSON Object',

    // Placeholders
    placeholders: {
      customKey: 'myCustomSetting',
      boolean: 'true/false',
      number: '123',
      json: '{"key": "value"}',
      string: 'My value'
    },
    
    // Error messages
    errors: {
      usernameRequired: 'Username is required',
      usernameTooShort: 'Username must be at least 3 characters',
      emailRequired: 'Email is required',
      emailInvalid: 'Invalid email format',
      keyRequired: 'Setting name is required',
      keyExists: 'Setting name already exists',
      invalidJson: 'Invalid JSON format',
      invalidFileType: 'Please select an image file',
      fileTooLarge: 'File size must be less than 5MB',
      uploadFailed: 'Failed to upload image'
    }
  },
  stats: {
      currentBalance: "Current Balance",
      monthlyIncome: "Monthly Income",
      totalTransactions: "Total Transactions",
      activeRecurring: "Active Recurring",
      quickOverview: "Quick Overview",
      thisMonth: "This Month",
      allTime: "All Time",
      activeSubscriptions: "Active Subscriptions",
      perMonth: "Per Month",
      savingsRate: "Savings Rate",
      yearlyAverage: "Yearly Average",
      activityOverview: "Activity Overview"
    },  

  // Forms
  forms: {
    errors: {
      descriptionRequired: 'Description is required',
      endDateRequired: 'End date is required'
    }
  },

  // Validation
  validation: {
    required: 'This field is required',
    usernameRequired: 'Username is required',
    usernameTooShort: 'Username must be at least 3 characters',
    emailRequired: 'Email is required',
    emailInvalid: 'Invalid email format',
    passwordTooShort: 'Password must be at least 8 characters',
    passwordNeedsNumber: 'Password must contain at least one number',
    passwordsDontMatch: 'Passwords do not match',
    agreeToTerms: 'You must agree to the terms'
  },

  // Register specific
  register: {
    success: {
      message: 'Registration successful! Please login to continue.'
    },
    errors: {
      registrationFailed: 'Registration failed. Please try again.'
    }
  },

  // Calendar
  calendar: {
    weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    today: 'Today',
    previousMonth: 'Previous Month',
    nextMonth: 'Next Month'
  },

  // Accessibility
  accessibility: {
    title: 'Accessibility',
    menu: 'Accessibility Menu',
    openMenu: 'Open accessibility menu',
    closeMenu: 'Close menu',
    hide: 'Hide',

    textSize: 'Text Size',
    increaseFontSize: 'Increase text size',
    decreaseFontSize: 'Decrease text size',
    highContrast: 'High Contrast',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    resetSettings: 'Reset Settings',

    compliance: 'This site complies with the Israeli accessibility regulations (IS 5568).',
    accessibilityStatement: 'Accessibility Statement',

    statement: {
      title: 'Accessibility Statement',
      intro: 'SpendWise is committed to making its website accessible to people with disabilities, in accordance with the Israeli Equal Rights for Persons with Disabilities Law (1998) and the Equal Rights for Persons with Disabilities Regulations (Service Accessibility Adaptations) of 2013.',
      features: 'Accessibility Features:',
      level: 'Accessibility Level:',
      levelDescription: 'This site conforms to Level AA compliance per WCAG 2.1 guidelines and the Israeli Standard (IS 5568).',
      contact: 'Accessibility Contact:',
      contactDescription: 'If you encounter accessibility issues or wish to provide feedback about accessibility on our site, please contact our accessibility coordinator:',
      phone: 'Phone',
      close: 'Close'
    }
  },

  // Floating Menu
  floatingMenu: {
    changeLanguage: 'Change Language',
    switchCurrency: 'Switch Currency'
  },

  // Footer
  footer: {
    description: 'Smart personal finance management tool to help you track expenses and manage your budget efficiently.',
    navigation: 'Navigation',
    legal: 'Legal',
    support: 'Support',
    supportTitle: 'Support',
    supportDescription: 'For questions and support, please contact:',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    accessibility: 'Accessibility',
    accessibilityStatement: 'Accessibility Statement',
    copyright: '© {{year}} SpendWise. All rights reserved.',
    madeWith: 'Made with',
    inIsrael: 'in Israel',
    close: 'Close'
  },

  // Error messages
  errors: {
    generic: 'An error occurred. Please try again.',
    network: 'Network error. Please check your connection.',
    validation: 'Please check the form for errors.',
    unauthorized: 'You are not authorized to perform this action.',
    notFound: 'The requested item was not found.',
    server: 'Server error. Please try again later.'
  },

  // === HEBREW TRANSLATIONS ===
  he: {
    // Common/Shared
    common: {
      loading: 'טוען...',
      save: 'שמור',
      cancel: 'ביטול',
      delete: 'מחק',
      edit: 'ערוך',
      close: 'סגור',
      back: 'חזור',
      next: 'הבא',
      previous: 'הקודם',
      submit: 'שלח',
      retry: 'נסה שוב',
      reset: 'איפוס',
      search: 'חפש',
      filter: 'סינון',
      filters: 'סינונים',
      all: 'הכל',
      none: 'ללא',
      yes: 'כן',
      no: 'לא',
      ok: 'אישור',
      error: 'שגיאה',
      success: 'הצלחה',
      warning: 'אזהרה',
      info: 'מידע',
      continue: 'המשך',
      active: 'פעיל',
      balance: 'יתרה',
      amount: 'סכום',
      description: 'תיאור',
      category: 'קטגוריה',
      date: 'תאריך',
      today: 'היום',
      last7Days: '7 ימים אחרונים',
      last30Days: '30 ימים אחרונים',
      last90Days: '90 ימים אחרונים',
      thisMonth: 'החודש הזה',
      lastMonth: 'החודש שעבר',
      selectDate: 'בחר תאריך',
      invalidDate: 'תאריך לא תקין',
      toggleTheme: 'החלף ערכת נושא',
      toggleLanguage: 'החלף שפה',
      openUserMenu: 'פתח תפריט משתמש',
      openMenu: 'פתח תפריט',
      closeMenu: 'סגור תפריט',
      floatingMenu: 'תפריט צף',
      accessibility: 'נגישות',
      statement: 'הצהרה',
      compliance: 'תאימות',
      hide: 'הסתר',
      show: 'הצג',
      menu: 'תפריט',
      notSet: 'לא הוגדר',
      saving: 'שומר...',
      copyright: '© {{year}} SpendWise. כל הזכויות שמורות.',
      period: 'תקופה',
      summary: 'סיכום'
    },

    // Navigation
    nav: {
      dashboard: 'לוח בקרה',
      transactions: 'עסקאות',
      profile: 'פרופיל',
      settings: 'הגדרות',
      reports: 'דוחות',
      logout: 'התנתק'
    },

    // Authentication
    auth: {
      // Page titles
      welcomeBack: 'ברוכים השבים',
      loginSubtitle: 'התחברו כדי להמשיך לחשבון שלכם',
      createAccount: 'יצירת חשבון',
      registerSubtitle: 'הצטרפו לאלפי משתמשים המנהלים את הכספים שלהם',
      startJourney: 'התחילו את המסע הפיננסי שלכם',
      joinThousands: 'הצטרפו לאלפים שכבר חוסכים בחוכמה',

      // Form fields
      email: 'דואר אלקטרוני',
      emailPlaceholder: 'הזינו את כתובת הדואר האלקטרוני',
      password: 'סיסמה',
      passwordPlaceholder: 'הזינו סיסמה',
      confirmPassword: 'אימות סיסמה',
      confirmPasswordPlaceholder: 'אשרו את הסיסמה',
      username: 'שם משתמש',
      usernamePlaceholder: 'בחרו שם משתמש',

      // Actions
      signIn: 'התחברות',
      signUp: 'הרשמה',
      logout: 'התנתק',
      rememberMe: 'זכור אותי',
      forgotPassword: 'שכחת סיסמה?',
      agreeToTerms: 'אני מסכים לתנאי השימוש ומדיניות הפרטיות',

      // Links
      noAccount: 'אין לך חשבון?',
      alreadyHaveAccount: 'כבר יש לך חשבון?',
      signUpNow: 'הירשם עכשיו',
      signInNow: 'התחבר עכשיו',

      // Messages
      invalidCredentials: 'דואר אלקטרוני או סיסמה לא תקינים',
      welcomeTitle: 'ברוכים הבאים לניהול פיננסי חכם',
      welcomeDescription: 'קחו שליטה על העתיד הפיננסי שלכם עם מעקב הוצאות חכם',

      // Benefits
      benefit1: 'אבטחה ברמה בנקאית',
      benefit2: 'ניתוח בזמן אמת',
      benefit3: 'תובנות חכמות',

      // Stats
      activeUsers: 'משתמשים פעילים',
      savedMoney: 'נחסך',
      rating: 'דירוג',

      // Password requirements
      passwordLength: 'לפחות 8 תווים',
      passwordNumber: 'מכיל מספר',
      passwordUpper: 'מכיל אות גדולה',
      passwordLower: 'מכיל אות קטנה',
      weak: 'חלש',
      fair: 'בינוני',
      good: 'טוב',
      strong: 'חזק',
      veryStrong: 'חזק מאוד',

      // Steps
      accountInfo: 'פרטי חשבון',
      security: 'אבטחה',

      // Features showcase
      features: {
        title: 'ניהול פיננסי חכם',
        subtitle: 'חווה את העתיד של ניהול הכספים האישי',
        secure: 'מאובטח ופרטי',
        secureDesc: 'המידע שלך מוצפן ומוגן',
        fast: 'מהיר במיוחד',
        fastDesc: 'עדכונים ומעקב בזמן אמת',
        smart: 'ניתוח חכם',
        smartDesc: 'תובנות חכמות להחלטות טובות יותר',
        feature1: 'עקבו אחר ההוצאות בקלות',
        feature2: 'הגדירו והשיגו יעדים פיננסיים',
        feature3: 'קבלו תובנות מותאמות אישית'
      }
    },

    // Dashboard
    dashboard: {
      title: 'לוח בקרה',
      subtitle: 'סקירת המצב הפיננסי שלך',

      greeting: {
        morning: 'בוקר טוב',
        afternoon: 'צהריים טובים',
        evening: 'ערב טוב',
        night: 'לילה טוב'
      },

      balance: {
        title: 'סקירת יתרה',
        income: 'הכנסות',
        expenses: 'הוצאות',
        total: 'יתרה נטו',
        error: 'לא ניתן לטעון נתוני יתרה',
        backToToday: 'חזרה להיום',
        tooltip: 'לחצו על לוח השנה כדי לקפוץ לכל תאריך',

        periods: {
          daily: 'יומי',
          weekly: 'שבועי',
          monthly: 'חודשי',
          yearly: 'שנתי'
        }
      },

      transactions: {
        recent: 'עסקאות אחרונות',
        viewAll: 'הצג הכל',
        noTransactions: 'אין עסקאות עדיין',
        noTransactionsDesc: 'התחילו לעקוב אחר הכספים שלכם על ידי הוספת העסקה הראשונה',
        fetchError: 'לא ניתן לטעון עסקאות'
      },

      quickActions: {
        title: 'הוספה מהירה',
        fast: 'הזנה מהירה',
        placeholder: 'הזן סכום',
        addExpense: 'הוסף הוצאה',
        addIncome: 'הוסף הכנסה',
        defaultDescription: 'עסקה מהירה',
        added: 'נוסף!',
        subtitle: 'הזנת עסקאות מהירה', // ✅ Added missing Hebrew
        todayWarning: 'הפעולה תתווסף להיום, לא לתאריך המוצג',
        switchToToday: 'הפעולה נוספה! לעבור לתצוגת היום כדי לראות אותה?'
      },

      stats: {
        dailyAverage: 'ממוצע יומי',
        monthlyGoal: 'יעד חודשי',
        recurringActive: 'הוראות קבע פעילות',
        savedThisMonth: 'נחסך החודש'
      },

      tips: {
        title: 'טיפ פיננסי',
        content: 'עקוב אחר ההוצאות היומיות שלך כדי לזהות דפוסי הוצאות והזדמנויות חיסכון פוטנציאליות.'
      }
    },

    // Transactions
    transactions: {
      title: 'עסקאות',
      subtitle: 'נהל את כל ההכנסות וההוצאות שלך',
      description: 'צפה ונהל את כל העסקאות שלך',
      all: 'הכל',
      income: 'הכנסות',
      expense: 'הוצאות',
      searchPlaceholder: 'חפש עסקאות...',
      // Add missing Hebrew translations
      showing: 'מציג',
      of: 'מתוך',
      results: 'תוצאות',
      filtered: 'מסוננות מתוך',
      totalTransactions: 'סך העסקאות',
      noSearchResults: 'לא נמצאו עסקאות עבור "{{term}}"',
      noTransactionsOfType: 'לא נמצאו עסקאות {{type}}',
      noTransactions: 'אין עסקאות לתקופה זו',
      noTransactionsDesc: 'העסקאות שלך יופיעו כאן לאחר שתוסיף אותן',
      noMatchingTransactions: 'אין עסקאות תואמות',
      tryDifferentSearch: 'נסה מונח חיפוש או סינון אחר',
      addTransaction: 'הוסף עסקה',
      addNew: 'הוסף חדש',
      editTransaction: 'ערוך עסקה',
      editTitle: 'ערוך פרטי עסקה',
      deleteConfirm: 'מחק עסקה',
      selectDate: 'בחר תאריך',
      selectCategory: 'בחר קטגוריה',
      date: 'תאריך',
      endsOn: 'מסתיים ב',
      updateFuture: 'החל על כל המופעים העתידיים',
      updateFutureDesc: 'זה יעדכן את כל המופעים העתידיים של עסקה קבועה זו',
      recurring: 'קבוע',
      recurringTransactions: 'עסקאות קבועות',
      recurringSection: {
        title: 'עסקאות קבועות',
        management: 'נהל את ההכנסות וההוצאות הקבועות שלך',
        impact: 'השפעה חודשית'
      },
      noRecurringTransactions: 'אין עסקאות קבועות',
      createRecurringNote: 'כשתיצור עסקאות קבועות, תוכל לנהל אותן כאן.',
      recurringNote: 'זו עסקה קבועה מסוג {{type}}. בעריכה, תוכל לבחור לעדכן רק את המופע הזה או את כל המופעים העתידיים.',
      frequency: 'תדירות',
      frequencies: {
        daily: 'יומי',
        weekly: 'שבועי',
        monthly: 'חודשי',
        yearly: 'שנתי',
        oneTime: 'חד פעמי',
        null: 'חד פעמי'
      },
      filters: {
        title: 'סינונים',
        type: 'סוג עסקה',
        showAll: 'הצג הכל',
        filterButton: 'סנן',
        amountRange: 'טווח סכומים',
        dateRange: 'טווח תאריכים',
        minAmount: 'סכום מינימלי',
        maxAmount: 'סכום מקסימלי',
        startDate: 'תאריך התחלה',
        endDate: 'תאריך סיום',
        recurringType: 'סוג עסקה',
        all: 'כל הסוגים',
        recurring: 'קבועות',
        oneTime: 'חד פעמיות',
        quickRanges: 'טווחים מהירים',
        commonAmounts: 'סכומים נפוצים',
        clearAll: 'נקה הכל' // Add missing Hebrew
      },
      fetchError: 'נכשל בטעינת עסקאות',
      deleteError: 'נכשל במחיקת עסקה',
      updateError: 'נכשל בעדכון עסקה',
      items: 'עסקאות',
      endOfList: 'סוף היסטוריית העסקאות',
      tip: 'נסה להוסיף עסקאות חדשות באמצעות הכפתור למעלה',
      // Add missing Hebrew translations
      paused: 'עסקה הושהתה',
      resumed: 'עסקה חודשה',
      pause: 'השהה',
      resume: 'חדש',
      skipDates: 'דלג על תאריכים',
      monthlyTotal: 'סך חודשי',
      active: 'פעיל',
      recurringInfo: {
        title: 'אודות עסקאות קבועות',
        description: 'עסקאות קבועות נוצרות אוטומטית לפי התדירות שלהן. ניתן לשנות או לעצור אותן בכל עת.'
      }
    },

    // Transaction Card
    transactionCard: {
      editButton: 'ערוך עסקה',
      deleteButton: 'מחק עסקה',
      nextOccurrence: 'מופע הבא',
      frequency: 'תדירות',
      dailyEquivalent: 'שווי יומי',
      startDate: 'תאריך התחלה',
      noScheduled: 'לא מתוכנן',
      hideDetails: 'הסתר פרטים',
      showDetails: 'הצג פרטים'
    },

    // Transaction Actions/Forms
    actions: {
      title: 'הוסף עסקה',
      buttontitle: 'הוסף עסקה חדשה',
      detailedTransaction: 'עסקה מפורטת',
      chooseAction: 'בחר את הפעולה למטה',
      smart: 'חכם',
      oneClick: 'הוספה בקליק',
      smartDefaults: 'ברירות מחדל חכמות',
      customize: 'התאמה אישית מלאה',
      quickActions: 'פעולות מהירות', // Added missing Hebrew translation
      allOptions: 'כל אפשרויות העסקה',
      directEntry: 'הזנה ישירה',
      fullCustomization: 'התאמה אישית מלאה',
      transactionAdded: 'העסקה שלך נוספה בהצלחה!',
      recurringExpense: 'הוצאה חוזרת',
      recurringExpenseDesc: 'הגדר הוצאות אוטומטיות חודשיות',
      recurringIncome: 'הכנסה חוזרת',
      recurringIncomeDesc: 'הגדר הכנסה אוטומטית חודשית',
      recurringOptions: 'אפשרויות חזרה',
      
      // Quick actions
      quickExpense: 'הוצאה מהירה',
      quickExpenseDesc: 'הוסף הוצאה של ₪100 מיידית',
      quickIncome: 'הכנסה מהירה',
      quickIncomeDesc: 'הוסף הכנסה של ₪1000 מיידית',
      quickRecurring: 'קבוע מהיר',
      quickRecurringDesc: 'הוסף הוצאה חוזרת חודשית',
      
      // Default descriptions
      defaultExpense: 'הוצאה מהירה',
      defaultIncome: 'הכנסה מהירה',
      defaultRecurringExpense: 'הוצאה חוזרת חודשית',
      defaultRecurringIncome: 'הכנסה חוזרת חודשית',
      
      added: 'נוסף!',

      // Frequencies
      frequencies: {
        daily: 'יומי',
        weekly: 'שבועי',
        monthly: 'חודשי',
        oneTime: 'חד פעמי'
      },

      // Errors
      errors: {
        addingTransaction: 'שגיאה בהוספת עסקה',
        invalidAmount: 'אנא הזינו סכום תקין',
        invalidDate: 'אנא הזינו תאריך תקין',
        formErrors: 'אנא תקנו את השגיאות בטופס'
      }
    },

    // Categories
    categories: {
      title: 'קטגוריות',
      addNew: 'הוסף קטגוריה חדשה',
      userCategories: 'הקטגוריות שלי',
      defaultCategories: 'קטגוריות ברירת מחדל',
      name: 'שם',
      description: 'תיאור',
      type: 'סוג',
      icon: 'אייקון',
      create: 'צור קטגוריה',
      edit: 'ערוך קטגוריה',
      delete: 'מחק קטגוריה',
      deleteConfirm: 'האם אתה בטוח שברצונך למחוק את הקטגוריה?',
      default: 'ברירת מחדל',
      noUserCategories: 'אין קטגוריות מותאמות אישית עדיין. צור את הקטגוריה הראשונה!',
      createSuccess: 'הקטגוריה נוצרה בהצלחה',
      updateSuccess: 'הקטגוריה עודכנה בהצלחה',
      deleteSuccess: 'הקטגוריה נמחקה בהצלחה',
      deleteError: 'לא ניתן למחוק את הקטגוריה',
      descriptionPlaceholder: 'הזן תיאור קטגוריה (אופציונלי)',
      manageCategories: 'נהל קטגוריות',
      Salary: 'משכורת',
      Freelance: 'עבודה עצמאית',
      Investments: 'השקעות',
      Rent: 'שכירות',
      Groceries: 'קניות',
      Transportation: 'תחבורה',
      Utilities: 'שירותים',
      Entertainment: 'בילויים',
      General: 'כללי'
    },

    // Profile
    profile: {
      title: 'פרופיל',
      personalInformation: 'מידע אישי',
      profilePhoto: 'תמונת פרופיל',
      username: 'שם משתמש',
      email: 'דואר אלקטרוני',
      phone: 'טלפון',
      location: 'מיקום',
      website: 'אתר אינטרנט',
      emailNotEditable: 'לא ניתן לשנות את הדואר האלקטרוני',
      changePassword: 'שינוי סיסמה',
      currentPassword: 'סיסמה נוכחית',
      newPassword: 'סיסמה חדשה',
      confirmPassword: 'אישור סיסמה חדשה',
      changePhoto: 'שנה תמונה',
      uploadPhoto: 'העלה תמונה',
      photoHelper: 'JPG, PNG או GIF. גודל מקסימלי 5MB',
      uploading: 'מעלה...',
      photoUploaded: 'התמונה הועלתה בהצלחה',

      save: 'שמור שינויים',
      cancel: 'ביטול',
      updateSuccess: 'הפרופיל עודכן בהצלחה',
      updateError: 'נכשל בעדכון הפרופיל',
      accountInfo: 'פרטי חשבון',
      accountStatus: 'סטטוס חשבון',
      verified: 'מאומת',
      memberSince: 'חבר מאז',
      lastLogin: 'התחברות אחרונה',

      tabs: {
        general: 'כללי',
        security: 'אבטחה',
        preferences: 'העדפות',
        billing: 'חיוב'
      },

      stats: {
        totalTransactions: 'סך העסקאות',
        thisMonth: 'החודש',
        activeDays: 'חבר כבר',
        successRate: 'אחוז הצלחה',
        days: 'ימים',
        months: 'חודשים',
        years: 'שנים'
      },

      quickActions: 'פעולות מהירות',
      exportData: 'ייצוא נתונים',
      notifications: 'התראות',
      comingSoon: 'בקרוב',
      logoutConfirm: 'אישור התנתקות',
      logoutConfirmDesc: 'האם אתה בטוח שברצונך להתנתק?',

      // Settings
      preferences: 'העדפות',
      appPreferences: 'העדפות אפליקציה',
      securitySettings: 'הגדרות אבטחה',
      billingSettings: 'חיוב ומנוי',
      language: 'שפה',
      currency: 'מטבע',
      theme: 'ערכת נושא',
      lightTheme: 'בהיר',
      darkTheme: 'כהה',
      languageChanged: 'השפה שונתה בהצלחה',
      currencyChanged: 'המטבע שונה בהצלחה',
      themeChanged: 'ערכת הנושא שונתה בהצלחה',
      passwordChanged: 'הסיסמה שונתה בהצלחה',
      incorrectPassword: 'הסיסמה הנוכחית שגויה',
      passwordChangeError: 'נכשל בשינוי הסיסמה',
      updatePassword: 'עדכן סיסמה',
      additionalSecurity: 'אבטחה נוספת',
      additionalSecurityDesc: 'אימות דו-שלבי ותכונות אבטחה נוספות בקרוב',

      // Custom preferences
      customPreferences: 'העדפות מותאמות אישית',
      customPreferencesTitle: 'נהל הגדרות מותאמות אישית',
      addNewPreference: 'הוסף העדפה חדשה',
      preferenceKey: 'שם ההגדרה',
      preferenceType: 'סוג נתונים',
      preferenceValue: 'ערך',
      addPreference: 'הוסף הגדרה',
      noCustomPreferences: 'אין העדפות מותאמות אישית עדיין',
      preferenceAdded: 'ההעדפה נוספה בהצלחה',
      preferenceRemoved: 'ההעדפה הוסרה בהצלחה',
      saveCustomPreferences: 'שמור העדפות מותאמות אישית',
      customPreferencesSaved: 'ההעדפות המותאמות אישית נשמרו בהצלחה',

      // Type options
      typeString: 'טקסט',
      typeNumber: 'מספר',
      typeBoolean: 'אמת/שקר',
      typeJson: 'אובייקט JSON',

      // Placeholders
      placeholders: {
        customKey: 'myCustomSetting',
        boolean: 'true/false',
        number: '123',
        json: '{"key": "value"}',
        string: 'הערך שלי'
      },

      // Error messages
      errors: {
        usernameRequired: 'שם משתמש נדרש',
        usernameTooShort: 'שם המשתמש חייב להכיל לפחות 3 תווים',
        emailRequired: 'דואר אלקטרוני נדרש',
        emailInvalid: 'פורמט דואר אלקטרוני לא תקין',
        keyRequired: 'שם ההגדרה נדרש',
        keyExists: 'שם ההגדרה כבר קיים',
        invalidJson: 'פורמט JSON לא תקין',
        invalidFileType: 'אנא בחר קובץ תמונה',
        fileTooLarge: 'גודל הקובץ חייב להיות קטן מ-5MB',
        uploadFailed: 'העלאת התמונה נכשלה'
      }
    },
    
    stats: {
      currentBalance: "יתרה נוכחית",
      monthlyIncome: "הכנסות חודשיות",
      totalTransactions: "סך הפעולות",
      activeRecurring: "מנויים פעילים",
      quickOverview: "סקירה מהירה",
      thisMonth: "החודש",
      allTime: "כל הזמנים",
      activeSubscriptions: "מנויים פעילים",
      perMonth: "לחודש",
      savingsRate: "שיעור חיסכון",
      yearlyAverage: "ממוצע שנתי",
      activityOverview: "סקירת פעילות"
    },

    // Forms
    forms: {
      errors: {
        descriptionRequired: 'תיאור נדרש',
        endDateRequired: 'תאריך סיום נדרש'
      }
    },

    // Validation
    validation: {
      required: 'שדה זה נדרש',
      usernameRequired: 'שם משתמש נדרש',
      usernameTooShort: 'שם המשתמש חייב להכיל לפחות 3 תווים',
      emailRequired: 'דואר אלקטרוני נדרש',
      emailInvalid: 'פורמט דואר אלקטרוני לא תקין',
      passwordTooShort: 'הסיסמה חייבת להכיל לפחות 8 תווים',
      passwordNeedsNumber: 'הסיסמה חייבת להכיל לפחות מספר אחד',
      passwordsDontMatch: 'הסיסמאות אינן תואמות',
      agreeToTerms: 'עליך להסכים לתנאים'
    },

    // Register specific
    register: {
      success: {
        message: 'ההרשמה הצליחה! אנא התחבר כדי להמשיך.'
      },
      errors: {
        registrationFailed: 'ההרשמה נכשלה. אנא נסה שוב.'
      }
    },

    // Calendar
    calendar: {
      weekDays: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
      today: 'היום',
      previousMonth: 'חודש קודם',
      nextMonth: 'חודש הבא'
    },

    // Accessibility
    accessibility: {
      title: 'נגישות',
      menu: 'תפריט נגישות',
      openMenu: 'פתח תפריט נגישות',
      closeMenu: 'סגור תפריט',
      hide: 'הסתר',

      textSize: 'גודל טקסט',
      increaseFontSize: 'הגדל טקסט',
      decreaseFontSize: 'הקטן טקסט',
      highContrast: 'ניגודיות גבוהה',
      darkMode: 'מצב כהה',
      lightMode: 'מצב בהיר',
      resetSettings: 'איפוס הגדרות',

      compliance: 'אתר זה תואם לתקנות נגישות בהתאם לתקן הישראלי (ת"י 5568).',
      accessibilityStatement: 'הצהרת נגישות',

      statement: {
        title: 'הצהרת נגישות',
        intro: 'אתר SpendWise מחויב להנגיש את שירותיו לאנשים עם מוגבלויות, בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות (התשנ"ח-1998) ותקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013.',
        features: 'תכונות נגישות באתר:',
        level: 'דרגת הנגישות:',
        levelDescription: 'אתר זה עומד ברמת תאימות AA לפי הנחיות WCAG 2.1 ועומד בתקן הישראלי (ת"י 5568).',
        contact: 'יצירת קשר בנושאי נגישות:',
        contactDescription: 'אם נתקלת בבעיות נגישות או ברצונך לשלוח משוב לגבי הנגישות באתר, אנא צור קשר עם רכז הנגישות שלנו:',
        phone: 'טלפון',
        close: 'סגור'
      }
    },

    // Floating Menu
    floatingMenu: {
      changeLanguage: 'שנה שפה',
      switchCurrency: 'החלף מטבע'
    },

    // Footer
    footer: {
      description: 'כלי חכם לניהול פיננסי אישי שעוזר לך לעקוב אחר הוצאות ולנהל את התקציב שלך ביעילות.',
      navigation: 'ניווט',
      legal: 'משפטי',
      support: 'תמיכה',
      supportTitle: 'תמיכה',
      supportDescription: 'לשאלות ותמיכה, אנא צרו קשר:',
      privacy: 'מדיניות פרטיות',
      terms: 'תנאי שימוש',
      accessibility: 'נגישות',
      accessibilityStatement: 'הצהרת נגישות',
      copyright: '© {{year}} SpendWise. כל הזכויות שמורות.',
      madeWith: 'נעשה עם',
      inIsrael: 'בישראל',
      close: 'סגור'
    },

    // Error messages
    errors: {
      generic: 'אירעה שגיאה. אנא נסו שוב.',
      network: 'שגיאת רשת. אנא בדקו את החיבור שלכם.',
      validation: 'אנא בדקו את הטופס לשגיאות.',
      unauthorized: 'אין לכם הרשאה לבצע פעולה זו.',
      notFound: 'הפריט המבוקש לא נמצא.',
      server: 'שגיאת שרת. אנא נסו שוב מאוחר יותר.'
    }
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'he' ? 'en' : 'he');
  };

  // Get translation function
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let translation = language === 'he' ? translations.he : translations;

    for (const k of keys) {
      if (!translation) break;
      translation = translation[k];
    }

    if (!translation) {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }

    // Handle parameter substitution
    if (typeof translation === 'string' && params) {
      return translation.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return params[key] !== undefined ? params[key] : match;
      });
    }

    return translation;
  };

  const formatDate = (date, lang = null) => {
    const locale = lang || language;
    return new Date(date).toLocaleDateString(
      locale === 'he' ? 'he-IL' : 'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(
      language === 'he' ? 'he-IL' : 'en-US',
      {
        style: 'currency',
        currency: 'ILS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    ).format(amount);
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      toggleLanguage,
      t,
      formatDate,
      formatCurrency,
      isRTL: language === 'he'
    }}>
      {children}
    </LanguageContext.Provider>
  );
};