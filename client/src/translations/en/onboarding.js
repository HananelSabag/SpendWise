/**
 * 🎯 ONBOARDING TRANSLATIONS - ENGLISH
 * Complete translations for the new mobile-first onboarding experience
 * @version 2.0.0
 */

export default {
  // Main onboarding modal
  modal: {
    title: "Welcome to SpendWise!",
    subtitle: "Let's set up your personal finance management in just a few steps",
    skip: "Skip for now",
    skipConfirm: "Skip onboarding?",
    skipMessage: "You can always complete this setup later from your profile settings.",
    yes: "Yes, skip",
    no: "Continue setup",
    next: "Next",
    back: "Back",
    finish: "Get Started",
    completing: "Setting up your account...",
    error: "Something went wrong. Please try again.",
    close: "Close"
  },

  // Progress indicator
  progress: {
    step: "Step {{current}} of {{total}}",
    welcome: "Welcome",
    preferences: "Preferences", 
    categories: "Categories",
    templates: "Templates",
    ready: "Ready!"
  },

  // Welcome step
  welcome: {
    title: "Welcome to SpendWise! 💰",
    subtitle: "Your journey to better financial management starts here",
    description: "SpendWise helps you track expenses, manage income, and achieve your financial goals with beautiful, intelligent insights.",
    features: {
      title: "What you'll get:",
      tracking: {
        title: "Smart Expense Tracking",
        description: "Effortlessly track your spending with categories and smart insights"
      },
      analytics: {
        title: "Financial Analytics", 
        description: "Beautiful charts and insights to understand your money habits"
      },
      goals: {
        title: "Budget & Goals",
        description: "Set savings goals and budgets to stay on track"
      },
      mobile: {
        title: "Mobile-First Design",
        description: "Perfect experience on all your devices"
      }
    },
    cta: "Let's get started!",
    timeEstimate: "Takes about 2 minutes"
  },

  // Preferences step
  preferences: {
    title: "Personalize Your Experience 🎨",
    subtitle: "Set up your preferences for the best experience",
    
    language: {
      title: "Language",
      description: "Choose your preferred language",
      options: {
        en: "English",
        he: "עברית (Hebrew)",
        es: "Español",
        fr: "Français",
        de: "Deutsch",
        ar: "العربية"
      }
    },
    
    currency: {
      title: "Primary Currency",
      description: "Your main currency for tracking finances",
      options: {
        USD: "US Dollar ($)",
        EUR: "Euro (€)",
        ILS: "Israeli Shekel (₪)",
        GBP: "British Pound (£)",
        JPY: "Japanese Yen (¥)",
        CNY: "Chinese Yuan (¥)",
        CAD: "Canadian Dollar ($)",
        AUD: "Australian Dollar ($)"
      }
    },
    
    theme: {
      title: "Appearance Theme",
      description: "Choose how SpendWise looks",
      options: {
        light: "Light Theme",
        dark: "Dark Theme", 
        auto: "System Default"
      }
    },

    dateFormat: {
      title: "Date Format",
      description: "How dates should be displayed",
      options: {
        "MM/DD/YYYY": "MM/DD/YYYY (US)",
        "DD/MM/YYYY": "DD/MM/YYYY (International)",
        "YYYY-MM-DD": "YYYY-MM-DD (ISO)",
        "DD.MM.YYYY": "DD.MM.YYYY (European)"
      }
    },

    notifications: {
      title: "Notifications",
      description: "Stay informed about your finances",
      email: "Email notifications",
      push: "Push notifications", 
      sms: "SMS notifications",
      recurring: "Recurring transaction reminders",
      budgetAlerts: "Budget alerts"
    }
  },

  // Categories step
  categories: {
    title: "Choose Your Categories 📂",
    subtitle: "Select the expense and income categories you'll use most",
    description: "Don't worry - you can always add, remove, or customize categories later.",
    
    tabs: {
      expense: "Expense Categories",
      income: "Income Categories",
      both: "All Categories"
    },
    
    defaultCategories: {
      title: "Recommended Categories",
      description: "Popular categories based on your preferences"
    },
    
    customCategories: {
      title: "Create Custom Category",
      name: "Category Name",
      namePlaceholder: "Enter category name...",
      description: "Description (optional)",
      descriptionPlaceholder: "What this category covers...",
      icon: "Choose Icon",
      color: "Choose Color",
      type: "Category Type",
      add: "Add Category",
      creating: "Creating..."
    },
    
    selectedCount: "{{count}} categories selected",
    minRequired: "Select at least 3 categories to continue",
    
    popular: {
      title: "Popular Categories",
      subtitle: "Most used by SpendWise users"
    }
  },

  // Templates step (recurring transactions)
  templates: {
    title: "Set Up Recurring Transactions 🔄",
    subtitle: "Automate your regular income and expenses",
    description: "Save time by setting up transactions that happen regularly - like salary, rent, or subscriptions.",
    
    skip: "Skip this step",
    skipMessage: "I'll set up recurring transactions later",
    
    add: "Add Recurring Transaction",
    edit: "Edit Template",
    delete: "Delete Template",
    
    form: {
      type: "Transaction Type",
      typeOptions: {
        income: "Income",
        expense: "Expense"
      },
      
      amount: "Amount",
      amountPlaceholder: "0.00",
      
      description: "Description",
      descriptionPlaceholder: "e.g., Monthly Salary, Rent Payment...",
      
      category: "Category", 
      categoryPlaceholder: "Select category...",
      
      frequency: "Frequency",
      frequencyOptions: {
        daily: "Daily",
        weekly: "Weekly", 
        monthly: "Monthly"
      },
      
      startDate: "Start Date",
      endDate: "End Date (optional)",
      
      dayOfWeek: "Day of Week",
      dayOfMonth: "Day of Month",
      
      preview: "Preview Next Transactions",
      save: "Save Template",
      saving: "Saving..."
    },
    
    examples: {
      title: "Common Examples",
      salary: {
        title: "Monthly Salary",
        description: "Recurring income from your job"
      },
      rent: {
        title: "Rent Payment", 
        description: "Monthly housing expense"
      },
      subscription: {
        title: "Subscription Services",
        description: "Netflix, Spotify, etc."
      },
      utilities: {
        title: "Utility Bills",
        description: "Electricity, water, internet"
      }
    },
    
    templateCount: "{{count}} templates created",
    recommended: "We recommend setting up 2-4 regular transactions"
  },

  // Success/completion step
  completion: {
    title: "You're All Set! 🎉",
    subtitle: "Your SpendWise account is ready to help you manage your finances",
    
    summary: {
      title: "Setup Summary",
      language: "Language: {{language}}",
      currency: "Currency: {{currency}}", 
      theme: "Theme: {{theme}}",
      categories: "Categories: {{count}} selected",
      templates: "Recurring: {{count}} templates"
    },
    
    nextSteps: {
      title: "Next Steps",
      addTransaction: {
        title: "Add Your First Transaction",
        description: "Start tracking by adding an expense or income"
      },
      exploreAnalytics: {
        title: "Explore Analytics",
        description: "View insights about your spending patterns"
      },
      setGoals: {
        title: "Set Financial Goals", 
        description: "Create budgets and savings targets"
      },
      inviteFriends: {
        title: "Share with Friends",
        description: "Help others take control of their finances"
      }
    },
    
    cta: "Start Using SpendWise",
    processing: "Finalizing your setup..."
  },

  // Error messages
  errors: {
    loadingFailed: "Failed to load onboarding data",
    savingFailed: "Failed to save your preferences", 
    completionFailed: "Failed to complete onboarding setup",
    networkError: "Network error - please check your connection",
    serverError: "Server error - please try again later",
    validationError: "Please fill in all required fields",
    categoryCreateFailed: "Failed to create custom category",
    templateCreateFailed: "Failed to create recurring template"
  },

  // Success messages
  success: {
    preferencesSaved: "Preferences saved successfully!",
    categoriesSelected: "Categories configured!",
    templateCreated: "Recurring template created!",
    templateUpdated: "Recurring template updated!",
    templateDeleted: "Recurring template deleted!",
    onboardingComplete: "Welcome to SpendWise! Your account is ready."
  },

  // Tooltips and help
  help: {
    language: "Choose the language for SpendWise interface",
    currency: "This will be your primary currency for all transactions",
    theme: "Auto theme switches between light and dark based on your system",
    dateFormat: "This affects how dates are displayed throughout the app",
    categories: "Categories help organize your transactions for better insights",
    recurring: "Recurring transactions are automatically created based on your schedule",
    frequency: "How often this transaction should repeat",
    dayOfMonth: "Which day of the month (1-31) for monthly transactions",
    dayOfWeek: "Which day of the week for weekly transactions"
  }
}; 