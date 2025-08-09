/**
 * 👤 PROFILE TRANSLATIONS - ENGLISH
 */

export default {
  // Navigation tabs
  tabs: {
    personal: 'Personal Info',
    preferences: 'Preferences',
    security: 'Security',
    export: 'Export Data'
  },

  // Messages
  messages: {
    profileUpdated: 'Profile updated successfully',
    preferencesUpdated: 'Preferences updated successfully',
    passwordChanged: 'Password changed successfully',
    uploadSuccess: 'Profile picture uploaded successfully',
    uploadError: 'Failed to upload profile picture'
  },

  // Personal Info section
  personal: {
    title: 'Personal Information',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    location: 'Location',
    website: 'Website',
    birthday: 'Birthday',
    bio: 'Bio',
    bioPlaceholder: 'Tell us about yourself...',
    memberSince: 'Member since'
  },

  // Preferences section
  preferences: {
    title: 'Application Preferences',
    subtitle: 'Customize your SpendWise experience with these settings.',
    language: 'Language',
    theme: 'Theme',
    currency: 'Currency',
    savePreferences: 'Save Preferences'
  },

  // Security
  security: {
    title: 'Security & Account',
    subtitle: 'Manage your security settings',
    
    // Password
    password: {
      title: 'Change Password',
      current: 'Current Password',
      new: 'New Password',
      confirm: 'Confirm New Password',
      change: 'Change Password',
      success: 'Password changed successfully',
      error: 'Error changing password',
      requirements: 'Password must be at least 8 characters'
    },
    
    // Two-factor authentication
    twoFactor: {
      title: 'Two-Factor Authentication',
      subtitle: 'Add an extra layer of security to your account',
      enable: 'Enable 2FA',
      disable: 'Disable 2FA',
      status: 'Status',
      enabled: 'Enabled',
      disabled: 'Disabled'
    },
    
    // Last activity
    lastActivity: {
      title: 'Recent Activity',
      subtitle: 'View your recent logins',
      device: 'Device',
      location: 'Location',
      time: 'Time',
      current: 'Current session'
    }
  },
  
  // Data export
  export: {
    title: 'Data Export',
    subtitle: 'Download your data',
    
    // Export options
    options: {
      all: 'All Data',
      transactions: 'Transactions Only',
      categories: 'Categories Only',
      custom: 'Custom Selection'
    },
    
    // Formats
    formats: {
      csv: 'CSV',
      json: 'JSON',
      pdf: 'PDF',
      excel: 'Excel'
    },
    
    // Date range
    dateRange: {
      title: 'Select Period',
      all: 'All Time',
      lastMonth: 'Last Month',
      lastYear: 'Last Year',
      custom: 'Custom Range'
    },
    
    // Actions
    actions: {
      download: 'Download Data',
      preview: 'Preview',
      schedule: 'Schedule Export'
    },
    
    // Messages
    messages: {
      preparing: 'Preparing file...',
      ready: 'File ready for download',
      error: 'Error creating file',
      emailSent: 'File sent to your email'
    }
  },
  
  // Preferences
  preferences: {
    title: 'Preferences',
    subtitle: 'Customize your experience',
    
    // Language and region
    language: {
      title: 'Language & Region',
      language: 'Language',
      currency: 'Currency',
      dateFormat: 'Date Format',
      timezone: 'Timezone'
    },
    
    // Display
    display: {
      title: 'Display',
      theme: 'Theme',
      density: 'Density',
      animations: 'Animations'
    }
  },
  
  // Notifications
  notifications: {
    title: 'Notifications',
    subtitle: 'Choose how and when to receive notifications',
    
    // Notification types
    types: {
      email: 'Email',
      push: 'Push Notifications',
      sms: 'SMS',
      inApp: 'In-App Notifications'
    },
    
    // Categories
    categories: {
      transactions: 'Transactions',
      budgets: 'Budgets',
      goals: 'Goals',
      security: 'Security',
      marketing: 'Marketing'
    }
  },

  // ✅ ADDED: Overview section for ProfileOverview.jsx component
  overview: {
    // Recent Activity
    recentActivity: 'Recent Activity',
    items: 'items',
    viewAll: 'View All',

    // Activity Types
    activity: {
      expense: 'New Expense',
      expenseDesc: 'Added expense to budget',
      income: 'New Income',
      incomeDesc: 'Added income to account',
      achievement: 'New Achievement',
      achievementDesc: 'Earned a new milestone',
      setting: 'Settings Update',
      settingDesc: 'Modified app settings'
    },

    // Achievements
    achievements: {
      title: 'Achievements',
      saver: 'Pro Saver',
      saverDesc: 'Saved over $1000 this month',
      streak: 'Daily Streak',
      streakDesc: '7 consecutive days of tracking',
      categories: 'Category Master',
      categoriesDesc: 'Created 5 custom categories',
      budgeter: 'Smart Budgeter',
      budgeterDesc: 'Stayed within budget for 3 months'
    },

    // Quick Actions
    quickActions: {
      title: 'Quick Actions',
      export: 'Export Data',
      preferences: 'Preferences',
      security: 'Security',
      share: 'Share',
      smart: 'Smart',
      help: 'Help'
    }
  },
  
  // General actions
  actions: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    update: 'Update',
    confirm: 'Confirm',
    back: 'Back',
    // Added to satisfy t('profile.actions.success') usage
    success: 'Success'
  },
  
  // General messages
  messages: {
    loading: 'Loading...',
    saving: 'Saving...',
    saved: 'Saved successfully',
    error: 'An error occurred',
    success: 'Operation completed successfully'
  }
}; 