/**
 * 🌍 Modern Onboarding Translations - English
 * Enhanced translation keys for new 3-step onboarding system
 * @version 4.0.0 - MODERN REDESIGN
 */

export default {
  // ✅ Main titles
  title: 'Welcome to SpendWise!',
  subtitle: 'Let\'s set up your account in 3 simple steps',

  // ✅ Progress and navigation
  progress: {
    step: 'Step {{current}} of {{total}}',
    timeRemaining: '{{minutes}} min remaining',
    completed: 'Completed',
    current: 'Current'
  },

  // ✅ Modal navigation
  modal: {
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    finishNow: 'Finish Now',
    close: 'Close',
    completing: 'Completing...',
    skip: 'Skip For Now'
  },

  // ✅ Step-specific content
  steps: {
    // Step 1: Profile & Preferences
    profile: {
      title: 'Profile & Preferences',
      subtitle: 'Set up your profile and personalize your experience',
      sections: {
        profile: 'Profile',
        preferences: 'Preferences', 
        notifications: 'Notifications'
      },
      profilePicture: {
        title: 'Profile Picture',
        upload: 'Click to upload your profile picture',
        uploading: 'Uploading...',
        success: 'Profile picture uploaded successfully!',
        error: 'Failed to upload profile picture',
        sizeError: 'Profile picture must be smaller than 5MB'
      },
      personalInfo: {
        title: 'Personal Information',
        firstName: 'First Name',
        lastName: 'Last Name',
        firstNamePlaceholder: 'Enter your first name',
        lastNamePlaceholder: 'Enter your last name',
        required: 'Required'
      },
      hybridAuth: {
        title: 'Set Up Hybrid Authentication',
        description: 'You\'re signed in with Google. Create a password to also sign in with email when needed.',
        setPassword: 'Set Password',
        confirmPassword: 'Confirm Password',
        passwordPlaceholder: 'Create a password',
        confirmPlaceholder: 'Confirm password',
        active: 'Hybrid Authentication Active',
        activeDescription: 'You can sign in with both Google and email/password'
      },
      language: {
        title: 'Language',
        description: 'Choose your preferred language',
        english: 'English',
        hebrew: 'עברית'
      },
      currency: {
        title: 'Currency',
        description: 'Choose your primary currency',
        usd: 'US Dollar',
        eur: 'Euro',
        ils: 'Israeli Shekel',
        gbp: 'British Pound'
      },
      theme: {
        title: 'Theme Preference',
        description: 'Choose your preferred theme',
        light: 'Light',
        dark: 'Dark',
        auto: 'Auto',
        lightDescription: 'Bright interface for day use',
        darkDescription: 'Dark interface for low-light',
        autoDescription: 'Matches system preference'
      },
      notifications: {
        title: 'Notification Preferences',
        email: 'Email Notifications',
        emailDesc: 'Important updates via email',
        push: 'Push Notifications',
        pushDesc: 'Browser notifications',
        budgetAlerts: 'Budget Alerts',
        budgetAlertsDesc: 'When you approach spending limits',
        recurring: 'Recurring Reminders',
        recurringDesc: 'Upcoming recurring transactions',
        note: 'You can change these settings anytime in your profile settings. We recommend keeping email and budget alerts enabled for important financial updates.'
      }
    },

    // Step 2: Education
    education: {
      title: 'Learn the Basics',
      subtitle: 'Understand transactions and balance tracking',
      sections: {
        overview: 'Overview',
        transactions: 'Transactions',
        balance: 'Balance Panel',
        benefits: 'Benefits'
      },
      mainTitle: 'Learn Your Financial Dashboard',
      mainSubtitle: 'Understanding how SpendWise tracks and displays your money',
      description: 'This foundation will help you make better financial decisions',
      
      transactionTypes: {
        title: 'Two Types of Transactions',
        description: 'Understanding the difference is key',
        oneTime: {
          title: 'One-Time',
          description: 'Individual purchases you enter manually',
          examples: ['Coffee', 'Gas', 'Shopping']
        },
        recurring: {
          title: 'Recurring',
          description: 'Automatic transactions that repeat on schedule',
          examples: ['Salary', 'Rent', 'Subscriptions']
        }
      },

      balancePanel: {
        title: 'Your Balance Dashboard',
        description: 'See your money at a glance',
        features: {
          privacy: 'Hide/show balances for privacy',
          tracking: 'Track changes over time',
          overview: 'Quick income vs expense overview'
        },
        demo: {
          totalBalance: 'Total Balance',
          acrossAccounts: 'Across all accounts',
          comparedTo: 'Compared to last month',
          income: 'Income',
          expenses: 'Expenses',
          savings: 'Savings'
        }
      },

      interactive: {
        title: 'Interactive Transaction Demo',
        description: 'Click on transactions to see how they work. Notice the visual differences!',
        selected: 'Great! You selected {{count}} example{{s}}',
        explanation: 'Notice how recurring transactions have purple styling, special badges, and show their next occurrence. This makes it easy to spot automated transactions in your list!'
      },

      benefits: {
        title: 'Why This Knowledge Matters',
        description: 'Understanding these concepts will transform your financial management',
        financial: {
          title: 'Financial Benefits',
          budgeting: {
            title: 'Better Budgeting',
            description: 'Recurring transactions help you predict future cash flow and plan ahead'
          },
          patterns: {
            title: 'Spot Patterns',
            description: 'Easily identify spending patterns and subscription costs'
          },
          progress: {
            title: 'Track Progress',
            description: 'Monitor your financial health with clear balance insights'
          }
        },
        practical: {
          title: 'Practical Benefits',
          time: {
            title: 'Save Time',
            description: 'No need to manually enter salary, rent, or subscriptions every month'
          },
          never_miss: {
            title: 'Never Miss',
            description: 'Get notified about upcoming recurring transactions before they happen'
          },
          privacy: {
            title: 'Privacy Control',
            description: 'Hide balances when sharing your screen or using in public'
          }
        },
        conclusion: {
          title: 'You\'re Ready to Take Control!',
          description: 'With this knowledge, you\'ll be able to effectively use SpendWise to improve your financial health and save time managing your money.'
        }
      }
    },

    // Step 3: Templates
    templates: {
      title: 'Quick Setup',
      subtitle: 'Add recurring transactions in seconds',
      mainTitle: 'Quick Templates Setup',
      mainSubtitle: 'Set up your recurring transactions in seconds',
      description: 'Choose templates that match your lifestyle - you can always add more later',
      
      presets: {
        title: 'Quick Start Presets',
        basic: {
          name: 'Basic Setup',
          description: 'Salary + Rent + Phone'
        },
        complete: {
          name: 'Complete Setup',
          description: 'All essentials + some lifestyle'
        },
        minimal: {
          name: 'Minimal Setup',
          description: 'Just salary for now'
        }
      },

      categories: {
        essentials: {
          title: 'Essentials',
          description: 'Must-have recurring transactions'
        },
        income: {
          title: 'Income',
          description: 'Regular income sources'
        },
        lifestyle: {
          title: 'Lifestyle',
          description: 'Entertainment and personal'
        },
        transportation: {
          title: 'Transport',
          description: 'Car payments and transport'
        }
      },

      templates: {
        salary: 'Monthly Salary',
        rent: 'Rent/Mortgage',
        phone: 'Phone Bill',
        gym: 'Gym Membership',
        netflix: 'Streaming Services',
        coffee: 'Coffee Budget',
        freelance: 'Freelance Income',
        investment: 'Investment Returns',
        car_payment: 'Car Payment',
        insurance: 'Car Insurance'
      },

      summary: {
        title: 'Your Monthly Summary',
        description: 'Based on {{count}} selected template{{s}}',
        income: 'Monthly Income',
        expenses: 'Monthly Expenses',
        net: 'Net Monthly',
        positive: 'Positive cash flow',
        negative: 'Budget deficit',
        sources: '{{count}} source{{s}}',
        recurring: '{{count}} recurring',
        selected: 'Selected Templates:',
        complete: 'Complete Setup with {{count}} Template{{s}}'
      },

      benefits: {
        title: 'What Happens Next?',
        automatic: {
          title: 'Automatic Transactions',
          description: 'These will be added to your account automatically based on their schedule'
        },
        adjustments: {
          title: 'Easy Adjustments',
          description: 'Change amounts, pause, or modify any template anytime'
        },
        budgeting: {
          title: 'Better Budgeting',
          description: 'See your financial patterns and plan ahead with confidence'
        },
        timeSaving: {
          title: 'Time Saving',
          description: 'No more manually entering the same transactions every month'
        }
      }
    }
  },

  // ✅ Completion
  completion: {
    success: 'Setup completed successfully! Welcome to SpendWise!',
    failed: 'Setup completion failed. Please try again.',
    completing: 'Completing your setup...',
    almostDone: 'Almost done! Finalizing your account...'
  },

  // ✅ Common actions
  common: {
    cancel: 'Cancel',
    save: 'Save',
    enabled: 'Enabled',
    disabled: 'Disabled',
    required: 'Required',
    optional: 'Optional',
    recommended: 'Recommended'
  },

  // ✅ Validation messages
  validation: {
    firstNameRequired: 'First name is required',
    lastNameRequired: 'Last name is required',
    languageRequired: 'Language selection is required',
    currencyRequired: 'Currency selection is required',
    passwordRequired: 'Password is required for hybrid authentication',
    passwordTooShort: 'Password must be at least 8 characters',
    passwordsDoNotMatch: 'Passwords do not match'
  }
};
