/**
 * 🍞 TOAST TRANSLATIONS - ENGLISH  
 * Complete toast notification system translations
 * @version 1.0.0
 */

export default {
  // ✅ Authentication Toasts
  auth: {
    loginSuccess: "Welcome back!",
    loginFailed: "Login failed. Please check your credentials.",
    logoutSuccess: "You've been signed out successfully",
    logoutFailed: "Failed to sign out. Please try again.",
    registrationSuccess: "Account created successfully! Please check your email for verification.",
    registrationFailed: "Registration failed. Please try again.",
    googleLoginSuccess: "Signed in with Google successfully!",
    googleLoginFailed: "Google sign-in failed. Please try again.",
    passwordResetSent: "Password reset instructions sent to your email",
    passwordResetSuccess: "Password reset successfully!",
    passwordResetFailed: "Password reset failed. Please try again.",
    emailVerified: "Email verified successfully!",
    emailVerificationFailed: "Email verification failed. Please try again.",
    sessionExpired: "Your session has expired. Please sign in again.",
    unauthorizedAccess: "Access denied. Please sign in to continue.",
    accountLocked: "Account temporarily locked due to security reasons.",
    invalidCredentials: "Invalid email or password. Please try again.",
    networkError: "Network error. Please check your connection and try again.",
    
    // ✅ NEW: Connection Recovery Toasts
    connectionIssue: "Connection issue detected...",
    connectionRecovering: "Attempting to reconnect to server...",
    connectionRestored: "Connection to server restored successfully! 🎉",
    connectionFailed: "Failed to connect to server. Please try again.",
    autoLogoutAuthFailure: "Automatically signed out due to authentication issues",
    autoLogoutStuckState: "Automatically signed out due to connection issues",
    autoLogoutRecoveryFailed: "Automatically signed out - unable to recover connection",
    autoLogoutMultipleFailures: "Automatically signed out due to multiple failures"
  },

  // ✅ Profile Management Toasts
  profile: {
    profileUpdated: "Profile updated successfully!",
    profileUpdateFailed: "Failed to update profile. Please try again.",
    avatarUploaded: "Profile picture updated successfully!",
    avatarUploadFailed: "Failed to upload profile picture. Please try again.",
    avatarTooLarge: "Profile picture must be less than 5MB",
    preferencesUpdated: "Preferences updated successfully!",
    preferencesUpdateFailed: "Failed to update preferences. Please try again.",
    passwordChanged: "Password changed successfully!",
    passwordChangeFailed: "Failed to change password. Please try again.",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 8 characters",
    currentPasswordWrong: "Current password is incorrect",
    requiredFieldsMissing: "Please fill in all required fields"
  },

  // ✅ Data Export Toasts
  export: {
    csvExportStarted: "CSV export started - download will begin shortly",
    jsonExportStarted: "JSON export started - download will begin shortly", 
    pdfExportStarted: "PDF export started - download will begin shortly",
    exportCompleted: "Data export completed successfully!",
    exportFailed: "Data export failed. Please try again.",
    csvExportFailed: "Failed to export CSV data",
    jsonExportFailed: "Failed to export JSON data",
    pdfExportFailed: "Failed to export PDF data",
    noDataToExport: "No data available to export",
    exportTooLarge: "Export data is too large. Please try with a smaller date range."
  },

  // ✅ Transaction Management Toasts
  transactions: {
    transactionCreated: "Transaction created successfully!",
    createSuccess: "Transaction created successfully!",
    transactionUpdated: "Transaction updated successfully!",
    transactionDeleted: "Transaction deleted successfully!",
    transactionCreateFailed: "Failed to create transaction. Please try again.",
    transactionUpdateFailed: "Failed to update transaction. Please try again.", 
    transactionDeleteFailed: "Failed to delete transaction. Please try again.",
    bulkDeleteSuccess: "{{count}} transactions deleted successfully!",
    bulkDeletePartialFail: "{{failed}} transactions failed to delete",
    bulkDeleteFailed: "Bulk delete operation failed. Please try again.",
    invalidAmount: "Please enter a valid amount",
    invalidDate: "Please select a valid date",
    categoryRequired: "Please select a category",
    descriptionRequired: "Please enter a description",
    bulkImportCompleted: "Bulk import completed successfully!",
    bulkImportFailed: "Bulk import failed. Please check your file format.",
    duplicateTransactionWarning: "This transaction might be a duplicate",
    securityAlert: "Security Alert: Transaction flagged for review",
    batchSecurityAlert: "Security Alert: Multiple transactions flagged for review"
  },

  // ✅ Category Management Toasts  
  categories: {
    categoryCreated: "Category created successfully!",
    categoryUpdated: "Category updated successfully!",
    categoryDeleted: "Category deleted successfully!",
    categoryCreateFailed: "Failed to create category. Please try again.",
    categoryUpdateFailed: "Failed to update category. Please try again.",
    categoryDeleteFailed: "Failed to delete category. Please try again.",
    categoryNameRequired: "Category name is required",
    categoryNameExists: "A category with this name already exists",
    categoryInUse: "Cannot delete category as it's being used by transactions",
    invalidCategoryIcon: "Please select a valid category icon",
    categoryLimitReached: "Maximum number of categories reached"
  },

  // ✅ Settings & Preferences Toasts
  settings: {
    settingsSaved: "Settings saved successfully!",
    settingsResetToDefault: "Settings reset to default values",
    settingsSaveFailed: "Failed to save settings. Please try again.",
    themeChanged: "Theme changed successfully!",
    languageChanged: "Language changed successfully!",
    themeChangedSession: "Theme changed to {{theme}} (session only).",
    languageChangedSession: "Language changed (session only).",
    sessionOnly: "Session-only change. Persistent preferences are loaded from your Profile at login.",
    currencyChanged: "Currency changed successfully!",
    notificationsEnabled: "Notifications enabled successfully!",
    notificationsDisabled: "Notifications disabled successfully!",
    accessibilityEnabled: "Accessibility features enabled",
    accessibilityDisabled: "Accessibility features disabled"
  },

  // ✅ Data & Sync Toasts
  data: {
    dataLoaded: "Data loaded successfully!",
    dataRefreshed: "Data refreshed successfully!",
    dataSynced: "Data synchronized successfully!",
    dataLoadFailed: "Failed to load data. Please refresh the page.",
    dataRefreshFailed: "Failed to refresh data. Please try again.",
    dataSyncFailed: "Data synchronization failed. Please check your connection.",
    offlineMode: "You're currently offline. Changes will sync when connection is restored.",
    connectionRestored: "Connection restored! Data is being synchronized.",
    backupCreated: "Data backup created successfully!",
    backupRestored: "Data backup restored successfully!",
    backupFailed: "Backup operation failed. Please try again."
  },

  // ✅ Validation & Error Toasts
  validation: {
    requiredField: "This field is required",
    invalidEmail: "Please enter a valid email address",
    invalidPhone: "Please enter a valid phone number",
    invalidUrl: "Please enter a valid website URL",
    invalidDate: "Please select a valid date",
    invalidNumber: "Please enter a valid number",
    invalidFormat: "Invalid format. Please check your input.",
    fileTooLarge: "File is too large. Maximum size is {maxSize}",
    invalidFileType: "Invalid file type. Allowed types: {allowedTypes}",
    characterLimit: "Maximum {limit} characters allowed"
  },

  // ✅ System & Technical Toasts
  system: {
    pageNotFound: "Page not found. Redirecting to dashboard...",
    accessDenied: "Access denied. You don't have permission to view this page.",
    maintenanceMode: "System is under maintenance. Please try again later.",
    updateAvailable: "A new version is available. Please refresh the page.",
    sessionTimeout: "Session timeout warning. Your session will expire in 5 minutes.",
    featureNotAvailable: "This feature is not available in your current plan",
    browserNotSupported: "Your browser is not supported. Please update to continue.",
    cookiesRequired: "Cookies are required for this application to work properly",
    storageQuotaExceeded: "Storage quota exceeded. Please clear some data."
  },

  // ✅ Success Actions
  success: {
    actionCompleted: "Action completed successfully!",
    changesSaved: "Your changes have been saved",
    operationSuccess: "Operation completed successfully!",
    requestProcessed: "Your request has been processed",
    emailSent: "Email sent successfully!",
    invitationSent: "Invitation sent successfully!",
    feedbackSubmitted: "Thank you for your feedback!",
    supportTicketCreated: "Support ticket created successfully!"
  },

  // ✅ Loading & Progress
  loading: {
    pleaseWait: "Please wait...",
    loading: "Loading...",
    processing: "Processing your request...",
    saving: "Saving changes...",
    uploading: "Uploading file...",
    downloading: "Downloading...",
    synchronizing: "Synchronizing data...",
    connecting: "Connecting...",
    preparing: "Preparing...",
    almostDone: "Almost done...",
    signingOut: "Signing out..."
  },

  // ✅ Common Actions
  common: {
    copied: "Copied to clipboard!",
    linkCopied: "Link copied to clipboard!",
    imageDownloaded: "Image downloaded successfully!",
    fileSaved: "File saved successfully!",
    undoAction: "Action undone successfully",
    redoAction: "Action redone successfully",
    itemAdded: "Item added successfully!",
    itemRemoved: "Item removed successfully!",
    itemUpdated: "Item updated successfully!",
    searchCompleted: "Search completed",
    filterApplied: "Filter applied successfully",
    sortApplied: "Sort applied successfully"
  }
}; 