// client/src/context/LanguageContext.jsx
// Enhanced language context with full translations for all components

import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Complete translations object
const translations = {
  calendar: {
    weekDays: {
      he: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
      en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    },
    previousMonth: {
      he: 'חודש קודם',
      en: 'Previous Month'
    },
    nextMonth: {
      he: 'חודש הבא',
      en: 'Next Month'
    },
    today: {
      he: 'היום',
      en: 'Today'
    },
    // נוסיף עוד תרגומים ללוח שנה
    weekDaysShort: {
      he: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
      en: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    },
    months: {
      he: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    },
    monthsShort: {
      he: ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'],
      en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    selectDate: {
      he: 'בחר תאריך',
      en: 'Select Date'
    },
    jumpToToday: {
      he: 'קפוץ להיום',
      en: 'Jump to Today'
    }
  },
  
  // Common translations
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
    toggleTheme: 'Toggle Theme',
    toggleLanguage: 'Toggle Language',
    openUserMenu: 'Open User Menu',
    openMenu: 'Open Menu'
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

  // Navigation
  nav: {
    home: 'Home',
    dashboard: 'Dashboard', // Added missing translation
    transactions: 'Transactions',
    reports: 'Reports', // Added missing translation
    settings: 'Settings', // Added missing translation
    profile: 'Profile',
    logout: 'Logout', // Add explicit logout key
    userMenu: 'User Menu'
  },

  // Authentication
  auth: {
    welcomeBack: 'Welcome Back',
    loginSubtitle: 'Sign in to continue to your account',
    createAccount: 'Create Account',
    registerSubtitle: 'Join thousands of users managing their finances',
    email: 'Email',
    emailPlaceholder: 'Enter your email address',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Confirm your password',
    username: 'Username',
    usernamePlaceholder: 'Choose a username',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    signUpNow: 'Sign up now',
    signInNow: 'Sign in now',
    orContinueWith: 'Or continue with',
    agreeToTerms: 'I agree to the Terms of Service and Privacy Policy',
    accountInfo: 'Account Information',
    security: 'Security',
    startJourney: 'Start Your Financial Journey',
    joinThousands: 'Join thousands of users already managing their finances with SpendWise',
    logout: 'Logout',
    
    // Password strength indicators
    weak: 'Weak',
    fair: 'Fair',
    good: 'Good',
    strong: 'Strong',
    veryStrong: 'Very Strong',
    
    // Password requirements
    passwordLength: 'At least 8 characters',
    passwordNumber: 'Contains a number',
    passwordUpper: 'Contains uppercase letter',
    passwordLower: 'Contains lowercase letter',
    
    // Features section
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
    
    // Benefits
    benefit1: 'Bank-level security for your data',
    benefit2: 'Smart automation features',
    benefit3: 'Real-time financial insights',
    
    // Stats
    activeUsers: 'Active Users',
    savedMoney: 'Money Tracked',
    rating: 'User Rating'
  },

  // Home page
  home: {
    greeting: {
      morning: 'Good Morning',
      afternoon: 'Good Afternoon',
      evening: 'Good Evening',
      night: 'Good Night'
    },
    nav: {
      overview: 'Overview',
      transactionsManagement: 'Manage Transactions',
      profile: 'Profile',
      logout: 'Logout'
    },
    balance: {
      title: 'Balance Overview',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      income: 'Income',
      expenses: 'Expenses',
      total: 'Net Balance',
      error: 'Unable to load balance data',
      period: {
        asOf: 'As of {{date}}',
        monthYear: '{{month}} {{year}}',
        yearOnly: '{{year}}'
      },
      backToToday: 'Back to today',
      tooltip: 'Click the calendar to jump to any date. Use arrows to navigate day by day.',
      nextReset: 'Daily reset in: {{time}}',
      calculateError: 'Unable to calculate balance',
      periods: {
        daily: {
          en: 'Daily',
          he: 'יומי'
        },
        weekly: {
          en: 'Weekly',
          he: 'שבועי'
        },
        monthly: {
          en: 'Monthly',
          he: 'חודשי'
        },
        yearly: {
          en: 'Yearly',
          he: 'שנתי'
        }
      },
      viewingPastDate: {
        en: 'You are viewing a past date. New transactions are added to today\'s date.',
        he: 'אתה צופה בתאריך קודם. פעולות חדשות נוספות לתאריך הנוכחי.'
      }
    },
    transactions: {
      recent: 'Recent Transactions',
      viewAll: 'View All',
      noTransactions: 'No transactions yet',
      fetchError: 'Unable to load transactions',
      today: 'Today'
    }
  },

  // Quick Actions/Expenses
  quickExpense: {
    title: 'Quick Actions',
    placeholder: 'Enter amount',
    addExpense: 'Add Expense',
    addIncome: 'Add Income',
    defaultDescription: 'Quick transaction',
    added: 'Added!',
    fast: 'Quick Entry',
    todayWarning: {
      en: 'Transaction will be added to today, not the displayed date',
      he: 'הפעולה תתווסף להיום, לא לתאריך המוצג'
    },
    switchToToday: {
      en: 'Transaction added! Switch to today\'s view to see it?',
      he: 'הפעולה נוספה! לעבור לתצוגת היום כדי לראות אותה?'
    }
  },

  // Actions
  actions: {
    title: 'Add Transaction',
    buttontitle: 'Add New Transaction',
    quickActions: 'Quick Actions',
    new: 'New',
    oneTimeExpense: 'One-time Expense',
    oneTimeExpenseDesc: 'Add a single expense transaction',
    recurringExpense: 'Recurring Expense',
    recurringExpenseDesc: 'Set up a repeating expense',
    oneTimeIncome: 'One-time Income',
    oneTimeIncomeDesc: 'Add a single income transaction',
    recurringIncome: 'Recurring Income',
    recurringIncomeDesc: 'Set up a repeating income',
    fillDetails: 'Fill in transaction details',
    selectType: 'Select transaction type',
    amount: 'Amount',
    amountPlaceholder: 'Enter amount',
    description: 'Description',
    descriptionPlaceholder: 'Enter description',
    category: 'Category',
    frequency: 'Frequency',
    date: {
      en: 'Date',
      he: 'תאריך'
    },
    frequencies: {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly'
    },
    recurringOptions: 'Recurring Options',
    endDate: 'End Date',
    options: 'Options',
    add: 'Add Transaction',
    addIncome: 'Add Income',
    addExpense: 'Add Expense',
    recurring: 'Recurring',
    quickAdd: 'Quick Add', // Ensure this key is properly defined
    errors: {
      addingTransaction: 'Error adding transaction',
      invalidAmount: 'Please enter a valid amount',
      invalidDate: 'Please enter a valid date',
      formErrors: 'Please correct the errors in the form'
    }
  },

  // Transaction Management
  transactions: {
    title: 'Transaction Management',
    transactionsForDay: 'Transactions for',
    recurringTransactions: 'Recurring Transactions',
    addTransaction: 'Add Transaction',
    editTransaction: 'Edit Transaction',
    editTitle: 'Edit transaction details',
    deleteConfirm: 'Delete Transaction',
    recurring: 'Recurring',
    amount: 'Amount',
    description: 'Description',
    category: 'Category',
    date: 'Date',
    frequency: 'Frequency',
    selectDate: 'Select Date',
    endsOn: 'Ends On',
    updateFuture: 'Apply to all future occurrences',
    noMatchingTransactions: 'No matching transactions',
  noRecurringTransactions: 'No recurring transactions',
  tryDifferentSearch: 'Try a different search term or filter',
  createRecurringNote: 'When you create recurring transactions, you\'ll be able to manage them here.',
  recurringNote: 'This is a recurring {type}. When editing, you can choose to update just this occurrence or all future occurrences.',
    filters: {
      title: 'Filters',
      income: 'Income',
      expense: 'Expense',
      recurring: 'Recurring',
      oneTime: 'One-time',
      filterButton: 'Filter',
      showAll: 'Show All'
    },
    fetchError: 'Failed to load transactions',
    deleteError: 'Failed to delete transaction',
    updateError: 'Failed to update transaction',
    currentDate: 'Back to today',
    noTransactions: 'No transactions for this period',
    recurringSection: {
      title: 'Recurring Transactions',
      management: 'Manage your recurring income and expenses',
      impact: 'Monthly Impact'
    },
    view: {
      all: 'All Transactions',
      income: 'Income Only',
      expense: 'Expenses Only'
    },
    subtitle: 'Manage all your income and expenses',
    items: 'items',
    endOfList: 'End of transaction history',
    tip: 'Try adding new transactions using the button above',
    noTransactionsDesc: 'Your transactions will appear here once you add them',
    updateFutureDesc: 'This will update all future occurrences of this recurring transaction',
    selectCategory: 'Select category',
    date: 'Date',
    addNew: 'Add New',
    edit: 'Edit Transaction',
    filters: {
      amountRange: 'Amount Range',
      dateRange: 'Date Range',
      recurringType: 'Transaction Type',
      all: 'All Types',
      recurring: 'Recurring',
      oneTime: 'One-time',
      title: 'Filters',
      minAmount: 'Min Amount',
      maxAmount: 'Max Amount',
      startDate: 'Start Date',
      endDate: 'End Date'
    },
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
    General: 'General'  // קטגוריית ברירת מחדל נמצאת
  },

  // Profile Page
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
      preferences: 'Preferences'
    },
    securitySettings: 'Security Settings',
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
    logout: 'Logout',
    financialSummary: 'Financial Summary',
    accountActivity: 'Account Activity',
    lastLoginInfo: 'Last login'
  },

  // Accessibility
  accessibility: {
    title: 'Accessibility',
    menu: 'Accessibility Menu',
    textSize: 'Text Size',
    increaseFontSize: 'Increase text size',
    decreaseFontSize: 'Decrease text size',
    highContrast: 'High Contrast',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    resetSettings: 'Reset Settings',
    compliance: 'This site complies with the Israeli accessibility regulations (IS 5568).',
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
    },
    hide: 'Hide',
    openMenu: 'Open accessibility menu',
    closeMenu: 'Close menu'
  },

  // Footer
  footer: {
    support: 'Support',
    supportTitle: 'Support',
    supportDescription: 'For questions and support, please contact:',
    openSource: 'Open Source',
    legal: 'Legal', // Added missing translation
    privacy: 'Privacy Policy', // Added missing translation
    terms: 'Terms of Service', // Added missing translation
    accessibility: 'Accessibility', // Added missing translation
    accessibilityStatement: 'Accessibility Statement',
    allRightsReserved: 'All rights reserved',
    close: 'Close',
    copyright: 'כל הזכויות שמורות © {{year}} SpendWise',
    privacyShort: 'Privacy', // Added missing translation
    accessibilityShort: 'Accessibility', // Added missing translation
    
    // Add these new keys
    description: 'Smart personal finance management tool to help you track expenses and manage your budget efficiently.',
    navigation: 'Navigation',
    legal: 'Legal',
    madeWith: 'Made with',
    inIsrael: 'in Israel',
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

  // Floating Menu
  floatingMenu: {
    changeLanguage: 'Change Language',
    switchCurrency: 'Switch Currency',
    more: 'More Options'
  },

  // Date related
  dates: {
    selectDate: 'Select Date',
    invalidDate: 'Invalid date',
    dateFormat: 'Date format: DD/MM/YYYY'
  },

  // Login features
  login: {
    title: 'Welcome to SpendWise',
    subtitle: 'Sign in to your account',
    email: 'Email',
    emailPlaceholder: 'Enter your email',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account?",
    createAccount: 'Create Account',
    invalidCredentials: 'Invalid email or password',
    features: {
      title: 'Smart Expense Management',
      description: 'Take control of your finances with our intuitive platform',
      feature1: 'Track expenses in real-time',
      feature2: 'Set up recurring transactions',
      feature3: 'Analyze spending patterns'
    }
  },

  // Register features
  register: {
    title: 'Join SpendWise',
    subtitle: 'Create your free account',
    username: 'Username',
    usernamePlaceholder: 'Enter your username',
    email: 'Email',
    emailPlaceholder: 'Enter your email',
    password: 'Password',
    passwordPlaceholder: 'Create a password',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Confirm your password',
    createAccount: 'Create Account',
    creatingAccount: 'Creating account...',
    alreadyHaveAccount: 'Already have an account?',
    signInInstead: 'Sign in instead',
    success: {
      title: 'Account Created!',
      message: 'Your account has been created successfully. Redirecting to login...'
    },
    features: {
      title: 'Start Managing Your Money',
      description: 'Join thousands of users who trust SpendWise',
      feature1: 'Free to use forever',
      feature2: 'Secure and private',
      feature3: 'Easy to get started'
    },
    errors: {
      registrationFailed: 'Registration failed. Please try again.'
    }
  },

  // Dashboard translations
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview of your finances',
    greeting: {
      morning: 'Good Morning',
      afternoon: 'Good Afternoon',
      evening: 'Good Evening',
      night: 'Good Night'
    },
    stats: {
      dailyAverage: 'Daily Average',
      monthlyGoal: 'Monthly Goal',
      recurringActive: 'Active Recurring',
      savedThisMonth: 'Saved This Month'
    },
    balance: {
      title: 'Balance Overview',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      income: 'Income',
      expenses: 'Expenses',
      total: 'Net Balance',
      error: 'Unable to load balance data',
      tooltip: 'Click the calendar to jump to any date'
    },
    transactions: {
      recent: 'Recent Transactions',
      viewAll: 'View All',
      noTransactions: 'No transactions yet',
      fetchError: 'Unable to load transactions'
    },
    
    // Ensure tips section is properly defined
    tips: {
      title: 'Finance Tip',
      content: 'Track your daily expenses to identify spending patterns and potential savings opportunities.'
    }
  },

  // Hebrew translations
  he: {
    // Common
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
      toggleTheme: 'החלף ערכת נושא',
      toggleLanguage: 'החלף שפה',
      openUserMenu: 'פתח תפריט משתמש',
      openMenu: 'פתח תפריט'
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

    // Navigation
    nav: {
      home: 'בית',
      dashboard: 'לוח בקרה', // Added missing translation
      transactions: 'עסקאות',
      reports: 'דוחות', // Added missing translation
      settings: 'הגדרות', // Added missing translation
      profile: 'פרופיל',
      logout: 'התנתק', // Add explicit logout key
      userMenu: 'תפריט משתמש'
    },

    // Authentication
    auth: {
      welcomeBack: 'ברוכים השבים',
      loginSubtitle: 'התחברו כדי להמשיך לחשבון שלכם',
      createAccount: 'יצירת חשבון',
      registerSubtitle: 'הצטרפו לאלפי משתמשים המנהלים את הכספים שלהם',
      email: 'דואר אלקטרוני',
      emailPlaceholder: 'הזינו את כתובת הדואר האלקטרוני',
      password: 'סיסמה',
      passwordPlaceholder: 'הזינו סיסמה',
      confirmPassword: 'אימות סיסמה',
      confirmPasswordPlaceholder: 'אשרו את הסיסמה',
      username: 'שם משתמש',
      usernamePlaceholder: 'בחרו שם משתמש',
      signIn: 'התחברות',
      signUp: 'הרשמה',
      rememberMe: 'זכור אותי',
      forgotPassword: 'שכחת סיסמה?',
      noAccount: 'אין לך חשבון?',
      alreadyHaveAccount: 'כבר יש לך חשבון?',
      signUpNow: 'הירשם עכשיו',
      signInNow: 'התחבר עכשיו',
      orContinueWith: 'או המשך באמצעות',
      agreeToTerms: 'אני מסכים לתנאי השימוש ומדיניות הפרטיות',
      accountInfo: 'פרטי חשבון',
      security: 'אבטחה',
      startJourney: 'התחל את המסע הפיננסי שלך',
      joinThousands: 'הצטרף לאלפי משתמשים שכבר מנהלים את הכספים שלהם עם SpendWise',
      logout: 'התנתק',
      
      // Password strength indicators
      weak: 'חלשה',
      fair: 'סבירה',
      good: 'טובה',
      strong: 'חזקה',
      veryStrong: 'חזקה מאוד',
      
      // Password requirements
      passwordLength: 'לפחות 8 תווים',
      passwordNumber: 'מכילה מספר',
      passwordUpper: 'מכילה אות גדולה',
      passwordLower: 'מכילה אות קטנה',
      
      // Features section
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
      
      // Benefits
      benefit1: 'אבטחה ברמת בנק למידע שלך',
      benefit2: 'תכונות אוטומציה חכמות',
      benefit3: 'תובנות פיננסיות בזמן אמת',
      
      // Stats
      activeUsers: 'משתמשים פעילים',
      savedMoney: 'כסף מנוהל',
      rating: 'דירוג משתמשים'
    },

    // Home page
    home: {
      greeting: {
        morning: 'בוקר טוב',
        afternoon: 'צהריים טובים',
        evening: 'ערב טוב',
        night: 'לילה טוב'
      },
      nav: {
        overview: 'סקירה כללית',
        transactionsManagement: 'ניהול עסקאות',
        profile: 'פרופיל',
        logout: 'יציאה'
      },
      balance: {
        title: 'סקירת יתרה',
        daily: 'יומי',
        weekly: 'שבועי',
        monthly: 'חודשי',
        yearly: 'שנתי',
        income: 'הכנסות',
        expenses: 'הוצאות',
        total: 'יתרה נטו',
        error: 'לא ניתן לטעון נתוני יתרה',
        period: {
          asOf: 'נכון ל-{{date}}',
          monthYear: '{{month}} {{year}}',
          yearOnly: '{{year}}'
        },
        backToToday: 'חזרה להיום',
        tooltip: 'לחצו על לוח השנה כדי לקפוץ לכל תאריך. השתמשו בחיצים כדי לנווט יום אחר יום.',
        nextReset: 'איפוס יומי בעוד: {{time}}',
        calculateError: 'לא ניתן לחשב יתרה',
        periods: {
          daily: {
            en: 'Daily',
            he: 'יומי'
          },
          weekly: {
            en: 'Weekly',
            he: 'שבועי'
          },
          monthly: {
            en: 'Monthly',
            he: 'חודשי'
          },
          yearly: {
            en: 'Yearly',
            he: 'שנתי'
          }
        },
        viewingPastDate: {
          en: 'You are viewing a past date. New transactions are added to today\'s date.',
          he: 'אתה צופה בתאריך קודם. פעולות חדשות נוספות לתאריך הנוכחי.'
        }
      },
      transactions: {
        recent: 'עסקאות אחרונות',
        viewAll: 'הצג הכל',
        noTransactions: 'אין עסקאות עדיין',
        fetchError: 'לא ניתן לטעון עסקאות',
        today: 'היום'
      }
    },

    // Quick Actions/Expenses
    quickExpense: {
      title: 'פעולות מהירות',
      placeholder: 'הזן סכום',
      addExpense: 'הוסף הוצאה',
      addIncome: 'הוסף הכנסה',
      defaultDescription: 'עסקה מהירה',
      added: 'נוסף!',
      fast: 'הזנה מהירה',
      todayWarning: {
        en: 'Transaction will be added to today, not the displayed date',
        he: 'הפעולה תתווסף להיום, לא לתאריך המוצג'
      },
      switchToToday: {
        en: 'Transaction added! Switch to today\'s view to see it?',
        he: 'הפעולה נוספה! לעבור לתצוגת היום כדי לראות אותה?'
      }
    },

    // Actions
    actions: {
      title: 'הוסף עסקה',
      buttontitle: 'הוסף עסקה חדשה',
      quickActions: 'פעולות מהירות',
      new: 'חדש',
      oneTimeExpense: 'הוצאה חד פעמית',
      oneTimeExpenseDesc: 'הוסף עסקת הוצאה בודדת',
      recurringExpense: 'הוצאה קבועה',
      recurringExpenseDesc: 'הגדר הוצאה חוזרת',
      oneTimeIncome: 'הכנסה חד פעמית',
      oneTimeIncomeDesc: 'הוסף עסקת הכנסה בודדת',
      recurringIncome: 'הכנסה קבועה',
      recurringIncomeDesc: 'הגדר הכנסה חוזרת',
      fillDetails: 'מלא את פרטי העסקה',
      selectType: 'בחר סוג עסקה',
      amount: 'סכום',
      amountPlaceholder: 'הזן סכום',
      description: 'תיאור',
      descriptionPlaceholder: 'הזן תיאור',
      category: 'קטגוריה',
      frequency: 'תדירות',
      date: 'תאריך',
      frequencies: {
        daily: 'יומי',
        weekly: 'שבועי',
        monthly: 'חודשי'
      },
      recurringOptions: 'אפשרויות חזרה',
      endDate: 'תאריך סיום',
      options: 'אפשרויות',
      add: 'הוסף עסקה',
      addIncome: 'הוסף הכנסה',
      addExpense: 'הוסף הוצאה',
      recurring: 'חוזר',
      quickAdd: 'הוספה מהירה', // Ensure this key is properly defined in Hebrew
      errors: {
        addingTransaction: 'שגיאה בהוספת עסקה',
        invalidAmount: 'אנא הזינו סכום תקין',
        invalidDate: 'אנא הזינו תאריך תקין',
        formErrors: 'אנא תקנו את השגיאות בטופס'
      }
    },

    // Transaction Management
    transactions: {
      title: 'ניהול עסקאות',
      transactionsForDay: 'עסקאות עבור',
      recurringTransactions: 'עסקאות קבועות',
      addTransaction: 'הוסף עסקה',
      editTransaction: 'ערוך עסקה',
      editTitle: 'ערוך פרטי עסקה',
      deleteConfirm: 'מחיקת עסקה',
      recurring: 'עסקה קבועה',
      amount: 'סכום',
      description: 'תיאור',
      category: 'קטגוריה',
      date: 'תאריך',
      frequency: 'תדירות',
      selectDate: 'בחר תאריך',
      endsOn: 'מסתיים ב',
      updateFuture: 'החל על כל המופעים העתידיים',
      noMatchingTransactions: 'לא נמצאו עסקאות תואמות',
      noRecurringTransactions: 'אין עסקאות חוזרות',
      tryDifferentSearch: 'נסו מילת חיפוש או סינון אחר',
      createRecurringNote: 'כשתצרו עסקאות חוזרות, תוכלו לנהל אותן כאן.',
      recurringNote: 'זוהי {type} חוזרת. בעת עריכה, תוכלו לבחור לעדכן רק את המופע הזה או את כל המופעים העתידיים.',
      filters: {
        title: 'סינונים',
        income: 'הכנסות',
        expense: 'הוצאות',
        recurring: 'קבוע',
        oneTime: 'חד פעמי',
        filterButton: 'סינון',
        showAll: 'הצג הכל'
      },
      fetchError: 'נכשל בטעינת עסקאות',
      deleteError: 'נכשל במחיקת עסקה',
      updateError: 'נכשל בעדכון עסקה',
      currentDate: 'חזרה להיום',
      noTransactions: 'אין עסקאות לתקופה זו',
      recurringSection: {
        title: 'עסקאות קבועות',
        management: 'נהלו את ההכנסות וההוצאות הקבועות שלכם',
        impact: 'השפעה חודשית'
      },
      view: {
        all: 'כל העסקאות',
        income: 'הכנסות בלבד',
        expense: 'הוצאות בלבד'
      },
      subtitle: 'ניהול כל ההכנסות וההוצאות שלך',
      items: 'פריטים',
      endOfList: 'סוף היסטוריית העסקאות',
      tip: 'נסה להוסיף עסקאות חדשות באמצעות הכפתור למעלה',
      noTransactionsDesc: 'העסקאות שלך יופיעו כאן לאחר שתוסיף אותן',
      updateFutureDesc: 'פעולה זו תעדכן את כל המופעים העתידיים של עסקה חוזרת זו',
      selectCategory: 'בחר קטגוריה',
      date: 'תאריך',
      addNew: 'הוסף חדש',
      edit: 'ערוך עסקה',
      filters: {
        amountRange: 'טווח סכומים',
        dateRange: 'טווח תאריכים',
        recurringType: 'סוג עסקה',
        all: 'כל הסוגים',
        recurring: 'חוזרת',
        oneTime: 'חד פעמית',
        title: 'סינונים',
        minAmount: 'סכום מינימלי',
        maxAmount: 'סכום מקסימלי',
        startDate: 'תאריך התחלה',
        endDate: 'תאריך סיום'
      },
      recurringInfo: {
        title: 'על עסקאות חוזרות',
        description: 'עסקאות חוזרות נוצרות אוטומטית בהתאם לתדירות שלהן. ניתן לשנות או להפסיק אותן בכל עת.'
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
      General: 'כללי'  // קטגוריית ברירת מחדל נמצאת
    },

    // Profile Page
    profile: {
      title: 'פרופיל',
      personalInformation: 'מידע אישי',
      username: 'שם משתמש',
      email: 'אימייל',
      emailNotEditable: 'לא ניתן לשנות את האימייל',
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
        preferences: 'העדפות'
      },
      securitySettings: 'הגדרות אבטחה',
      passwordRequirements: 'דרישות סיסמה',
      passwordMinLength: 'מינימום 8 תווים',
      passwordRequireNumber: 'חייב להכיל לפחות מספר אחד',
      securityTip: 'טיפ אבטחה',
      securityTipText: 'שמרו על הסיסמה שלכם והחליפו אותה באופן קבוע',
      language: 'שפה',
      theme: 'נושא',
      lightTheme: 'בהיר',
      darkTheme: 'כהה',
      notificationsPreferences: 'העדפות התראות',
      emailNotifications: 'התראות אימייל',
      loginAlerts: 'התראות כניסה',
      monthlySummaries: 'סיכומים חודשיים',
      dataManagement: 'ניהול נתונים',
      exportExplanation: 'ייצאו את הנתונים שלכם לגיבוי',
      exportFeatureComingSoon: 'תכונת ייצוא בקרוב...',
      appPreferences: 'העדפות יישום',
      memberSince: 'חבר מאז',
      lastLogin: 'התחברות אחרונה',
      logout: 'התנתק',
      financialSummary: 'סיכום כספי',
      accountActivity: 'פעילות חשבון',
      lastLoginInfo: 'התחברות אחרונה'
    },

    // Accessibility
    accessibility: {
      title: 'נגישות',
      menu: 'תפריט נגישות',
      textSize: 'גודל טקסט',
      increaseFontSize: 'הגדל טקסט',
      decreaseFontSize: 'הקטן טקסט',
      highContrast: 'ניגודיות גבוהה',
      darkMode: 'מצב כהה',
      lightMode: 'מצב בהיר',
      resetSettings: 'איפוס הגדרות',
      compliance: 'אתר זה תואם לתקנות נגישות בהתאם לתקן הישראלי (ת"י 5568).',
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
      },
      hide: 'הסתר',
      openMenu: 'פתח תפריט נגישות',
      closeMenu: 'סגור תפריט'
    },

    // Footer
    footer: {
      support: 'תמיכה',
      supportTitle: 'תמיכה',
      supportDescription: 'לשאלות ותמיכה, אנא צרו קשר:',
      openSource: 'קוד פתוח',
      legal: 'משפטי', // Added missing translation
      privacy: 'מדיניות פרטיות', // Added missing translation
      terms: 'תנאי שימוש', // Added missing translation
      accessibility: 'נגישות', // Added missing translation
      accessibilityStatement: 'הצהרת נגישות',
      allRightsReserved: 'כל הזכויות שמורות',
      close: 'סגור',
      copyright: 'כל הזכויות שמורות © {{year}} SpendWise',
      privacyShort: 'פרטיות', // Added missing translation
      accessibilityShort: 'נגישות', // Added missing translation
      
      // Add these new keys in Hebrew
      description: 'כלי חכם לניהול פיננסי אישי שעוזר לך לעקוב אחר הוצאות ולנהל את התקציב שלך ביעילות.',
      navigation: 'ניווט',
      legal: 'משפטי',
      madeWith: 'נעשה עם',
      inIsrael: 'בישראל',
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
    },

    // Floating Menu
    floatingMenu: {
      changeLanguage: 'שנה שפה',
      switchCurrency: 'החלף מטבע',
      more: 'אפשרויות נוספות'
    },

    // Date related
    dates: {
      selectDate: 'בחר תאריך',
      invalidDate: 'תאריך לא תקין',
      dateFormat: 'פורמט תאריך: יי/חח/שששש'
    },

    // Login features
    login: {
      title: 'ברוכים הבאים ל-SpendWise',
      subtitle: 'התחברו לחשבונכם',
      email: 'אימייל',
      emailPlaceholder: 'הזינו את האימייל שלכם',
      password: 'סיסמה',
      passwordPlaceholder: 'הזינו את הסיסמה שלכם',
      signIn: 'כניסה',
      signingIn: 'מתחבר...',
      forgotPassword: 'שכחתי סיסמה',
      noAccount: 'אין לכם חשבון?',
      createAccount: 'צור חשבון',
      invalidCredentials: 'אימייל או סיסמה לא תקינים',
      features: {
        title: 'ניהול חכם של הוצאות',
        description: 'קחו שליטה על הכספים שלכם עם הפלטפורמה האינטואיטיבית שלנו',
        feature1: 'מעקב expenses בזמן אמת',
        feature2: 'הגדרת עסקאות קבועות',
        feature3: 'ניתוח דפוסי הוצאות'
      }
    },

    // Register features
    register: {
      title: 'הצטרפו ל-SpendWise',
      subtitle: 'צרו את החשבון החינמי שלכם',
      username: 'שם משתמש',
      usernamePlaceholder: 'הזינו שם משתמש',
      email: 'אימייל',
      emailPlaceholder: 'הזינו את האימייל שלכם',
      password: 'סיסמה',
      passwordPlaceholder: 'צרו סיסמה',
      confirmPassword: 'אישור סיסמה',
      confirmPasswordPlaceholder: 'אשרו את הסיסמה שלכם',
      createAccount: 'צור חשבון',
      creatingAccount: 'יוצר חשבון...',
      alreadyHaveAccount: 'יש לכם כבר חשבון?',
      signInInstead: 'התחברו במקום זאת',
      success: {
        title: 'החשבון נוצר!',
        message: 'החשבון שלכם נוצר בהצלחה. מעביר לעמוד התחבות...'
      },
      features: {
        title: 'התחילו לנהל את הכספים שלכם',
        description: 'הצטרפו לאלפי משתמשים שסומכים על SpendWise',
        feature1: 'חינמי לשימוש לתמיד',
        feature2: 'בטוח ופרטי',
        feature3: 'קל להתחיל'
      },
      errors: {
        registrationFailed: 'ההרשמה נכשלה. אנא נסו שוב.'
      }
    },

    // Dashboard translations
    dashboard: {
      title: 'לוח בקרה',
      subtitle: 'סקירת המצב הפיננסי שלך',
      greeting: {
        morning: 'בוקר טוב',
        afternoon: 'צהריים טובים',
        evening: 'ערב טוב',
        night: 'לילה טוב'
      },
      stats: {
        dailyAverage: 'ממוצע יומי',
        monthlyGoal: 'יעד חודשי',
        recurringActive: 'הוראות קבע פעילות',
        savedThisMonth: 'נחסך החודש'
      },
      balance: {
        title: 'סקירת יתרה',
        daily: 'יומי',
        weekly: 'שבועי',
        monthly: 'חודשי',
        yearly: 'שנתי',
        income: 'הכנסות',
        expenses: 'הוצאות',
        total: 'יתרה נטו',
        error: 'לא ניתן לטעון נתוני יתרה',
        tooltip: 'לחץ על לוח השנה כדי לקפוץ לתאריך'
      },
      transactions: {
        recent: 'עסקאות אחרונות',
        viewAll: 'הצג הכל',
        noTransactions: 'אין עסקאות עדיין',
        fetchError: 'לא ניתן לטעון עסקאות'
      },
      
      // Ensure tips section is properly defined in Hebrew
      tips: {
        title: 'טיפ פיננסי',
        content: 'עקוב אחר ההוצאות היומיות שלך כדי לזהות דפוסי הוצאות והזדמנויות חיסכון פוטנציאליות.'
      }
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