// client/src/context/LanguageContext.jsx
// Enhanced language context with complete organized translations

import { ca } from 'date-fns/locale';
import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Toast messages
  toast: {
    // Success messages
    success: {
      // Authentication
      loginSuccess: 'Welcome back!',
      registerSuccess: 'Registration successful! Please check your email.',
      logoutSuccess: 'Logged out successfully',
      emailVerified: 'Email verified successfully!',
      verificationSent: 'Verification email sent!',
      passwordReset: 'Password reset successfully',
      passwordChanged: 'Password changed successfully',

      // Profile
      profileUpdated: 'Profile updated successfully',
      profilePictureUploaded: 'Profile picture uploaded successfully',
      preferencesUpdated: 'Preferences updated successfully',

      // Transactions
      transactionCreated: 'Transaction created successfully',
      transactionUpdated: 'Transaction updated successfully',
      transactionDeleted: 'Transaction deleted successfully',
      transactionGenerated: 'Recurring transactions generated successfully',
      templateUpdated: 'Template updated successfully',
      skipDatesSuccess: 'Dates skipped successfully',
      dataRefreshed: 'All transaction data refreshed',
      nextPaymentSkipped: 'Next payment skipped successfully',

      // Categories
      categoryCreated: 'Category created successfully',
      categoryUpdated: 'Category updated successfully',
      categoryDeleted: 'Category deleted successfully',

      // Export
      csvExportCompleted: 'CSV export completed successfully!',
      jsonExportCompleted: 'JSON export completed successfully!',

      // Bulk operations
      bulkOperationSuccess: '{{count}} transactions {{operation}} successfully',

      // General
      actionCompleted: 'Action completed successfully',
      changesSaved: 'Changes saved successfully',
      operationSuccess: 'Operation completed successfully'
    },

    // Error messages
    error: {
      // Authentication errors
      invalidCredentials: 'Invalid email or password',
      emailNotVerified: 'Your email is not verified. Please check your inbox.',
      emailAlreadyExists: 'This email is already registered',
      usernameExists: 'Username already exists',
      tokenExpired: 'Session expired. Please login again.',
      unauthorized: 'You are not authorized to perform this action',
      authenticationFailed: 'Authentication failed. Please try again.',

      // Validation errors
      categoryNameRequired: 'Category name is required',
      categoryTypeRequired: 'Category type must be income or expense',
      invalidAmount: 'Please enter a valid amount',
      invalidDate: 'Please enter a valid date',
      descriptionRequired: 'Description is required',
      categoryRequired: 'Please select a category',
      emailRequired: 'Email is required',
      passwordRequired: 'Password is required',
      formErrors: 'Please correct the errors in the form',

      // Category errors
      cannotDeleteDefault: 'Cannot delete default categories',
      categoryInUse: 'Cannot delete category that has transactions',

      // Transaction errors
      cannotSkipNonRecurring: 'Cannot skip non-recurring transaction',
      cannotToggleNonTemplate: 'Cannot toggle non-template transaction',
      unknownInterval: 'Unknown interval type',

      // Server errors
      serverError: 'Server error. Please try again later.',
      networkError: 'Network error. Please check your connection.',
      serviceUnavailable: 'Service temporarily unavailable',
      tooManyRequests: 'Too many requests. Please slow down.',
      notFound: 'The requested item was not found',
      operationFailed: 'Operation failed. Please try again.',

      // Export errors
      noDataToExport: 'No data available to export',
      exportFailed: '{{format}} export failed. Please try again.',
      exportLimitReached: 'Too many export requests. Please wait a moment.',

      // Bulk operation errors
      bulkOperationFailed: 'Bulk {{operation}} failed',
      bulkOperationPartialFail: '{{failed}} transactions failed to {{operation}}',

      // File upload errors
      fileTooLarge: 'File size must be less than 5MB',
      invalidFileType: 'Please select a valid file type',
      uploadFailed: 'Upload failed. Please try again.',

      // Database errors
      databaseError: 'Database error occurred',
      queryFailed: 'Query failed to execute',
      connectionError: 'Connection to database failed',

      // General errors
      unexpectedError: 'An unexpected error occurred',
      operationTimeout: 'Operation timed out. Please try again.',
      unknownError: 'An unknown error occurred',
      generic: 'Something went wrong. Please try again.'
    },

    // Info messages
    info: {
      pdfExportComingSoon: 'PDF export coming soon! Please use CSV or JSON for now.',
      featureComingSoon: 'This feature is coming soon!',
      noNewNotifications: 'No new notifications',
      dataLoading: 'Loading your data...',
      operationInProgress: 'Operation in progress...',
      syncingData: 'Syncing your data...',
      checkingStatus: 'Checking status...'
    },

    // Warning messages
    warning: {
      unsavedChanges: 'You have unsaved changes',
      actionCannotBeUndone: 'This action cannot be undone',
      confirmDelete: 'Are you sure you want to delete this?',
      sessionExpiringSoon: 'Your session will expire soon',
      offlineMode: 'You are currently offline',
      dataOutOfSync: 'Your data might be out of sync'
    },

    // Loading messages
    loading: {
      authenticating: 'Authenticating...',
      savingChanges: 'Saving changes...',
      deletingItem: 'Deleting...',
      uploadingFile: 'Uploading file...',
      generatingExport: 'Generating export...',
      processingRequest: 'Processing request...',
      loadingData: 'Loading data...',
      refreshingData: 'Refreshing data...',
      preparingExport: 'Preparing {{format}} export...',
      syncingPreferences: 'Syncing preferences...',
      connectingToServer: 'Connecting to server...'
    },

    // Error messages
    errors: {
      noInternetConnection: 'No Internet Connection',
      checkConnectionAndRetry: 'Please check your internet connection and try again.',
      connectionIssues: 'Connection Issues',
      unableToVerifyLogin: 'Unable to verify your login. This might be temporary.'
    }
  },

  // Common/Shared
  common: {
    comingSoon: "Coming soon",
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    refresh: 'Refresh',
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
    available: 'Available',
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
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    thisWeek: 'This Week',
    lastWeek: 'Last Week',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    thisYear: 'This Year',
    lastYear: 'Last Year',
    last7Days: 'Last 7 Days',
    last30Days: 'Last 30 Days',
    last90Days: 'Last 90 Days',
    allTime: 'All Time',
    selectDate: 'Select Date',
    invalidDate: 'Invalid date',
    toggleTheme: 'Toggle Theme',
    switchToLight: 'Switch to Light Mode',
    switchToDark: 'Switch to Dark Mode',
    toggleLanguage: 'Toggle Language',
    openUserMenu: 'Open User Menu',
    openMenu: 'Open Menu',
    closeMenu: 'Close Menu',
    sessionOverrideActive: 'Session overrides active',
    floatingMenu: 'Floating Menu',
    accessibility: 'Accessibility',
    statement: 'Statement',
    compliance: 'Compliance',
    hide: 'Hide',
    show: 'Show',
    menu: 'Menu',
    notSet: 'Not set',
    saving: 'Saving...',
    deleting: 'Deleting...',
    updating: 'Updating...',
    copyright: '© {{year}} SpendWise. All rights reserved.',
    period: 'Period',
    summary: 'Summary',
    details: 'Details',
    optional: 'Optional',
    required: 'Required',
    recommended: 'Recommended',
    permanent: 'Permanent',
    temporary: 'Temporary',
    example: 'Example',
    examples: 'Examples',
    goBack: 'Go Back',
    confirm: 'Confirm',
    confirmAction: 'Confirm Action',
    positive: 'Positive',
    negative: 'Negative',
    neutral: 'Neutral',
    trending: 'Trending',
    spent: 'Spent',
    manage: 'Manage',
    results: 'results',
    of: 'of',
    from: 'from',
    to: 'to',
    with: 'with',
    without: 'without',
    or: 'or',
    and: 'and',
    never: 'Never',
    always: 'Always',
    sometimes: 'Sometimes',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    perDay: 'per day',
    perWeek: 'per week',
    perMonth: 'per month',
    perYear: 'per year',
    create: 'Create',
    advanced: ' Advanced Filters',
    customRange: "Custom range",

  },


  // Days of week
  days: {
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sun: 'Sun',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat'
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    profile: 'Profile',
    settings: 'Settings',
    reports: 'Reports',
    logout: 'Logout',
    categories: 'Categories',
    help: 'Help',
    about: 'About',
    categoryManager: 'Category Manager',
    categoryManagerDesc: 'Manage your personal and system categories',
    panels: "Panels",
    recurringManager: 'Recurring transactions manager',
    recurringManagerDesc: 'Manage your recurring transactions and templates',
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
    currentPassword: 'Current Password',
    newPassword: 'New Password',

    emailVerificationNotice: 'We will send you a verification email to confirm your account.',
    registrationSuccess: 'Registration Successful!',
    verificationEmailSent: 'We\'ve sent a verification email to',
    checkEmailInstructions: 'Please check your inbox and click the verification link to activate your account.',
    goToLogin: 'Go to Login',
    emailNotVerifiedError: 'This email is already registered but not verified. Please check your email or request a new verification link.',
    emailAlreadyRegistered: 'This email is already registered',
    verificationEmailSentMessage: 'Verification email sent! Please check your inbox.',
    emailNotVerifiedLogin: 'Your email is not verified. Please check your inbox or request a new verification email.',
    resendVerificationLink: 'Resend verification email',
    resendVerificationEmail: 'Resend Verification Email',
    resendVerificationDescription: 'We\'ll send a new verification email to',
    resendEmail: 'Resend Email',
    verificationEmailResent: 'Verification email sent successfully!',
    verifyingEmail: 'Verifying Your Email',
    pleaseWait: 'Please wait while we verify your email address...',
    emailVerified: 'Email Verified!',
    emailVerifiedSuccess: 'Your email has been successfully verified. Welcome to SpendWise!',
    tokenExpired: 'Verification Link Expired',
    tokenExpiredMessage: 'This verification link has expired. Please request a new one from the login page.',
    alreadyVerified: 'Already Verified',
    alreadyVerifiedMessage: 'This email has already been verified. You can proceed to login.',
    verificationFailed: 'Verification Failed',
    verificationFailedMessage: 'We couldn\'t verify your email. Please try again or contact support.',
    redirectingToDashboard: 'Redirecting you to your dashboard...',
    redirectingToSkipDates: 'Redirecting to skip dates management...',
    goToDashboard: 'Go to Dashboard',
    backToLogin: 'Back to Login',
    proceedToLogin: 'Proceed to Login',
    needHelp: 'Need help?',
    contactSupport: 'Contact Support',
    invalidVerificationLink: 'Invalid verification link',
    welcomeToSpendWise: 'Welcome to SpendWise',
    redirectingIn: 'Redirecting in',
    seconds: 'seconds',
    verifying: 'Verifying',

    // Actions
    signIn: 'Sign In',
    signUp: 'Sign Up',
    logout: 'Logout',
    loginAgain: 'Login Again',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    changePassword: 'Change Password',
    sendResetLink: 'Send Reset Link',
    agreeToTerms: 'I agree to the Terms of Service and Privacy Policy',

    // Password reset
    forgotPasswordTitle: 'Forgot Password?',
    forgotPasswordDesc: 'Enter your email to receive a reset link',
    resetPasswordTitle: 'Reset Password',
    resetPasswordDesc: 'Enter your new password',
    checkYourEmail: 'Check Your Email',
    resetLinkSent: 'Reset Link Sent!',
    resetEmailSent: 'We\'ve sent a reset link to your email',
    resetEmailSentDev: 'Email sent! Also check console for dev link.',
    emailSentDesc: 'Check your email for a link to reset your password. If it doesn\'t appear within a few minutes, check your spam folder.',
    passwordResetSuccess: 'Password Reset Successfully!',
    redirectingToLogin: 'Redirecting to login...',
    sendAnotherEmail: 'Send Another Email',
    developmentMode: 'Development Mode',
    emailSentDevDesc: 'Email sent via Gmail SMTP! Check console for additional testing link.',
    sendTestEmail: 'Send Test Email (Dev)',

    // Links
    noAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    signUpNow: 'Sign up now',
    signInNow: 'Sign in now',

    // Messages
    invalidCredentials: 'Invalid email or password',
    welcomeTitle: 'Welcome to Smart Finance',
    welcomeDescription: 'Take control of your financial future with intelligent expense tracking',
    loginSuccess: 'Login successful',
    logoutSuccess: 'Logged out successfully',
    passwordChanged: 'Password changed successfully',
    resetTokenInvalid: 'Invalid or missing reset token',
    resetTokenExpired: 'Reset token has expired',

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
    passwordSpecial: 'Contains special character',
    passwordStrength: 'Password Strength',
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
      smartDesc: 'Intelligent insights for better decisions'
    },

    // Email verification modal
    emailNotVerifiedModalTitle: 'Email Not Verified',
    emailNotVerifiedModalMessage: 'You haven\'t verified your email address yet.',
    checkEmailSpamMessage: 'Please check your inbox and spam folder. Sometimes verification emails end up there.',
    resendVerificationSuccess: 'Verification email sent successfully!',
    checkEmailAgainMessage: 'Please check your inbox again (including spam folder)',
    stillNoEmailMessage: 'Still don\'t see the email?',
    clickToResendMessage: 'Click here to resend',
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview of your finances',
    welcomeMessage: 'Welcome back, {{name}}!',
    overviewPeriod: 'Overview for {{period}}',

    greeting: {
      morning: 'Good Morning',
      afternoon: 'Good Afternoon',
      evening: 'Good Evening',
      night: 'Good Night'
    },

    balance: {
      title: 'Balance Overview',
      subtitle: 'Track your financial flow',
      income: 'Income',
      expenses: 'Expenses',
      total: 'Net Balance',
      error: 'Unable to load balance data',
      backToToday: 'Back to today',
      tooltip: 'Click the calendar to jump to any date',
      trending: 'Trending',
      spent: 'Spent',
      positive: 'Surplus',
      negative: 'Deficit',

      periods: {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        yearly: 'Yearly'
      }
    },

    transactions: {
      recent: 'Recent Transactions',
      latestActivity: 'Latest Activity',
      viewAll: 'View All',
      noTransactions: 'No transactions yet',
      noTransactionsDesc: 'Start tracking your finances by adding your first transaction',
      fetchError: 'Unable to load transactions',
      loading: 'Loading transactions...'
    },

    quickActions: {
      title: 'Quick Add',
      subtitle: 'Fast transaction entry',
      fast: 'Fast Entry',
      smart: 'Smart',
      placeholder: 'Enter amount',
      amount: 'Amount',
      addExpense: 'Add Expense',
      addIncome: 'Add Income',
      defaultDescription: 'Quick transaction',
      added: 'Added!',
      advanced: 'Advanced Actions',
      todayWarning: 'Transaction will be added to today, not the displayed date',
      switchToToday: 'Transaction added! Switch to today\'s view to see it?',
      hint: 'Use quick actions for fast transaction entry',
      quickExpense: 'Quick Expense',
      quickIncome: 'Quick Income',
      quickRecurring: 'Quick Recurring',
      historicalDateWarning: 'Adding to Historical Date',
      goToToday: 'Today',
      notToday: 'Historical Date Mode'
    },

    stats: {
      title: 'Statistics',
      subtitle: 'Transaction insights',
      showMore: 'Show More',
      showLess: 'Show Less',
      savingsRate: 'Savings Rate',
      dailyAvg: 'Daily Avg',
      budget: 'Budget',
      health: 'Health',
      excellent: 'Excellent',
      good: 'Good',
      improve: 'Improve',
      spendingPerDay: 'spending/day',
      onTrack: 'On track',
      review: 'Review',
      great: 'Great',
      ok: 'OK',
      poor: 'Poor',
      incomeVsExpenses: 'Income vs Expenses Breakdown',
      detailedInsights: 'Detailed Insights',
      averageTransaction: 'Average Transaction',
      totalTransactions: '{count} total transactions',
      recurringImpact: 'Recurring Impact',
      monthlyRecurringBalance: 'Monthly recurring balance',
      largestTransaction: 'Largest Transaction',
      singleTransaction: 'Single transaction',
      topCategory: 'Top Category',
      mostUsedCategory: 'Most used category',
      balanceTrend: 'Balance Trend',
      currentPeriodTrend: 'Current period trend',
      noData: 'No data for this period',
      income: 'Income',
      expenses: 'Expenses',
      ofTotal: 'of total',
      trend: {
        positive: 'Positive',
        negative: 'Negative',
        stable: 'Stable'
      }
    },

    tips: {
      title: 'Finance Tip',
      content: 'Track your daily expenses to identify spending patterns and potential savings opportunities.',
      nextTip: 'Next Tip',
      previousTip: 'Previous Tip'
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
    smartActions: 'Smart Actions',
    total: 'Total Transactions for the period',
    editTemplate: 'Edit Template',
    editAll: 'Edit All Future',
    editOnce: 'Edit This Occurrence',
    totalAmount: 'Total Amount',
    // Add these to your translation files

    templateActions: "Template Actions",
    recurringActions: "Recurring Actions",
    editActions: "Edit Actions",
    skipNextTooltip: "Skip the next scheduled occurrence of this transaction",
    pauseTooltip: "Pause this template - no new transactions will be created",
    resumeTooltip: "Resume this template - transactions will be created again",
    manageRecurringTooltip: "Open the recurring transactions manager",
    editSingleTooltip: "Edit only this occurrence, leave template unchanged",
    editTemplateTooltip: "Edit the template - affects all future transactions",
    editAllTooltip: "Edit this and all future occurrences",
    editTooltip: "Edit this transaction",
    deleteTemplateTooltip: "Delete this template and optionally all related transactions",
    deleteRecurringTooltip: "Delete this transaction or the entire recurring series",
    deleteTooltip: "Delete this transaction",
    nextOccurrenceNote: "When this transaction will happen next",
    frequencyNote: "How often this transaction repeats",
    templateActiveTitle: "Template is Active",
    templateActiveDescription: "New transactions are being created automatically",
    templatePausedTitle: "Template is Paused",
    templatePausedDescription: "No new transactions will be created",
    totalGenerated: "Total Generated",
    recurringTransactionInfo: "About Recurring Transactions",
    recurringDescription: "This transaction was created from a recurring template. You can:",
    editOnceDescription: "Change only this transaction",
    editAllDescription: "Change the template and all future transactions",
    scheduleManagement: "Schedule Management",
    templateManagement: "Template Management",
    skipSpecificDates: "Skip Specific Dates",
    pauseTemplate: "Pause Template",
    resumeTemplate: "Resume Template",
    scheduleActiveDescription: "Template is creating new transactions on schedule",
    schedulePausedDescription: "Template is paused - no new transactions being created",
    templateManagementDescription: "Edit or delete this entire template",
    chooseDeleteOption: "Choose Delete Option",
    searchTemplates: "Search Templates",
    type: "Type",
    upcomingTransactions: "Upcoming Transactions",
    scheduledTransactions: "Scheduled Transactions",
    automated: "Automated",
    editThis: "Edit",
    quickActions: "Quick Actions",
    noRecurringTemplates: "No recurring templates found",
    editTransactionDesc: 'Edit this transaction to modify its details',
    deleteTransactionDesc: 'Delete this transaction to remove it from your history',
    scheduled: 'Scheduled',
    transactions: "Total Transactions",
    skipError: {
      invalidTemplate: "Cannot skip: Invalid template",
      templateNotFound: "Template not found",
      general: "Failed to skip date. Please try again."
    },
    cannotSkipNonRecurring: "Cannot skip non-recurring transaction",
    cannotToggleNonTemplate: "Cannot toggle non-template transaction",
    unknownInterval: "Unknown interval type",
    nextPaymentSkipped: "Next payment skipped successfully",
    skipNextDesc: "Skip the next scheduled transaction without deleting the template",
    deleteTemplate: "Delete Template",
    deleteTemplateDesc: "Delete this recurring template and all its future transactions. Past transactions will remain unchanged.",




    // Display & Filtering
    showing: 'Showing',
    of: 'of',
    results: 'results',
    items: 'transactions',
    filtered: 'filtered from',
    totalTransactions: 'total transactions',
    noSearchResults: 'No transactions found for "{{term}}"',
    noTransactionsOfType: 'No {{type}} transactions found',
    noTransactions: 'No transactions for this period',
    noTransactionsDesc: 'Your transactions will appear here once you add them',
    noMatchingTransactions: 'No matching transactions',
    tryDifferentSearch: 'Try a different search term or filter',
    loadingTransactions: 'Loading your transactions...',

    // Actions
    addTransaction: 'Add Transaction',
    addNew: 'Add New',
    editTransaction: 'Edit Transaction',
    editSingleOccurrence: 'Edit Single Occurrence',
    editRecurringTemplate: 'Edit Recurring Template',
    editSingleNote: 'Changes will only affect this occurrence',
    editRecurringNote: 'Changes will affect the recurring template',
    editDetails: 'Modify transaction details',
    singleEdit: 'Single Edit',
    editing: 'Editing',
    editingSingleOccurrence: 'Editing Single Occurrence',
    singleEditNote: 'This will create a new transaction and won\'t affect the recurring template.',
    updateSuccess: 'Transaction Updated',
    transactionUpdated: 'Your transaction has been successfully updated',
    saveOnce: 'Save Once',
    deleteConfirm: 'Delete Transaction',
    deleteConfirmDesc: 'Are you sure you want to delete this transaction?',
    editSingle: 'Edit This',
    editThisOnly: 'Edit this occurrence only',
    manage: 'Manage',
    editThisDesc: "Edit only this transaction. Future recurring transactions will not be affected.",
    editAllDesc: "Edit this and all future recurring transactions in the series.",
    pauseDesc: "Pause this template temporarily. No future transactions will be created until you reactivate it.",
    skipNext: "Skip next",
    single: "Single",


    // Form fields
    selectDate: 'Select Date',
    selectCategory: 'Select category',
    date: 'Date',
    endsOn: 'Ends On',
    updateFuture: 'Apply to all future occurrences',
    updateFutureDesc: 'This will update all future occurrences of this recurring transaction',
    convertToRecurring: 'Create recurring template',
    convertToRecurringDesc: 'This will create both a one-time transaction and a recurring template for future use.',

    // Recurring
    recurring: 'Recurring',
    recurringTransactions: 'Recurring Transactions',
    recurringManagement: 'Recurring Management',
    recurringManager: {
      title: 'Recurring Transactions Manager',
      subtitle: 'Manage your automated transactions',
      generateNow: 'Generate Now'
    },

    recurringSection: {
      title: 'Recurring Transactions',
      management: 'Manage your recurring income and expenses',
      impact: 'Monthly Impact'
    },
    noRecurringTransactions: 'No recurring transactions',
    createRecurringNote: 'When you create recurring transactions, you\'ll be able to manage them here.',
    recurringNote: 'This is a recurring {{type}}. When editing, you can choose to update just this occurrence or all future occurrences.',
    recurringInfo: {
      title: 'About Recurring Transactions',
      description: 'Recurring transactions are automatically generated based on their frequency. You can modify or stop them at any time.'
    },
    convertedToRecurring: 'Successfully converted to recurring transaction',

    // Recurring Actions
    pause: 'Pause',
    resume: 'Resume',
    paused: 'Transaction paused',
    resumed: 'Transaction resumed',
    generateNow: 'Generate Now',
    generated: 'Recurring transactions generated',
    generateError: 'Failed to generate recurring transactions',

    // Skip Dates
    skipDates: {
      title: 'Skip Dates',
      info: 'Select dates to skip for {{name}} ({{interval}})',
      selectDates: 'Select Dates to Skip',
      addDate: 'Add Date',
      noDatesSelected: 'No dates selected',
      alreadySkipped: 'Already Skipped Dates',
      selectAtLeast: 'Please select at least one date to skip',
      success: 'Skip dates saved successfully',
      error: 'Failed to save skip dates',
      save: 'Save Skip Dates'
    },
    delete: {
      singleOccurrence: 'Delete this occurrence only',
      skipDates: 'Skip specific dates',
      skipDescription: 'Choose specific dates to skip for this recurring transaction while keeping the pattern active.',
      stopRecurring: 'Stop recurring from this date',
      deleteAll: 'Delete entire recurring series',
      allDescription: 'Permanently delete this recurring transaction and all its past and future occurrences.',
      permanent: 'Permanent',
      irreversible: 'Irreversible',
      manageDates: 'Manage dates',
      recurringInfo: 'This is a recurring transaction. Choose how to delete it.',
      cannotUndo: 'This action cannot be undone',
      confirmSingle: 'This will permanently delete this {{type}}.',
      skipRedirect: 'Skip dates management screen will open',
      nextOccurrence: 'Next occurrence on {{date}}',
      allWarning: 'This will delete all occurrences of this recurring transaction',
      redirectingToSkip: 'Redirecting to skip dates management',
      skipModalInfo: 'You will be able to choose specific dates to skip.',
      finalConfirmation: 'Final Confirmation Required',
      confirmAll: 'This will permanently delete the entire recurring transaction and its occurrences.',
      confirmFuture: 'This will stop the recurring {{type}} from this date onwards.',
      summaryChanges: 'Summary of changes:',
      summarySkip: 'Will skip selected dates',
      summaryDelete: 'Delete {{description}} ({{amount}})',
      summaryDeleteAll: 'Delete all recurring transaction occurrences',
      summaryCancelFuture: 'Cancel all future occurrences',
      goToSkipDates: 'Go to skip dates management',
      deleteOnce: 'Delete once',
      openSkipModal: 'Open skip dates screen',
      confirmDelete: 'Confirm deletion'
    },


    // Delete options
    deleteOptions: {
      single: {
        title: 'Delete this occurrence only',
        description: 'Remove just this specific {{type}} on {{date}}. The recurring pattern will continue for future dates.',
        recommended: true
      },
      future: {
        title: 'Stop this recurring transaction',
        description: 'Cancel this {{type}} from {{date}} onwards. All future occurrences will be removed.',
        warning: true,
        permanent: true
      }
    },
    deleteMessages: {
      thisActionCannotBeUndone: 'This action cannot be undone',
      finalConfirmation: 'Final Confirmation Required',
      permanentDelete: 'This will permanently delete this {{type}}.',
      permanentStop: 'This will permanently stop the recurring {{type}} and remove all future occurrences.',
      summaryOfChanges: 'Summary of changes:',
      deleteItem: 'Delete {{description}} ({{amount}})',
      cancelFutureOccurrences: 'Cancel all future occurrences',
      alsoCancel: 'This will also cancel the next occurrence on {{date}}',
      yesDeleteForever: 'Yes, Delete Forever',
      confirmDeletion: 'Confirm Deletion'
    },

    // Frequencies
    frequency: 'Frequency',
    frequencies: {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      oneTime: 'One-time',
      null: 'One-time'
    },

    // Filters
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
      clearAll: 'Clear All Filters',
      activeFilters: 'Active Filters',
      advancedFilters: "Advanced Filters",
      customDateRange: "Custom date range",
      from: "From",
      to: "To",


    },

    // Errors & Messages
    fetchError: 'Failed to load transactions',
    deleteError: 'Failed to delete transaction',
    updateError: 'Failed to update transaction',
    saveError: 'Failed to save transaction',
    endOfList: 'End of transaction history',
    tip: 'Try adding new transactions using the button above',
    quickTip: 'Quick Tip',
    emptyStateTip: 'Use the + button or quick actions to add your first transaction',
    totalItems: 'Total: {{count}} items',
    monthlyTotal: 'monthly total',
    active: 'active'
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
    showDetails: 'Show Details',
    recurringInfo: 'Recurring Transaction',
    recurringNote: 'This {{type}} repeats automatically. Changes can affect future occurrences.'
  },

  // Transaction Actions/Forms
  actions: {
    title: 'Add Transaction',
    buttontitle: 'Add New Transaction',
    detailedTransaction: 'Detailed Transaction',
    chooseAction: 'Choose your action below',
    selectType: 'Select transaction type',
    smart: 'Smart',
    oneClick: 'One-click add',
    smartDefaults: 'Smart defaults',
    customize: 'Fully customizable',
    quickActions: 'Quick Actions',
    allOptions: 'All Transaction Options',
    directEntry: 'Direct entry',
    fullCustomization: 'Full customization',
    transactionAdded: 'Your transaction has been added successfully!',

    // Quick actions
    quickExpense: 'Quick Expense',
    quickExpenseDesc: 'Add ₪100 expense instantly',
    quickIncome: 'Quick Income',
    quickIncomeDesc: 'Add ₪1000 income instantly',
    quickRecurring: 'Quick Recurring',
    quickRecurringDesc: 'Add monthly recurring expense',
    quickAdd: 'Quick Add',

    // Transaction types
    oneTimeExpense: 'One-time Expense',
    oneTimeExpenseDesc: 'Add a single expense transaction',
    recurringExpense: 'Recurring Expense',
    recurringExpenseDesc: 'Set up a repeating expense',
    recurringSetup: 'Setup Recurring',
    recurringSetupDesc: 'Configure automated transactions',
    oneTimeIncome: 'One-time Income',
    oneTimeIncomeDesc: 'Add a single income transaction',
    recurringIncome: 'Recurring Income',
    recurringIncomeDesc: 'Set up a repeating income',

    // Default descriptions
    defaultExpense: 'Quick expense',
    defaultIncome: 'Quick income',
    defaultRecurringExpense: 'Monthly recurring expense',
    defaultRecurringIncome: 'Monthly recurring income',

    // Form labels
    fillDetails: 'Fill in transaction details',
    amount: 'Amount',
    description: 'Description',
    descriptionPlaceholder: 'Enter description',
    selectCategory: 'Select Category',
    category: 'Category',
    date: 'Date',
    frequency: 'Frequency',
    endDate: 'End Date (Optional)',
    recurringOptions: 'Recurring Options',
    recurring: 'Recurring',
    dayOfWeek: 'Day of Week',

    // Examples
    example: 'Example',
    examples: 'Examples',
    expenseExample: 'e.g., Groceries, Gas, Shopping',
    recurringExpenseExample: 'e.g., Rent, Insurance, Subscription',
    incomeExample: 'e.g., Salary, Bonus, Gift',
    recurringIncomeExample: 'e.g., Salary, Dividend, Rental Income',
    examplePlaceholders: {
      coffee: 'Coffee with friends',
      lunch: 'Lunch at restaurant',
      salary: 'Monthly salary',
      rent: 'Monthly rent'
    },

    // Actions
    add: 'Add Transaction',
    addIncome: 'Add Income',
    addExpense: 'Add Expense',
    success: 'Success!',
    added: 'Added!',
    create: 'Create',
    update: 'Update',
    save: 'Save',
    cancel: 'Cancel',
    creating: 'Creating...',
    adding: 'Adding...',
    updating: 'Updating...',
    
    // Success messages
    addSuccess: 'Transaction Added Successfully',
    updateSuccess: 'Transaction Updated Successfully',
    
    // Historical date warnings
    historicalDateWarning: 'Adding transaction to historical date',
    goToToday: 'Go to Today',

    // Frequencies
    frequencies: {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      oneTime: 'One-time'
    },

    // Errors
    errors: {
      addingTransaction: 'Error adding transaction',
      invalidAmount: 'Please enter a valid amount',
      invalidDate: 'Please enter a valid date',
      descriptionRequired: 'Description is required',
      categoryRequired: 'Please select a category',
      formErrors: 'Please correct the errors in the form',
      general: 'An error occurred. Please try again.',
      updatingTransaction: 'Failed to update transaction',
    },

    // New keys
    new: 'New'
  },

  // Categories
  categories: {
    title: 'Categories',
    manage: 'Manage Categories',
    manageCategories: 'Manage Categories',
    wizardSubtitle: 'Organize your finances like a wizard',
    addNew: 'Add Category',
    create: 'Create Category',
    createFirst: 'Create First Category',
    edit: 'Edit Category',
    delete: 'Delete Category',
    deleteConfirm: 'Are you sure you want to delete this category?',
    name: 'Category Name',
    nameRequired: 'Category name is required',
    description: 'Description',
    descriptionPlaceholder: 'Optional category description',
    type: 'Type',
    icon: 'Icon',
    userCategories: 'My Categories',
    userCategoriesDesc: 'Your personal categories',
    defaultCategories: 'Default Categories',
    defaultCategoriesDesc: 'Built-in system categories',
    noUserCategories: 'You haven\'t created any custom categories yet',
    noUserCategoriesDesc: 'Create custom categories to organize your finances',
    default: 'Default',
    selectCategory: 'Select Category',
    selectCategoryHint: 'Please select a category for this transaction',
    noCategoriesFound: 'No categories found',
    createCategoriesFirst: 'Create new categories first',
    searchPlaceholder: 'Search categories...',
    created: 'Category created successfully',
    updated: 'Category updated successfully',
    deleted: 'Category deleted successfully',
    saveFailed: 'Failed to save category',
    deleteFailed: 'Failed to delete category',
    required: 'Required',
    searchCategories: "Search categories",
    addCategory: "Add category",


    // Filter options
    filter: {
      all: 'All',
      income: 'Income',
      expense: 'Expense'
    },

    // Statistics
    stats: {
      total: 'Total Categories',
      personal: 'Personal Categories',
      default: 'Default'
    },

    // Default category names
    General: 'General',
    Salary: 'Salary',
    Freelance: 'Freelance',
    Investments: 'Investments',
    Rent: 'Rent',
    Groceries: 'Groceries',
    Transportation: 'Transportation',
    Utilities: 'Utilities',
    Entertainment: 'Entertainment',
    Food: 'Food',
    Shopping: 'Shopping',
    Health: 'Health',
    Education: 'Education',
    Travel: 'Travel',
    Other: 'Other'
  },

  // Profile
      profile: {
      title: 'Profile',
      personalInformation: 'Personal Information',
      accountInformation: 'Account Information',
      profilePhoto: 'Profile Photo',
      username: 'Username',
      email: 'Email',
      phone: 'Phone',
      location: 'Location',
      website: 'Website',
      bio: 'Bio',
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
      invalidImageType: 'Please select a valid image file (JPG, PNG, or GIF)',
      imageTooLarge: 'Image size must be less than 5MB',
      active: "Active",
      subtitle: "Manage your account details and preferences",
      status: "Status",
      security: "Security",
      level: "Level",
      tier: "Tier",
      pro: "Pro",
      premium: "Premium",
      profileLastUpdate: "Profile Last Update",
      unknown: "unknown",
      notUpdatedYet: "Not updated yet",
      edit: "Edit",



    save: 'Save Changes',
    cancel: 'Cancel',
    updateSuccess: 'Profile updated successfully',
    updateError: 'Failed to update profile',
    saveError: 'Failed to save changes',
    accountInfo: 'Account Information',
    accountStatus: 'Account Status',
    verified: 'Verified',
    memberSince: 'Member Since',
    lastLogin: 'Last Login',

    tabs: {
      general: 'General',
      security: 'Security',
      preferences: 'Preferences',
      billing: 'Billing',
      notifications: 'Notifications',
      privacy: 'Privacy'
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
    systemTheme: 'System',
    languageChanged: 'Language changed successfully',
    currencyChanged: 'Currency changed successfully',
    
    // Budget
    budget: {
      monthlyBudget: 'Monthly Budget',
      enterAmount: 'Enter budget amount',
      optional: 'Optional'
    },
    
    // Templates
    templates: {
      quickSetup: 'Quick Setup',
      yourTemplates: 'Your Templates',
      setupComplete: 'Setup Complete! {{count}} templates ready',
      setupOptional: 'Templates are optional',
      canAddMore: 'You can add more templates anytime',
      canSkipForNow: 'You can skip this step and add templates later',
      carPayment: 'Car Payment',
      internet: 'Internet Service'
    },
    
    // Recurring transactions
    recurring: {
      whatAre: {
        title: 'What are Recurring Transactions?',
        description: 'Recurring transactions are payments or income that happen regularly - like your salary, rent, or monthly subscriptions. Instead of manually entering them each time, you can set them up once and SpendWise will track them automatically.'
      },
      examples: {
        title: 'Example',
        demo: 'Demo',
        salaryDesc: 'Your monthly salary automatically added as income',
        rentDesc: 'Monthly rent payment tracked as expense',
        phoneDesc: 'Phone bill automatically deducted each month'
      },
      benefits: {
        title: 'Why Use Recurring Transactions?',
        timeTitle: 'Save Time',
        timeDesc: 'No need to manually enter the same transactions every month',
        insightsTitle: 'Better Insights',
        insightsDesc: 'Get accurate predictions of your future financial situation',
        accuracyTitle: 'Stay Accurate',
        accuracyDesc: 'Never forget to track regular payments or income'
      },
      cta: {
        title: 'Ready to Set Up Your First Recurring Transactions?',
        description: 'Let\'s add some common recurring transactions to get you started.',
        button: 'Set Up Templates'
      }
    },
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

    // Advanced preferences
    advancedPreferences: 'Advanced Preferences',
    preferencesEditor: 'Preferences Editor',
    preferencesEditorInfo: 'Edit your preferences as JSON. Be careful with syntax!',
    rawPreferences: 'Raw Preferences JSON',
    preferencesUpdated: 'Preferences updated successfully',
    saveAllPreferences: 'Save All Preferences',
    commonPreferences: 'Common Preferences',
    notificationPreferences: 'Notification Preferences',
    privacyPreferences: 'Privacy Preferences',

    // Notification types
    notificationTypes: {
      email: 'Email Notifications',
      push: 'Push Notifications',
      sms: 'SMS Notifications',
      recurring: 'Recurring Transaction Alerts',
      reminders: 'Payment Reminders'
    },

    // Privacy options
    privacy: {
      showProfile: 'Show Public Profile',
      showStats: 'Show Statistics',
      allowAnalytics: 'Allow Analytics'
    },

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
    export: {
      selectFormat: "Select format",
      csvDescription: "CSV (spreadsheet, Excel, Google Sheets)",
      jsonDescription: "JSON (for import to other apps)",

      // Error messages
      invalidFormat: 'Invalid export format selected',
      formatUnavailable: '{format} export is not available',

      // Progress messages
      preparing: 'Preparing {format} export...',
      processing: 'Processing your export...',
      progressStatus: '{format} export: {progress}% complete',

      // Modal content
      title: 'Export Your Data',
      subtitle: 'Choose your preferred format for downloading',
      dataIncluded: "What's included in your export",
      loadingOptions: 'Loading export options...',
      formatsAvailable: 'formats available',

      // Format descriptions  
      csvFormat: 'Compatible with Excel, Google Sheets, and all spreadsheet applications',
      csvUseCase: 'Perfect for data analysis, reporting, and further processing',
      jsonFormat: 'Machine-readable format with complete data structure and metadata',
      jsonUseCase: 'Ideal for developers, data scientists, and technical users',

      // Metadata
      estimatedSize: 'Size',
      instant: 'Instant download',

      // Security
      security: 'Security & Privacy',
      httpsEncrypted: 'HTTPS Encrypted',
      notStored: 'Not Stored',
      onDemand: 'On-Demand Only',

      // User info
      userInfo: 'Export for {username} • {currency} • {language}'
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

  // Statistics
  stats: {
    title: 'Statistics',
    overview: 'Overview',
    currentBalance: 'Current Balance',
    monthlyIncome: 'Monthly Income',
    monthlyExpenses: 'Monthly Expenses',
    totalTransactions: 'Total Transactions',
    activeRecurring: 'Active Recurring',
    quickOverview: 'Quick Overview',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    thisYear: 'This Year',
    allTime: 'All Time',
    activeSubscriptions: 'Active Subscriptions',
    perMonth: 'Per Month',
    savingsRate: 'Savings Rate',
    yearlyAverage: 'Yearly Average',
    activityOverview: 'Activity Overview',
    dailyAverage: 'Daily Average',
    perDay: 'per day',
    trend: 'Trend',
    categories: 'Categories',
    topCategories: 'Top Categories', // ✅ ADD: Missing translation
    noData: 'No data available',
    noTrendData: 'No trend data available',
    noCategoryData: 'No category data available',
    loadingStats: 'Loading statistics...'
  },

  // Forms
  forms: {
    errors: {
      required: 'This field is required',
      invalidEmail: 'Invalid email address',
      invalidAmount: 'Invalid amount',
      invalidDate: 'Invalid date',
      passwordTooShort: 'Password must be at least 8 characters',
      passwordsDontMatch: 'Passwords do not match',
      descriptionRequired: 'Description is required',
      endDateRequired: 'End date is required',
      categoryRequired: 'Category is required',
      usernameRequired: 'Username is required',
      emailRequired: 'Email is required'
    },
    placeholders: {
      email: 'your@email.com',
      password: '••••••••',
      amount: '0.00',
      description: 'Enter description',
      search: 'Search...'
    }
  },

  // Validation
  validation: {
    required: 'This field is required',
    usernameRequired: 'Username is required',
    usernameTooShort: 'Username must be at least 3 characters',
    emailRequired: 'Email is required',
    emailInvalid: 'Invalid email format',
    passwordRequired: 'Password is required',
    passwordTooShort: 'Password must be at least 8 characters',
    passwordNeedsNumber: 'Password must contain at least one number',
    passwordNeedsUpper: 'Password must contain at least one uppercase letter',
    passwordNeedsLower: 'Password must contain at least one lowercase letter',
    passwordNeedsSpecial: 'Password must contain at least one special character',
    passwordsDontMatch: 'Passwords do not match',
    agreeToTerms: 'You must agree to the terms',
    amountRequired: 'Amount is required',
    amountInvalid: 'Amount must be a valid number',
    amountPositive: 'Amount must be greater than 0',
    dateRequired: 'Date is required',
    dateInvalid: 'Invalid date format',
    categoryRequired: 'Category is required'
  },

  // Register specific
  register: {
    success: {
      title: 'Registration Successful!',
      message: 'Registration successful! Please login to continue.'
    },
    errors: {
      registrationFailed: 'Registration failed. Please try again.',
      emailExists: 'Email already exists',
      usernameExists: 'Username already exists'
    }
  },

  // Calendar
  calendar: {
    weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    today: 'Today',
    previousMonth: 'Previous Month',
    nextMonth: 'Next Month',
    selectDate: 'Select Date',
    close: 'Close'
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
    required: 'Required',

    compliance: 'This site complies with the Israeli accessibility regulations (IS 5568).',
    accessibilityStatement: 'Accessibility Statement',

          statement: {
        title: 'Accessibility Statement',
        intro: 'SpendWise is committed to making its website accessible to people with disabilities, in accordance with the Israeli Equal Rights for Persons with Disabilities Law (1998) and the Equal Rights for Persons with Disabilities Regulations (Service Accessibility Adaptations) of 2013.',
        features: 'Accessibility Features:',
        featuresList: {
          screenReader: 'Screen reader compatibility',
          colorContrast: 'Adjustable color contrast',
          textSize: 'Text size adjustment',
          keyboardNav: 'Keyboard navigation support',
          multiLanguage: 'Hebrew and English language support'
        },
        level: 'Accessibility Level:',
        levelDescription: 'This site conforms to Level AA compliance per WCAG 2.1 guidelines and the Israeli Standard (IS 5568).',
        contact: 'Accessibility Contact:',
        contactDescription: 'If you encounter accessibility issues or wish to provide feedback about accessibility on our site, please contact our accessibility coordinator:',
        phone: 'Phone',
        lastUpdated: 'Last updated: 01/01/{{year}}',
        close: 'Close'
      }
    },

  // Privacy Policy
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: {{date}}',
    sections: {
      intro: {
        title: 'Introduction',
        content: 'SpendWise ("we", "our", or "us") respects your privacy and is committed to protecting your personal data in accordance with Israeli Privacy Protection Law 1981 and applicable regulations.'
      },
      dataCollection: {
        title: 'Data We Collect',
        content: 'We collect information you provide directly to us (account information, financial data) and automatically through your use of our service (usage analytics, device information).'
      },
      dataUse: {
        title: 'How We Use Your Data',
        content: 'Your data is used to provide our financial management services, improve user experience, ensure security, and comply with legal obligations.'
      },
      dataProtection: {
        title: 'Data Protection',
        content: 'We implement appropriate security measures including encryption, secure servers, and regular security audits to protect your personal information.'
      },
      userRights: {
        title: 'Your Rights',
        content: 'You have the right to access, correct, delete, or export your personal data. Contact us for any data-related requests.'
      },
      contact: {
        title: 'Contact Us',
        content: 'For privacy-related questions, contact us at: spendwise.verifiction@gmail.com'
      }
    }
  },

  // Terms of Service
  terms: {
    title: 'Terms of Service',
    lastUpdated: 'Last updated: {{date}}',
    sections: {
      acceptance: {
        title: 'Acceptance of Terms',
        content: 'By using SpendWise, you agree to these terms and conditions. If you do not agree, please discontinue use of our service.'
      },
      service: {
        title: 'Service Description',
        content: 'SpendWise provides personal financial management tools including expense tracking, budget management, and financial analytics.'
      },
      userResponsibilities: {
        title: 'User Responsibilities',
        content: 'You are responsible for maintaining account security, providing accurate information, and using the service in compliance with applicable laws.'
      },
      limitations: {
        title: 'Service Limitations',
        content: 'Our service is provided "as is" without warranties. We are not liable for any financial decisions made based on our tools.'
      },
      termination: {
        title: 'Termination',
        content: 'Either party may terminate this agreement. Upon termination, your access will cease but your data retention rights remain as per our Privacy Policy.'
      },
      governingLaw: {
        title: 'Governing Law',
        content: 'These terms are governed by Israeli law. Disputes will be resolved in Israeli courts.'
      },
      contact: {
        title: 'Contact Us',
        content: 'For questions about these terms, contact us at: spendwise.verifiction@gmail.com'
      }
    }
  },

  // Floating Menu
  floatingMenu: {
    changeLanguage: 'Change Language',
    switchCurrency: 'Switch Currency',
    toggleTheme: 'Toggle Theme',
    switchToLight: 'Switch to Light Mode',
    switchToDark: 'Switch to Dark Mode',
    accessibility: 'Accessibility'
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
    close: 'Close',
    followUs: 'Follow Us',
    newsletter: 'Newsletter',
    newsletterDesc: 'Get financial tips and updates'
  },

  // Error messages
  errors: {
    generic: 'An error occurred. Please try again.',
    network: 'Network error. Please check your connection.',
    validation: 'Please check the form for errors.',
    unauthorized: 'You are not authorized to perform this action.',
    notFound: 'The requested item was not found.',
    server: 'Server error. Please try again later.',
    timeout: 'Request timed out. Please try again.',
    unknown: 'An unknown error occurred.'
  },

  // NEW: Not Found page translations
  notFound: {
    title: 'Page Not Found',
    message: 'The page you\'re looking for doesn\'t exist.',
    suggestion: 'It might have been moved, deleted, or you entered the wrong URL.',
    goHome: 'Go to Dashboard',
    needHelp: 'Need Help?',
    helpMessage: 'Contact our support team if you continue having issues.'
  },

  // Onboarding translations
  onboarding: {
    // Common onboarding terms
    common: {
      next: 'Next',
      previous: 'Previous',
      skip: 'Skip',
      complete: 'Complete Setup',
      completing: 'Completing...',
      confirmClose: 'Are you sure you want to close? Your progress will be saved.',
      of: 'of',
      step: 'Step'
    },

    // Welcome step
    welcome: {
      title: 'Welcome to SpendWise!',
      greeting: 'Hello {{name}}!',
      description: 'Let\'s set up your financial management experience and help you understand how SpendWise can simplify your money management.',
      
      features: {
        recurring: {
          title: 'Recurring Transactions',
          description: 'Automate your regular income and expenses for effortless tracking.'
        },
        analytics: {
          title: 'Smart Analytics',
          description: 'Get insights into your spending patterns and financial trends.'
        },
        security: {
          title: 'Secure & Private',
          description: 'Your financial data is encrypted and stored securely.'
        }
      },

      highlight: {
        title: 'Recurring Transactions',
        subtitle: 'The key to effortless financial management',
        description: 'Set up transactions that happen regularly - like salary, rent, or subscriptions - and SpendWise will automatically track them for you.'
      },

      examples: {
        salary: 'Monthly Salary',
        rent: 'Rent Payment',
        phone: 'Phone Bill',
        utilities: 'Utilities'
      },

      cta: {
        description: 'Ready to take control of your finances? Let\'s get started!',
        button: 'Let\'s Begin'
      },

      stats: {
        minutes: 'Minutes to Setup',
        steps: 'Simple Steps',
        benefits: 'Benefits'
      }
    },

    // Preferences step
    preferences: {
      title: 'Customize Your Experience',
      subtitle: 'Set your preferences to personalize SpendWise',
      description: 'Configure these settings to personalize your SpendWise experience. You can change these anytime in your profile.',
      
      localization: 'Language & Region',
      language: 'Language',
      currency: 'Currency',
      
      appearance: 'Appearance',
      theme: 'Theme',
      themes: {
        light: 'Light',
        dark: 'Dark',
        system: 'System'
      },
      
      budget: 'Monthly Budget',
      monthlyBudget: 'Monthly Budget',
      enterAmount: 'Enter budget amount',
      saving: 'Saving...'
    },

    // Recurring explanation step
    recurring: {
      title: 'Understanding Recurring Transactions',
      subtitle: 'Learn how to automate your financial tracking'
    },

    // Templates step
    templates: {
      title: 'Add Your First Recurring Transactions',
      subtitle: 'Set up common recurring transactions to get started'
    },

    // Step subtitles for header
    step1: {
      subtitle: 'Welcome to your financial journey'
    },
    step2: {
      subtitle: 'Personalize your experience'
    },
    step3: {
      subtitle: 'Master recurring transactions'
    },
    step4: {
      subtitle: 'Set up your first templates'
    }
  },

  // Recurring transactions education
  recurring: {
    whatAre: {
      title: 'What are Recurring Transactions?',
      description: 'Recurring transactions are payments or income that happen automatically on a regular schedule. Instead of manually entering them each time, you set them up once and SpendWise handles the rest.'
    },
    
    examples: {
      title: 'Real Examples',
      demo: 'Play Demo',
      salaryDesc: 'Your monthly income automatically tracked',
      rentDesc: 'Monthly housing payment never forgotten',
      phoneDesc: 'Regular subscription automatically recorded'
    },
    
    benefits: {
      title: 'Why Use Recurring Transactions?',
      timeTitle: 'Save Time',
      timeDesc: 'Set up once, track automatically forever',
      insightsTitle: 'Better Insights',
      insightsDesc: 'See your real spending patterns and trends',
      accuracyTitle: 'Stay Accurate',
      accuracyDesc: 'Never forget regular payments again'
    },
    
    cta: {
      title: 'Ready to Set Up Your First Recurring Transaction?',
      description: 'In the next step, we\'ll help you add common recurring transactions to get started.',
      button: 'Let\'s Set Them Up'
    }
  },

  // Templates management
  templates: {
    quickSetup: 'Quick Setup Suggestions',
    yourTemplates: 'Your Templates',
    createCustom: 'Create Custom Template',
    setupComplete: 'Great! You\'ve set up {{count}} recurring transactions',
    setupOptional: 'No templates yet - that\'s okay!',
    canAddMore: 'You can always add more from the dashboard',
    canSkipForNow: 'You can add recurring transactions anytime from your dashboard',
    addedFromOnboarding: 'Added during onboarding',
    carPayment: 'Car Payment',
    internet: 'Internet Bill'
  },

  // Budget settings
  budget: {
    monthlyBudget: 'Monthly Budget',
    enterAmount: 'Enter budget amount',
    optional: 'Optional',
    saving: 'Saving...'
  },

  // === HEBREW TRANSLATIONS ===
  he: {
    // Toast messages in Hebrew
    toast: {
      // Success messages
      success: {
        // Authentication
        loginSuccess: 'ברוך השב!',
        registerSuccess: 'ההרשמה הושלמה בהצלחה! אנא בדוק את האימייל שלך.',
        logoutSuccess: 'התנתקת בהצלחה',
        emailVerified: 'האימייל אומת בהצלחה!',
        verificationSent: 'אימייל אימות נשלח!',
        passwordReset: 'הסיסמה אופסה בהצלחה',
        passwordChanged: 'הסיסמה שונתה בהצלחה',

        // Profile
        profileUpdated: 'הפרופיל עודכן בהצלחה',
        profilePictureUploaded: 'תמונת הפרופיל הועלתה בהצלחה',
        preferencesUpdated: 'ההעדפות עודכנו בהצלחה',

        // Transactions
        transactionCreated: 'העסקה נוצרה בהצלחה',
        transactionUpdated: 'העסקה עודכנה בהצלחה',
        transactionDeleted: 'העסקה נמחקה בהצלחה',
        transactionGenerated: 'עסקאות קבועות נוצרו בהצלחה',
        templateUpdated: 'התבנית עודכנה בהצלחה',
        skipDatesSuccess: 'תאריכים נדלגו בהצלחה',
        dataRefreshed: 'כל נתוני העסקאות רוענו',
        nextPaymentSkipped: 'התשלום הבא נדלג בהצלחה',

        // Categories
        categoryCreated: 'הקטגוריה נוצרה בהצלחה',
        categoryUpdated: 'הקטגוריה עודכנה בהצלחה',
        categoryDeleted: 'הקטגוריה נמחקה בהצלחה',

        // Export
        csvExportCompleted: 'יצוא CSV הושלם בהצלחה!',
        jsonExportCompleted: 'יצוא JSON הושלם בהצלחה!',

        // Bulk operations
        bulkOperationSuccess: '{{count}} עסקאות {{operation}} בהצלחה',

        // General
        actionCompleted: 'הפעולה הושלמה בהצלחה',
        changesSaved: 'השינויים נשמרו בהצלחה',
        operationSuccess: 'הפעולה הושלמה בהצלחה'
      },

      // Error messages
      error: {
        // Authentication errors
        invalidCredentials: 'דואר אלקטרוני או סיסמה לא תקינים',
        emailNotVerified: 'האימייל שלך לא אומת. אנא בדוק את תיבת הדואר.',
        emailAlreadyExists: 'כתובת האימייל הזו כבר רשומה',
        usernameExists: 'שם המשתמש כבר תפוס',
        tokenExpired: 'תוקף ההתחברות פג. אנא התחבר שוב.',
        unauthorized: 'אין לך הרשאה לבצע פעולה זו',
        authenticationFailed: 'האימות נכשל. אנא נסה שוב.',

        // Validation errors
        categoryNameRequired: 'שם הקטגוריה נדרש',
        categoryTypeRequired: 'סוג הקטגוריה חייב להיות הכנסה או הוצאה',
        invalidAmount: 'אנא הזן סכום תקין',
        invalidDate: 'אנא הזן תאריך תקין',
        descriptionRequired: 'תיאור נדרש',
        categoryRequired: 'אנא בחר קטגוריה',
        emailRequired: 'דואר אלקטרוני נדרש',
        passwordRequired: 'סיסמה נדרשת',
        formErrors: 'אנא תקן את השגיאות בטופס',

        // Category errors
        cannotDeleteDefault: 'לא ניתן למחוק קטגוריות ברירת מחדל',
        categoryInUse: 'לא ניתן למחוק קטגוריה שיש לה עסקאות',

        // Transaction errors
        cannotSkipNonRecurring: 'לא ניתן לדלג על עסקה שאינה חוזרת',
        cannotToggleNonTemplate: 'לא ניתן להחליף מצב של עסקה שאינה תבנית',
        unknownInterval: 'סוג מרווח לא מוכר',

        // Server errors
        serverError: 'שגיאת שרת. אנא נסה שוב מאוחר יותר.',
        networkError: 'שגיאת רשת. אנא בדוק את החיבור שלך.',
        serviceUnavailable: 'השירות אינו זמין זמנית',
        tooManyRequests: 'יותר מדי בקשות. אנא האט.',
        notFound: 'הפריט המבוקש לא נמצא',
        operationFailed: 'הפעולה נכשלה. אנא נסה שוב.',

        // Export errors
        noDataToExport: 'אין נתונים זמינים לייצוא',
        exportFailed: 'יצוא {{format}} נכשל. אנא נסה שוב.',
        exportLimitReached: 'יותר מדי בקשות ייצוא. אנא המתן רגע.',

        // Bulk operation errors
        bulkOperationFailed: 'פעולה קבוצתית {{operation}} נכשלה',
        bulkOperationPartialFail: '{{failed}} עסקאות נכשלו ב{{operation}}',

        // File upload errors
        fileTooLarge: 'גודל הקובץ חייב להיות קטן מ-5MB',
        invalidFileType: 'אנא בחר סוג קובץ תקין',
        uploadFailed: 'ההעלאה נכשלה. אנא נסה שוב.',

        // Database errors
        databaseError: 'אירעה שגיאת בסיס נתונים',
        queryFailed: 'השאילתה נכשלה בביצוע',
        connectionError: 'החיבור לבסיס הנתונים נכשל',

        // General errors
        unexpectedError: 'אירעה שגיאה לא צפויה',
        operationTimeout: 'הפעולה תם זמנה. אנא נסה שוב.',
        unknownError: 'אירעה שגיאה לא ידועה',
        generic: 'משהו השתבש. אנא נסה שוב.'
      },

      // Info messages
      info: {
        pdfExportComingSoon: 'יצוא PDF בקרוב! אנא השתמש ב-CSV או JSON כרגע.',
        featureComingSoon: 'התכונה הזו בקרוב!',
        noNewNotifications: 'אין התראות חדשות',
        dataLoading: 'טוען את הנתונים שלך...',
        operationInProgress: 'פעולה בתהליך...',
        syncingData: 'מסנכרן את הנתונים שלך...',
        checkingStatus: 'בודק סטטוס...'
      },

      // Warning messages
      warning: {
        unsavedChanges: 'יש לך שינויים שלא נשמרו',
        actionCannotBeUndone: 'לא ניתן לבטל פעולה זו',
        confirmDelete: 'האם אתה בטוח שברצונך למחוק את זה?',
        sessionExpiringSoon: 'ההתחברות שלך תפוג בקרוב',
        offlineMode: 'אתה כרגע במצב לא מקוון',
        dataOutOfSync: 'הנתונים שלך עלולים להיות לא מסונכרנים'
      },

      // Loading messages
      loading: {
        authenticating: 'מאמת...',
        savingChanges: 'שומר שינויים...',
        deletingItem: 'מוחק...',
        uploadingFile: 'מעלה קובץ...',
        generatingExport: 'יוצר ייצוא...',
        processingRequest: 'מעבד בקשה...',
        loadingData: 'טוען נתונים...',
        refreshingData: 'מרענן נתונים...',
        preparingExport: 'מכין יצוא {{format}}...',
        syncingPreferences: 'מסנכרן העדפות...',
        connectingToServer: 'מתחבר לשרת...'
      },

      // Error messages
      errors: {
        noInternetConnection: 'אין חיבור לאינטרנט',
        checkConnectionAndRetry: 'אנא בדוק את החיבור לאינטרנט ונסה שוב.',
        connectionIssues: 'בעיות חיבור',
        unableToVerifyLogin: 'לא ניתן לאמת את הכניסה שלך. זה יכול להיות זמני.'
      }
    },

    // Common/Shared
    common: {
      comingSoon: "בקרוב...",
      loading: 'טוען...',
      save: 'שמור',
      cancel: 'ביטול',
      refresh: 'רענן',
      delete: 'מחק',
      edit: 'ערוך',
      available: 'זמין',
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
      yesterday: 'אתמול',
      tomorrow: 'מחר',
      thisWeek: 'השבוע',
      lastWeek: 'שבוע שעבר',
      thisMonth: 'החודש',
      lastMonth: 'החודש שעבר',
      thisYear: 'השנה',
      lastYear: 'שנה שעברה',
      last7Days: '7 ימים אחרונים',
      last30Days: '30 ימים אחרונים',
      last90Days: '90 ימים אחרונים',
      allTime: 'כל הזמן',
      selectDate: 'בחר תאריך',
      invalidDate: 'תאריך לא תקין',
      toggleTheme: 'החלף ערכת נושא',
      switchToLight: 'עבור למצב בהיר',
      switchToDark: 'עבור למצב כהה',
      toggleLanguage: 'החלף שפה',
      openUserMenu: 'פתח תפריט משתמש',
      openMenu: 'פתח תפריט',
      closeMenu: 'סגור תפריט',
      sessionOverrideActive: 'עקיפת העדפות פעילה',
      floatingMenu: 'תפריט צף',
      accessibility: 'נגישות',
      statement: 'הצהרה',
      compliance: 'תאימות',
      hide: 'הסתר',
      show: 'הצג',
      menu: 'תפריט',
      notSet: 'לא הוגדר',
      saving: 'שומר...',
      deleting: 'מוחק...',
      updating: 'מעדכן...',
      copyright: '© {{year}} SpendWise. כל הזכויות שמורות.',
      period: 'תקופה',
      summary: 'סיכום',
      details: 'פרטים',
      optional: 'אופציונלי',
      required: 'חובה',
      recommended: 'מומלץ',
      permanent: 'קבוע',
      temporary: 'זמני',
      example: 'דוגמה',
      examples: 'דוגמאות',
      goBack: 'חזור',
      confirm: 'אשר',
      confirmAction: 'אשר פעולה',
      positive: 'חיובי',
      negative: 'שלילי',
      neutral: 'ניטרלי',
      trending: 'מגמה',
      spent: 'הוצא',
      manage: 'נהל',
      results: 'תוצאות',
      of: 'מתוך',
      from: 'מ',
      to: 'עד',
      with: 'עם',
      without: 'ללא',
      or: 'או',
      and: 'ו',
      never: 'אף פעם',
      always: 'תמיד',
      sometimes: 'לפעמים',
      daily: 'יומי',
      weekly: 'שבועי',
      monthly: 'חודשי',
      yearly: 'שנתי',
      perDay: 'ליום',
      perWeek: 'לשבוע',
      perMonth: 'לחודש',
      perYear: 'לשנה',
      create: 'צור',
      advanced: 'פילטרים מתקדמים',
      customRange: "טווח מותאם",
      change: 'שנה',
      logout: 'התנתק',
      weak: 'חלש',
      fair: 'בינוני',
      good: 'טוב',
      strong: 'חזק',
      protected: 'מוגן',
      uploadFailed: 'ההעלאה נכשלה. אנא נסה שוב.',
      passwordMinLength: 'הסיסמה חייבת להיות באורך של 8 תווים לפחות',
      passwordsDoNotMatch: 'הסיסמאות אינן תואמות',
      usernameRequired: 'שם משתמש נדרש',
    },

    // Days of week
    days: {
      sunday: 'ראשון',
      monday: 'שני',
      tuesday: 'שלישי',
      wednesday: 'רביעי',
      thursday: 'חמישי',
      friday: 'שישי',
      saturday: 'שבת',
      sun: 'א׳',
      mon: 'ב׳',
      tue: 'ג׳',
      wed: 'ד׳',
      thu: 'ה׳',
      fri: 'ו׳',
      sat: 'ש׳'
    },

    // Navigation
    nav: {
      dashboard: 'דשבורד',
      transactions: 'עסקאות',
      profile: 'פרופיל',
      settings: 'הגדרות',
      reports: 'דוחות',
      logout: 'התנתק',
      categories: 'קטגוריות',
      help: 'עזרה',
      about: 'אודות',
      categoryManager: 'מנהל קטגוריות',
          panels: "פנלי שליטה",
    recurringManager: 'מנהל עסקאות חוזרות',
    recurringManagerDesc: 'נהל עסקאות חוזרות',
    categoryManagerDesc: 'נהל את הקטגוריות שלך',
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
      currentPassword: 'סיסמה נוכחית',
      newPassword: 'סיסמה חדשה',
              accountInfo: 'פרטי חשבון',
        security: 'אבטחה',
        emailVerificationNotice: 'נשלח אליך אימייל לאימות על מנת לאשר את החשבון שלך.',
      registrationSuccess: 'ההרשמה הושלמה בהצלחה!',
      verificationEmailSent: 'שלחנו אימייל אימות אל',
      checkEmailInstructions: 'אנא בדוק את תיבת הדואר ולחץ על קישור האימות להפעלת החשבון.',
      goToLogin: 'לעמוד ההתחברות',
      emailNotVerifiedError: 'כתובת האימייל הזו כבר רשומה אך לא אומתה. אנא בדוק את תיבת הדואר או בקש קישור אימות חדש.',
      emailAlreadyRegistered: 'כתובת האימייל הזו כבר רשומה',
      verificationEmailSentMessage: 'אימייל אימות נשלח! אנא בדוק את תיבת הדואר.',
      emailNotVerifiedLogin: 'האימייל שלך לא אומת. בדוק את תיבת הדואר או בקש אימייל אימות חדש.',
      resendVerificationLink: 'שלח שוב אימייל אימות',
      resendVerificationEmail: 'שלח שוב אימייל אימות',
      resendVerificationDescription: 'נשלח אליך שוב אימייל אימות לכתובת',
      resendEmail: 'שלח אימייל מחדש',
      verificationEmailResent: 'אימייל אימות נשלח בהצלחה!',
      verifyingEmail: 'מאמת את האימייל שלך',
      pleaseWait: 'אנא המתן בזמן שאנו מאמתים את כתובת הדואר האלקטרוני...',
      emailVerified: 'האימייל אומת בהצלחה!',
      emailVerifiedSuccess: 'כתובת האימייל שלך אומתה בהצלחה. ברוך הבא ל- SpendWise!',
      tokenExpired: 'קישור האימות פג תוקף',
      tokenExpiredMessage: 'קישור האימות הזה פג תוקף. אנא בקש קישור חדש מעמוד ההתחברות.',
      alreadyVerified: 'כבר אומת',
      alreadyVerifiedMessage: 'האימייל הזה כבר אומת. ניתן להמשיך להתחברות.',
      verificationFailed: 'האימות נכשל',
      verificationFailedMessage: 'לא הצלחנו לאמת את כתובת האימייל. אנא נסה שוב או פנה לתמיכה.',
      redirectingToDashboard: 'מעביר אותך ללוח הבקרה...',
      redirectingToSkipDates: 'מעביר למנהל תאריכים...',
      goToDashboard: 'מעבר ללוח הבקרה',
      backToLogin: 'חזרה להתחברות',
      proceedToLogin: 'המשך להתחברות',
      needHelp: 'צריך עזרה?',
      contactSupport: 'פנה לתמיכה',
      invalidVerificationLink: 'קישור אימות לא חוקי',
      welcomeToSpendWise: 'ברוכים הבאים לSpendWise',
      redirectingIn: 'מפנה תוך',
      seconds: 'שניות',
      verifying: 'מאמת',


      // Actions
      signIn: 'התחברות',
      signUp: 'הרשמה',
      logout: 'התנתק',
      loginAgain: 'התחברות מחדש',
      rememberMe: 'זכור אותי',
      forgotPassword: 'שכחת סיסמה?',
      resetPassword: 'איפוס סיסמה',
      changePassword: 'שינוי סיסמה',
      sendResetLink: 'שלח קישור איפוס',
      agreeToTerms: 'אני מסכים לתנאי השימוש ומדיניות הפרטיות',

      // Password reset
      forgotPasswordTitle: 'שכחת סיסמה?',
      forgotPasswordDesc: 'הזן את כתובת הדוא״ל שלך לקבלת קישור איפוס',
      resetPasswordTitle: 'איפוס סיסמה',
      resetPasswordDesc: 'הזן את הסיסמה החדשה שלך',
      checkYourEmail: 'בדוק את הדוא״ל שלך',
      resetLinkSent: 'קישור איפוס נשלח!',
      resetEmailSent: 'שלחנו קישור איפוס לדוא״ל שלך',
      resetEmailSentDev: 'דוא״ל נשלח! בדוק גם את הקונסול לקישור פיתוח.',
      emailSentDesc: 'בדוק את הדוא״ל שלך לקישור לאיפוס הסיסמה. אם הוא לא מופיע תוך מספר דקות, בדוק את תיקיית הספאם.',
      passwordResetSuccess: 'הסיסמה אופסה בהצלחה!',
      redirectingToLogin: 'מפנה לעמוד ההתחברות...',
      sendAnotherEmail: 'שלח דוא״ל נוסף',
      developmentMode: 'מצב פיתוח',
      emailSentDevDesc: 'דוא״ל נשלח דרך Gmail SMTP! בדוק את הקונסול לקישור בדיקה נוסף.',
      sendTestEmail: 'שלח דוא״ל בדיקה (פיתוח)',

      // Links
      noAccount: 'אין לך חשבון?',
      alreadyHaveAccount: 'כבר יש לך חשבון?',
      signUpNow: 'הירשם עכשיו',
      signInNow: 'התחבר עכשיו',

      // Messages
      invalidCredentials: 'דואר אלקטרוני או סיסמה לא תקינים',
      welcomeTitle: 'ברוכים הבאים לניהול פיננסי חכם',
      welcomeDescription: 'קחו שליטה על העתיד הפיננסי שלכם עם מעקב הוצאות חכם',
      loginSuccess: 'ההתחברות בוצעה בהצלחה',
      logoutSuccess: 'התנתקת בהצלחה',
      passwordChanged: 'הסיסמה שונתה בהצלחה',
      resetTokenInvalid: 'קישור איפוס לא תקין או חסר',
      resetTokenExpired: 'תוקף קישור האיפוס פג',

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
      passwordSpecial: 'מכיל תו מיוחד',
      passwordStrength: 'חוזק סיסמה',
      weak: 'חלש',
      fair: 'בינוני',
      good: 'טוב',
      strong: 'חזק',
      veryStrong: 'חזק מאוד',

      // Steps
      stepAccountInfo: 'פרטי חשבון',
      stepSecurity: 'אבטחה',

      // Features showcase
      features: {
        title: 'ניהול פיננסי חכם',
        subtitle: 'חווה את העתיד של ניהול הכספים האישי',
        secure: 'מאובטח ופרטי',
        secureDesc: 'המידע שלך מוצפן ומוגן',
        fast: 'מהיר במיוחד',
        fastDesc: 'עדכונים ומעקב בזמן אמת',
        smart: 'ניתוח חכם',
        smartDesc: 'תובנות חכמות להחלטות טובות יותר'
      },

      // Email verification modal
      emailNotVerifiedModalTitle: 'האימייל לא מאומת',
      emailNotVerifiedModalMessage: 'עדיין לא אימתת את כתובת האימייל שלך.',
      checkEmailSpamMessage: 'אנא בדוק את תיבת הדואר ותיקיית הספאם. לפעמים אימיילי אימות מגיעים לשם.',
      resendVerificationSuccess: 'אימייל אימות נשלח בהצלחה!',
      checkEmailAgainMessage: 'אנא בדוק את תיבת הדואר שוב (כולל תיקיית ספאם)',
      stillNoEmailMessage: 'עדיין לא רואה את האימייל?',
      clickToResendMessage: 'לחצו כאן לשלוח מחדש',
    },

    // Dashboard
    dashboard: {
      title: 'לוח בקרה',
      subtitle: 'סקירת המצב הפיננסי שלך',
      welcomeMessage: 'ברוך שובך, {{name}}!',
      overviewPeriod: 'סקירה עבור {{period}}',

      greeting: {
        morning: 'בוקר טוב',
        afternoon: 'צהריים טובים',
        evening: 'ערב טוב',
        night: 'לילה טוב'
      },

      balance: {
        title: 'סקירת יתרה',
        subtitle: 'עקוב אחר התזרים הפיננסי שלך',
        income: 'הכנסות',
        expenses: 'הוצאות',
        total: 'יתרה נטו',
        error: 'לא ניתן לטעון נתוני יתרה',
        backToToday: 'חזרה להיום',
        tooltip: 'לחצו על לוח השנה כדי לקפוץ לכל תאריך',
        trending: 'מגמה',
        spent: 'הוצא',
        positive: 'עודף',
        negative: 'גירעון',

        periods: {
          daily: 'יומי',
          weekly: 'שבועי',
          monthly: 'חודשי',
          yearly: 'שנתי'
        }
      },

              transactions: {
          recent: 'עסקאות אחרונות',
          latestActivity: 'פעילות אחרונה',
          viewAll: 'הצג הכל',
          noTransactions: 'אין עסקאות עדיין',
          noTransactionsDesc: 'התחילו לעקוב אחר הכספים שלכם על ידי הוספת העסקה הראשונה',
          fetchError: 'לא ניתן לטעון עסקאות',
          loading: 'טוען עסקאות...'
        },

      quickActions: {
        title: 'הוספה מהירה',
        subtitle: 'הזנת עסקאות מהירה',
        fast: 'הזנה מהירה',
        smart: 'חכם',
        placeholder: 'הזן סכום',
        amount: 'סכום',
        addExpense: 'הוסף הוצאה',
        addIncome: 'הוסף הכנסה',
        defaultDescription: 'עסקה מהירה',
        added: 'נוסף!',
        advanced: 'פעולות מתקדמות',
        todayWarning: 'הפעולה תתווסף להיום, לא לתאריך המוצג',
        switchToToday: 'הפעולה נוספה! לעבור לתצוגת היום כדי לראות אותה?',
        hint: 'השתמש בפעולות מהירות להזנת עסקאות מהירה',
        quickExpense: 'הוצאה מהירה',
        quickIncome: 'הכנסה מהירה',
        quickRecurring: 'עסקה קבועה מהירה',
        historicalDateWarning: 'הוספה לתאריך היסטורי',
        goToToday: 'היום',
        notToday: 'מצב תאריך היסטורי'
      },

      stats: {
        title: 'סטטיסטיקות',
        subtitle: 'תובנות עסקאות',
        showMore: 'הצג עוד',
        showLess: 'הצג פחות',
        savingsRate: 'שיעור חיסכון',
        dailyAvg: 'ממוצע יומי',
        budget: 'תקציב',
        health: 'בריאות',
        excellent: 'מעולה',
        good: 'טוב',
        improve: 'לשיפור',
        spendingPerDay: 'הוצאה/יום',
        onTrack: 'במסלול',
        review: 'לבדיקה',
        great: 'נהדר',
        ok: 'בסדר',
        poor: 'חלש',
        incomeVsExpenses: 'פירוט הכנסות מול הוצאות',
        detailedInsights: 'תובנות מפורטות',
        averageTransaction: 'עסקה ממוצעת',
        totalTransactions: '{count} עסקאות סה״כ',
        recurringImpact: 'השפעת עסקאות קבועות',
        monthlyRecurringBalance: 'יתרה חודשית קבועה',
        largestTransaction: 'העסקה הגדולה ביותר',
        singleTransaction: 'עסקה יחידה',
        topCategory: 'קטגוריה מובילה',
        mostUsedCategory: 'הקטגוריה הנפוצה ביותר',
        balanceTrend: 'מגמת יתרה',
        currentPeriodTrend: 'מגמת התקופה הנוכחית',
        noData: 'אין נתונים לתקופה זו',
        income: 'הכנסות',
        expenses: 'הוצאות',
        ofTotal: 'מהסכום הכולל',
        trend: {
          positive: 'חיובי',
          negative: 'שלילי',
          stable: 'יציב'
        }
      },

      tips: {
        title: 'טיפ פיננסי',
        content: 'עקוב אחר ההוצאות היומיות שלך כדי לזהות דפוסי הוצאות והזדמנויות חיסכון פוטנציאליות.',
        nextTip: 'הטיפ הבא',
        previousTip: 'הטיפ הקודם'
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
      smartActions: 'פעולות חכמות',
      total: 'סך העסקאות לתקופה',
      editTemplate: 'ערוך תבנית חוזרת',
      editAll: 'ערוך את כל המופעים',
      editOnce: 'ערוך מופע יחיד',
      totalAmount: 'סך הכל',
      templateActions: "פעולות תבנית",
      recurringActions: "פעולות הוראת קבע",
      editActions: "פעולות עריכה",
      skipNextTooltip: "דלג על המופע הבא המתוכנן של עסקה זו",
      pauseTooltip: "השהה תבנית זו - לא ייווצרו עסקאות חדשות",
      resumeTooltip: "חדש תבנית זו - עסקאות ייווצרו שוב",
      manageRecurringTooltip: "פתח את מנהל העסקאות החוזרות",
      editSingleTooltip: "ערוך רק את המופע הזה, השאר את התבנית ללא שינוי",
      editTemplateTooltip: "ערוך את התבנית - משפיע על כל העסקאות העתידיות",
      editAllTooltip: "ערוך את זה ואת כל המופעים העתידיים",
      editTooltip: "ערוך עסקה זו",
      deleteTemplateTooltip: "מחק תבנית זו ובאופן אופציונלי את כל העסקאות הקשורות",
      deleteRecurringTooltip: "מחק עסקה זו או את כל הסדרה החוזרת",
      deleteTooltip: "מחק עסקה זו",
      nextOccurrenceNote: "מתי העסקה הזו תתרחש הפעם הבאה",
      frequencyNote: "כמה פעמים העסקה הזו חוזרת על עצמה",
      templateActiveTitle: "התבנית פעילה",
      templateActiveDescription: "עסקאות חדשות נוצרות באופן אוטומטי",
      templatePausedTitle: "התבנית מושהית",
      templatePausedDescription: "לא ייווצרו עסקאות חדשות",
      totalGenerated: "סה״כ שנוצר",
      recurringTransactionInfo: "אודות עסקאות חוזרות",
      recurringDescription: "עסקה זו נוצרה מתבנית חוזרת. אתה יכול:",
      editOnceDescription: "לשנות רק את העסקה הזו",
      editAllDescription: "לשנות את התבנית ואת כל העסקאות העתידיות",
      scheduleManagement: "ניהול לוח זמנים",
      templateManagement: "ניהול תבניות",
      skipSpecificDates: "דלג על תאריכים ספציפיים",
      pauseTemplate: "השהה תבנית",
      resumeTemplate: "חדש תבנית",
      scheduleActiveDescription: "התבנית יוצרת עסקאות חדשות לפי לוח הזמנים",
      schedulePausedDescription: "התבנית מושהית - לא נוצרות עסקאות חדשות",
      templateManagementDescription: "ערוך או מחק את כל התבנית הזו",
      chooseDeleteOption: "בחר אפשרות מחיקה",
      searchTemplates: "חפש תבניות",
      type: "סוג",
      upcomingTransactions: "עסקאות קרובות",
      scheduledTransactions: "עסקאות מתוזמנות",
      automated: "אוטומטי",
      editThis: "ערוך",
      quickActions: "פעולות מהירות",
      editTransactionDesc: 'ערוך עסקה זו',
      deleteTransactionDesc: 'מחק עסקה זו',
      scheduled: 'מתוזמן',
      transactions: "סך הכל עסקאות",
      skipError: {
        invalidTemplate: "לא ניתן לדלג: תבנית לא חוקית",
        templateNotFound: "תבנית לא נמצאה",
        general: "נכשל בדילוג על התאריך. נסה שוב."
      },
      cannotSkipNonRecurring: "לא ניתן לדלג על עסקה שאינה חוזרת",
      cannotToggleNonTemplate: "לא ניתן להחליף מצב של עסקה שאינה תבנית",
      unknownInterval: "סוג מרווח לא מוכר",
      nextPaymentSkipped: "התשלום הבא נדלג בהצלחה",
      skipNextDesc: "דלג על העסקה הקרובה מבלי למחוק את התבנית החוזרת",
deleteTemplate: "מחק תבנית",
deleteTemplateDesc: "מחק את התבנית החוזרת וכל העסקאות העתידיות שלה. עסקאות עבר לא יושפעו.",
editThisDesc: "ערוך רק את העסקה הזו. עסקאות חוזרות עתידיות לא יושפעו.",
editAllDesc: "ערוך את העסקה הזו ואת כל העסקאות החוזרות הבאות בסדרה.",
pauseDesc: "השהה את התבנית הזו זמנית. לא יווצרו עסקאות חדשות עד להפעלה מחודשת.",
skipNext: "דלג על הבאה",
single: "עסקה רגילה",





      // Display & Filtering
      showing: 'מציג',
      of: 'מתוך',
      results: 'תוצאות',
      items: 'עסקאות',
      filtered: 'מסוננות מתוך',
      totalTransactions: 'סך העסקאות',
      noSearchResults: 'לא נמצאו עסקאות עבור "{{term}}"',
      noTransactionsOfType: 'לא נמצאו עסקאות {{type}}',
      noTransactions: 'אין עסקאות לתקופה זו',
      noTransactionsDesc: 'העסקאות שלך יופיעו כאן לאחר שתוסיף אותן',
      noMatchingTransactions: 'אין עסקאות תואמות',
      tryDifferentSearch: 'נסה מונח חיפוש או סינון אחר',
      loadingTransactions: 'טוען את העסקאות שלך...',

      // Actions
      addTransaction: 'הוסף עסקה',
      addNew: 'הוסף חדש',
      editTransaction: 'ערוך עסקה',
      editSingleOccurrence: 'ערוך מופע יחיד',
      editRecurringTemplate: 'ערוך תבנית חוזרת',
      editSingleNote: 'השינויים ישפיעו רק על המופע הזה',
      editRecurringNote: 'השינויים ישפיעו על התבנית החוזרת',
      editDetails: 'שנה פרטי עסקה',
      singleEdit: 'עריכה יחידה',
      editing: 'עורך',
      editingSingleOccurrence: 'עורך מופע יחיד',
      singleEditNote: 'זה ייצור עסקה חדשה ולא ישפיע על התבנית החוזרת.',
      updateSuccess: 'העסקה עודכנה',
      transactionUpdated: 'העסקה שלך עודכנה בהצלחה',
      saveOnce: 'שמור פעם אחת',
      deleteConfirm: 'מחק עסקה',
      deleteConfirmDesc: 'האם אתה בטוח שברצונך למחוק עסקה זו?',
      editSingle: 'ערוך רק זו',
      editThisOnly: 'ערוך רק את המופע הזה',
      manage: 'נהל',

      // Form fields
      selectDate: 'בחר תאריך',
      selectCategory: 'בחר קטגוריה',
      date: 'תאריך',
      endsOn: 'מסתיים ב',
      updateFuture: 'החל על כל המופעים העתידיים',
      updateFutureDesc: 'זה יעדכן את כל המופעים העתידיים של עסקה קבועה זו',
      convertToRecurring: 'צור תבנית חוזרת',
      convertToRecurringDesc: 'זה ייצור גם עסקה חד פעמית וגם תבנית חוזרת לשימוש עתידי.',

      // Recurring
      recurring: 'קבוע',
      recurringTransactions: 'עסקאות קבועות',
      recurringManagement: 'ניהול הוראות קבע',
      recurringManager: {
        title: 'מנהל עסקאות קבועות',
        subtitle: 'נהל את העסקאות האוטומטיות שלך',
        generateNow: 'צור עסקאות קבועות עכשיו'
      },
      recurringSection: {
        title: 'עסקאות קבועות',
        management: 'נהל את ההכנסות וההוצאות הקבועות שלך',
        impact: 'השפעה חודשית'
      },
      noRecurringTransactions: 'אין עסקאות קבועות',
      createRecurringNote: 'כשתיצור עסקאות קבועות, תוכל לנהל אותן כאן.',
      recurringNote: 'זו עסקה קבועה מסוג {{type}}. בעריכה, תוכל לבחור לעדכן רק את המופע הזה או את כל המופעים העתידיים.',
      recurringInfo: {
        title: 'אודות עסקאות קבועות',
        description: 'עסקאות קבועות נוצרות אוטומטית לפי התדירות שלהן. ניתן לשנות או לעצור אותן בכל עת.'
      },
      convertedToRecurring: 'הומרה בהצלחה לעסקה קבועה',

      // Recurring Actions
      pause: 'השהה',
      resume: 'חדש',
      paused: 'עסקה הושהתה',
      resumed: 'עסקה חודשה',
      generateNow: 'צור עכשיו',
      generated: 'עסקאות קבועות נוצרו',
      generateError: 'נכשל ביצירת עסקאות קבועות',

      // Skip Dates
      skipDates: {
        title: 'דלג על תאריכים',
        info: 'בחר תאריכים לדילוג עבור {{name}} ({{interval}})',
        selectDates: 'בחר תאריכים לדילוג',
        addDate: 'הוסף תאריך',
        noDatesSelected: 'לא נבחרו תאריכים',
        alreadySkipped: 'תאריכים שכבר דולגו',
        selectAtLeast: 'אנא בחר לפחות תאריך אחד לדילוג',
        success: 'תאריכי דילוג נשמרו בהצלחה',
        error: 'נכשל בשמירת תאריכי דילוג',
        save: 'שמור תאריכי דילוג'
      },
      delete: {
        singleOccurrence: 'מחק מופע יחיד',
        skipDates: 'דלג על תאריכים',
        skipDescription: 'בחר תאריכים ספציפיים לדילוג עבור עסקה חוזרת זו תוך שמירה על הדפוס פעיל.',
        stopRecurring: 'עצור חזרה מתאריך זה',
        deleteAll: 'מחק את כל הסדרה החוזרת',
        allDescription: 'מחק לצמיתות את העסקה החוזרת הזו ואת כל המופעים הקודמים והעתידיים שלה.',
        permanent: 'קבוע',
        irreversible: 'בלתי הפיך',
        manageDates: 'נהל תאריכים',
        recurringInfo: 'זוהי עסקה חוזרת. בחר איך למחוק אותה.',
        cannotUndo: 'לא ניתן לבטל פעולה זו',
        confirmSingle: 'זה ימחק לצמיתות את ה{{type}} הזה/הזו.',
        skipRedirect: 'ייפתח מסך ניהול תאריכי דילוג',
        nextOccurrence: 'המופע הבא בתאריך {{date}}',
        allWarning: 'זה ימחק את כל המופעים של העסקה החוזרת הזו',
        redirectingToSkip: 'מעביר למסך ניהול דילוגים',
        skipModalInfo: 'תוכל לבחור תאריכים ספציפיים לדילוג.',
        finalConfirmation: 'אישור סופי נדרש',
        confirmAll: 'זה ימחק לצמיתות את כל העסקה החוזרת והמופעים שלה.',
        confirmFuture: 'זה יעצור את ה{{type}} החוזר/ת מהתאריך הזה ואילך.',
        summaryChanges: 'סיכום השינויים:',
        summarySkip: 'יידלג על תאריכים נבחרים',
        summaryDelete: 'מחק {{description}} ({{amount}})',
        summaryDeleteAll: 'מחק את כל המופעים של העסקה החוזרת',
        summaryCancelFuture: 'בטל את כל המופעים העתידיים',
        goToSkipDates: 'עבור לניהול דילוגים',
        deleteOnce: 'מחק פעם אחת',
        openSkipModal: 'פתח מסך דילוגים',
        confirmDelete: 'אשר מחיקה'
      },

      // Delete options
      deleteOptions: {
        single: {
          title: 'מחק רק את המופע הזה',
          description: 'הסר רק את ה{{type}} הספציפי/ת בתאריך {{date}}. הדפוס החוזר ימשיך לתאריכים עתידיים.',
          recommended: true
        },
        future: {
          title: 'עצור את העסקה החוזרת הזו',
          description: 'בטל את ה{{type}} מתאריך {{date}} ואילך. כל המופעים העתידיים יוסרו.',
          warning: true,
          permanent: true
        }
      },
      deleteMessages: {
        thisActionCannotBeUndone: 'לא ניתן לבטל פעולה זו',
        finalConfirmation: 'נדרש אישור סופי',
        permanentDelete: 'זה ימחק לצמיתות את ה{{type}} הזה/הזו.',
        permanentStop: 'זה יעצור לצמיתות את ה{{type}} החוזר/ת ויסיר את כל המופעים העתידיים.',
        summaryOfChanges: 'סיכום השינויים:',
        deleteItem: 'מחק {{description}} ({{amount}})',
        cancelFutureOccurrences: 'בטל את כל המופעים העתידיים',
        alsoCancel: 'זה גם יבטל את המופע הבא בתאריך {{date}}',
        yesDeleteForever: 'כן, מחק לצמיתות',
        confirmDeletion: 'אשר מחיקה'
      },

      // Frequencies
      frequency: 'תדירות',
      frequencies: {
        daily: 'יומי',
        weekly: 'שבועי',
        monthly: 'חודשי',
        yearly: 'שנתי',
        oneTime: 'חד פעמי',
        null: 'חד פעמי'
      },

      // Filters
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
        clearAll: 'נקה את כל הסינונים',
        activeFilters: 'סינונים פעילים',
        advancedFilters: " סינונים מתקדמים",
        customDateRange: "טווח תאריכים מותאם",
        from: "מתאריך",
        to: "עד תאריך",

      },

      // Errors & Messages
      fetchError: 'נכשל בטעינת עסקאות',
      deleteError: 'נכשל במחיקת עסקה',
      updateError: 'נכשל בעדכון עסקה',
      saveError: 'נכשל בשמירת עסקה',
      endOfList: 'סוף היסטוריית העסקאות',
      tip: 'נסה להוסיף עסקאות חדשות באמצעות הכפתור למעלה',
      quickTip: 'טיפ מהיר',
      emptyStateTip: 'השתמש בכפתור + או בפעולות מהירות להוספת העסקה הראשונה שלך',
      totalItems: 'סה״כ: {{count}} פריטים',
      monthlyTotal: 'סך חודשי',
      active: 'פעיל'
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
      showDetails: 'הצג פרטים',
      recurringInfo: 'עסקה חוזרת',
      recurringNote: '{{type}} זה/זו חוזר/ת אוטומטית. שינויים יכולים להשפיע על מופעים עתידיים.'
    },

    // Transaction Actions/Forms
    actions: {
      title: 'הוסף עסקה',
      buttontitle: 'הוסף עסקה חדשה',
      detailedTransaction: 'עסקה מפורטת',
      chooseAction: 'בחר את הפעולה למטה',
      selectType: 'בחר סוג עסקה',
      smart: 'חכם',
      oneClick: 'הוספה בקליק',
      smartDefaults: 'ברירות מחדל חכמות',
      customize: 'התאמה אישית מלאה',
      quickActions: 'פעולות מהירות',
      allOptions: 'כל אפשרויות העסקה',
      directEntry: 'הזנה ישירה',
      fullCustomization: 'התאמה אישית מלאה',
      transactionAdded: 'העסקה שלך נוספה בהצלחה!',

      // Quick actions
      quickExpense: 'הוצאה מהירה',
      quickExpenseDesc: 'הוסף הוצאה של ₪100 מיידית',
      quickIncome: 'הכנסה מהירה',
      quickIncomeDesc: 'הוסף הכנסה של ₪1000 מיידית',
      quickRecurring: 'קבוע מהיר',
      quickRecurringDesc: 'הוסף הוצאה חוזרת חודשית',
      quickAdd: 'הוסף עסקה מהירה',

      // Transaction types
      oneTimeExpense: 'הוצאה חד פעמית',
      oneTimeExpenseDesc: 'הוסף עסקת הוצאה בודדת',
      recurringExpense: 'הוצאה חוזרת',
      recurringExpenseDesc: 'הגדר הוצאה חוזרת',
      recurringSetup: 'הגדרת חוזרת',
      recurringSetupDesc: 'הגדר עסקאות אוטומטיות',
      oneTimeIncome: 'הכנסה חד פעמית',
      oneTimeIncomeDesc: 'הוסף עסקת הכנסה בודדת',
      recurringIncome: 'הכנסה חוזרת',
      recurringIncomeDesc: 'הגדר הכנסה חוזרת',

      // Default descriptions
      defaultExpense: 'הוצאה מהירה',
      defaultIncome: 'הכנסה מהירה',
      defaultRecurringExpense: 'הוצאה חוזרת חודשית',
      defaultRecurringIncome: 'הכנסה חוזרת חודשית',

      // Form labels
      fillDetails: 'מלא פרטי עסקה',
      amount: 'סכום',
      description: 'תיאור',
      descriptionPlaceholder: 'הזן תיאור',
      selectCategory: 'בחר קטגוריה',
      category: 'קטגוריה',
      date: 'תאריך',
      frequency: 'תדירות',
      endDate: 'תאריך סיום (אופציונלי)',
      recurringOptions: 'אפשרויות חזרה',
      recurring: 'חוזר',
      dayOfWeek: 'יום בשבוע',

      // Examples
      example: 'דוגמה',
      examples: 'דוגמאות',
      expenseExample: 'לדוגמה: קניות, דלק, קניות',
      recurringExpenseExample: 'לדוגמה: שכר דירה, ביטוח, מנוי',
      incomeExample: 'לדוגמה: משכורת, בונוס, מתנה',
      recurringIncomeExample: 'לדוגמה: משכורת, דיבידנד, שכר דירה',
      examplePlaceholders: {
        coffee: 'קפה עם חברים',
        lunch: 'ארוחת צהריים במסעדה',
        salary: 'משכורת חודשית',
        rent: 'שכר דירה חודשי'
      },

      // Actions
      add: 'הוסף עסקה',
      addIncome: 'הוסף הכנסה',
      addExpense: 'הוסף הוצאה',
      success: 'הצלחה!',
      added: 'נוסף!',
      create: 'צור',
      update: 'עדכן',

      // Frequencies
      frequencies: {
        daily: 'יומי',
        weekly: 'שבועי',
        monthly: 'חודשי',
        yearly: 'שנתי',
        oneTime: 'חד פעמי'
      },

      // Errors
      errors: {
        addingTransaction: 'שגיאה בהוספת עסקה',
        invalidAmount: 'אנא הזינו סכום תקין',
        invalidDate: 'אנא הזינו תאריך תקין',
        descriptionRequired: 'תיאור נדרש',
        categoryRequired: 'אנא בחר קטגוריה',
        formErrors: 'אנא תקנו את השגיאות בטופס',
        general: 'אירעה שגיאה. אנא נסה שוב.',
        updatingTransaction: 'נכשל בעדכון העסקה',
      },

      // New keys
      new: 'חדש'
    },

    // Categories
    categories: {
      title: 'קטגוריות',
      manage: 'נהל קטגוריות',
      manageCategories: 'ניהול קטגוריות',
      wizardSubtitle: 'ארגן את הכספים שלך כמו אשף',
      addNew: 'הוסף קטגוריה',
      create: 'צור קטגוריה',
      createFirst: 'צור קטגוריה ראשונה',
      edit: 'ערוך קטגוריה',
      delete: 'מחק קטגוריה',
      deleteConfirm: 'האם אתה בטוח שברצונך למחוק קטגוריה זו?',
      name: 'שם הקטגוריה',
      nameRequired: 'שם הקטגוריה נדרש',
      description: 'תיאור',
      descriptionPlaceholder: 'תיאור אופציונלי לקטגוריה',
      type: 'סוג',
      icon: 'אייקון',
      userCategories: 'הקטגוריות שלי',
      userCategoriesDesc: 'הקטגוריות האישיות שלך',
      defaultCategories: 'קטגוריות ברירת מחדל',
      defaultCategoriesDesc: 'קטגוריות מובנות במערכת',
      noUserCategories: 'עדיין לא יצרת קטגוריות משלך',
      noUserCategoriesDesc: 'צור קטגוריות מותאמות אישית לניהול הכספים שלך',
      default: 'ברירת מחדל',
      selectCategory: 'בחר קטגוריה',
      selectCategoryHint: 'אנא בחר קטגוריה עבור העסקה',
      noCategoriesFound: 'לא נמצאו קטגוריות',
      createCategoriesFirst: 'צור קטגוריות חדשות תחילה',
      searchPlaceholder: 'חפש קטגוריות...',
      created: 'הקטגוריה נוצרה בהצלחה',
      updated: 'הקטגוריה עודכנה בהצלחה',
      deleted: 'הקטגוריה נמחקה בהצלחה',
      saveFailed: 'שמירת הקטגוריה נכשלה',
      deleteFailed: 'מחיקת הקטגוריה נכשלה',
      required: 'חובה',
      searchCategories: "חפש קטגוריות",
      addCategory: "הוסף קטגוריה",


      // Filter options
      filter: {
        all: 'הכל',
        income: 'הכנסות',
        expense: 'הוצאות'
      },

      // Statistics
      stats: {
        total: 'סה״כ קטגוריות',
        personal: 'קטגוריות אישיות',
        default: 'ברירת מחדל'
      },

      // Default category names
      General: 'כללי',
      Salary: 'משכורת',
      Freelance: 'עבודה עצמאית',
      Investments: 'השקעות',
      Rent: 'שכירות',
      Groceries: 'קניות מזון',
      Transportation: 'תחבורה',
      Utilities: 'חשבונות',
      Entertainment: 'בילויים',
      Food: 'אוכל',
      Shopping: 'קניות',
      Health: 'בריאות',
      Education: 'חינוך',
      Travel: 'נסיעות',
      Other: 'אחר'
    },

    // Profile
    profile: {
      title: 'פרופיל',
      personalInformation: 'מידע אישי',
      accountInformation: 'פרטי חשבון',
      profilePhoto: 'תמונת פרופיל',
      username: 'שם משתמש',
      email: 'דואר אלקטרוני',
      phone: 'טלפון',
      location: 'מיקום',
      website: 'אתר אינטרנט',
      bio: 'אודות',
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
      invalidImageType: 'אנא בחר קובץ תמונה תקין (JPG, PNG, או GIF)',
      imageTooLarge: 'גודל התמונה חייב להיות פחות מ-5MB',
      active: "פעיל",
      subtitle: "נהל את פרטי החשבון וההעדפות שלך",
      status: "סטטוס",
      security: "אבטחה",
      level: "רמה",
      tier: "דרגה",
      pro: "מקצועי",
      premium: "פרימיום",
      profileLastUpdate: "עדכון אחרון של הפרופיל",
      unknown: "לא ידוע",
      notUpdatedYet: "לא עודכן עדיין",
      edit: "ערוך",



      save: 'שמור שינויים',
      cancel: 'ביטול',
      updateSuccess: 'הפרופיל עודכן בהצלחה',
      updateError: 'נכשל בעדכון הפרופיל',
      saveError: 'נכשל בשמירת השינויים',
      accountInfo: 'פרטי חשבון',
      accountStatus: 'סטטוס חשבון',
      verified: 'מאומת',
      memberSince: 'חבר מאז',
      lastLogin: 'התחברות אחרונה',

      tabs: {
        general: 'כללי',
        security: 'אבטחה',
        preferences: 'העדפות',
        billing: 'חיוב',
        notifications: 'התראות',
        privacy: 'פרטיות'
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
    systemTheme: 'מערכת',
      languageChanged: 'השפה שונתה בהצלחה',
      currencyChanged: 'המטבע שונה בהצלחה',
      
      // Budget
      budget: {
        monthlyBudget: 'תקציב חודשי',
        enterAmount: 'הכניסו סכום תקציב',
        optional: 'אופציונלי'
      },
      
      // Templates
      templates: {
        quickSetup: 'הגדרה מהירה',
        yourTemplates: 'התבניות שלכם',
        setupComplete: 'הגדרה הושלמה! {{count}} תבניות מוכנות',
        setupOptional: 'תבניות הן אופציונליות',
        canAddMore: 'תוכלו להוסיף עוד תבניות בכל זמן',
        canSkipForNow: 'תוכלו לדלג על השלב הזה ולהוסיף תבניות מאוחר יותר',
        carPayment: 'תשלום רכב',
        internet: 'שירות אינטרנט'
      },
      
      // Recurring transactions
      recurring: {
        whatAre: {
          title: 'מה הן עסקאות חוזרות?',
          description: 'עסקאות חוזרות הן תשלומים או הכנסות שקורים באופן קבוע - כמו המשכורת, שכר דירה, או מנויים חודשיים. במקום להזין אותם ידנית בכל פעם, תוכלו להגדיר אותם פעם אחת ו-SpendWise יעקוב אחריהם אוטומטית.'
        },
        examples: {
          title: 'דוגמה',
          demo: 'הדגמה',
          salaryDesc: 'המשכורת החודשית שלכם מתווספת אוטומטית כהכנסה',
          rentDesc: 'תשלום שכר דירה חודשי נרשם כהוצאה',
          phoneDesc: 'חשבון הטלפון מנוכה אוטומטית כל חודש'
        },
        benefits: {
          title: 'למה להשתמש בעסקאות חוזרות?',
          timeTitle: 'חיסכון בזמן',
          timeDesc: 'אין צורך להזין ידנית את אותן עסקאות כל חודש',
          insightsTitle: 'תובנות טובות יותר',
          insightsDesc: 'קבלו תחזיות מדויקות של המצב הכלכלי העתידי שלכם',
          accuracyTitle: 'דיוק מושלם',
          accuracyDesc: 'לעולם לא תשכחו לעקוב אחר תשלומים או הכנסות קבועות'
        },
        cta: {
          title: 'מוכנים להגדיר את העסקאות החוזרות הראשונות שלכם?',
          description: 'בואו נוסיף כמה עסקאות חוזרות נפוצות כדי להתחיל.',
          button: 'הגדרת תבניות'
        }
      },
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

      // Advanced preferences
      advancedPreferences: 'העדפות מתקדמות',
      preferencesEditor: 'עורך העדפות',
      preferencesEditorInfo: 'ערוך את ההעדפות שלך כ-JSON. היזהר עם התחביר!',
      rawPreferences: 'העדפות JSON גולמיות',
      preferencesUpdated: 'ההעדפות עודכנו בהצלחה',
      saveAllPreferences: 'שמור את כל ההעדפות',
      commonPreferences: 'העדפות נפוצות',
      notificationPreferences: 'העדפות התראות',
      privacyPreferences: 'העדפות פרטיות',

      // Notification types
      notificationTypes: {
        email: 'התראות דוא״ל',
        push: 'התראות דחיפה',
        sms: 'התראות SMS',
        recurring: 'התראות עסקאות חוזרות',
        reminders: 'תזכורות תשלום'
      },

      // Privacy options
      privacy: {
        showProfile: 'הצג פרופיל ציבורי',
        showStats: 'הצג סטטיסטיקות',
        allowAnalytics: 'אפשר אנליטיקה'
      },

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
      export: {
        selectFormat: "בחר פורמט",
        csvDescription: "קובץ CSV (אקסל/גוגל שיטס)",
        jsonDescription: "קובץ JSON (לייבוא לאפליקציות אחרות)",

        // Error messages
        invalidFormat: 'פורמט יצוא לא תקין נבחר',
        formatUnavailable: 'יצוא {format} אינו זמין',

        // Progress messages
        preparing: 'מכין יצוא {format}...',
        processing: 'מעבד את הייצוא שלך...',
        progressStatus: 'יצוא {format}: {progress}% הושלם',

        // Modal content
        title: 'יצא את הנתונים שלך',
        subtitle: 'בחר את הפורמט המועדף עליך להורדה',
        dataIncluded: 'מה כלול בייצוא שלך',
        loadingOptions: 'טוען אפשרויות ייצוא...',
        formatsAvailable: 'פורמטים זמינים',

                  // Format descriptions
          csvFormat: 'תואם ל-Excel, Google Sheets ויישומי גיליונות אלקטרוניים',
          csvUseCase: 'מושלם לניתוח נתונים, דיווחים ועיבוד נוסף',
          jsonFormat: 'פורמט קריא למכונה עם מבנה נתונים מלא ומטא-דאטה',
          jsonUseCase: 'אידיאלי למפתחים, מדעני נתונים ומשתמשים טכניים',

        // Metadata
        estimatedSize: 'גודל',
        instant: 'הורדה מיידית',

        // Security
        security: 'אבטחה ופרטיות',
        httpsEncrypted: 'מוצפן HTTPS',
        notStored: 'לא נשמר',
        onDemand: 'לפי דרישה בלבד',

        // User info
        userInfo: 'יצוא עבור {username} • {currency} • {language}'
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

    // Statistics
    stats: {
      title: 'סטטיסטיקות',
      overview: 'סקירה',
      currentBalance: 'יתרה נוכחית',
      monthlyIncome: 'הכנסות חודשיות',
      monthlyExpenses: 'הוצאות חודשיות',
      totalTransactions: 'סך העסקאות',
      activeRecurring: 'מנויים פעילים',
      quickOverview: 'סקירה מהירה',
      thisMonth: 'החודש',
      lastMonth: 'החודש שעבר',
      thisYear: 'השנה',
      allTime: 'כל הזמנים',
      activeSubscriptions: 'מנויים פעילים',
      perMonth: 'לחודש',
      savingsRate: 'שיעור חיסכון',
      yearlyAverage: 'ממוצע שנתי',
      activityOverview: 'סקירת פעילות',
      dailyAverage: 'ממוצע יומי',
      perDay: 'ליום',
      trend: 'מגמה',
      categories: 'קטגוריות',
      topCategories: 'קטגוריות מובילות', // ✅ ADD: Missing Hebrew translation
      noData: 'אין נתונים זמינים',
      noTrendData: 'אין נתוני מגמה זמינים',
      noCategoryData: 'אין נתוני קטגוריות זמינים',
      loadingStats: 'טוען סטטיסטיקות...'
    },

    // Forms
    forms: {
      errors: {
        required: 'שדה זה נדרש',
        invalidEmail: 'כתובת דוא״ל לא תקינה',
        invalidAmount: 'סכום לא תקין',
        invalidDate: 'תאריך לא תקין',
        passwordTooShort: 'הסיסמה חייבת להכיל לפחות 8 תווים',
        passwordsDontMatch: 'הסיסאות אינן תואמות',
        descriptionRequired: 'תיאור נדרש',
        endDateRequired: 'תאריך סיום נדרש',
        categoryRequired: 'קטגוריה נדרשת',
        usernameRequired: 'שם משתמש נדרש',
        emailRequired: 'דוא״ל נדרש'
      },
      placeholders: {
        email: 'your@email.com',
        password: '••••••••',
        amount: '0.00',
        description: 'הזן תיאור',
        search: 'חפש...'
      }
    },

    // Validation
    validation: {
      required: 'שדה זה נדרש',
      usernameRequired: 'שם משתמש נדרש',
      usernameTooShort: 'שם המשתמש חייב להכיל לפחות 3 תווים',
      emailRequired: 'דואר אלקטרוני נדרש',
      emailInvalid: 'פורמט דואר אלקטרוני לא תקין',
      passwordRequired: 'סיסמה נדרשת',
      passwordTooShort: 'הסיסמה חייבת להכיל לפחות 8 תווים',
      passwordNeedsNumber: 'הסיסמה חייבת להכיל לפחות מספר אחד',
      passwordNeedsUpper: 'הסיסמה חייבת להכיל לפחות אות גדולה אחת',
      passwordNeedsLower: 'הסיסמה חייבת להכיל לפחות אות קטנה אחת',
      passwordNeedsSpecial: 'הסיסמה חייבת להכיל לפחות תו מיוחד אחד',
      passwordsDontMatch: 'הסיסאות אינן תואמות',
      agreeToTerms: 'עליך להסכים לתנאים',
      amountRequired: 'סכום נדרש',
      amountInvalid: 'הסכום חייב להיות מספר תקין',
      amountPositive: 'הסכום חייב להיות גדול מ-0',
      dateRequired: 'תאריך נדרש',
      dateInvalid: 'פורמט תאריך לא תקין',
      categoryRequired: 'קטגוריה נדרשת'
    },

    // Register specific
    register: {
      success: {
        title: 'ההרשמה הצליחה!',
        message: 'ההרשמה בוצעה בהצלחה! אנא התחבר כדי להמשיך.'
      },
      errors: {
        registrationFailed: 'ההרשמה נכשלה. אנא נסה שוב.',
        emailExists: 'הדוא״ל כבר קיים',
        usernameExists: 'שם המשתמש כבר תפוס'
      }
    },

    // Calendar
    calendar: {
      weekDays: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
      months: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
      monthsShort: ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'],
      today: 'היום',
      previousMonth: 'חודש קודם',
      nextMonth: 'חודש הבא',
      selectDate: 'בחר תאריך',
      close: 'סגור'
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
      required: 'חובה',

      compliance: 'אתר זה תואם לתקנות נגישות בהתאם לתקן הישראלי (ת"י 5568).',
      accessibilityStatement: 'הצהרת נגישות',

      statement: {
        title: 'הצהרת נגישות',
        intro: 'אתר SpendWise מחויב להנגיש את שירותיו לאנשים עם מוגבלויות, בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות (התשנ"ח-1998) ותקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013.',
        features: 'תכונות נגישות באתר:',
        featuresList: {
          screenReader: 'תאימות לקורא מסך',
          colorContrast: 'ניגודיות צבעים מתכווננת',
          textSize: 'התאמת גודל טקסט',
          keyboardNav: 'תמיכה בניווט במקלדת',
          multiLanguage: 'תמיכה בעברית ובאנגלית'
        },
        level: 'דרגת הנגישות:',
        levelDescription: 'אתר זה עומד ברמת תאימות AA לפי הנחיות WCAG 2.1 ועומד בתקן הישראלי (ת"י 5568).',
        contact: 'יצירת קשר בנושאי נגישות:',
        contactDescription: 'אם נתקלת בבעיות נגישות או ברצונך לשלוח משוב לגבי הנגישות באתר, אנא צור קשר עם רכז הנגישות שלנו:',
        phone: 'טלפון',
        lastUpdated: 'עודכן לאחרונה: 01/01/{{year}}',
        close: 'סגור'
      }
    },

  // Privacy Policy Hebrew
  privacy: {
    title: 'מדיניות פרטיות',
    lastUpdated: 'עודכן לאחרונה: {{date}}',
    sections: {
      intro: {
        title: 'הקדמה',
        content: 'SpendWise ("אנחנו", "שלנו") מכבדת את פרטיותכם ומתחייבת להגן על המידע האישי שלכם בהתאם לחוק הגנת הפרטיות התשמ"א-1981 ותקנותיו.'
      },
      dataCollection: {
        title: 'המידע שאנו אוספים',
        content: 'אנו אוספים מידע שאתם מספקים לנו ישירות (פרטי חשבון, נתונים פיננסיים) ומידע שנאסף אוטומטית דרך השימוש בשירות (נתוני שימוש, מידע על המכשיר).'
      },
      dataUse: {
        title: 'איך אנו משתמשים במידע',
        content: 'המידע שלכם משמש לספק את שירותי ניהול הכספים, לשפר את חוויית המשתמש, להבטיח אבטחה ולעמוד בחובות חוקיות.'
      },
      dataProtection: {
        title: 'הגנה על המידע',
        content: 'אנו מיישמים אמצעי אבטחה מתאימים כולל הצפנה, שרתים מאובטחים וביקורות אבטחה קבועות כדי להגן על המידע האישי שלכם.'
      },
      userRights: {
        title: 'הזכויות שלכם',
        content: 'יש לכם זכות לגשת, לתקן, למחוק או לייצא את המידע האישי שלכם. צרו איתנו קשר לכל בקשה הקשורה למידע.'
      },
      contact: {
        title: 'צרו קשר',
        content: 'לשאלות הקשורות לפרטיות, צרו קשר: spendwise.verifiction@gmail.com'
      }
    }
  },

  // Terms of Service Hebrew
  terms: {
    title: 'תקנון שימוש',
    lastUpdated: 'עודכן לאחרונה: {{date}}',
    sections: {
      acceptance: {
        title: 'הסכמה לתנאים',
        content: 'על ידי שימוש ב-SpendWise, אתם מסכימים לתנאים והתנאים הללו. אם אינכם מסכימים, אנא הפסיקו להשתמש בשירות שלנו.'
      },
      service: {
        title: 'תיאור השירות',
        content: 'SpendWise מספקת כלים לניהול כספים אישיים כולל מעקב הוצאות, ניהול תקציב ואנליטיקה פיננסית.'
      },
      userResponsibilities: {
        title: 'אחריות המשתמש',
        content: 'אתם אחראים לשמירה על אבטחת החשבון, למתן מידע מדויק ולשימוש בשירות בהתאם לחוקים החלים.'
      },
      limitations: {
        title: 'מגבלות השירות',
        content: 'השירות שלנו מסופק "כפי שהוא" ללא אחריות. איננו אחראים להחלטות פיננסיות שנעשות על בסיס הכלים שלנו.'
      },
      termination: {
        title: 'סיום הסכם',
        content: 'כל צד יכול לסיים הסכם זה. עם הסיום, הגישה שלכם תיפסק אך זכויות שמירת הנתונים שלכם יישארו כפי שמפורט במדיניות הפרטיות.'
      },
      governingLaw: {
        title: 'חוק החל',
        content: 'תנאים אלה כפופים לחוק הישראלי. מחלוקות ייפתרו בבתי המשפט הישראליים.'
      },
      contact: {
        title: 'צרו קשר',
        content: 'לשאלות על תנאים אלה, צרו קשר: spendwise.verifiction@gmail.com'
      }
    }
  },

    // Floating Menu
    floatingMenu: {
      changeLanguage: 'שנה שפה',
      switchCurrency: 'החלף מטבע',
      toggleTheme: 'החלף ערכת נושא',
      switchToLight: 'עבור למצב בהיר',
      switchToDark: 'עבור למצב כהה',
      accessibility: 'נגישות'
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
      close: 'סגור',
      followUs: 'עקבו אחרינו',
      newsletter: 'ניוזלטר',
      newsletterDesc: 'קבלו טיפים פיננסיים ועדכונים'
    },

    // Error messages
    errors: {
      generic: 'אירעה שגיאה. אנא נסו שוב.',
      network: 'שגיאת רשת. אנא בדקו את החיבור שלכם.',
      validation: 'אנא בדקו את הטופס לשגיאות.',
      unauthorized: 'אין לכם הרשאה לבצע פעולה זו.',
      notFound: 'הפריט המבוקש לא נמצא.',
      server: 'שגיאת שרת. אנא נסו שוב מאוחר יותר.',
      timeout: 'פג זמן הבקשה. אנא נסו שוב.',
      unknown: 'אירעה שגיאה לא ידועה.'
    },

    // NEW: Not Found page translations in Hebrew
    notFound: {
      title: 'הדף לא נמצא',
      message: 'הדף שאתה מחפש לא קיים.',
      suggestion: 'ייתכן שהוא הועבר, נמחק, או שהזנת כתובת שגויה.',
      goHome: 'חזרה לדשבורד',
      needHelp: 'צריך עזרה?',
      helpMessage: 'צור קשר עם צוות התמיכה אם אתה ממשיך להיתקל בבעיות.'
    },

    // Onboarding translations in Hebrew
    onboarding: {
          // Common onboarding terms
    common: {
      next: 'הבא',
      previous: 'הקודם',
      skip: 'דלג',
      complete: 'השלם הגדרה',
      completing: 'משלים...',
      confirmClose: 'האם אתה בטוח שברצונך לסגור? ההתקדמות שלך תישמר.',
      of: 'מתוך',
      step: 'שלב'
    },

      // Welcome step
      welcome: {
        title: 'ברוכים הבאים ל-SpendWise!',
        greeting: 'שלום {{name}}!',
        description: 'בואו נגדיר את חוויית ניהול הכספים שלכם ונעזור לכם להבין איך SpendWise יכול לפשט את ניהול הכסף שלכם.',
        
        features: {
          recurring: {
            title: 'עסקאות חוזרות',
            description: 'הפכו את ההכנסות וההוצאות הקבועות שלכם לאוטומטיות למעקב קל.'
          },
          analytics: {
            title: 'אנליטיקה חכמה',
            description: 'קבלו תובנות על דפוסי ההוצאות והמגמות הפיננסיות שלכם.'
          },
          security: {
            title: 'בטוח ופרטי',
            description: 'הנתונים הפיננסיים שלכם מוצפנים ומאוחסנים בבטחה.'
          }
        },

        highlight: {
          title: 'עסקאות חוזרות',
          subtitle: 'המפתח לניהול פיננסי קל',
          description: 'הגדירו עסקאות שקורות באופן קבוע - כמו משכורת, שכר דירה או מנויים - ו-SpendWise יעקוב אחריהן אוטומטית עבורכם.'
        },

        examples: {
          salary: 'משכורת חודשית',
          rent: 'תשלום דירה',
          phone: 'חשבון טלפון',
          utilities: 'שירותים'
        },

        cta: {
          description: 'מוכנים להשתלט על הכספים שלכם? בואו נתחיל!',
          button: 'בואו נתחיל'
        },

        stats: {
          minutes: 'דקות הגדרה',
          steps: 'שלבים פשוטים',
          benefits: 'יתרונות'
        }
      },

      // Preferences step
      preferences: {
        title: 'התאימו את החוויה שלכם',
        subtitle: 'הגדירו את ההעדפות שלכם כדי להתאים אישית את SpendWise',
        description: 'הגדירו את ההגדרות האלה כדי להתאים אישית את חוויית SpendWise שלכם. תוכלו לשנות אותן בכל זמן בפרופיל שלכם.',
        
        localization: 'שפה ואזור',
        language: 'שפה',
        currency: 'מטבע',
        
        appearance: 'מראה',
        theme: 'נושא',
        themes: {
          light: 'בהיר',
          dark: 'כהה',
          system: 'מערכת'
        },
        
        budget: 'תקציב חודשי',
        monthlyBudget: 'תקציב חודשי',
        enterAmount: 'הכניסו סכום תקציב',
        saving: 'שומר...'
      },

      // Recurring explanation step
      recurring: {
        title: 'הבנת עסקאות חוזרות',
        subtitle: 'למדו איך להפוך את המעקב הפיננסי לאוטומטי'
      },

      // Templates step
      templates: {
        title: 'הוסיפו את העסקאות החוזרות הראשונות שלכם',
        subtitle: 'הגדירו עסקאות חוזרות נפוצות כדי להתחיל'
      },

      // Step subtitles for header
      step1: {
        subtitle: 'ברוכים הבאים למסע הפיננסי שלכם'
      },
      step2: {
        subtitle: 'התאימו אישית את החוויה שלכם'
      },
      step3: {
        subtitle: 'שלטו בעסקאות חוזרות'
      },
      step4: {
        subtitle: 'הגדירו את התבניות הראשונות שלכם'
      }
    },

    // Recurring transactions education in Hebrew
    recurring: {
      whatAre: {
        title: 'מה הן עסקאות חוזרות?',
        description: 'עסקאות חוזרות הן תשלומים או הכנסות שקורים אוטומטית לפי לוח זמנים קבוע. במקום להכניס אותן ידנית בכל פעם, אתם מגדירים אותן פעם אחת ו-SpendWise מטפל בשאר.'
      },
      
      examples: {
        title: 'דוגמאות אמיתיות',
        demo: 'הפעל הדגמה',
        salaryDesc: 'ההכנסה החודשית שלכם נרשמת אוטומטית',
        rentDesc: 'תשלום דיור חודשי שלא נשכח אף פעם',
        phoneDesc: 'מנוי קבוע נרשם אוטומטית'
      },
      
      benefits: {
        title: 'למה להשתמש בעסקאות חוזרות?',
        timeTitle: 'חוסך זמן',
        timeDesc: 'הגדרה פעם אחת, מעקב אוטומטי לתמיד',
        insightsTitle: 'תובנות טובות יותר',
        insightsDesc: 'רואים את דפוסי ההוצאות והמגמות האמיתיים שלכם',
        accuracyTitle: 'נשארים מדויקים',
        accuracyDesc: 'לא שוכחים תשלומים קבועים יותר'
      },
      
      cta: {
        title: 'מוכנים להגדיר את העסקה החוזרת הראשונה שלכם?',
        description: 'בשלב הבא, נעזור לכם להוסיף עסקאות חוזרות נפוצות כדי להתחיל.',
        button: 'בואו נגדיר אותן'
      }
    },

    // Templates management in Hebrew
    templates: {
      quickSetup: 'הצעות הגדרה מהירה',
      yourTemplates: 'התבניות שלכם',
      createCustom: 'צור תבנית מותאמת אישית',
      setupComplete: 'מעולה! הגדרתם {{count}} עסקאות חוזרות',
      setupOptional: 'אין תבניות עדיין - זה בסדר!',
      canAddMore: 'תמיד אפשר להוסיף עוד מהדשבורד',
      canSkipForNow: 'אפשר להוסיף עסקאות חוזרות בכל זמן מהדשבורד שלכם',
      addedFromOnboarding: 'נוסף במהלך האונבורדינג',
      carPayment: 'תשלום רכב',
      internet: 'חשבון אינטרנט'
    },

    // Budget settings in Hebrew
    budget: {
      monthlyBudget: 'תקציב חודשי',
      enterAmount: 'הכניסו סכום תקציב',
      optional: 'אופציונלי',
      saving: 'שומר...'
    }
  }
};

export const LanguageProvider = ({ children }) => {
  // ✅ FIX: Don't use useAuth directly to avoid circular dependency
  // We'll sync with auth state via events instead
  
  // ✅ FIX: Initialize language from localStorage first, then fallback to browser/default
  const [language, setLanguage] = useState(() => {
    // Check localStorage first
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && ['en', 'he'].includes(savedLanguage)) {
      return savedLanguage;
    }

    // Check browser language as fallback
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('he')) {
      return 'he';
    }

    return 'en'; // Default fallback
  });

  // ✅ ADD: Track session-only language changes
  const [sessionLanguage, setSessionLanguage] = useState(null);

  // ✅ FIX: Get effective language (session override or saved preference)
  const effectiveLanguage = sessionLanguage || language;

  // ✅ FIX: Permanent language change (for profile settings)
  const changeLanguagePermanent = (newLanguage) => {
    if (!['en', 'he'].includes(newLanguage)) {
      console.warn('Invalid language code:', newLanguage);
      return;
    }

    console.log(`🌐 [LANGUAGE] Permanent change: ${language} → ${newLanguage}`);

    setLanguage(newLanguage);
    setSessionLanguage(null); // Clear session override
    localStorage.setItem('preferredLanguage', newLanguage);
  };

  // ✅ ADD: Session-only language change (for header toggle)
  const changeLanguageSession = (newLanguage) => {
    if (!['en', 'he'].includes(newLanguage)) {
      console.warn('Invalid language code:', newLanguage);
      return;
    }

    console.log(`🌐 [LANGUAGE] Session change: ${effectiveLanguage} → ${newLanguage}`);

    setSessionLanguage(newLanguage);
    // Note: Don't save to localStorage for session changes
  };

  // ✅ FIX: Enhanced toggleLanguage for session-only changes
  const toggleLanguage = () => {
    const newLanguage = effectiveLanguage === 'he' ? 'en' : 'he';
    changeLanguageSession(newLanguage);
  };

  // ✅ ADD: Reset to saved preference (called on logout)
  const resetToSavedLanguage = () => {
    console.log(`🌐 [LANGUAGE] Resetting to saved preference: ${language}`);
    setSessionLanguage(null);
  };

  // ✅ FIX: Sync with user preferences via event system
  useEffect(() => {
    const handleUserPreferencesSync = (event) => {
      const { user } = event.detail;
      if (user?.preferences?.language) {
        const userLang = user.preferences.language;
        if (userLang !== language) {
          console.log(`🌐 [LANGUAGE] Syncing with user preference: ${language} → ${userLang}`);
          setLanguage(userLang);
          setSessionLanguage(null); // Clear any session override
          localStorage.setItem('preferredLanguage', userLang);
        }
      }
    };

    window.addEventListener('user-preferences-loaded', handleUserPreferencesSync);
    return () => window.removeEventListener('user-preferences-loaded', handleUserPreferencesSync);
  }, [language]);

  // ✅ ADD: Effect to sync language changes across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'preferredLanguage' && e.newValue !== language) {
        console.log(`🌐 [LANGUAGE] Storage change detected: ${language} → ${e.newValue}`);
        setLanguage(e.newValue);
        setSessionLanguage(null); // Clear session override when permanent preference changes
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [language]);

  // ✅ ADD: Debug log for language changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 [LANGUAGE] State update:`, {
        saved: language,
        session: sessionLanguage,
        effective: effectiveLanguage,
        isSessionOverride: !!sessionLanguage
      });
    }
  }, [effectiveLanguage, language, sessionLanguage]);

  // ✅ ADD: Listen for session reset events (logout)
  useEffect(() => {
    const handleSessionReset = () => {
      console.log(`🌐 [LANGUAGE] Session reset detected - clearing session overrides`);
      resetToSavedLanguage();
    };

    const handleLanguageReset = () => {
      console.log(`🌐 [LANGUAGE] Language-specific reset detected`);
      resetToSavedLanguage();
    };

    window.addEventListener('auth-logout', handleSessionReset);
    window.addEventListener('language-session-reset', handleLanguageReset);
    
    return () => {
      window.removeEventListener('auth-logout', handleSessionReset);
      window.removeEventListener('language-session-reset', handleLanguageReset);
    };
  }, []);

  // ✅ FIX: Use effectiveLanguage for translations
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let translation = effectiveLanguage === 'he' ? translations.he : translations;

    for (const k of keys) {
      if (translation && typeof translation === 'object') {
        translation = translation[k];
      } else {
        translation = null;
        break;
      }
    }

    if (!translation) {
      console.warn(`Missing translation for key: ${key} in language: ${effectiveLanguage}`);
      return key;
    }

    if (typeof translation === 'string' && params) {
      return translation.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] || match;
      });
    }

    return translation;
  };

  const formatDate = (date, lang = null) => {
    const locale = lang || effectiveLanguage;
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
    // Format currency based on effective language
    const locale = effectiveLanguage === 'he' ? 'he-IL' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  return (
    <LanguageContext.Provider value={{
      language: effectiveLanguage, // ✅ Use effective language
      savedLanguage: language, // ✅ Expose saved preference
      sessionLanguage, // ✅ Expose session override
      setLanguage: changeLanguagePermanent, // ✅ For profile settings
      changeLanguagePermanent, // ✅ ADD: Export function with expected name
      setLanguageSession: changeLanguageSession, // ✅ For header toggle
      toggleLanguage, // ✅ Session-only toggle
      resetToSavedLanguage, // ✅ Reset on logout
      t,
      formatDate,
      formatCurrency,
      isRTL: effectiveLanguage === 'he'
    }}>
      {children}
    </LanguageContext.Provider>
  );
};