/**
 * 🎯 English Onboarding Translations
 * Complete translation keys for onboarding system
 * @version 3.0.0 - COMPLETE TRANSLATION COVERAGE
 */

export default {
  progress: {
    welcome: "Welcome",
    preferences: "Preferences",
    categories: "Categories",
    templates: "Templates",
    ready: "Ready",
    step: "Step {{current}} of {{total}}",
    stepDescription: "Complete your setup to get the most out of SpendWise",
    complete: "Complete",
    timeRemaining: "{{minutes}} min remaining"
  },
  modal: {
    back: "Back",
    next: "Next",
    skip: "Skip For Now",
    finish: "Complete Setup",
    close: "Close",
    completing: "Completing...",
    unsavedChanges: "You have unsaved changes. Are you sure you want to leave?",
    keyboardHint: "Use keyboard shortcuts",
    nextShortcut: "Next",
    backShortcut: "Back",
    skipShortcut: "Skip",
    readyToComplete: "Ready to complete setup!"
  },
  title: "Welcome to SpendWise!",
  subtitle: "Let's set up your account in just a few steps",
  steps: {
    profile: {
      title: "Profile & Preferences",
      subtitle: "Set up your profile and preferences"
    },
    education: {
      title: "Learn the Basics",
      subtitle: "Understand transactions and balance tracking"
    },
    templates: {
      title: "Quick Setup",
      subtitle: "Add recurring transactions in seconds"
    }
  },
  welcome: {
    title: "Welcome to SpendWise!",
    subtitle: "Your smart financial companion",
    description: "Take control of your finances with powerful expense tracking, insights, and automation.",
    features: {
      tracking: {
        title: "Smart Tracking",
        description: "Automatically categorize and track your expenses with AI-powered insights"
      },
      analytics: {
        title: "Visual Analytics",
        description: "Beautiful charts and reports to understand your spending patterns"
      },
      goals: {
        title: "Financial Goals",
        description: "Set and track budgets, savings goals, and financial milestones"
      },
      security: {
        title: "Bank-Grade Security",
        description: "Your financial data is protected with enterprise-level encryption"
      },
      mobile: {
        title: "Mobile-First",
        description: "Perfect experience on all devices - phone, tablet, and desktop"
      },
      automation: {
        title: "Smart Automation",
        description: "Recurring transactions and intelligent categorization save you time"
      }
    },
    benefits: {
      title: "Why Choose SpendWise?",
      items: {
        easy: "Easy to use interface",
        powerful: "Powerful analytics",
        secure: "Bank-grade security",
        mobile: "Works everywhere"
      }
    },
    cta: {
      getStarted: "Get Started",
      letsGo: "Let's Go!",
      continue: "Continue Setup"
    },
    stats: {
      users: "50K+ Users",
      tracked: "$2M+ Tracked",
      categories: "100+ Categories",
      countries: "25+ Countries"
    }
  },
  templates: {
    title: "Set Up Your Templates",
    subtitle: "Create recurring transactions to automate your expense tracking",
    selected: "{{count}} template(s) selected",
    setupComplete: "Templates setup completed!",
    templatesAdded: "{{count}} templates added successfully",
    setupFailed: "Failed to setup templates",
    customCreated: "Custom template created successfully",
    createFailed: "Failed to create custom template",
    setting: "Setting up templates...",
    continue: "Continue with {{count}} template(s)",
    creating: "Creating...",
    create: "Create Template",
    createCustom: "Create Custom Template",
    createFirst: "Create your first template",
    addCustom: "Add Custom",
    custom: "Custom",
    loadMore: "Load More Templates",
    categories: {
      popular: "Popular",
      income: "Income",
      essential: "Essential",
      lifestyle: "Lifestyle",
      custom: "Custom",
      popularDescription: "Most commonly used templates",
      incomeDescription: "Salary, freelance, and other income",
      essentialDescription: "Rent, utilities, and necessary expenses",
      lifestyleDescription: "Entertainment, dining, and personal expenses",
      customDescription: "Your own custom templates"
    },
    enterAmount: "Enter amount",
    autoSelect: "Press Enter or click away to select",
    customName: "Template name (e.g., \"Farm Cleaning\")",
    customAmount: "Amount",
    customHint: "Create your own recurring transaction",
    remove: "Remove",
    readyToCreate: "These will be saved as recurring transaction templates",
    info: "These are quick setups. You can create advanced recurring transactions with full control using the + button in the main app.",
    popular: {
      salary: "Monthly Salary",
      rent: "Monthly Rent",
      groceries: "Groceries",
      streaming: "Streaming Services",
      carPayment: "Car Payment"
    },
    income: {
      primarySalary: "Primary Salary",
      freelance: "Freelance Income",
      investments: "Investment Returns",
      bonus: "Quarterly Bonus"
    },
    essential: {
      utilities: "Utilities",
      phone: "Phone Bill",
      insurance: "Insurance",
      internet: "Internet"
    },
    lifestyle: {
      gym: "Gym Membership",
      coffee: "Coffee & Drinks",
      travel: "Travel Fund",
      diningOut: "Dining Out"
    },
    form: {
      description: "Description",
      descriptionPlaceholder: "Enter template description...",
      amount: "Amount",
      type: "Type",
      category: "Category",
      frequency: "Frequency",
      selectCategory: "Select category",
      selectFrequency: "Select frequency",
      preview: "Preview"
    },
    validation: {
      required: "Please fill in all required fields",
      descriptionRequired: "Description is required",
      descriptionTooShort: "Description must be at least 3 characters",
      descriptionTooLong: "Description must be less than 50 characters",
      amountRequired: "Amount must be greater than 0",
      amountTooLarge: "Amount cannot exceed $1,000,000"
    },
    search: {
      placeholder: "Search templates...",
      noResults: "No templates found",
      noResultsDescription: "No templates match \"{{query}}\". Try a different search term.",
      results: "{{count}} result(s) for \"{{query}}\""
    },
    summary: {
      title: "Templates Summary",
      description: "You have selected {{count}} template(s) for automation",
      templates: "templates"
    },
    edit: "Edit Template",
    delete: "Delete Template",
    duplicate: "Duplicate Template",
    activate: "Activate",
    deactivate: "Deactivate"
  },
  preferences: {
    title: "Your Preferences",
    subtitle: "Customize your SpendWise experience",
    sectionDesc: "Set up your preferences to personalize your experience",
    stepProgress: "Section {{current}} of {{total}}",
    saved: "Preferences saved successfully",
    savedDescription: "Your preferences have been applied",
    saveFailed: "Failed to save preferences",
    saving: "Saving preferences...",
    complete: "Complete Setup",
    nextSection: "Next Section",
    previousSection: "Previous",
    completed: "{{count}} section(s) completed",
    required: "Required",
    quickComplete: "Skip to completion",
    language: {
      title: "Language & Region",
      description: "Choose your preferred language",
      sectionDesc: "Select your language and regional preferences",
      current: "Current",
      rtl: "Right-to-left text",
      preview: "Preview",
      sampleText: "This is how text will appear in your selected language",
      help: "You can change this later in settings"
    },
    theme: {
      title: "Appearance",
      description: "Choose your preferred theme",
      sectionDesc: "Customize the visual appearance of SpendWise",
      light: "Light",
      dark: "Dark",
      auto: "Auto",
      lightDescription: "Bright interface for day use",
      darkDescription: "Dark interface for low-light environments",
      autoDescription: "Matches your system preference",
      current: "Current",
      preview: "Preview",
      currentlyUsing: "Currently using {{theme}} theme",
      systemDetected: "System preference detected: {{theme}}",
      help: "Theme will be applied immediately"
    },
    currency: {
      title: "Currency",
      description: "Choose your primary currency",
      sectionDesc: "Set your default currency for transactions",
      popular: "Popular",
      popularTitle: "Popular Currencies",
      selected: "Selected",
      searchPlaceholder: "Search currencies...",
      searchResults: "{{count}} result(s) for \"{{query}}\"",
      noResults: "No currencies found for \"{{query}}\"",
      sample: "Sample",
      preview: "Currency Preview",
      help: "All amounts will be displayed in this currency"
    },
    notifications: {
      title: "Notifications",
      description: "Manage your notification preferences",
      sectionDesc: "Choose how you want to receive notifications",
      enablePush: "Enable Push Notifications",
      enablePushDesc: "Get instant notifications on your device for important updates",
      allowNotifications: "Allow Notifications",
      permissionGranted: "Notifications enabled successfully",
      permissionDenied: "Notifications were denied. You can enable them later in settings.",
      permissionError: "Failed to request notification permission",
      permissionRequired: "Browser permission required",
      notSupported: "Notifications are not supported in this browser",
      recommended: "Recommended",
      help: "You can change these settings anytime",
      channels: {
        title: "Notification Channels",
        push: "Push Notifications",
        email: "Email",
        sms: "SMS",
        pushDesc: "Instant browser notifications",
        emailDesc: "Email notifications to your inbox",
        smsDesc: "Text messages to your phone"
      },
      categories: {
        essential: "Essential",
        activity: "Activity",
        reports: "Reports",
        marketing: "Marketing",
        essentialDesc: "Critical security and budget alerts",
        activityDesc: "Transaction and account activity",
        reportsDesc: "Weekly and monthly summaries",
        marketingDesc: "Product updates and promotions"
      },
      security: {
        title: "Security Alerts",
        description: "Important security notifications"
      },
      budget: {
        title: "Budget Alerts",
        description: "When you approach spending limits"
      },
      transactions: {
        title: "Transaction Alerts",
        description: "New transaction notifications"
      },
      recurring: {
        title: "Recurring Reminders",
        description: "Upcoming recurring transactions"
      },
      weekly: {
        title: "Weekly Reports",
        description: "Your weekly spending summary"
      },
      monthly: {
        title: "Monthly Reports",
        description: "Your monthly financial overview"
      },
      marketing: {
        title: "Product Updates",
        description: "New features and announcements"
      },
      settings: {
        title: "Notification Settings"
      },
      summary: {
        title: "Notification Summary",
        enabled: "Enabled",
        channels: "Active channels"
      }
    }
  },
  completion: {
    success: "Setup completed successfully! Welcome to SpendWise!",
    failed: "Setup completion failed. Please try again.",
    completing: "Completing your setup...",
    almostDone: "Almost done! Finalizing your account...",
    templates_created: "Successfully created {{count}} out of {{total}} templates",
    templates_partial_failure: "Some templates could not be created. Please try again.",
    templates_failed: "Templates could not be created, but onboarding will continue."
  },
  templateTypes: {
    income: "Income",
    expense: "Expense"
  },
  frequencies: {
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly"
  },
  common: {
    cancel: "Cancel",
    save: "Save",
    enabled: "Enabled",
    disabled: "Disabled",
    back: "Back",
    continue: "Continue",
    complete: "Complete",
    skip: "Skip",
    next: "Next",
    previous: "Previous",
    close: "Close"
  },
  restart: "Restart"
};
