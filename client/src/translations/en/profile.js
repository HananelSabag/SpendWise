/**
 * 👤 PROFILE TRANSLATIONS - ENGLISH
 */

export default {
  page: {
    title: "Profile",
    subtitle: "Manage your account and preferences"
  },
  tabs: {
    personal: "Personal Info",
    preferences: "Preferences",
    security: "Security",
    export: "Export Data",
    accountSettings: "Account Settings",
    accountSettingsDesc: "Manage your profile and preferences"
  },
  messages: {
    loading: "Loading...",
    saving: "Saving...",
    saved: "Saved successfully",
    error: "An error occurred",
    success: "Operation completed successfully"
  },
  personal: {
    title: "Personal Information",
    profilePictureTitle: "Profile Picture",
    profilePictureAlt: "Profile Picture",
    changePicture: "Change Picture",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phone: "Phone",
    location: "Location",
    website: "Website",
    birthday: "Birthday",
    bio: "Bio",
    bioPlaceholder: "Tell us about yourself...",
    memberSince: "Member since",
    changePhoto: "Change Photo",
    setPhoto: "Set Photo",
    newPhotoDesc: "This will be your new profile picture",
    processingImage: "Processing image…",
    imageTooLargeAfterCompression: "Image too large after compression ({{size}}MB). Please choose a smaller image.",
    imageProcessingFailed: "Failed to process image. Please try another photo."
  },
  preferences: {
    title: "Preferences",
    subtitle: "Customize your experience",
    language: {
      title: "Language & Region",
      language: "Language",
      currency: "Currency",
      dateFormat: "Date Format",
      timezone: "Timezone"
    },
    display: {
      title: "Display",
      theme: "Theme",
      density: "Density",
      animations: "Animations"
    },
    theme: "Theme",
    currency: "Currency",
    savePreferences: "Save Preferences",
    themeOptions: {
      system: "System",
      light: "Light",
      dark: "Dark"
    }
  },
  security: {
    title: "Security & Account",
    subtitle: "Manage your security settings",
    password: {
      title: "Change Password",
      current: "Current Password",
      new: "New Password",
      confirm: "Confirm New Password",
      change: "Change Password",
      success: "Password changed successfully",
      error: "Error changing password",
      requirements: "Password must be at least 8 characters",
      policy: "Password must include at least one letter and one number"
    },
    twoFactor: {
      title: "Two-Factor Authentication",
      subtitle: "Add an extra layer of security to your account",
      enable: "Enable 2FA",
      disable: "Disable 2FA",
      status: "Status",
      enabled: "Enabled",
      disabled: "Disabled"
    },
    lastActivity: {
      title: "Recent Activity",
      subtitle: "View your recent logins",
      device: "Device",
      location: "Location",
      time: "Time",
      current: "Current session"
    },
    setPassword: "Set Password",
    updatePassword: "Update Password",
    googleSignInNote: "You signed in with Google. You can add a password to also sign in with email.",
    currentPasswordPlaceholder: "Current password",
    newPasswordPlaceholder: "New password (min. 8 chars, letter + number)",
    confirmPasswordPlaceholder: "Confirm new password"
  },
  export: {
    title: "Data Export",
    subtitle: "Download your data",
    options: {
      all: "All Data",
      transactions: "Transactions Only",
      categories: "Categories Only",
      custom: "Custom Selection"
    },
    formats: {
      csv: "CSV",
      json: "JSON",
      pdf: "PDF",
      excel: "Excel"
    },
    csvLabel: "Export as CSV",
    csvDesc: "Spreadsheet format for Excel / Google Sheets",
    jsonLabel: "Export as JSON",
    jsonDesc: "Raw data format for developers",
    pdfLabel: "Export as PDF",
    pdfDesc: "Formatted report ready to print or share",
    dateRange: {
      title: "Select Period",
      all: "All Time",
      lastMonth: "Last Month",
      lastYear: "Last Year",
      custom: "Custom Range"
    },
    actions: {
      download: "Download Data",
      preview: "Preview",
      schedule: "Schedule Export"
    },
    messages: {
      preparing: "Preparing file...",
      ready: "File ready for download",
      error: "Error creating file",
      emailSent: "File sent to your email"
    }
  },
  notifications: {
    title: "Notifications",
    subtitle: "Choose how and when to receive notifications",
    types: {
      email: "Email",
      push: "Push Notifications",
      sms: "SMS",
      inApp: "In-App Notifications"
    },
    categories: {
      transactions: "Transactions",
      budgets: "Budgets",
      goals: "Goals",
      security: "Security",
      marketing: "Marketing"
    }
  },
  overview: {
    recentActivity: "Recent Activity",
    items: "items",
    viewAll: "View All",
    activity: {
      expense: "New Expense",
      expenseDesc: "Added expense to budget",
      income: "New Income",
      incomeDesc: "Added income to account",
      achievement: "New Achievement",
      achievementDesc: "Earned a new milestone",
      setting: "Settings Update",
      settingDesc: "Modified app settings"
    },
    achievements: {
      title: "Achievements",
      saver: "Pro Saver",
      saverDesc: "Saved over $1000 this month",
      streak: "Daily Streak",
      streakDesc: "7 consecutive days of tracking",
      categories: "Category Master",
      categoriesDesc: "Created 5 custom categories",
      budgeter: "Smart Budgeter",
      budgeterDesc: "Stayed within budget for 3 months"
    },
    quickActions: {
      title: "Quick Actions",
      export: "Export Data",
      preferences: "Preferences",
      security: "Security",
      share: "Share",
      smart: "Smart",
      help: "Help"
    }
  },
  actions: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    update: "Update",
    confirm: "Confirm",
    back: "Back",
    success: "Success"
  },
  avatarTooLarge: "Avatar Too Large",
  avatarUploaded: "Avatar Uploaded",
  avatarUploadFailed: "Avatar Upload Failed",
  currentPasswordWrong: "Current Password Wrong",
  passwordChanged: "Password Changed",
  passwordChangeFailed: "Password Change Failed",
  passwordMismatch: "Password Mismatch",
  passwordTooShort: "Password Too Short",
  preferencesUpdated: "Preferences Updated",
  profileUpdated: "Profile Updated",
  profileUpdateFailed: "Profile Update Failed",
  requiredFieldsMissing: "Required Fields Missing"
};
