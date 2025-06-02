// client/src/context/LanguageContext.jsx
// Enhanced language context with organized translations

import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// ✅ Complete organized translations object
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
    selectDate: 'Select Date',
    invalidDate: 'Invalid date',
    toggleTheme: 'Toggle Theme',
    toggleLanguage: 'Toggle Language',
    openUserMenu: 'Open User Menu',
    openMenu: 'Open Menu',
    // ✅ הוספת מפתחות חדשים לקומפוננטים של common
    floatingMenu: 'Floating Menu',
    accessibility: 'Accessibility',
    statement: 'Statement',
    compliance: 'Compliance',
    hide: 'Hide',
    show: 'Show',
    menu: 'Menu'
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    profile: 'Profile',
    settings: 'Settings',
    reports: 'Reports',
    logout: 'Logout',
    userMenu: 'User Menu',
    toggleTheme: 'Toggle Theme',
    toggleLanguage: 'Toggle Language',
    openUserMenu: 'Open User Menu',
    openMenu: 'Open Menu'
  },

  // Authentication
  auth: {
    // Page titles
    welcomeBack: 'Welcome Back',
    loginSubtitle: 'Sign in to continue to your account',
    createAccount: 'Create Account',
    registerSubtitle: 'Join thousands of users managing their finances',
    
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
    
    // Links
    noAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    signUpNow: 'Sign up now',
    signInNow: 'Sign in now',
    
    // Messages
    invalidCredentials: 'Invalid email or password',
    
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
      fetchError: 'Unable to load transactions'
    },
    
    quickActions: {
      title: 'Quick Actions',
      fast: 'Quick Entry',
      placeholder: 'Enter amount',
      addExpense: 'Add Expense',
      addIncome: 'Add Income',
      defaultDescription: 'Quick transaction',
      added: 'Added!',
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
    
    // View types
    all: 'All',
    income: 'Income',
    expense: 'Expenses',
    
    // Search & Filters
    searchPlaceholder: 'Search transactions...',
    noSearchResults: 'No transactions found for "{{term}}"',
    noTransactionsOfType: 'No {{type}} transactions found',
    noTransactions: 'No transactions for this period',
    noTransactionsDesc: 'Your transactions will appear here once you add them',
    
    // Actions
    addTransaction: 'Add Transaction',
    addNew: 'Add New',
    editTransaction: 'Edit Transaction',
    editTitle: 'Edit transaction details',
    deleteConfirm: 'Delete Transaction',
    
    // Form fields
    selectCategory: 'Select category',
    selectDate: 'Select Date',
    endsOn: 'Ends On',
    updateFuture: 'Apply to all future occurrences',
    updateFutureDesc: 'This will update all future occurrences of this recurring transaction',
    
    // Recurring
    recurring: 'Recurring',
    recurringTransactions: 'Recurring Transactions',
    recurringSection: {
      title: 'Recurring Transactions',
      management: 'Manage your recurring income and expenses',
      impact: 'Monthly Impact'
    },
    noRecurringTransactions: 'No recurring transactions',
    createRecurringNote: 'When you create recurring transactions, you\'ll be able to manage them here.',
    recurringNote: 'This is a recurring {type}. When editing, you can choose to update just this occurrence or all future occurrences.',
    
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
      oneTime: 'One-time'
    },
    
    // View options
    view: {
      all: 'All Transactions',
      income: 'Income Only',
      expense: 'Expenses Only'
    },
    
    // Messages
    fetchError: 'Failed to load transactions',
    deleteError: 'Failed to delete transaction',
    updateError: 'Failed to update transaction',
    noMatchingTransactions: 'No matching transactions',
    tryDifferentSearch: 'Try a different search term or filter',
    items: 'transactions',
    endOfList: 'End of transaction history',
    tip: 'Try adding new transactions using the button above',
    
    // Info
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
    quickActions: 'Quick Actions',
    quickAdd: 'Quick Add',
    new: 'New',
    
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
    amountPlaceholder: 'Enter amount',
    descriptionPlaceholder: 'Enter description',
    recurringOptions: 'Recurring Options',
    endDate: 'End Date',
    options: 'Options',
    
    // Actions
    add: 'Add Transaction',
    addIncome: 'Add Income',
    addExpense: 'Add Expense',
    
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
    username: 'Username',
    email: 'Email',
    emailNotEditable: 'Email cannot be changed',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    save: 'Save Changes',
    cancel: 'Cancel',
    updateSuccess: 'Profile updated successfully',
    updateError: 'Failed to update profile',
    
    tabs: {
      general: 'General',
      security: 'Security',
      preferences: 'Preferences',
      billing: 'Billing' // ✅ הוספתי
    },
    
    // ✅ הוספת תרגומים חסרים
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
    
    securitySettings: 'Security Settings',
    billingSettings: 'Billing & Subscription',
    passwordRequirements: 'Password requirements',
    passwordMinLength: 'Minimum 8 characters',
    passwordRequireNumber: 'Must contain at least one number',
    securityTip: 'Security Tip',
    securityTipText: 'Keep your password secure and change it regularly',
    
    language: 'Language',
    theme: 'Theme',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    
    notificationsPreferences: 'Notification Preferences',
    emailNotifications: 'Email notifications',
    loginAlerts: 'Login alerts',
    monthlySummaries: 'Monthly summaries',
    
    dataManagement: 'Data Management',
    exportExplanation: 'Export your data to keep a backup',
    exportFeatureComingSoon: 'Export feature coming soon...',
    
    appPreferences: 'App Preferences',
    memberSince: 'Member Since',
    lastLogin: 'Last Login',
    lastLoginInfo: 'Last login',
    logout: 'Logout',
    financialSummary: 'Financial Summary',
    accountActivity: 'Account Activity',
    
    // ✅ הוספת תרגומים חסרים לפרופיל
    phone: 'Phone',
    phonePlaceholder: 'Enter phone number',
    location: 'Location', 
    locationPlaceholder: 'Enter location',
    website: 'Website',
    accountInfo: 'Account Information',
    verified: 'Verified',
    photoHelper: 'Click to upload or change your profile photo',
    changePhoto: 'Change Photo',
    uploading: 'Uploading...',
    photoUploaded: 'Photo uploaded successfully',
    
    // Custom preferences translations
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
    
    // Error messages
    errors: {
      keyRequired: 'Setting name is required',
      keyExists: 'Setting name already exists',
      invalidJson: 'Invalid JSON format',
      invalidFileType: 'Please select an image file',
      fileTooLarge: 'File size must be less than 5MB',
      uploadFailed: 'Failed to upload image'
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

  // Alert notifications
  alerts: {
    success: {
      title: 'Success!',
      defaultMessage: 'Operation completed successfully'
    },
    error: {
      title: 'Error!',
      defaultMessage: 'An error occurred'
    },
    warning: {
      title: 'Warning!',
      defaultMessage: 'Please check the information'
    },
    info: {
      title: 'Information',
      defaultMessage: 'Here is some information'
    },
    dismiss: 'Dismiss'
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
      selectDate: 'בחר תאריך',
      invalidDate: 'תאריך לא תקין',
      toggleTheme: 'החלף ערכת נושא',
      toggleLanguage: 'החלף שפה',
      openUserMenu: 'פתח תפריט משתמש',
      openMenu: 'פתח תפריט',
      // ✅ הוספת מפתחות חדשים לקומפוננטים של common
      floatingMenu: 'תפריט צף',
      accessibility: 'נגישות',
      statement: 'הצהרה',
      compliance: 'תאימות',
      hide: 'הסתר',
      show: 'הצג',
      menu: 'תפריט'
    },

    // Navigation
    nav: {
      dashboard: 'לוח בקרה',
      transactions: 'עסקאות',
      profile: 'פרופיל',
      settings: 'הגדרות',
      reports: 'דוחות',
      logout: 'התנתק',
      userMenu: 'תפריט משתמש',
      toggleTheme: 'החלף ערכת נושא',
      toggleLanguage: 'החלף שפה',
      openUserMenu: 'פתח תפריט משתמש',
      openMenu: 'פתח תפריט'
    },

    // Authentication
    auth: {
      // Page titles
      welcomeBack: 'ברוכים השבים',
      loginSubtitle: 'התחברו כדי להמשיך לחשבון שלכם',
      createAccount: 'יצירת חשבון',
      registerSubtitle: 'הצטרפו לאלפי משתמשים המנהלים את הכספים שלהם',
      
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
      
      // Links
      noAccount: 'אין לך חשבון?',
      alreadyHaveAccount: 'כבר יש לך חשבון?',
      signUpNow: 'הירשם עכשיו',
      signInNow: 'התחבר עכשיו',
      
      // Messages
      invalidCredentials: 'דואר אלקטרוני או סיסמה לא תקינים',
      
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
        fetchError: 'לא ניתן לטעון עסקאות'
      },
      
      quickActions: {
        title: 'פעולות מהירות',
        fast: 'הזנה מהירה',
        placeholder: 'הזן סכום',
        addExpense: 'הוסף הוצאה',
        addIncome: 'הוסף הכנסה',
        defaultDescription: 'עסקה מהירה',
        added: 'נוסף!',
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
      
      // View types
      all: 'הכל',
      income: 'הכנסות',
      expense: 'הוצאות',
      
      // Search & Filters
      searchPlaceholder: 'חפש עסקאות...',
      noSearchResults: 'לא נמצאו עסקאות עבור "{{term}}"',
      noTransactionsOfType: 'לא נמצאו עסקאות {{type}}',
      noTransactions: 'אין עסקאות לתקופה זו',
      noTransactionsDesc: 'העסקאות שלך יופיעו כאן לאחר שתוסיף אותן',
      
      // Actions
      addTransaction: 'הוסף עסקה',
      addNew: 'הוסף חדש',
      editTransaction: 'ערוך עסקה',
      editTitle: 'ערוך פרטי עסקה',
      deleteConfirm: 'מחק עסקה',
      
      // Form fields
      selectCategory: 'בחר קטגוריה',
      selectDate: 'בחר תאריך',
      endsOn: 'מסתיים ב',
      updateFuture: 'החל על כל המופעים העתידיים',
      updateFutureDesc: 'זה יעדכן את כל המופעים העתידיים של עסקה קבועה זו',
      
      // Recurring
      recurring: 'קבוע',
      recurringTransactions: 'עסקאות קבועות',
      recurringSection: {
        title: 'עסקאות קבועות',
        management: 'נהל את ההכנסות וההוצאות הקבועות שלך',
        impact: 'השפעה חודשית'
      },
      noRecurringTransactions: 'אין עסקאות קבועות',
      createRecurringNote: 'כשתיצור עסקאות קבועות, תוכל לנהל אותן כאן.',
      recurringNote: 'זו עסקה קבועה מסוג {type}. בעריכה, תוכל לבחור לעדכן רק את המופע הזה או את כל המופעים העתידיים.',
      
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
        oneTime: 'חד פעמיות'
      },
      
      // View options
      view: {
        all: 'כל העסקאות',
        income: 'הכנסות בלבד',
        expense: 'הוצאות בלבד'
      },
      
      // Messages
      fetchError: 'נכשל בטעינת עסקאות',
      deleteError: 'נכשל במחיקת עסקה',
      updateError: 'נכשל בעדכון עסקה',
      noMatchingTransactions: 'אין עסקאות תואמות',
      tryDifferentSearch: 'נסה מונח חיפוש או סינון אחר',
      items: 'עסקאות',
      endOfList: 'סוף היסטוריית העסקאות',
      tip: 'נסה להוסיף עסקאות חדשות באמצעות הכפתור למעלה',
      
      // Info
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
      quickActions: 'פעולות מהירות',
      quickAdd: 'הוספה מהירה',
      new: 'חדש',
      
      // Transaction types
      oneTimeExpense: 'הוצאה חד פעמית',
      oneTimeExpenseDesc: 'הוסף עסקת הוצאה בודדת',
      recurringExpense: 'הוצאה קבועה',
      recurringExpenseDesc: 'הגדר הוצאה חוזרת',
      oneTimeIncome: 'הכנסה חד פעמית',
      oneTimeIncomeDesc: 'הוסף עסקת הכנסה בודדת',
      recurringIncome: 'הכנסה קבועה',
      recurringIncomeDesc: 'הגדר הכנסה חוזרת',
      
      // Form
      fillDetails: 'מלא את פרטי העסקה',
      selectType: 'בחר סוג עסקה',
      amountPlaceholder: 'הזן סכום',
      descriptionPlaceholder: 'הזן תיאור',
      recurringOptions: 'אפשרויות חזרה',
      endDate: 'תאריך סיום',
      options: 'אפשרויות',
      
      // Actions
      add: 'הוסף עסקה',
      addIncome: 'הוסף הכנסה',
      addExpense: 'הוסף הוצאה',
      
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
      username: 'שם משתמש',
      email: 'דואר אלקטרוני',
      emailNotEditable: 'לא ניתן לשנות את הדואר האלקטרוני',
      changePassword: 'שינוי סיסמה',
      currentPassword: 'סיסמה נוכחית',
      newPassword: 'סיסמה חדשה',
      confirmPassword: 'אישור סיסמה חדשה',
      save: 'שמור שינויים',
      cancel: 'ביטול',
      updateSuccess: 'הפרופיל עודכן בהצלחה',
      updateError: 'נכשל בעדכון הפרופיל',
      
      tabs: {
        general: 'כללי',
        security: 'אבטחה',
        preferences: 'העדפות',
        billing: 'חיוב' // ✅ הוספתי
      },
      
      // ✅ הוספת תרגומים חסרים להתקנות פרופיל
      preferences: 'Preferences',
      privacy: 'Privacy',
      security: 'Security',
      dataManagement: 'Data Management',
      languageChanged: 'Language changed successfully',
      currencyChanged: 'Currency changed successfully', 
      themeChanged: 'Theme changed successfully',
      passwordChanged: 'Password changed successfully',
      incorrectPassword: 'Current password is incorrect',
      passwordChangeError: 'Failed to change password',
      notificationsSaved: 'Notifications saved successfully',
      privacySaved: 'Privacy settings saved successfully',
      saveError: 'Failed to save settings',
      updatePassword: 'Update Password',
      twoFactor: 'Two-Factor Authentication',
      twoFactorDesc: 'Add an extra layer of security to your account',
      
      // Notification preferences
      notificationPreferences: 'Notification Preferences',
      emailNotifications: 'Email notifications',
      emailNotificationsDesc: 'Receive notifications via email',
      pushNotifications: 'Push notifications', 
      pushNotificationsDesc: 'Receive push notifications in browser',
      smsNotifications: 'SMS notifications',
      smsNotificationsDesc: 'Receive notifications via SMS',
      reminders: 'Transaction reminders',
      remindersDesc: 'Get reminders for recurring transactions',
      productUpdates: 'Product updates',
      productUpdatesDesc: 'Receive updates about new features',
      marketingEmails: 'Marketing emails',
      marketingEmailsDesc: 'Receive promotional emails',
      saveNotifications: 'Save Notifications',
      
      // Privacy settings
      privacySettings: 'Privacy Settings',
      publicProfile: 'Public profile',
      publicProfileDesc: 'Allow others to view your profile',
      shareStats: 'Share statistics',
      shareStatsDesc: 'Allow sharing of anonymized usage data',
      analytics: 'Analytics tracking',
      analyticsDesc: 'Help improve our service with usage analytics',
      savePrivacy: 'Save Privacy Settings',
      
      // Profile photo
      profilePhoto: 'Profile Photo',
      accountStatus: 'Account Status',
      notSet: 'Not set',
      
      // Data management
      downloadData: 'Download My Data',
      exportDataDesc: 'Export all your data in a portable format',
      deleteAccount: 'Delete Account',
      deleteAccountDesc: 'Permanently delete your account and all data',
      deleteAccountButton: 'Delete Account',
      
      // ...existing code...
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
      validation: 'אנא בדקו את הטופס שגיאות.',
      unauthorized: 'אין לכם הרשאה לבצע פעולה זו.',
      notFound: 'הפריט המבוקש לא נמצא.',
      server: 'שגיאת שרת. אנא נסו שוב מאוחר יותר.'
    },

    // Alert notifications
    alerts: {
      success: {
        title: 'הצלחה!',
        defaultMessage: 'הפעולה הושלמה בהצלחה'
      },
      error: {
        title: 'שגיאה!',
        defaultMessage: 'אירעה שגיאה'
      },
      warning: {
        title: 'אזהרה!',
        defaultMessage: 'אנא בדקו את המידע'
      },
      info: {
        title: 'מידע',
        defaultMessage: 'הנה קצת מידע'
      },
      dismiss: 'התעלם'
    }
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // Changed from 'he' to 'en'
  
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
      
      // טיפול מיוחד במקרים של אובייקטים עם תרגומים לפי שפה
      if (translation && typeof translation === 'object' && 'he' in translation && 'en' in translation) {
        return translation[language];
      }
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