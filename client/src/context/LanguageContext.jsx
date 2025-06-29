// client/src/context/LanguageContext.jsx
// Enhanced language context with complete organized translations

import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Development only logger (hoisted)
function debugLog(...args) {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
}

// Complete organized translations object
const translations = {
  // Toast messages
  "toast": {
    "success": {
      "loginSuccess": "Welcome back!",
      "registerSuccess": "Registration successful! Please check your email.",
      "logoutSuccess": "Logged out successfully",
      "emailVerified": "Email verified successfully!",
      "verificationSent": "Verification email sent!",
      "passwordReset": "Password reset successfully",
      "passwordChanged": "Password changed successfully",
      "profileUpdated": "Profile updated successfully",
      "profilePictureUploaded": "Profile picture uploaded successfully",
      "preferencesUpdated": "Preferences updated successfully",
      "transactionCreated": "Transaction created successfully",
      "transactionUpdated": "Transaction updated successfully",
      "transactionDeleted": "Transaction deleted successfully",
      "transactionGenerated": "Recurring transactions generated successfully",
      "templateUpdated": "Template updated successfully",
      "templateDeleted": "Template deleted successfully",
      "skipDatesSuccess": "Skip dates saved successfully",
      "dataRefreshed": "All transaction data refreshed",
      "nextPaymentSkipped": "Next payment skipped successfully",
      "categoryCreated": "Category created successfully",
      "categoryUpdated": "Category updated successfully",
      "categoryDeleted": "Category deleted successfully",
      "csvExportCompleted": "CSV export completed successfully!",
      "jsonExportCompleted": "JSON export completed successfully!",
      "bulkOperationSuccess": "{{count}} transactions {{operation}} successfully",
      "actionCompleted": "Action completed successfully",
      "changesSaved": "Changes saved successfully",
      "operationSuccess": "Operation completed successfully",
      "transactionAdded": "Transaction added successfully"
    },

    "error": {
      "invalidCredentials": "Invalid email or password",
      "emailNotVerified": "Your email is not verified. Please check your inbox.",
      "emailAlreadyExists": "This email is already registered",
      "usernameExists": "Username already exists",
      "tokenExpired": "Session expired. Please login again.",
      "unauthorized": "You are not authorized to perform this action",
      "authenticationFailed": "Authentication failed. Please try again.",
      "categoryNameRequired": "Category name is required",
      "categoryTypeRequired": "Category type must be income or expense",
      "invalidAmount": "Please enter a valid amount",
      "invalidDate": "Please enter a valid date",
      "descriptionRequired": "Description is required",
      "categoryRequired": "Please select a category",
      "emailRequired": "Email is required",
      "passwordRequired": "Password is required",
      "formErrors": "Please correct the errors in the form",
      "cannotDeleteDefault": "Cannot delete default categories",
      "categoryInUse": "Cannot delete category that has transactions",
      "cannotSkipNonRecurring": "Cannot skip non-recurring transaction",
      "cannotToggleNonTemplate": "Cannot toggle non-template transaction",
      "cannotSkipNonTemplate": "Cannot skip non-template transaction",
      "unknownInterval": "Unknown interval type",
      "noNextPayment": "No next payment date available",
      "serverError": "Server error. Please try again later.",
      "networkError": "Network error. Please check your connection.",
      "serviceUnavailable": "Service temporarily unavailable",
      "tooManyRequests": "Too many requests. Please slow down.",
      "notFound": "The requested item was not found",
      "operationFailed": "Operation failed. Please try again.",
      "noDataToExport": "No data available to export",
      "exportFailed": "{{format}} export failed. Please try again.",
      "exportLimitReached": "Too many export requests. Please wait a moment.",
      "bulkOperationFailed": "Bulk {{operation}} failed",
      "bulkOperationPartialFail": "{{failed}} transactions failed to {{operation}}",
      "fileTooLarge": "File size must be less than 10MB",
      "invalidFileType": "Please select a valid file type",
      "uploadFailed": "Upload failed. Please try again.",
      "databaseError": "Database error occurred",
      "queryFailed": "Query failed to execute",
      "connectionError": "Connection to database failed",
      "unexpectedError": "An unexpected error occurred",
      "operationTimeout": "Operation timed out. Please try again.",
      "unknownError": "An unknown error occurred",
      "generic": "Something went wrong. Please try again.",
      "templateCreationFailed": "Failed to create some templates. Please try again."
    },

    "info": {
      "pdfExportComingSoon": "PDF export coming soon! Please use CSV or JSON for now.",
      "featureComingSoon": "This feature is coming soon!",
      "noNewNotifications": "No new notifications",
      "dataLoading": "Loading your data...",
      "operationInProgress": "Operation in progress...",
      "syncingData": "Syncing your data...",
      "checkingStatus": "Checking status..."
    },

    "warning": {
      "unsavedChanges": "You have unsaved changes",
      "actionCannotBeUndone": "This action cannot be undone",
      "confirmDelete": "Are you sure you want to delete this?",
      "sessionExpiringSoon": "Your session will expire soon",
      "offlineMode": "You are currently offline",
      "dataOutOfSync": "Your data might be out of sync"
    },

    "loading": {
      "authenticating": "Authenticating...",
      "savingChanges": "Saving changes...",
      "deletingItem": "Deleting...",
      "uploadingFile": "Uploading file...",
      "generatingExport": "Generating export...",
      "processingRequest": "Processing request...",
      "loadingData": "Loading data...",
      "refreshingData": "Refreshing data...",
      "preparingExport": "Preparing {{format}} export...",
      "syncingPreferences": "Syncing preferences...",
      "connectingToServer": "Connecting to server..."
    },

    "errorMessages": {
      "noInternetConnection": "No Internet Connection",
      "checkConnectionAndRetry": "Please check your internet connection and try again.",
      "connectionIssues": "Connection Issues",
      "unableToVerifyLogin": "Unable to verify your login. This might be temporary.",
      "serverStarting": "Server is starting up, please wait...",
      "serverReady": "Server is ready!",
      "unableToConnectServer": "Unable to connect to server. Please check your internet connection.",
      "tooManyRequestsSlowDown": "Too many requests. Please slow down.",
      "serverErrorTryLater": "Server error. Please try again later.",
      "pageNotFound": "Page Not Found",
      "somethingWentWrong": "Something Went Wrong",
      "applicationError": "Application Error",
      "pleaseTryAgain": "Please refresh the page or contact support if the problem persists.",
      "refresh": "Refresh"
    }
  },

  "errors": {
    "generic": "An error occurred. Please try again.",
    "network": "Network error. Please check your connection.",
    "validation": "Please check the form for errors.",
    "unauthorized": "You are not authorized to perform this action.",
    "notFound": "The requested item was not found.",
    "server": "Server error. Please try again later.",
    "timeout": "Request timed out. Please try again.",
    "unknown": "An unknown error occurred.",
    "noInternetConnection": "No internet connection",
    "checkConnectionAndRetry": "Please check your connection and try again"
  },

  "common": {
    "amount": "Amount",
    "description": "Description",
    "category": "Category",
    "date": "Date",
    "optional": "Optional",
    "required": "Required",
    "back": "Back",
    "cancel": "Cancel",
    "save": "Save",
    "creating": "Creating...",
    "saving": "Saving...",
    "updating": "Updating...",
    "daily": "Daily",
    "weekly": "Weekly",
    "monthly": "Monthly",
    "yearly": "Yearly",
    "loading": "Loading...",
    "switchToDark": "Switch to Dark Mode",
    "toggleLanguage": "Toggle Language",
    "openUserMenu": "Open User Menu",
    "openMenu": "Open Menu",
    "retry": "Retry",
    "comingSoon": "Coming soon",
    "refresh": "Refresh",
    "cache_cleared": "Cache cleared",
    "delete": "Delete",
    "edit": "Edit",
    "available": "Available",
    "avatar": "Avatar",
    "operation_failed": "Operation failed",
    "close": "Close",
    "next": "Next",
    "previous": "Previous",
    "submit": "Submit",
    "reset": "Reset",
    "search": "Search",
    "filter": "Filter",
    "filters": "Filters",
    "all": "All",
    "none": "None",
    "yes": "Yes",
    "no": "No",
    "ok": "OK",
    "error": "Error",
    "success": "Success",
    "warning": "Warning",
    "info": "Information",
    "continue": "Continue",
    "active": "Active",
    "balance": "Balance",
    "today": "Today",
    "yesterday": "Yesterday",
    "tomorrow": "Tomorrow",
    "thisWeek": "This Week",
    "lastWeek": "Last Week",
    "thisMonth": "This Month",
    "lastMonth": "Last Month",
    "thisYear": "This Year",
    "lastYear": "Last Year",
    "last7Days": "Last 7 Days",
    "last30Days": "Last 30 Days",
    "last90Days": "Last 90 Days",
    "allTime": "All Time",
    "selectDate": "Select Date",
    "invalidDate": "Invalid date",
    "toggleTheme": "Toggle Theme",
    "switchToLight": "Switch to Light Mode",
    "closeMenu": "Close Menu",
    "sessionOverrideActive": "Session overrides active",
    "floatingMenu": "Floating Menu",
    "accessibility": "Accessibility",
    "statement": "Statement",
    "compliance": "Compliance",
    "hide": "Hide",
    "show": "Show",
    "menu": "Menu",
    "notSet": "Not set",
    "deleting": "Deleting...",
    "copyright": "© {{year}} SpendWise. All rights reserved.",
    "period": "Period",
    "summary": "Summary",
    "details": "Details",
    "recommended": "Recommended",
    "permanent": "Permanent",
    "temporary": "Temporary",
    "example": "Example",
    "examples": "Examples",
    "goBack": "Go Back",
    "confirm": "Confirm",
    "confirmAction": "Confirm Action",
    "positive": "Positive",
    "negative": "Negative",
    "neutral": "Neutral",
    "trending": "Trending",
    "spent": "Spent",
    "manage": "Manage",
    "results": "Results",
    "of": "of",
    "from": "From",
    "to": "To",
    "with": "With",
    "without": "Without",
    "or": "Or",
    "and": "And",
    "never": "Never",
    "always": "Always",
    "sometimes": "Sometimes",
    "perDay": "Per day",
    "perWeek": "Per week",
    "perMonth": "Per month",
    "perYear": "Per year",
    "create": "Create",
    "advanced": "Advanced filters",
    "customRange": "Custom range",
    "change": "Change",
    "logout": "Logout",
    "weak": "Weak",
    "fair": "Fair",
    "good": "Good",
    "strong": "Strong",
    "protected": "Protected",
    "uploadFailed": "Upload failed. Please try again.",
    "passwordMinLength": "Password must be at least 8 characters long",
    "passwordsDoNotMatch": "Passwords do not match",
    "usernameRequired": "Username is required",
    "selected": "selected",
    "select": "Select",
    "options": "Options", 
    "more": "More",
    "scrollForMore": "Scroll for more",
    "loadMore": "Load more",
    "refreshing": "Refreshing...",
    "quarterly": "Quarterly",
    "oneTime": "One-time",
    "uncategorized": "Uncategorized",
    "processing": "Processing...",
    "errorDescription": "Error description",
    "unknownError": "Unknown error",
    "email": "Email"
  },

  "days": {
    "sunday": "Sunday",
    "monday": "Monday",
    "tuesday": "Tuesday",
    "wednesday": "Wednesday",
    "thursday": "Thursday",
    "friday": "Friday",
    "saturday": "Saturday"
  },

  "nav": {
    "dashboard": "Dashboard",
    "transactions": "Transactions",
    "profile": "Profile",
    "settings": "Settings",
    "reports": "Reports",
    "logout": "Logout",
    "categories": "Categories",
    "help": "Help",
    "about": "About",
    "categoryManager": "Category Manager",
    "categoryManagerDesc": "Manage your personal and system categories",
    "panels": "Panels",
    "recurringManager": "Recurring transactions manager",
    "recurringManagerDesc": "Manage your recurring transactions and templates",
    "exchangeCalculator": "Exchange Calculator",
    "exchangeCalculatorDesc": "Convert currencies quickly with real-time rates"
  },

  "auth": {
    "welcomeBack": "Welcome Back",
    "loginSubtitle": "Sign in to continue to your account",
    "createAccount": "Create Account",
    "registerSubtitle": "Join thousands of users managing their finances",
    "startJourney": "Start Your Financial Journey",
    "joinThousands": "Join thousands who are already saving smarter",
    "email": "Email",
    "emailPlaceholder": "Enter your email address",
    "password": "Password",
    "passwordPlaceholder": "Enter your password",
    "confirmPassword": "Confirm Password",
    "confirmPasswordPlaceholder": "Confirm your password",
    "username": "Username",
    "usernamePlaceholder": "Choose a username",
    "currentPassword": "Current Password",
    "newPassword": "New Password",
    "emailVerificationNotice": "We will send you a verification email to confirm your account.",
    "registrationSuccess": "Registration Successful!",
    "verificationEmailSent": "We've sent a verification email to",
    "checkEmailInstructions": "Please check your inbox and click the verification link to activate your account.",
    "goToLogin": "Go to Login",
    "emailNotVerifiedError": "This email is already registered but not verified. Please check your email or request a new verification link.",
    "emailAlreadyRegistered": "This email is already registered",
    "verificationEmailSentMessage": "Verification email sent! Please check your inbox.",
    "emailNotVerifiedLogin": "Your email is not verified. Please check your inbox or request a new verification email.",
    "resendVerificationLink": "Resend verification email",
    "resendVerificationEmail": "Resend Verification Email",
    "resendVerificationDescription": "We'll send a new verification email to",
    "resendEmail": "Resend Email",
    "verificationEmailResent": "Verification email sent successfully!",
    "verifyingEmail": "Verifying Your Email",
    "pleaseWait": "Please wait while we verify your email address...",
    "emailVerified": "Email Verified!",
    "emailVerifiedSuccess": "Your email has been successfully verified. Welcome to SpendWise!",
    "tokenExpired": "Verification Link Expired",
    "tokenExpiredMessage": "This verification link has expired. Please request a new one from the login page.",
    "alreadyVerified": "Already Verified",
    "alreadyVerifiedMessage": "This email has already been verified. You can proceed to login.",
    "verificationFailed": "Verification Failed",
    "verificationFailedMessage": "We couldn't verify your email. Please try again or contact support.",
    "redirectingToDashboard": "Redirecting you to your dashboard...",
    "redirectingToSkipDates": "Redirecting to skip dates management...",
    "goToDashboard": "Go to Dashboard",
    "backToLogin": "Back to Login",
    "proceedToLogin": "Proceed to Login",
    "needHelp": "Need help?",
    "contactSupport": "Contact Support",
    "invalidVerificationLink": "Invalid verification link",
    "welcomeToSpendWise": "Welcome to SpendWise",
    "redirectingIn": "Redirecting in",
    "seconds": "seconds",
    "verifying": "Verifying",
    "signIn": "Sign In",
    "signUp": "Sign Up",
    "logout": "Logout",
    "loginAgain": "Login Again",
    "rememberMe": "Remember me",
    "forgotPassword": "Forgot Password?",
    "resetPassword": "Reset Password",
    "changePassword": "Change Password",
    "sendResetLink": "Send Reset Link",
    "agreeToTerms": "I agree to the Terms of Service and Privacy Policy",
    "forgotPasswordTitle": "Forgot Password?",
    "forgotPasswordDesc": "Enter your email to receive a reset link",
    "resetPasswordTitle": "Reset Password",
    "resetPasswordDesc": "Enter your new password",
    "checkYourEmail": "Check Your Email",
    "resetLinkSent": "Reset Link Sent!",
    "resetEmailSent": "We've sent a reset link to your email",
    "resetEmailSentDev": "Email sent! Also check console for dev link.",
    "emailSentDesc": "Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.",
    "passwordResetSuccess": "Password Reset Successfully!",
    "redirectingToLogin": "Redirecting to login...",
    "sendAnotherEmail": "Send Another Email",
    "developmentMode": "Development Mode",
    "emailSentDevDesc": "Email sent via Gmail SMTP! Check console for additional testing link.",
    "sendTestEmail": "Send Test Email (Dev)",
    "noAccount": "Don't have an account?",
    "alreadyHaveAccount": "Already have an account?",
    "signUpNow": "Sign up now",
    "signInNow": "Sign in now",
    "invalidCredentials": "Invalid email or password",
    "welcomeTitle": "Welcome to Smart Finance",
    "welcomeDescription": "Take control of your financial future with intelligent expense tracking",
    "loginSuccess": "Login successful",
    "logoutSuccess": "Logged out successfully",
    "passwordChanged": "Password changed successfully",
    "resetTokenInvalid": "Invalid or missing reset token",
    "resetTokenExpired": "Reset token has expired",
    "benefit1": "Bank-level Security",
    "benefit2": "Real-time Analytics",
    "benefit3": "Smart Insights",
    "activeUsers": "Active Users",
    "savedMoney": "Saved",
    "rating": "Rating",
    "passwordLength": "At least 8 characters",
    "passwordNumber": "Contains a number",
    "passwordUpper": "Contains uppercase letter",
    "passwordLower": "Contains lowercase letter",
    "passwordSpecial": "Contains special character",
    "passwordStrength": "Password Strength",
    "weak": "Weak",
    "fair": "Fair",
    "good": "Good",
    "strong": "Strong",
    "veryStrong": "Very Strong",
    "accountInfo": "Account Info",
    "security": "Security",

    "features": {
      "title": "Smart Finance Management",
      "subtitle": "Experience the future of personal finance",
      "secure": "Secure & Private",
      "secureDesc": "Your data is encrypted and protected",
      "fast": "Lightning Fast",
      "fastDesc": "Real-time updates and tracking",
      "smart": "Smart Analytics",
      "smartDesc": "Intelligent insights for better decisions"
    },

    "emailNotVerifiedModalTitle": "Email Not Verified",
    "emailNotVerifiedModalMessage": "You haven't verified your email address yet.",
    "checkEmailSpamMessage": "Please check your inbox and spam folder. Sometimes verification emails end up there.",
    "resendVerificationSuccess": "Verification email sent successfully!",
    "checkEmailAgainMessage": "Please check your inbox again (including spam folder)",
    "stillNoEmailMessage": "Still don't see the email?",
    "clickToResendMessage": "Click here to resend",
    "stepAccountInfo": "Account Info",
    "stepSecurity": "Security"
  },

  "dashboard": {
    "title": "Dashboard",
    "subtitle": "Overview of your finances",
    "welcomeMessage": "Welcome back, {{name}}!",
    "overviewPeriod": "Overview for {{period}}",

    "greeting": {
      "morning": "Good Morning",
      "afternoon": "Good Afternoon",
      "evening": "Good Evening",
      "night": "Good Night"
    },

    "balance": {
      "title": "Balance Overview",
      "subtitle": "Track your financial flow",
      "income": "Income",
      "expenses": "Expenses",
      "total": "Net Balance",
      "error": "Unable to load balance data",
      "backToToday": "Back to today",
      "tooltip": "Click the calendar to jump to any date",
      "trending": "Trending",
      "spent": "Spent",
      "positive": "Surplus",
      "negative": "Deficit",
      "periods": {
        "daily": "Daily",
        "weekly": "Weekly",
        "monthly": "Monthly",
        "yearly": "Yearly"
      }
    },

    "transactions": {
      "recent": "Recent Transactions",
      "latestActivity": "Latest Activity",
      "viewAll": "View All",
      "noTransactions": "No transactions yet",
      "noTransactionsDesc": "Start tracking your finances by adding your first transaction",
      "noMore": "No more transactions",
      "fetchError": "Unable to load transactions",
      "loading": "Loading transactions...",
      "error": "Error loading transactions"
    },

    "quickActions": {
      "title": "Quick Add",
      "subtitle": "Fast transaction entry",
      "fast": "Fast Entry",
      "smart": "Smart",
      "placeholder": "Enter amount",
      "amount": "Amount",
      "addExpense": "Add Expense",
      "addIncome": "Add Income",
      "defaultDescription": "Quick transaction",
      "added": "Added!",
      "advanced": "Advanced Actions",
      "todayWarning": "Transaction will be added to today, not the displayed date",
      "switchToToday": "Transaction added! Switch to today's view to see it?",
      "hint": "Use quick actions for fast transaction entry",
      "quickExpense": "Quick Expense",
      "quickIncome": "Quick Income",
      "quickRecurring": "Quick Recurring",
      "historicalDateWarning": "Adding to Historical Date",
      "goToToday": "Today",
      "notToday": "Historical Date Mode"
    },

    "stats": {
      "title": "Statistics",
      "subtitle": "Transaction insights",
      "showMore": "Show More",
      "showLess": "Show Less",
      "savingsRate": "Savings Rate",
      "dailyAvg": "Daily Avg",
      "budget": "Budget",
      "health": "Health",
      "excellent": "Excellent",
      "good": "Good",
      "improve": "Improve",
      "spendingPerDay": "spending/day",
      "onTrack": "On track",
      "review": "Review",
      "great": "Great",
      "ok": "OK",
      "poor": "Poor",
      "incomeVsExpenses": "Income vs Expenses Breakdown",
      "detailedInsights": "Detailed Insights",
      "averageTransaction": "Average Transaction",
      "totalTransactions": "{count} total transactions",
      "recurringImpact": "Recurring Impact",
      "monthlyRecurringBalance": "Monthly recurring balance",
      "largestTransaction": "Largest Transaction",
      "singleTransaction": "Single transaction",
      "topCategory": "Top Category",
      "mostUsedCategory": "Most used category",
      "balanceTrend": "Balance Trend",
      "currentPeriodTrend": "Current period trend",
      "noData": "No data for this period",
      "income": "Income",
      "expenses": "Expenses",
      "ofTotal": "of total",
      "error": "Error loading statistics",
      "noTrendData": "No trend data available",
      "financialHealthScore": "Financial Health Score",
      "dailyBurn": "Daily Burn",
      "frequency": "Frequency",
      "volatility": "Volatility",
      "high": "High",
      "medium": "Medium",
      "low": "Low",
      "transactionsPerDay": "Transactions/day",
      "perDaySpending": "Per day spending",
      "balanceTrends": "Balance Trends",
      "smartInsights": "Smart Insights",
      "fair": "Fair",
      "insights": "insights",
      "excellentSavingsRate": "Excellent savings rate",
      "goodSavingsRate": "Good savings rate",
      "lowSavingsRate": "Low savings rate",
      "spendingExceedsIncome": "Spending exceeds income this period",
      "healthyExpenseRatio": "Healthy expense-to-income ratio",
      "highExpenseRatio": "High expense-to-income ratio",
      "strongRecurringIncome": "Strong recurring income foundation",
      "moderateRecurringIncome": "Moderate recurring income stability",
      "limitedRecurringIncome": "Limited recurring income stability",
      "consistentSpending": "Consistent spending patterns",
      "irregularSpending": "Irregular spending patterns detected",
      "positiveBalance": "Positive balance for this period",
      "negativeBalance": "Negative balance for this period",
      "criticalImpact": "critical impact",
      "highImpact": "high impact",
      "mediumImpact": "medium impact",
      "lowImpact": "low impact",
      "recommendations": "Recommendations",
      "increaseSavingsRate": "Increase Savings Rate",
      "currentSavingsRateAim": "Current savings rate is {{rate}}%. Aim for at least 10-20%.",
      "reviewExpenses": "Review expenses and identify areas to cut spending",
      "stabilizeSpending": "Stabilize Spending",
      "highSpendingVolatility": "High spending volatility detected. More consistent spending helps with budgeting.",
      "createBudget": "Create a monthly budget and track spending categories",
      "buildRecurringIncome": "Build Recurring Income",
      "onlyRecurringIncome": "Only {{percent}}% of income is recurring. More predictable income improves financial stability.",
      "considerRecurringIncome": "Consider subscriptions, retainers, or passive income sources",
      "highBurnRate": "High Burn Rate",
      "dailySpendingHigh": "Daily spending rate is high relative to income.",
      "reduceExpenses": "Review and reduce daily discretionary expenses",
      "highPriority": "high",
      "mediumPriority": "medium",
      "pieChart": "Pie",
      "barsChart": "Bars",

      "trend": {
        "positive": "Positive",
        "negative": "Negative",
        "stable": "Stable"
      }
    },

    "tips": {
      "title": "Finance Tip",
      "content": "Track your daily expenses to identify spending patterns and potential savings opportunities.",
      "nextTip": "Next Tip",
      "previousTip": "Previous Tip"
    }
  },

  "transactions": {
    "title": "Transactions",
    "subtitle": "Manage all your income and expenses",
    "description": "View and manage all your transactions",
    "all": "All",
    "income": "Income",
    "expense": "Expenses",
    "searchPlaceholder": "Search transactions...",
    "noTransactions": "No transactions yet",
    "smartActions": "Smart Actions",
    "total": "Total Transactions for the period",
    "editTemplate": "Edit Template",
    "editAll": "Edit All Future",
    "editOnce": "Edit This Occurrence",
    "totalAmount": "Total Amount",
    "templateActions": "Template Actions",
    "recurringActions": "Recurring Actions",
    "editActions": "Edit Actions",
    "skipNextTooltip": "Skip the next scheduled occurrence of this transaction",
    "pauseTooltip": "Pause this template - no new transactions will be created",
    "resumeTooltip": "Resume this template - transactions will be created again",
    "manageRecurringTooltip": "Open the recurring transactions manager",
    "editSingleTooltip": "Edit only this occurrence, leave template unchanged",
    "editTemplateTooltip": "Edit the template - affects all future transactions",
    "editAllTooltip": "Edit this and all future occurrences",
    "editTooltip": "Edit this transaction",
    "deleteTemplateTooltip": "Delete this template and optionally all related transactions",
    "deleteRecurringTooltip": "Delete this transaction or the entire recurring series",
    "deleteTooltip": "Delete this transaction",
    "nextOccurrenceNote": "When this transaction will happen next",
    "frequencyNote": "How often this transaction repeats",
    "templateActiveTitle": "Template is Active",
    "templateActiveDescription": "New transactions are being created automatically",
    "templatePausedTitle": "Template is Paused",
    "templatePausedDescription": "No new transactions will be created",
    "totalGenerated": "Total Generated",
    "recurringTransactionInfo": "About Recurring Transactions",
    "recurringDescription": "This transaction was created from a recurring template. You can:",
    "editOnceDescription": "Change only this transaction",
    "editAllDescription": "Change the template and all future transactions",
    "scheduleManagement": "Schedule Management",
    "templateManagement": "Template Management",
    "skipSpecificDates": "Skip Specific Dates",
    "pauseTemplate": "Pause Template",
    "resumeTemplate": "Resume Template",
    "scheduleActiveDescription": "Template is creating new transactions on schedule",
    "schedulePausedDescription": "Template is paused - no new transactions being created",
    "templateManagementDescription": "Edit or delete this entire template",
    "chooseDeleteOption": "Choose Delete Option",
    "searchTemplates": "Search Templates",
    "type": "Type",
    "upcomingTransactions": "Upcoming Transactions",
    "templates": "Templates",
    "scheduledTransactions": "Scheduled Transactions",
    "automated": "Automated",
    "editThis": "Edit",
    "quickActions": "Quick Actions",
    "noRecurringTemplates": "No recurring templates found",
    "editTransactionDesc": "Edit this transaction to modify its details",
    "editTransactionTooltip": "Edit transaction details",
    "editThisOnlyTooltip": "Edit only this occurrence without affecting future transactions",
    "resumeDesc": "Resume this recurring transaction",
    "skipOnceDesc": "Skip the next occurrence of this recurring transaction",
    "skipOnceTooltip": "Skip next payment only",
    "deleteSeriesDesc": "Delete this entire recurring transaction series",
    "deleteSeriesTooltip": "Delete entire recurring series",
    "deleteTransactionTooltip": "Delete transaction",
    "toggleTemplateError": "Failed to toggle template",
    "orphaned": "Template Deleted",
    "transactionDetails": "Transaction Details",
    "untitledTemplate": "Untitled Template",
    "activeOnly": "Active",
    "pausedOnly": "Paused",
    "loadingTemplates": "Loading templates...",
    "noMatchingTemplates": "No matching templates",
    "createRecurringNote": "Create recurring templates to automate your transactions",
    "generateError": "Failed to generate recurring transactions",
    "templateDeleteFailed": "Failed to delete template",
    "skipSelected": "Skip Selected",

    "skipDates": {
      "title": "Skip Dates",
      "description": "Select dates to skip"
    },

    // Missing transaction keys
    "updateSuccess": "Transaction updated successfully",
    "transactionUpdated": "Transaction updated",
    "noTransactionsDesc": "Start tracking your finances by adding your first transaction",
    "scheduled": "Scheduled",
    "transactions": "Transactions", 
    "editSeries": "Edit Series",
    "editSeriesDesc": "Edit this and all future transactions",
    "pause": "Pause",
    "pauseDesc": "Pause recurring transactions",
    "resume": "Resume", 
    "skipOnce": "Skip Once",
    "deleteSeries": "Delete Series",
    "deleteTransactionDesc": "Delete this transaction",
    "paused": "Paused",
    "updating": "Updating...",
    "deleting": "Deleting...",
    "skipping": "Skipping...",
    "generate": "Generate",
    "editTemplateDesc": "Edit this template",
    "skipNext": "Skip Next",
    "skipNextDesc": "Skip the next occurrence",
    "manageDates": "Manage Dates",
    "manageDatesDesc": "Manage recurring dates",
    "deleteTemplate": "Delete Template",
    "editTransaction": "Edit Transaction",
    "saveTransaction": "Save Transaction",
    "editSingleOccurrence": "Edit Single Occurrence",
    "editSingleDesc": "Edit only this occurrence",
    "saveSingle": "Save Single",
    "editAllFuture": "Edit All Future",
    "saveSeries": "Save Series",
    "saveTemplate": "Save Template",
    "recurring": "Recurring",
    "oneTime": "One-time",
    "singleEdit": "Single Edit",
    "seriesEdit": "Series Edit",
    "template": "Template",
    "editingTransaction": "Editing Transaction",
    "editingSingleOccurrence": "Editing Single Occurrence",
    "editingAllFuture": "Editing All Future",
    "editingTemplate": "Editing Template",
    "oneTimeEditExplanation": "Edit this single transaction",
    "singleEditExplanation": "Edit only this occurrence without affecting future transactions",
    "seriesEditExplanation": "Edit this and all future transactions in the series",
    "templateEditExplanation": "Edit the template that generates these transactions",
    "descriptionOptional": "Description (optional)",
    "noDescription": "No description",
    "deleteError": "Failed to delete transaction",
    "deleteConfirm": "Confirm deletion",
    "deleteConfirmDesc": "Are you sure you want to delete this transaction?",

    "skipError": {
      "general": "Failed to skip transaction"
    },

    "delete": {
      "deleteOnce": "Delete Once",
      "skipDates": "Skip Dates",
      "manageDates": "Manage Dates", 
      "skipDescription": "Skip specific dates instead of deleting",
      "stopRecurring": "Stop Recurring",
      "deleteAll": "Delete All",
      "allDescription": "Delete entire recurring series",
      "recurringInfo": "This is a recurring transaction",
      "cannotUndo": "This action cannot be undone",
      "skipModalInfo": "You can skip specific dates instead",
      "allWarning": "This will delete all transactions in this series",
      "openSkipModal": "Open skip modal"
    },

    "deleteMessages": {
      "permanentDelete": "Permanent deletion",
      "permanentStop": "Permanently stop recurring",
      "finalConfirmation": "Final confirmation required",
      "summaryOfChanges": "Summary of changes", 
      "deleteItem": "Delete item",
      "cancelFutureOccurrences": "Cancel future occurrences",
      "summaryDeleteAll": "Summary: Delete all",
      "thisActionCannotBeUndone": "This action cannot be undone",
      "confirmDeletion": "Confirm deletion"
    },

    "deleteOptions": {
      "single": {
        "description": "Delete only this transaction"
      },
      "future": {
        "description": "Delete this and all future transactions"
      }
    }
  },

  "transactionDetails": "Transaction Details",

  "transactionCard": {
    "editButton": "Edit Transaction",
    "deleteButton": "Delete Transaction",
    "nextOccurrence": "Next Occurrence",
    "frequency": "Frequency",
    "dailyEquivalent": "Daily Equivalent",
    "startDate": "Start Date",
    "noScheduled": "Not Scheduled",
    "hideDetails": "Hide Details",
    "showDetails": "Show Details",
    "recurringInfo": "Recurring Transaction",
    "recurringNote": "This {{type}} repeats automatically. Changes may affect future occurrences."
  },

  "actions": {
    "title": "Add Transaction",
    "buttontitle": "Add New Transaction",
    "detailedTransaction": "Detailed Transaction",
    "chooseAction": "Choose your action below",
    "selectType": "Select transaction type",
    "smart": "Smart",
    "oneClick": "One-click add",
    "smartDefaults": "Smart defaults",
    "customize": "Full customization",
    "quickActions": "Quick Actions",
    "allOptions": "All transaction options",
    "directEntry": "Direct entry",
    "fullCustomization": "Full customization",
    "transactionAdded": "Your transaction has been added successfully!",
    "quickExpense": "Quick Expense",
    "quickExpenseDesc": "Add ₪100 expense instantly",
    "quickIncome": "Quick Income",
    "quickIncomeDesc": "Add ₪1000 income instantly",
    "quickRecurring": "Quick Recurring",
    "quickRecurringDesc": "Add monthly recurring expense",
    "quickAdd": "Add Quick Transaction",
    "oneTimeExpense": "One-time Expense",
    "oneTimeExpenseDesc": "Add single expense transaction",
    "recurringExpense": "Recurring Expense",
    "recurringExpenseDesc": "Set up recurring expense",
    "recurringSetup": "Recurring Setup",
    "recurringSetupDesc": "Set up automatic transactions",
    "oneTimeIncome": "One-time Income",
    "oneTimeIncomeDesc": "Add single income transaction",
    "recurringIncome": "Recurring Income",
    "recurringIncomeDesc": "Set up recurring income",
    "defaultExpense": "Quick Expense",
    "defaultIncome": "Quick Income",
    "defaultRecurringExpense": "Monthly Recurring Expense",
    "defaultRecurringIncome": "Monthly Recurring Income",
    "fillDetails": "Fill transaction details",
    "amount": "Amount",
    "description": "Description",
    "descriptionPlaceholder": "Enter description...",
    "selectCategory": "Select category",
    "category": "Category",
    "date": "Date",
    "frequency": "Frequency",
    "endDate": "End date (optional)",
    "recurringOptions": "Recurring options",
    "recurring": "Recurring",
    "dayOfWeek": "Day of week",
    "example": "Example",
    "examples": "Examples",
    "expenseExample": "e.g., Groceries, Gas, Shopping",
    "recurringExpenseExample": "e.g., Rent, Insurance, Subscription",
    "incomeExample": "e.g., Salary, Bonus, Gift",
    "recurringIncomeExample": "e.g., Salary, Dividend, Rental Income",

    "examplePlaceholders": {
      "coffee": "Coffee with friends",
      "lunch": "Lunch at restaurant",
      "salary": "Monthly salary",
      "rent": "Monthly rent payment"
    },

    "add": "Add Transaction",
    "addIncome": "Add Income",
    "addExpense": "Add Expense",
    "success": "Success!",
    "added": "Added!",
    "create": "Create",
    "update": "Update",
    "save": "Save",
    "cancel": "Cancel",
    "creating": "Creating...",
    "adding": "Adding...",
    "updating": "Updating...",
    "addSuccess": "Transaction Added Successfully",
    "updateSuccess": "Update Success",
    "historicalDateWarning": "Adding transaction to historical date",
    "goToToday": "Go to Today",

    "frequencies": {
      "daily": "Daily",
      "weekly": "Weekly",
      "monthly": "Monthly",
      "yearly": "Yearly",
      "oneTime": "One-time"
    },

    "oneTime": "One-time",

    "new": "New",
    "e.g., Salary, Bonus, Gift": "e.g., Salary, Bonus, Gift",
    "e.g., Salary, Dividend, Rental Income": "e.g., Salary, Dividend, Rental Income",
    "e.g., Groceries, Gas, Shopping": "e.g., Groceries, Gas, Shopping",
    "e.g., Rent, Insurance, Subscription": "e.g., Rent, Insurance, Subscription",
    "expense": "Expense",
    "willUseDefault": "Will use default category",
    "defaultToday": "Defaults to today",
    "monthlyIncome": "Monthly Income",
    "income": "Income",
    "monthlyExpense": "Monthly Expense",
    "willUseFirstCategory": "Will use first category",
    "automaticPayments": "Automatic payments",
    "createRecurring": "Create Recurring",
    "amountRequired": "Amount is required!",
    "dayOfMonth": "Day of Month",
    "dayOfMonthNote": "Choose which day of the month (1-31)",
    "autoClosing": "Auto-closing dialog...",

    // Missing keys from English transactions - ADD TO MATCH HEBREW
    "transactionUpdated": "Transaction Updated",
    "transactions": "Transactions", 
    "noTransactionsDesc": "Start tracking your finances by adding your first transaction",
    "noMore": "No more transactions",
    "fetchError": "Unable to load transactions",
    "error": "Error loading transactions",
    "recent": "Recent Transactions",
    "latestActivity": "Latest Activity",
    "viewAll": "View All",
    "loading": "Loading transactions...",
    "scheduled": "Scheduled",
    "editSeries": "Edit Series",
    "editSeriesDesc": "Edit this and all future transactions",
    "pause": "Pause",
    "pauseDesc": "Pause recurring transactions",
    "resume": "Resume",
    "skipOnce": "Skip Once",
    "deleteSeries": "Delete Series",
    "deleteTransactionDesc": "Delete this transaction",
    "paused": "Paused",
    "deleting": "Deleting...",
    "skipping": "Skipping...",
    "generate": "Generate",
    "editTemplateDesc": "Edit this template",
    "skipNext": "Skip Next",
    "skipNextDesc": "Skip the next occurrence",
    "manageDates": "Manage Dates",
    "manageDatesDesc": "Manage recurring dates",
    "deleteTemplate": "Delete Template",
    "editTransaction": "Edit Transaction",
    "saveTransaction": "Save Transaction",
    "editSingleOccurrence": "Edit Single Occurrence",
    "editSingleDesc": "Edit only this occurrence",
    "saveSingle": "Save Single",
    "editAllFuture": "Edit All Future",
    "saveSeries": "Save Series",
    "saveTemplate": "Save Template",
    "singleEdit": "Single Edit",
    "seriesEdit": "Series Edit",
    "template": "Template",
    "editingTransaction": "Editing Transaction",
    "editingSingleOccurrence": "Editing Single Occurrence",
    "editingAllFuture": "Editing All Future",
    "editingTemplate": "Editing Template",
    "oneTimeEditExplanation": "Edit this single transaction",
    "singleEditExplanation": "Edit only this occurrence without affecting future transactions",
    "seriesEditExplanation": "Edit this and all future transactions in the series",
    "templateEditExplanation": "Edit the template that generates these transactions",
    "descriptionOptional": "Description (optional)",
    "noDescription": "No description",
    "deleteError": "Failed to delete transaction",
    "deleteConfirm": "Confirm deletion",
    "deleteConfirmDesc": "Are you sure you want to delete this transaction?",

    "skipError": {
      "general": "Failed to skip transaction"
    },

    "delete": {
      "deleteOnce": "Delete Once",
      "skipDates": "Skip Dates",
      "manageDates": "Manage Dates",
      "skipDescription": "Skip specific dates instead of deleting",
      "stopRecurring": "Stop Recurring",
      "deleteAll": "Delete All",
      "allDescription": "Delete entire recurring series",
      "recurringInfo": "This is a recurring transaction",
      "cannotUndo": "This action cannot be undone",
      "skipModalInfo": "You can skip specific dates instead",
      "allWarning": "This will delete all transactions in this series",
      "openSkipModal": "Open skip modal"
    },

    "deleteMessages": {
      "permanentDelete": "Permanent deletion",
      "permanentStop": "Permanently stop recurring",
      "finalConfirmation": "Final confirmation required",
      "summaryOfChanges": "Summary of changes",
      "deleteItem": "Delete item",
      "cancelFutureOccurrences": "Cancel future occurrences",
      "summaryDeleteAll": "Summary: Delete all",
      "thisActionCannotBeUndone": "This action cannot be undone",
      "confirmDeletion": "Confirm deletion"
    },

    "deleteOptions": {
      "single": {
        "description": "Delete only this transaction"
      },
      "future": {
        "description": "Delete this and all future transactions"
      }
    },

    "errors": {
      "addingTransaction": "Error adding transaction",
      "invalidAmount": "Please enter a valid amount",
      "invalidDate": "Please enter a valid date",
      "descriptionRequired": "Description is required",
      "categoryRequired": "Please select a category",
      "formErrors": "Please correct the errors in the form",
      "general": "An error occurred. Please try again.",
      "updatingTransaction": "Failed to update transaction",
      "amountRequired": "Amount is required"
    }
  },

  "categories": {
    "title": "Categories",
    "manage": "Manage Categories",
    "manageCategories": "Manage Categories",
    "wizardSubtitle": "Organize your finances like a wizard",
    "addNew": "Add Category",
    "create": "Create Category",
    "createFirst": "Create First Category",
    "edit": "Edit Category",
    "delete": "Delete Category",
    "deleteConfirm": "Are you sure you want to delete this category?",
    "name": "Category Name",
    "nameRequired": "Category name is required",
    "description": "Description",
    "descriptionPlaceholder": "Optional category description",
    "type": "Type",
    "icon": "Icon",
    "userCategories": "My Categories",
    "userCategoriesDesc": "Your personal categories",
    "defaultCategories": "Default Categories",
    "defaultCategoriesDesc": "Built-in system categories",
    "noUserCategories": "You haven't created any categories yet",
    "noUserCategoriesDesc": "Create custom categories to organize your finances",
    "default": "Default",
    "selectCategory": "Select Category",
    "selectCategoryHint": "Please select a category for the transaction",
    "noCategoriesFound": "No categories found",
    "createCategoriesFirst": "Create new categories first",
    "searchPlaceholder": "Search categories...",
    "created": "Category created successfully",
    "updated": "Category updated successfully",
    "deleted": "Category deleted successfully",
    "saveFailed": "Failed to save category",
    "deleteFailed": "Failed to delete category",
    "required": "Required",
    "searchCategories": "Search Categories",
    "addCategory": "Add Category",
    "manager": "Category Manager",
    "noResults": "No results found",
    "noCategories": "No categories available",
    "tryDifferentSearch": "Try a different search term",
    "createFirstCategory": "Create your first category",
    "loading": "Loading categories...",
    "errorLoading": "Error loading categories",
    "errorGeneric": "An error occurred",
    "namePlaceholder": "Enter category name...",
    "custom": "Custom",
    "noGeneralCategories": "No general categories available",
    "defaultCategoriesWillAppear": "Default categories will appear here when loaded",
    "noCustomCategories": "No custom categories available",
    "createCategoriesInSettings": "Create custom categories in settings",

    "filter": {
      "all": "All",
      "income": "Income",
      "expense": "Expenses"
    },

    "stats": {
      "total": "Total Categories",
      "personal": "Personal Categories",
      "default": "Default"
    },

    "themes": {
      "dailyExpenses": "Daily Expenses",
      "billsAndUtilities": "Bills & Utilities",
      "lifestyle": "Lifestyle",
      "professional": "Professional",
      "workIncome": "Work Income",
      "investments": "Investments",
      "otherIncome": "Other Income",
      "other": "Other"
    },

    "General": "General",
    "Salary": "Salary",
    "Freelance": "Freelance",
    "Business Income": "Business Income",
    "Investments": "Investments",
    "Side Hustle": "Side Hustle",
    "Bonus": "Bonus",
    "Gift": "Gift",
    "Rent": "Rent",
    "Groceries": "Groceries",
    "Utilities": "Utilities",
    "Phone Bill": "Phone Bill",
    "Insurance": "Insurance",
    "Transportation": "Transportation",
    "Car Payment": "Car Payment",
    "Public Transport": "Public Transport",
    "Food": "Food",
    "Dining Out": "Dining Out",
    "Coffee & Drinks": "Coffee & Drinks",
    "Entertainment": "Entertainment",
    "Streaming Services": "Streaming Services",
    "Movies": "Movies",
    "Gaming": "Gaming",
    "Shopping": "Shopping",
    "Personal Care": "Personal Care",
    "Clothing": "Clothing",
    "Beauty": "Beauty",
    "Health": "Health",
    "Medical": "Medical",
    "Pharmacy": "Pharmacy",
    "Fitness": "Fitness",
    "Education": "Education",
    "Books": "Books",
    "Online Courses": "Online Courses",
    "Travel": "Travel",
    "Hotel": "Hotel",
    "Flight": "Flight",
    "Taxes": "Taxes",
    "Bank Fees": "Bank Fees",
    "Credit Card": "Credit Card",
    "Savings": "Savings",
    "Other": "Other",
    "Other Expense": "Other Expense",
    "Other Income": "Other Income",
    "Bills & Utilities": "Bills & Utilities",
    "Business": "Business",
    "Food & Dining": "Food & Dining",
    "Gifts & Donations": "Gifts & Donations",
    "Healthcare": "Healthcare",
    "Home & Garden": "Home & Garden",
    "Gifts": "Gifts",
    "Government": "Government",
    "Investment": "Investment",
    "Rental": "Rental",
    "Quick Income": "Quick Income",
    "Quick Expense": "Quick Expense"
  },

  "profile": {
    "title": "Profile",
    "personalInformation": "Personal Information",
    "accountInformation": "Account Information",
    "profilePhoto": "Profile Photo",
    "username": "Username",
    "email": "Email",
    "phone": "Phone",
    "location": "Location",
    "website": "Website",
    "bio": "About",
    "emailNotEditable": "Email cannot be changed",
    "changePassword": "Change Password",
    "currentPassword": "Current Password",
    "newPassword": "New Password",
    "confirmPassword": "Confirm New Password",
    "changePhoto": "Change Photo",
    "uploadPhoto": "Upload Photo",
    "photoHelper": "JPG, PNG or GIF. Max size 10MB",
    "uploading": "Uploading...",
    "photoUploaded": "Photo uploaded successfully",
    "invalidImageType": "Please select a valid image file (JPG, PNG, or GIF)",
    "imageTooLarge": "Image size must be less than 10MB",
    "active": "Active",
    "subtitle": "Manage your account details and preferences",
    "status": "Status",
    "security": "Security",
    "level": "Level",
    "tier": "Tier",
    "pro": "Pro",
    "premium": "Premium",
    "profileLastUpdate": "Profile Last Update",
    "unknown": "Unknown",
    "notUpdatedYet": "Not updated yet",
    "edit": "Edit",
    "save": "Save Changes",
    "cancel": "Cancel",
    "updateSuccess": "Profile updated successfully",
    "updateError": "Failed to update profile",
    "saveError": "Failed to save changes",
    "accountInfo": "Account Information",
    "accountStatus": "Account Status",
    "verified": "Verified",
    "memberSince": "Member Since",
    "lastLogin": "Last Login",

    "tabs": {
      "general": "General",
      "security": "Security",
      "preferences": "Preferences",
      "billing": "Billing",
      "notifications": "Notifications",
      "privacy": "Privacy"
    },

    "stats": {
      "totalTransactions": "Total Transactions",
      "thisMonth": "This Month",
      "activeDays": "Member For",
      "successRate": "Success Rate",
      "days": "days",
      "months": "months",
      "years": "years"
    },

    "quickActions": "Quick Actions",
    "exportData": "Export Data",
    "notifications": "Notifications",
    "comingSoon": "Coming Soon",
    "logoutConfirm": "Confirm Logout",
    "logoutConfirmDesc": "Are you sure you want to logout?",
    "preferences": "Preferences",
    "appPreferences": "App Preferences",
    "securitySettings": "Security Settings",
    "billingSettings": "Billing & Subscription",
    "language": "Language",
    "currency": "Currency",
    "theme": "Theme",
    "lightTheme": "Light",
    "darkTheme": "Dark",
    "systemTheme": "System",
    "languageChanged": "Language changed successfully",
    "currencyChanged": "Currency changed successfully",

    "budget": {
      "monthlyBudget": "Monthly Budget",
      "enterAmount": "Enter budget amount",
      "saving": "Saving..."
    },

    "templates": {
      "quickSetup": "Quick Setup",
      "yourTemplates": "Your Templates",
      "setupComplete": "Setup Complete! {{count}} templates ready",
      "setupOptional": "Templates are optional",
      "canAddMore": "You can add more templates anytime",
      "canSkipForNow": "You can skip this step and add templates later",
      "carPayment": "Car Payment",
      "internet": "Internet Service"
    },

    "recurring": {
      "whatAre": {
        "title": "What are Recurring Transactions?",
        "description": "Recurring transactions are payments or income that happen regularly - like your salary, rent, or monthly subscriptions. Instead of manually entering them each time, you can set them up once and SpendWise will track them automatically."
      },

      "examples": {
        "title": "Example",
        "demo": "Demo",
        "salaryDesc": "Your monthly salary is automatically added as income",
        "rentDesc": "Monthly rent payment is recorded as expense",
        "phoneDesc": "Phone bill is deducted automatically each month"
      },

      "benefits": {
        "title": "Why use recurring transactions?",
        "timeTitle": "Save Time",
        "timeDesc": "No need to manually enter the same transactions each month",
        "insightsTitle": "Better Insights",
        "insightsDesc": "Get accurate forecasts of your future financial situation",
        "accuracyTitle": "Perfect Accuracy",
        "accuracyDesc": "Never forget to track regular payments or income"
      },

      "cta": {
        "title": "Ready to set up your first recurring transactions?",
        "description": "Let's add some common recurring transactions to get you started.",
        "button": "Set Up Templates"
      }
    },

    "themeChanged": "Theme changed successfully",
    "passwordChanged": "Password changed successfully",
    "incorrectPassword": "Current password is incorrect",
    "passwordChangeError": "Failed to change password",
    "updatePassword": "Update Password",
    "additionalSecurity": "Additional Security",
    "additionalSecurityDesc": "Two-factor authentication and additional security features coming soon",
    "customPreferences": "Custom Preferences",
    "customPreferencesTitle": "Manage custom settings",
    "addNewPreference": "Add New Preference",
    "preferenceKey": "Setting Name",
    "preferenceType": "Data Type",
    "preferenceValue": "Value",
    "addPreference": "Add Setting",
    "noCustomPreferences": "No custom preferences yet",
    "preferenceAdded": "Preference added successfully",
    "preferenceRemoved": "Preference removed successfully",
    "saveCustomPreferences": "Save Custom Preferences",
    "customPreferencesSaved": "Custom preferences saved successfully",
    "advancedPreferences": "Advanced Preferences",
    "preferencesEditor": "Preferences Editor",
    "preferencesEditorInfo": "Edit your preferences as JSON. Be careful with syntax!",
    "rawPreferences": "Raw JSON Preferences",
    "preferencesUpdated": "Preferences updated successfully",
    "saveAllPreferences": "Save All Preferences",
    "commonPreferences": "Common Preferences",
    "notificationPreferences": "Notification Preferences",
    "privacyPreferences": "Privacy Preferences",

    "notificationTypes": {
      "email": "Email Notifications",
      "push": "Push Notifications",
      "sms": "SMS Notifications",
      "recurring": "Recurring Transaction Alerts",
      "reminders": "Payment Reminders"
    },

    "privacy": {
      "showProfile": "Show Public Profile",
      "showStats": "Show Statistics",
      "allowAnalytics": "Allow Analytics"
    },

    "typeString": "Text",
    "typeNumber": "Number",
    "typeBoolean": "True/False",
    "typeJson": "JSON Object",

    "placeholders": {
      "customKey": "myCustomSetting",
      "boolean": "true/false",
      "number": "123",
      "json": "{\"key\": \"value\"}",
      "string": "My value"
    },

    "export": {
      "selectFormat": "Select Format",
      "csvDescription": "CSV file (Excel/Google Sheets)",
      "jsonDescription": "JSON file (for importing to other apps)",
      "invalidFormat": "Invalid export format selected",
      "formatUnavailable": "{format} export is not available",
      "preparing": "Preparing {format} export...",
      "processing": "Processing your export...",
      "progressStatus": "{format} export: {progress}% complete",
      "title": "Export Your Data",
      "subtitle": "Choose your preferred format for download",
      "dataIncluded": "What's included in your export",
      "loadingOptions": "Loading export options...",
      "formatsAvailable": "Available Formats",
      "csvFormat": "Compatible with Excel, Google Sheets, and spreadsheet applications",
      "csvUseCase": "Perfect for data analysis, reporting, and further processing",
      "jsonFormat": "Machine-readable format with complete data structure and metadata",
      "jsonUseCase": "Ideal for developers, data scientists, and technical users",
      "estimatedSize": "Size",
      "instant": "Instant download",
      "security": "Security & Privacy",
      "httpsEncrypted": "HTTPS Encrypted",
      "notStored": "Not Stored",
      "onDemand": "On-Demand Only",
      "userInfo": "Export for {username} • {currency} • {language}",
      "transactionsIncluded": "All transactions (income and expenses)",
      "categoriesIncluded": "Categories and descriptions",
      "summaryIncluded": "Account summary and statistics",
      "preferencesIncluded": "User preferences and settings"
    },

    "errors": {
      "usernameRequired": "Username is required",
      "usernameTooShort": "Username must be at least 3 characters",
      "emailRequired": "Email is required",
      "emailInvalid": "Invalid email format",
      "keyRequired": "Setting name is required",
      "keyExists": "Setting name already exists",
      "invalidJson": "Invalid JSON format",
      "invalidFileType": "Please select an image file",
      "fileTooLarge": "File size must be less than 10MB",
      "uploadFailed": "Failed to upload image"
    }
  },

  "stats": {
    "title": "Statistics",
    "overview": "Overview",
    "currentBalance": "Current Balance",
    "monthlyIncome": "Monthly Income",
    "monthlyExpenses": "Monthly Expenses",
    "totalTransactions": "Total Transactions",
    "activeRecurring": "Active Recurring",
    "quickOverview": "Quick Overview",
    "thisMonth": "This Month",
    "lastMonth": "Last Month",
    "thisYear": "This Year",
    "allTime": "All Time",
    "activeSubscriptions": "Active Subscriptions",
    "perMonth": "Per Month",
    "savingsRate": "Savings Rate",
    "yearlyAverage": "Yearly Average",
    "activityOverview": "Activity Overview",
    "dailyAverage": "Daily Average",
    "perDay": "per day",
    "trend": "Trend",
    "categories": "Categories",
    "topCategories": "Top Categories",
    "noData": "No data available",
    "noTrendData": "No trend data available",
    "noCategoryData": "No category data available",
    "loadingStats": "Loading statistics..."
  },

  "forms": {
    "errors": {
      "required": "This field is required",
      "invalidEmail": "Invalid email address",
      "invalidAmount": "Invalid amount",
      "invalidDate": "Invalid date",
      "passwordTooShort": "Password must be at least 8 characters",
      "passwordsDontMatch": "Passwords don't match",
      "descriptionRequired": "Description is required",
      "endDateRequired": "End date is required",
      "categoryRequired": "Category is required",
      "usernameRequired": "Username is required",
      "emailRequired": "Email is required"
    },

    "placeholders": {
      "email": "your@email.com",
      "password": "••••••••",
      "amount": "0.00",
      "description": "Enter description",
      "search": "Search..."
    }
  },

  "validation": {
    "required": "This field is required",
    "usernameRequired": "Username is required",
    "usernameTooShort": "Username must be at least 3 characters",
    "emailRequired": "Email is required",
    "emailInvalid": "Invalid email format",
    "passwordRequired": "Password is required",
    "passwordTooShort": "Password must be at least 8 characters",
    "passwordNeedsNumber": "Password must contain at least one number",
    "passwordNeedsUpper": "Password must contain at least one uppercase letter",
    "passwordNeedsLower": "Password must contain at least one lowercase letter",
    "passwordNeedsSpecial": "Password must contain at least one special character",
    "passwordsDontMatch": "Passwords don't match",
    "agreeToTerms": "You must agree to the terms",
    "amountRequired": "Amount is required",
    "amountInvalid": "Amount must be a valid number",
    "amountPositive": "Amount must be greater than 0",
    "dateRequired": "Date is required",
    "dateInvalid": "Invalid date format",
    "categoryRequired": "Category is required"
  },

  "register": {
    "success": {
      "title": "Registration Successful!",
      "message": "Registration completed successfully! Please login to continue."
    },

    "errors": {
      "registrationFailed": "Registration failed. Please try again.",
      "emailExists": "Email already exists",
      "usernameExists": "Username already taken"
    }
  },

  "calendar": {
    "weekDays": ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    "months": ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    "monthsShort": ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    "today": "Today",
    "previousMonth": "Previous Month",
    "nextMonth": "Next Month",
    "selectDate": "Select Date",
    "close": "Close"
  },

  "accessibility": {
    "title": "Accessibility",
    "menu": "Accessibility Menu",
    "openMenu": "Open Accessibility Menu",
    "closeMenu": "Close Menu",
    "hide": "Hide",
    "textSize": "Text Size",
    "increaseFontSize": "Increase Text",
    "decreaseFontSize": "Decrease Text",
    "highContrast": "High Contrast",
    "darkMode": "Dark Mode",
    "lightMode": "Light Mode",
    "resetSettings": "Reset Settings",
    "required": "Required",
    "compliance": "This site complies with accessibility regulations according to Israeli Standard (TI 5568).",
    "accessibilityStatement": "Accessibility Statement",

    "statement": {
      "title": "Accessibility Statement",
      "intro": "SpendWise website is committed to making our services accessible to people with disabilities, in accordance with the Equal Rights for Persons with Disabilities Law (1998) and the Equal Rights for Persons with Disabilities Regulations (Service Accessibility Adjustments), 2013.",
      "features": "Accessibility features on the site:",

      "featuresList": {
        "screenReader": "Screen reader compatibility",
        "colorContrast": "Adjustable color contrast",
        "textSize": "Text size adjustment",
        "keyboardNav": "Keyboard navigation support",
        "multiLanguage": "Hebrew and English support"
      },

      "level": "Accessibility level:",
      "levelDescription": "This site meets AA compliance level according to WCAG 2.1 guidelines and complies with Israeli Standard (TI 5568).",
      "contact": "Contact for accessibility issues:",
      "contactDescription": "If you encounter accessibility issues or would like to send feedback about accessibility on the site, please contact our accessibility coordinator:",
      "phone": "Phone",
      "lastUpdated": "Last updated: 01/01/{{year}}",
      "close": "Close"
    }
  },

  "privacy": {
    "title": "Privacy Policy",
    "lastUpdated": "Last updated: {{date}}",

    "sections": {
      "intro": {
        "title": "Introduction",
        "content": "SpendWise ('we', 'our') respects your privacy and is committed to protecting your personal information in accordance with applicable privacy laws and regulations."
      },

      "dataCollection": {
        "title": "Information We Collect",
        "content": "We collect information you provide to us directly (account details, financial data) and information collected automatically through use of the service (usage data, device information)."
      },

      "dataUse": {
        "title": "How We Use Information",
        "content": "Your information is used to provide financial management services, improve user experience, ensure security, and meet legal obligations."
      },

      "dataProtection": {
        "title": "Data Protection",
        "content": "We implement appropriate security measures including encryption, secure servers, and regular security audits to protect your personal information."
      },

      "userRights": {
        "title": "Your Rights",
        "content": "You have the right to access, correct, delete, or export your personal information. Contact us for any information-related requests."
      },

      "contact": {
        "title": "Contact Us",
        "content": "For privacy-related questions, contact us at: spendwise.verification@gmail.com"
      }
    }
  },

  "terms": {
    "title": "Terms of Service",
    "lastUpdated": "Last updated: {{date}}",

    "sections": {
      "acceptance": {
        "title": "Acceptance of Terms",
        "content": "By using SpendWise, you agree to these terms and conditions. If you don't agree, please stop using our service."
      },

      "service": {
        "title": "Service Description",
        "content": "SpendWise provides personal finance management tools including expense tracking, budget management, and financial analytics."
      },

      "userResponsibilities": {
        "title": "User Responsibilities",
        "content": "You are responsible for maintaining account security, providing accurate information, and using the service in accordance with applicable laws."
      },

      "limitations": {
        "title": "Service Limitations",
        "content": "Our service is provided 'as is' without warranty. We are not liable for any financial decisions made based on our tools."
      },

      "termination": {
        "title": "Termination",
        "content": "Either party may terminate this agreement. Upon termination, your access will cease but your data retention rights remain as per our Privacy Policy."
      },

      "governingLaw": {
        "title": "Governing Law",
        "content": "These terms are governed by Israeli law. Disputes will be resolved in Israeli courts."
      },

      "contact": {
        "title": "Contact Us",
        "content": "For questions about these terms, contact us at: spendwise.verification@gmail.com"
      }
    }
  },

  "floatingMenu": {
    "changeLanguage": "Change Language",
    "switchCurrency": "Switch Currency",
    "toggleTheme": "Toggle Theme",
    "switchToLight": "Switch to Light Mode",
    "switchToDark": "Switch to Dark Mode",
    "accessibility": "Accessibility"
  },

  "footer": {
    "description": "Smart personal finance management tool to help you track expenses and manage your budget efficiently.",
    "navigation": "Navigation",
    "legal": "Legal",
    "support": "Support",
    "supportTitle": "Support",
    "supportDescription": "For questions and support, please contact:",
    "privacy": "Privacy Policy",
    "terms": "Terms of Service",
    "accessibility": "Accessibility",
    "accessibilityStatement": "Accessibility Statement",
    "copyright": "© {{year}} SpendWise. All rights reserved.",
    "madeWith": "Made with",
    "inIsrael": "in Israel",
    "close": "Close",
    "followUs": "Follow Us",
    "newsletter": "Newsletter",
    "newsletterDesc": "Get financial tips and updates",
    "missionStatement": "Smart personal finance management tool to help you track expenses and manage your budget efficiently.",
    "privacyPolicy": "Privacy Policy",
    "termsOfService": "Terms of Service",
    "privacyProtectionLaw": "Privacy Protection Law",
    "supportMessage": "For questions and support, please contact:",
    "legalCompliance": "SpendWise operates in accordance with all relevant financial and privacy regulations."
  },

  "notFound": {
    "title": "Page Not Found",
    "message": "The page you're looking for doesn't exist.",
    "suggestion": "It might have been moved, deleted, or you entered the wrong URL.",
    "goHome": "Go to Dashboard",
    "needHelp": "Need Help?",
    "helpMessage": "Contact our support team if you continue having issues."
  },

  "onboarding": {
    "common": {
      "next": "Next",
      "previous": "Previous",
      "skip": "Skip",
      "complete": "Complete Setup",
      "completing": "Completing...",
      "confirmClose": "Are you sure you want to close? Your progress will be saved.",
      "of": "of",
      "step": "Step"
    },

    "welcome": {
      "title": "Welcome to SpendWise!",
      "greeting": "Hello {{name}}!",
      "description": "Let's set up your financial management experience and help you understand how SpendWise can simplify your money management.",

      "features": {
        "recurring": {
          "title": "Recurring Transactions",
          "description": "Automate your regular income and expenses for effortless tracking."
        },

        "analytics": {
          "title": "Smart Analytics",
          "description": "Get insights into your spending patterns and financial trends."
        },

        "security": {
          "title": "Secure & Private",
          "description": "Your financial data is encrypted and stored securely."
        }
      },

      "highlight": {
        "title": "Recurring Transactions",
        "subtitle": "The key to effortless financial management",
        "description": "Set up transactions that happen regularly - like salary, rent, or subscriptions - and SpendWise will automatically track them for you."
      },

      "examples": {
        "salary": "Monthly Salary",
        "rent": "Rent Payment",
        "phone": "Phone Bill",
        "utilities": "Utilities"
      },

      "cta": {
        "description": "Ready to take control of your finances? Let's get started!",
        "button": "Let's Begin"
      },

      "stats": {
        "minutes": "Minutes to Setup",
        "steps": "Simple Steps",
        "benefits": "Benefits"
      },
      "profileTitle": "Personal Profile",
      "preferencesTitle": "Preferences",

      "profile": {
        "addPhoto": "Add Profile Picture",
        "uploadPrompt": "Click to upload profile picture"
      },

      "nextPrompt": {
        "title": "Ready for the next step?",
        "description": "Let's learn about the power of recurring transactions and how they can help you manage your finances smarter!"
      },

      "quickSetup": {
        "description": "Your settings are saved automatically and you can change them anytime from your profile"
      }
    },

    "preferences": {
      "title": "Customize Your Experience",
      "subtitle": "Set your preferences to personalize SpendWise",
      "description": "Configure these settings to personalize your SpendWise experience. You can change these anytime in your profile.",
      "localization": "Language & Region",
      "language": "Language",
      "currency": "Currency",
      "appearance": "Appearance",
      "theme": "Theme",

      "themes": {
        "light": "Light",
        "dark": "Dark",
        "system": "System"
      },

      "budget": "Monthly Budget",
      "monthlyBudget": "Monthly Budget",
      "enterAmount": "Enter budget amount",
      "saving": "Saving...",
      "comingSoon": "More features coming soon"
    },

    "recurring": {
      "title": "Understanding Recurring Transactions",
      "subtitle": "Learn how to automate your financial tracking",
      "tagline": "Smart automation for financial tracking - set once, track forever",

      "compareTitle": "Compare: Recurring vs One-time",
      "recurringLabel": "Recurring Transaction (with purple badge)",
      "oneTimeLabel": "One-time Transaction (no badge)",

      "keyDiffTitle": "Key Differences:",
      "keyDiff": {
        "point1": "Recurring transactions have purple badge and more edit options",
        "point2": "They include unique 'Pause' and 'Skip' options"
      },

      "howWorks": {
        "title": "How It Works?",
        "desc1": "You set the date – it's added to the list and balances on that date but distributed throughout the month from the beginning",
        "peace": "Be at Peace!",
        "desc2": "Everything is balanced from the start of the month – no surprises!"
      },

      "toolsTitle": "Available Tools",

      "features": {
        "manager": {
          "title": "Recurring Manager",
          "description": "Central management of all recurring transactions"
        },
        "quickAdd": {
          "title": "Quick Add",
          "description": "Add transactions from dashboard with one click"
        },
        "categories": {
          "title": "Categories Manager",
          "description": "Manage your personal and system categories"
        },
        "advanced": {
          "title": "Advanced Transactions",
          "description": "Advanced filtering & search with insights"
        }
      },

      "examples": {
        "salary": "Monthly Salary",
        "salaryCat": "Salary",
        "coffee": "Morning Coffee",
        "coffeeCat": "Food & Drinks"
      }
    },

    "templates": {
      "title": "Add Your First Recurring Transactions",
      "subtitle": "Set up common recurring transactions to get started",
      "selected": "{{count}} Templates Selected",
      "addCustom": "Add Custom Transaction",
      "addCustomDesc": "Create a new transaction with your exact details",
      "created": "{{count}} recurring transactions created successfully!",
      "examples": {
        "salary": "Monthly Salary",
        "rent": "Rent Payment",
        "phone": "Phone Bill",
        "internet": "Internet",
        "groceries": "Monthly Groceries",
        "carInsurance": "Car Insurance",
        "gym": "Gym Membership",
        "netflix": "Netflix Subscription",
        "coffee": "Daily Coffee"
      },
      "cta": {
        "button": "Set Up Templates"
      }
    },

    "step1": {
      "subtitle": "Welcome to your financial journey"
    },

    "step2": {
      "subtitle": "Personalize your experience"
    },

    "step3": {
      "subtitle": "Master recurring transactions"
    },

    "step4": {
      "subtitle": "Set up your first templates"
    },

    "exitConfirm": "Are you sure you want to exit the onboarding process? Your progress will be saved and you can continue later.",
    "closeExit": "Close and exit",

    "prompt": {
      "title": "Looks like you didn't finish the onboarding experience",
      "description": "Would you like to continue and finish the setup, or skip it and start using the app?",
      "skipStart": "Skip & Start",
      "continue": "Continue Setup",
      "help": "You can always access the setup later from the Help menu"
    }
  },

  "recurring": {
    "whatAre": {
      "title": "What are Recurring Transactions?",
      "description": "Recurring transactions are payments or income that happen automatically on a set schedule. Instead of entering them manually each time, you set them up once and SpendWise handles the rest."
    },

    "examples": {
      "title": "Real Examples",
      "demo": "Run Demo",
      "salaryDesc": "Your monthly income is recorded automatically",
      "rentDesc": "Monthly housing payment that never gets forgotten",
      "phoneDesc": "Regular subscription recorded automatically"
    },

    "benefits": {
      "title": "Why use recurring transactions?",
      "timeTitle": "Saves Time",
      "timeDesc": "Set once, track automatically forever",
      "insightsTitle": "Better Insights",
      "insightsDesc": "See your real spending patterns and trends",
      "accuracyTitle": "Stay Accurate",
      "accuracyDesc": "Never forget regular payments again"
    },

    "cta": {
      "title": "Ready to set up your first recurring transaction?",
      "description": "Next, we'll help you add common recurring transactions to get started.",
      "button": "Let's Set Them Up"
    }
  },

  "templates": {
    "quickSetup": "Quick Setup Suggestions",
    "yourTemplates": "Your Templates",
    "createCustom": "Create Custom Template",
    "setupComplete": "Great! You've set up {{count}} recurring transactions",
    "setupOptional": "No templates yet - that's okay!",
    "canAddMore": "You can always add more from the dashboard",
    "canSkipForNow": "You can add recurring transactions anytime from your dashboard",
    "addedFromOnboarding": "Added during onboarding",
    "carPayment": "Car Payment",
    "internet": "Internet Bill"
  },

  "budget": {
    "monthlyBudget": "Monthly Budget",
    "enterAmount": "Enter budget amount",
    "saving": "Saving...",
    "comingSoon": "More features coming soon"
  },

  "exchange": {
    "title": "Currency Converter",
    "subtitle": "Convert between currencies",
    "loading": "Loading exchange rates...",

    "error": {
      "title": "Failed to load exchange rates",
      "message": "Unable to load current exchange rates. Please check your connection.",
      "tryAgain": "Try Again"
    },

    "form": {
      "amountLabel": "Amount to convert",
      "amountPlaceholder": "100",
      "fromLabel": "From",
      "toLabel": "To"
    },

    "result": {
      "rate": "1 {{from}} = {{rate}} {{to}}"
    },

    "popular": {
      "title": "Popular Conversions"
    },

    "footer": {
      "liveRates": "Live rates • Updated every 5 minutes",
      "liveRatesMobile": "Live rates • Updates every 5 min",
      "availableCurrencies": "{{count}} currencies",
      "possiblePairs": "{{count}} currencies • {{pairs}} pairs"
    },

    "currencies": {
      "USD": "US Dollar",
      "ILS": "Israeli Shekel",
      "EUR": "Euro",
      "GBP": "British Pound",
      "JPY": "Japanese Yen",
      "CAD": "Canadian Dollar",
      "AUD": "Australian Dollar",
      "CHF": "Swiss Franc"
    }
  },

    // Loading states
    "loading": {
      "connectingToServer": "Connecting to server..."
    },

    // Theme translations for theme toggle
    "theme": {
      "dark": "Dark",
      "light": "Light"
    },

  // App initializer translations
  "app": {
    "initializer": {
      "authenticating": "Authenticating...",
      "connectingToServer": "Connecting to server...",
      "loadingSpendWise": "Loading SpendWise...",
      "loadingData": "Loading data...",
      "almostReady": "Almost ready...",
      "serverStartingUp": "Server Starting Up",
      "serverWakingMessage": "This might take a moment on the first visit...",
      "freeHostingMessage": "Free hosting takes time to wake up",
      "somethingWentWrong": "Something Went Wrong",
      "initializationFailed": "Failed to initialize the application",
      "checkingServer": "Checking server status...",
      "serverSleeping": "Server is sleeping",
      "serverWarmingUp": "Server is warming up...",
      "serverReady": "Server is ready!"
    }
  },

  // === HEBREW TRANSLATIONS ===
  he: {
    "toast": {
      "success": {
        "loginSuccess": "ברוך הבא!",
        "registerSuccess": "הרשמה הצליחה! אנא בדוק את הדואר האלקטרוני שלך.",
        "logoutSuccess": "התנתקת בהצלחה",
        "emailVerified": "הדואר האלקטרוני אומת בהצלחה!",
        "verificationSent": "אימייל אימות נשלח!",
        "passwordReset": "הסיסמה אופסה בהצלחה",
        "passwordChanged": "הסיסמה שונתה בהצלחה",
        "profileUpdated": "הפרופיל עודכן בהצלחה",
        "profilePictureUploaded": "תמונת הפרופיל הועלתה בהצלחה",
        "preferencesUpdated": "ההעדפות עודכנו בהצלחה",
        "transactionCreated": "העסקה נוצרה בהצלחה",
        "transactionUpdated": "העסקה עודכנה בהצלחה",
        "transactionDeleted": "העסקה נמחקה בהצלחה",
        "transactionGenerated": "עסקאות חוזרות נוצרו בהצלחה",
        "templateUpdated": "התבנית עודכנה בהצלחה",
        "templateDeleted": "התבנית נמחקה בהצלחה",
        "skipDatesSuccess": "תאריכי דילוג נשמרו בהצלחה",
        "dataRefreshed": "כל נתוני העסקאות רוענו",
        "nextPaymentSkipped": "התשלום הבא דולג בהצלחה",
        "categoryCreated": "הקטגוריה נוצרה בהצלחה",
        "categoryUpdated": "הקטגוריה עודכנה בהצלחה",
        "categoryDeleted": "הקטגוריה נמחקה בהצלחה",
        "csvExportCompleted": "יצוא CSV הושלם בהצלחה!",
        "jsonExportCompleted": "יצוא JSON הושלם בהצלחה!",
        "bulkOperationSuccess": "{{count}} עסקאות {{operation}} בהצלחה",
        "actionCompleted": "הפעולה הושלמה בהצלחה",
        "changesSaved": "השינויים נשמרו בהצלחה",
        "operationSuccess": "הפעולה הושלמה בהצלחה",
        "transactionAdded": "עסקה נוספה בהצלחה"
      },

      "error": {
        "invalidCredentials": "דואר אלקטרוני או סיסמה שגויים",
        "emailNotVerified": "הדואר האלקטרוני שלך לא מאומת. אנא בדוק את תיבת הדואר שלך.",
        "emailAlreadyExists": "דואר אלקטרוני זה כבר רשום",
        "usernameExists": "שם המשתמש כבר קיים",
        "tokenExpired": "הפעלה פגה. אנא התחבר שוב.",
        "unauthorized": "אין לך הרשאה לבצע פעולה זו",
        "authenticationFailed": "האימות נכשל. אנא נסה שוב.",
        "categoryNameRequired": "שם קטגוריה נדרש",
        "categoryTypeRequired": "סוג הקטגוריה חייב להיות הכנסה או הוצאה",
        "invalidAmount": "אנא הזן סכום תקין",
        "invalidDate": "אנא הזן תאריך תקין",
        "descriptionRequired": "תיאור נדרש",
        "categoryRequired": "אנא בחר קטגוריה",
        "emailRequired": "דואר אלקטרוני נדרש",
        "passwordRequired": "סיסמה נדרשת",
        "formErrors": "אנא תקן את השגיאות בטופס",
        "cannotDeleteDefault": "לא ניתן למחוק קטגוריות ברירת מחדל",
        "categoryInUse": "לא ניתן למחוק קטגוריה שיש לה עסקאות",
        "cannotSkipNonRecurring": "לא ניתן לדלג על עסקה לא חוזרת",
        "cannotToggleNonTemplate": "לא ניתן להחליף מצב של עסקה שאינה תבנית",
        "cannotSkipNonTemplate": "לא ניתן לדלג על עסקה שאינה תבנית",
        "unknownInterval": "סוג מרווח לא ידוע",
        "noNextPayment": "אין תאריך תשלום הבא זמין",
        "serverError": "שגיאת שרת. אנא נסה שוב מאוחר יותר.",
        "networkError": "שגיאת רשת. אנא בדוק את החיבור שלך.",
        "serviceUnavailable": "השירות זמנית לא זמין",
        "tooManyRequests": "יותר מדי בקשות. אנא האט.",
        "notFound": "הפריט המבוקש לא נמצא",
        "operationFailed": "הפעולה נכשלה. אנא נסה שוב.",
        "noDataToExport": "אין נתונים זמינים ליצוא",
        "exportFailed": "יצוא {{format}} נכשל. אנא נסה שוב.",
        "exportLimitReached": "יותר מדי בקשות יצוא. אנא המתן רגע.",
        "bulkOperationFailed": "פעולה קבוצתית {{operation}} נכשלה",
        "bulkOperationPartialFail": "{{failed}} עסקאות נכשלו ב{{operation}}",
        "fileTooLarge": "גודל הקובץ חייב להיות פחות מ-10MB",
        "invalidFileType": "אנא בחר סוג קובץ תקין",
        "uploadFailed": "ההעלאה נכשלה. אנא נסה שוב.",
        "databaseError": "אירעה שגיאת מסד נתונים",
        "queryFailed": "השאילתה נכשלה לביצוע",
        "connectionError": "החיבור למסד הנתונים נכשל",
        "unexpectedError": "אירעה שגיאה לא צפויה",
        "operationTimeout": "פג זמן הפעולה. אנא נסה שוב.",
        "unknownError": "אירעה שגיאה לא ידועה",
        "generic": "משהו השתבש. אנא נסה שוב.",
        "templateCreationFailed": "נכשל ליצור חלק מהתבניות. אנא נסה שוב."
      },

      "info": {
        "pdfExportComingSoon": "יצוא PDF בקרוב! אנא השתמש ב-CSV או JSON לעת עתה.",
        "featureComingSoon": "התכונה הזו בקרוב!",
        "noNewNotifications": "אין התראות חדשות",
        "dataLoading": "טוען את הנתונים שלך...",
        "operationInProgress": "פעולה בביצוע...",
        "syncingData": "מסנכרן את הנתונים שלך...",
        "checkingStatus": "בודק סטטוס..."
      },

      "warning": {
        "unsavedChanges": "יש לך שינויים לא שמורים",
        "actionCannotBeUndone": "פעולה זו לא ניתנת לביטול",
        "confirmDelete": "האם אתה בטוח שברצונך למחוק זאת?",
        "sessionExpiringSoon": "הפעלה שלך תפוג בקרוב",
        "offlineMode": "אתה כעת במצב לא מקוון",
        "dataOutOfSync": "הנתונים שלך עשויים לא להיות מסונכרנים"
      },

      "loading": {
        "authenticating": "מאמת...",
        "savingChanges": "שומר שינויים...",
        "deletingItem": "מוחק...",
        "uploadingFile": "מעלה קובץ...",
        "generatingExport": "יוצר יצוא...",
        "processingRequest": "מעבד בקשה...",
        "loadingData": "טוען נתונים...",
        "refreshingData": "מרענן נתונים...",
        "preparingExport": "מכין יצוא {{format}}...",
        "syncingPreferences": "מסנכרן העדפות...",
        "connectingToServer": "מתחבר לשרת..."
      },

      "errorMessages": {
        "noInternetConnection": "אין חיבור לאינטרנט",
        "checkConnectionAndRetry": "אנא בדוק את חיבור האינטרנט שלך ונסה שוב.",
        "connectionIssues": "בעיות חיבור",
        "unableToVerifyLogin": "לא ניתן לאמת את ההתחברות שלך. זה עשוי להיות זמני.",
        "serverStarting": "השרת מתחיל, אנא המתן...",
        "serverReady": "השרת מוכן!",
        "unableToConnectServer": "לא ניתן להתחבר לשרת. אנא בדוק את חיבור האינטרנט שלך.",
        "tooManyRequestsSlowDown": "יותר מדי בקשות. אנא האט.",
        "serverErrorTryLater": "שגיאת שרת. אנא נסה שוב מאוחר יותר.",
        "pageNotFound": "עמוד לא נמצא",
        "somethingWentWrong": "משהו השתבש",
        "applicationError": "שגיאת יישום",
        "pleaseTryAgain": "אנא רענן את הדף או צור קשר עם התמיכה אם הבעיה נמשכת.",
        "refresh": "רענן"
      }
    },

    "errors": {
      "generic": "אירעה שגיאה. אנא נסה שוב.",
      "network": "שגיאת רשת. אנא בדוק את החיבור שלך.",
      "validation": "אנא בדוק את הטופס לשגיאות.",
      "unauthorized": "אין לך הרשאה לבצע פעולה זו.",
      "notFound": "הפריט המבוקש לא נמצא.",
      "server": "שגיאת שרת. אנא נסה שוב מאוחר יותר.",
      "timeout": "פג זמן הבקשה. אנא נסה שוב.",
      "unknown": "אירעה שגיאה לא ידועה.",
      "noInternetConnection": "אין חיבור לאינטרנט",
      "checkConnectionAndRetry": "אנא בדוק את החיבור שלך ונסה שוב"
    },

    // Loading states
    "loading": {
      "connectingToServer": "מתחבר לשרת..."
    },

    "common": {
      "amount": "סכום",
      "description": "תיאור",
      "category": "קטגוריה",
      "date": "תאריך",
      "optional": "אופציונלי",
      "required": "נדרש",
      "back": "חזור",
      "cancel": "בטל",
      "save": "שמור",
      "creating": "יוצר...",
      "saving": "שומר...",
      "updating": "מעדכן...",
      "daily": "יומי",
      "weekly": "שבועי",
      "monthly": "חודשי",
      "yearly": "שנתי",
      "loading": "טוען...",
      "switchToDark": "עבור למצב כהה",
      "toggleLanguage": "החלף שפה",
      "openUserMenu": "פתח תפריט משתמש",
      "openMenu": "פתח תפריט",
      "retry": "נסה שוב",
      "comingSoon": "בקרוב",
      "refresh": "רענן",
      "cache_cleared": "המטמון נוקה",
      "delete": "מחק",
      "edit": "ערוך",
      "available": "זמין",
      "close": "סגור",
      "next": "הבא",
      "previous": "הקודם",
      "submit": "שלח",
      "reset": "איפוס",
      "search": "חפש",
      "filter": "סנן",
      "filters": "מסננים",
      "all": "הכל",
      "none": "ללא",
      "yes": "כן",
      "no": "לא",
      "ok": "אישור",
      "error": "שגיאה",
      "success": "הצלחה",
      "warning": "אזהרה",
      "info": "מידע",
      "continue": "המשך",
      "active": "פעיל",
      "balance": "יתרה",
      "today": "היום",
      "yesterday": "אתמול",
      "tomorrow": "מחר",
      "thisWeek": "השבוע",
      "lastWeek": "שבוע שעבר",
      "thisMonth": "החודש",
      "lastMonth": "החודש שעבר",
      "thisYear": "השנה",
      "lastYear": "שנה שעברה",
      "last7Days": "7 ימים אחרונים",
      "last30Days": "30 ימים אחרונים",
      "last90Days": "90 ימים אחרונים",
      "allTime": "כל הזמן",
      "selectDate": "בחר תאריך",
      "invalidDate": "תאריך לא תקין",
      "toggleTheme": "החלף ערכת נושא",
      "switchToLight": "עבור למצב בהיר",
      "closeMenu": "סגור תפריט",
      "sessionOverrideActive": "עקיפות פעלה פעילות",
      "floatingMenu": "תפריט צף",
      "accessibility": "נגישות",
      "statement": "הצהרה",
      "compliance": "תאימות",
      "hide": "הסתר",
      "show": "הצג",
      "menu": "תפריט",
      "notSet": "לא הוגדר",
      "deleting": "מוחק...",
      "copyright": "© {{year}} SpendWise. כל הזכויות שמורות.",
      "period": "תקופה",
      "summary": "סיכום",
      "details": "פרטים",
      "recommended": "מומלץ",
      "permanent": "קבוע",
      "temporary": "זמני",
      "example": "דוגמה",
      "examples": "דוגמאות",
      "goBack": "חזור",
      "confirm": "אשר",
      "confirmAction": "אשר פעולה",
      "positive": "חיובי",
      "negative": "שלילי",
      "neutral": "ניטרלי",
      "trending": "מגמה",
      "spent": "הוצא",
      "manage": "נהל",
      "results": "תוצאות",
      "of": "מתוך",
      "from": "מ",
      "to": "עד",
      "with": "עם",
      "without": "ללא",
      "or": "או",
      "and": "ו",
      "never": "אף פעם",
      "always": "תמיד",
      "sometimes": "לפעמים",
      "perDay": "ליום",
      "perWeek": "לשבוע",
      "perMonth": "לחודש",
      "perYear": "לשנה",
      "create": "צור",
      "advanced": "מסננים מתקדמים",
      "customRange": "טווח מותאם",
      "change": "שנה",
      "logout": "התנתק",
      "weak": "חלש",
      "fair": "בינוני",
      "good": "טוב",
      "strong": "חזק",
      "protected": "מוגן",
      "uploadFailed": "ההעלאה נכשלה. אנא נסה שוב.",
      "passwordMinLength": "הסיסמה חייבת להיות באורך של לפחות 8 תווים",
      "passwordsDoNotMatch": "הסיסמאות אינן תואמות",
      "usernameRequired": "שם משתמש נדרש",
      "selected": "נבחר",
      "select": "בחר",
      "options": "אפשרויות", 
      "more": "עוד",
      "scrollForMore": "גלול לעוד",
      "loadMore": "טען עוד",
      "refreshing": "מרענן...",
      "quarterly": "רבעוני",
      "oneTime": "חד פעמי",
      "uncategorized": "ללא קטגוריה",
      "processing": "מעבד...",
      "errorDescription": "תיאור שגיאה",
      "unknownError": "שגיאה לא ידועה",
      "email": "דואר אלקטרוני",
      "avatar": "אוואטר",
      "operation_failed": "הפעולה נכשלה"
    },

    "days": {
      "sunday": "ראשון",
      "monday": "שני",
      "tuesday": "שלישי",
      "wednesday": "רביעי",
      "thursday": "חמישי",
      "friday": "שישי",
      "saturday": "שבת"
    },

    "nav": {
      "dashboard": "דשבורד",
      "transactions": "עסקאות",
      "profile": "פרופיל",
      "settings": "הגדרות",
      "reports": "דוחות",
      "logout": "התנתק",
      "categories": "קטגוריות",
      "help": "עזרה",
      "about": "אודות",
      "categoryManager": "מנהל קטגוריות",
      "categoryManagerDesc": "נהל את הקטגוריות האישיות והמערכת שלך",
      "panels": "פאנלים",
      "recurringManager": "מנהל עסקאות חוזרות",
      "recurringManagerDesc": "נהל את העסקאות החוזרות והתבניות שלך",
      "exchangeCalculator": "מחשבון המרה",
      "exchangeCalculatorDesc": "המר מטבעות במהירות עם שערים בזמן אמת"
    },

    "auth": {
      "welcomeBack": "ברוך שובך",
      "loginSubtitle": "התחבר כדי להמשיך לחשבון שלך",
      "createAccount": "צור חשבון",
      "registerSubtitle": "הצטרף לאלפי משתמשים המנהלים את הכספים שלהם",
      "startJourney": "התחל את המסע הפיננסי שלך",
      "joinThousands": "הצטרף לאלפים שכבר חוסכים בחכמה",
      "email": "דואר אלקטרוני",
      "emailPlaceholder": "הזן את כתובת הדואר האלקטרוני שלך",
      "password": "סיסמה",
      "passwordPlaceholder": "הזן את הסיסמה שלך",
      "confirmPassword": "אשר סיסמה",
      "confirmPasswordPlaceholder": "אשר את הסיסמה שלך",
      "username": "שם משתמש",
      "usernamePlaceholder": "בחר שם משתמש",
      "currentPassword": "סיסמה נוכחית",
      "newPassword": "סיסמה חדשה",
      "emailVerificationNotice": "נשלח לך אימייל אימות לאישור החשבון שלך.",
      "registrationSuccess": "הרשמה הצליחה!",
      "verificationEmailSent": "שלחנו אימייל אימות ל",
      "checkEmailInstructions": "אנא בדוק את תיבת הדואר שלך ולחץ על קישור האימות כדי להפעיל את החשבון שלך.",
      "goToLogin": "עבור להתחברות",
      "emailNotVerifiedError": "דואר אלקטרוני זה כבר רשום אך לא מאומת. אנא בדוק את הדואר שלך או בקש קישור אימות חדש.",
      "emailAlreadyRegistered": "דואר אלקטרוני זה כבר רשום",
      "verificationEmailSentMessage": "אימייל אימות נשלח! אנא בדוק את תיבת הדואר שלך.",
      "emailNotVerifiedLogin": "הדואר האלקטרוני שלך לא מאומת. אנא בדוק את תיבת הדואר שלך או בקש אימייל אימות חדש.",
      "resendVerificationLink": "שלח שוב אימייל אימות",
      "resendVerificationEmail": "שלח שוב אימייל אימות",
      "resendVerificationDescription": "נשלח אימייל אימות חדש ל",
      "resendEmail": "שלח שוב אימייל",
      "verificationEmailResent": "אימייל אימות נשלח בהצלחה!",
      "verifyingEmail": "מאמת את הדואר האלקטרוני שלך",
      "pleaseWait": "אנא המתן בזמן שאנו מאמתים את כתובת הדואר האלקטרוני שלך...",
      "emailVerified": "דואר אלקטרוני אומת!",
      "emailVerifiedSuccess": "הדואר האלקטרוני שלך אומת בהצלחה. ברוך הבא לSpendWise!",
      "tokenExpired": "קישור האימות פג",
      "tokenExpiredMessage": "קישור האימות הזה פג. אנא בקש חדש מדף ההתחברות.",
      "alreadyVerified": "כבר מאומת",
      "alreadyVerifiedMessage": "דואר אלקטרוני זה כבר אומת. אתה יכול להמשיך להתחברות.",
      "verificationFailed": "האימות נכשל",
      "verificationFailedMessage": "לא הצלחנו לאמת את הדואר האלקטרוני שלך. אנא נסה שוב או צור קשר עם התמיכה.",
      "redirectingToDashboard": "מפנה אותך לדשבורד שלך...",
      "redirectingToSkipDates": "מפנה לניהול תאריכי דילוג...",
      "goToDashboard": "עבור לדשבורד",
      "backToLogin": "חזור להתחברות",
      "proceedToLogin": "המשך להתחברות",
      "needHelp": "צריך עזרה?",
      "contactSupport": "צור קשר עם התמיכה",
      "invalidVerificationLink": "קישור אימות לא תקין",
      "welcomeToSpendWise": "ברוך הבא לSpendWise",
      "redirectingIn": "מפנה בעוד",
      "seconds": "שניות",
      "verifying": "מאמת",
      "signIn": "התחבר",
      "signUp": "הירשם",
      "logout": "התנתק",
      "loginAgain": "התחבר שוב",
      "rememberMe": "זכור אותי",
      "forgotPassword": "שכחת סיסמה?",
      "resetPassword": "אפס סיסמה",
      "changePassword": "שנה סיסמה",
      "sendResetLink": "שלח קישור איפוס",
      "agreeToTerms": "אני מסכים לתנאי השירות ומדיניות הפרטיות",
      "forgotPasswordTitle": "שכחת סיסמה?",
      "forgotPasswordDesc": "הזן את הדואר האלקטרוני שלך כדי לקבל קישור איפוס",
      "resetPasswordTitle": "אפס סיסמה",
      "resetPasswordDesc": "הזן את הסיסמה החדשה שלך",
      "checkYourEmail": "בדוק את הדואר האלקטרוני שלך",
      "resetLinkSent": "קישור איפוס נשלח!",
      "resetEmailSent": "שלחנו קישור איפוס לדואר האלקטרוני שלך",
      "resetEmailSentDev": "אימייל נשלח! בדוק גם את הקונסולה לקישור פיתוח.",
      "emailSentDesc": "בדוק את הדואר האלקטרוני שלך לקישור לאיפוס הסיסמה. אם הוא לא מופיע תוך כמה דקות, בדוק את תיקיית הספאם שלך.",
      "passwordResetSuccess": "הסיסמה אופסה בהצלחה!",
      "redirectingToLogin": "מפנה להתחברות...",
      "sendAnotherEmail": "שלח אימייל נוסף",
      "developmentMode": "מצב פיתוח",
      "emailSentDevDesc": "אימייל נשלח דרך Gmail SMTP! בדוק את הקונסולה לקישור בדיקה נוסף.",
      "sendTestEmail": "שלח אימייל בדיקה (פיתוח)",
      "noAccount": "אין לך חשבון?",
      "alreadyHaveAccount": "כבר יש לך חשבון?",
      "signUpNow": "הירשם עכשיו",
      "signInNow": "התחבר עכשיו",
      "invalidCredentials": "דואר אלקטרוני או סיסמה שגויים",
      "welcomeTitle": "ברוך הבא לSmart Finance",
      "welcomeDescription": "השתלט על עתידך הפיננסי עם מעקב הוצאות חכם",
      "loginSuccess": "התחברות הצליחה",
      "logoutSuccess": "התנתקת בהצלחה",
      "passwordChanged": "הסיסמה שונתה בהצלחה",
      "resetTokenInvalid": "טוקן איפוס לא תקין או חסר",
      "resetTokenExpired": "טוקן האיפוס פג",
      "benefit1": "אבטחה ברמת בנק",
      "benefit2": "ניתוח בזמן אמת",
      "benefit3": "תובנות חכמות",
      "activeUsers": "משתמשים פעילים",
      "savedMoney": "חסך",
      "rating": "דירוג",
      "passwordLength": "לפחות 8 תווים",
      "passwordNumber": "מכיל מספר",
      "passwordUpper": "מכיל אות גדולה",
      "passwordLower": "מכיל אות קטנה",
      "passwordSpecial": "מכיל תו מיוחד",
      "passwordStrength": "עוצמת סיסמה",
      "weak": "חלש",
      "fair": "בינוני",
      "good": "טוב",
      "strong": "חזק",
      "veryStrong": "חזק מאוד",
      "accountInfo": "פרטי חשבון",
      "security": "אבטחה",

      "features": {
        "title": "ניהול כספי חכם",
        "subtitle": "חווה את עתיד הכספים האישיים",
        "secure": "בטוח ופרטי",
        "secureDesc": "הנתונים שלך מוצפנים ומוגנים",
        "fast": "מהיר כברק",
        "fastDesc": "עדכונים ומעקב בזמן אמת",
        "smart": "ניתוח חכם",
        "smartDesc": "תובנות חכמות להחלטות טובות יותר"
      },
  
      "emailNotVerifiedModalTitle": "דואר אלקטרוני לא מאומת",
      "emailNotVerifiedModalMessage": "עדיין לא אימתת את כתובת הדואר האלקטרוני שלך.",
      "checkEmailSpamMessage": "אנא בדוק את תיבת הדואר ותיקיית הספאם שלך. לפעמים אימיילי אימות מגיעים לשם.",
      "resendVerificationSuccess": "אימייל אימות נשלח בהצלחה!",
      "checkEmailAgainMessage": "אנא בדוק שוב את תיבת הדואר שלך (כולל תיקיית הספאם)",
      "stillNoEmailMessage": "עדיין לא רואה את האימייל?",
      "clickToResendMessage": "לחץ כאן לשליחה מחדש",
      "stepAccountInfo": "פרטי חשבון",
      "stepSecurity": "אבטחה"
    },

    "dashboard": {
      "title": "דשבורד",
      "subtitle": "סקירה כללית של הכספים שלך",
      "welcomeMessage": "ברוך שובך, {{name}}!",
      "overviewPeriod": "סקירה עבור {{period}}",

      "greeting": {
        "morning": "בוקר טוב",
        "afternoon": "צהריים טובים",
        "evening": "ערב טוב",
        "night": "לילה טוב"
      },

      "balance": {
        "title": "סקירת יתרה",
        "subtitle": "עקוב אחר הזרם הפיננסי שלך",
        "income": "הכנסות",
        "expenses": "הוצאות",
        "total": "יתרה נטו",
        "error": "לא ניתן לטעון נתוני יתרה",
        "backToToday": "חזור להיום",
        "tooltip": "לחץ על הלוח שנה כדי לקפוץ לכל תאריך",
        "trending": "מגמה",
        "spent": "הוצא",
        "positive": "עודף",
        "negative": "גירעון",

        "periods": {
          "daily": "יומי",
          "weekly": "שבועי",
          "monthly": "חודשי",
          "yearly": "שנתי"
        }
      },

      "transactions": {
        "recent": "עסקאות אחרונות",
        "latestActivity": "פעילות אחרונה",
        "viewAll": "צפה בהכל",
        "noTransactions": "אין עסקאות עדיין",
        "noTransactionsDesc": "התחל לעקוב אחר הכספים שלך על ידי הוספת העסקה הראשונה שלך",
        "noMore": "אין עוד עסקאות",
        "fetchError": "לא ניתן לטעון עסקאות",
        "loading": "טוען עסקאות...",
        "error": "שגיאה בטעינת עסקאות"
      },

      "quickActions": {
        "title": "הוספה מהירה",
        "subtitle": "הזנת עסקאות מהירה",
        "fast": "הזנה מהירה",
        "smart": "חכם",
        "placeholder": "הזן סכום",
        "amount": "סכום",
        "addExpense": "הוסף הוצאה",
        "addIncome": "הוסף הכנסה",
        "defaultDescription": "עסקה מהירה",
        "added": "נוסף!",
        "advanced": "פעולות מתקדמות",
        "todayWarning": "העסקה תתווסף להיום, לא לתאריך המוצג",
        "switchToToday": "עסקה נוספה! לעבור לתצוגת היום כדי לראות אותה?",
        "hint": "השתמש בפעולות מהירות להזנת עסקאות מהירה",
        "quickExpense": "הוצאה מהירה",
        "quickIncome": "הכנסה מהירה",
        "quickRecurring": "חוזר מהיר",
        "historicalDateWarning": "מוסיף לתאריך היסטורי",
        "goToToday": "היום",
        "notToday": "מצב תאריך היסטורי"
      },

      "stats": {
        "title": "סטטיסטיקות",
        "subtitle": "תובנות עסקאות",
        "showMore": "הצג יותר",
        "showLess": "הצג פחות",
        "savingsRate": "שיעור חיסכון",
        "dailyAvg": "ממוצע יומי",
        "budget": "תקציב",
        "health": "בריאות",
        "excellent": "מעולה",
        "good": "טוב",
        "improve": "שפר",
        "spendingPerDay": "הוצאה/יום",
        "onTrack": "על המסלול",
        "review": "בדוק",
        "great": "נהדר",
        "ok": "בסדר",
        "poor": "גרוע",
        "incomeVsExpenses": "פילוח הכנסות מול הוצאות",
        "detailedInsights": "תובנות מפורטות",
        "averageTransaction": "עסקה ממוצעת",
        "totalTransactions": "{count} סך עסקאות",
        "recurringImpact": "השפעה חוזרת",
        "monthlyRecurringBalance": "יתרה חוזרת חודשית",
        "largestTransaction": "עסקה הגדולה ביותר",
        "singleTransaction": "עסקה בודדת",
        "topCategory": "קטגוריה מובילה",
        "mostUsedCategory": "קטגוריה הכי בשימוש",
        "balanceTrend": "מגמת יתרה",
        "currentPeriodTrend": "מגמת התקופה הנוכחית",
        "noData": "אין נתונים עבור תקופה זו",
        "income": "הכנסות",
        "expenses": "הוצאות",
        "ofTotal": "מהכולל",
        "error": "שגיאה בטעינת סטטיסטיקות",
        "noTrendData": "אין נתוני מגמה זמינים",
        "financialHealthScore": "ציון בריאות פיננסית",
        "dailyBurn": "צריכה יומית",
        "frequency": "תדירות",
        "volatility": "תנודתיות",
        "high": "גבוה",
        "medium": "בינוני",
        "low": "נמוך",
        "transactionsPerDay": "עסקאות/יום",
        "perDaySpending": "הוצאה ליום",
        "balanceTrends": "מגמות יתרה",
        "smartInsights": "תובנות חכמות",
        "fair": "בינוני",
        "insights": "תובנות",
        "excellentSavingsRate": "שיעור חיסכון מעולה",
        "goodSavingsRate": "שיעור חיסכון טוב",
        "lowSavingsRate": "שיעור חיסכון נמוך",
        "spendingExceedsIncome": "ההוצאות עולות על ההכנסות בתקופה זו",
        "healthyExpenseRatio": "יחס בריא בין הוצאות להכנסות",
        "highExpenseRatio": "יחס גבוה בין הוצאות להכנסות",
        "strongRecurringIncome": "בסיס הכנסות חוזרות חזק",
        "moderateRecurringIncome": "יציבות הכנסות חוזרות בינונית",
        "limitedRecurringIncome": "יציבות הכנסות חוזרות מוגבלת",
        "consistentSpending": "דפוסי הוצאה עקביים",
        "irregularSpending": "זוהו דפוסי הוצאה לא סדירים",
        "positiveBalance": "יתרה חיובית עבור תקופה זו",
        "negativeBalance": "יתרה שלילית עבור תקופה זו",
        "criticalImpact": "השפעה קריטית",
        "highImpact": "השפעה גבוהה",
        "mediumImpact": "השפעה בינונית",
        "lowImpact": "השפעה נמוכה",
        "recommendations": "המלצות",
        "increaseSavingsRate": "הגדל שיעור חיסכון",
        "currentSavingsRateAim": "שיעור החיסכון הנוכחי הוא {{rate}}%. שאף לפחות 10-20%.",
        "reviewExpenses": "בדוק הוצאות וזהה תחומים לחיתוך הוצאות",
        "stabilizeSpending": "ייצב הוצאות",
        "highSpendingVolatility": "זוהתה תנודתיות הוצאות גבוהה. הוצאות עקביות יותר עוזרות לתקציב.",
        "createBudget": "צור תקציב חודשי ועקוב אחר קטגוריות הוצאות",
        "buildRecurringIncome": "בנה הכנסות חוזרות",
        "onlyRecurringIncome": "רק {{percent}}% מההכנסות חוזרות. הכנסות צפויות יותר משפרות יציבות פיננסית.",
        "considerRecurringIncome": "שקול מנויים, משכורות קבועות או מקורות הכנסה פסיביים",
        "highBurnRate": "קצב צריכה גבוה",
        "dailySpendingHigh": "קצב ההוצאה היומית גבוה יחסית להכנסה.",
        "reduceExpenses": "בדוק והפחת הוצאות יומיומיות לא חיוניות",
        "highPriority": "גבוה",
        "mediumPriority": "בינוני",
        "pieChart": "עוגה",
        "barsChart": "עמודות",

        "trend": {
          "positive": "חיובי",
          "negative": "שלילי",
          "stable": "יציב"
        }
      },

      "tips": {
        "title": "טיפ פיננסי",
        "content": "עקוב אחר ההוצאות היומיות שלך כדי לזהות דפוסי הוצאה והזדמנויות חיסכון פוטנציאליות.",
        "nextTip": "טיפ הבא",
        "previousTip": "טיפ קודם"
      }
    },

    "transactions": {
      "title": "עסקאות",
      "subtitle": "נהל את כל ההכנסות וההוצאות שלך",
      "description": "צפה ונהל את כל העסקאות שלך",
      "all": "הכל",
      "income": "הכנסות",
      "expense": "הוצאות",
      "searchPlaceholder": "חפש עסקאות...",
      "noTransactions": "אין עסקאות עדיין",
      "smartActions": "פעולות חכמות",
      "total": "סך העסקאות עבור התקופה",
      "editTemplate": "ערוך תבנית",
      "editAll": "ערוך הכל עתידי",
      "editOnce": "ערוך מופע זה",
      "totalAmount": "סכום כולל",
      "templateActions": "פעולות תבנית",
      "recurringActions": "פעולות חוזרות",
      "editActions": "פעולות עריכה",
      "skipNextTooltip": "דלג על המופע הבא המתוכנן של עסקה זו",
      "pauseTooltip": "השהה תבנית זו - לא ייווצרו עסקאות חדשות",
      "resumeTooltip": "חדש תבנית זו - עסקאות ייווצרו שוב",
      "manageRecurringTooltip": "פתח את מנהל העסקאות החוזרות",
      "editSingleTooltip": "ערוך רק את המופע הזה, השאר את התבנית ללא שינוי",
      "editTemplateTooltip": "ערוך את התבנית - משפיע על כל העסקאות העתידיות",
      "editAllTooltip": "ערוך את זה ואת כל המופעים העתידיים",
      "editTooltip": "ערוך עסקה זו",
      "deleteTemplateTooltip": "מחק תבנית זו ובאופציה את כל העסקאות הקשורות",
      "deleteRecurringTooltip": "מחק עסקה זו או את כל הסדרה החוזרת",
      "deleteTooltip": "מחק עסקה זו",
      "nextOccurrenceNote": "מתי עסקה זו תתרחש הבא",
      "frequencyNote": "כמה פעמים עסקה זו חוזרת",
      "templateActiveTitle": "התבנית פעילה",
      "templateActiveDescription": "עסקאות חדשות נוצרות אוטומטית",
      "templatePausedTitle": "התבנית מושהית",
      "templatePausedDescription": "לא ייווצרו עסקאות חדשות",
      "totalGenerated": "סך נוצר",
      "recurringTransactionInfo": "אודות עסקאות חוזרות",
      "recurringDescription": "עסקה זו נוצרה מתבנית חוזרת. אתה יכול:",
      "editOnceDescription": "שנה רק את העסקה הזו",
      "editAllDescription": "שנה את התבנית ואת כל העסקאות העתידיות",
      "scheduleManagement": "ניהול לוח זמנים",
      "templateManagement": "ניהול תבנית",
      "skipSpecificDates": "דלג על תאריכים ספציפיים",
      "pauseTemplate": "השהה תבנית",
      "resumeTemplate": "חדש תבנית",
      "scheduleActiveDescription": "התבנית יוצרת עסקאות חדשות לפי לוח הזמנים",
      "schedulePausedDescription": "התבנית מושהית - לא נוצרות עסקאות חדשות",
      "templateManagementDescription": "ערוך או מחק את כל התבנית הזו",
      "chooseDeleteOption": "בחר אפשרות מחיקה",
      "searchTemplates": "חפש תבניות",
      "type": "סוג",
      "upcomingTransactions": "עסקאות קרובות",
      "templates": "תבניות",
      "scheduledTransactions": "עסקאות מתוכננות",
      "automated": "אוטומטי",
      "editThis": "ערוך",
      "quickActions": "פעולות מהירות",
      "noRecurringTemplates": "לא נמצאו תבניות חוזרות",
      "editTransactionDesc": "ערוך עסקה זו כדי לשנות את הפרטים שלה",
      "editTransactionTooltip": "ערוך פרטי עסקה",
      "editThisOnlyTooltip": "ערוך רק את המופע הזה מבלי להשפיע על עסקאות עתידיות",
      "resumeDesc": "חדש עסקה חוזרת זו",
      "skipOnceDesc": "דלג על המופע הבא של עסקה חוזרת זו",
      "skipOnceTooltip": "דלג על התשלום הבא בלבד",
      "deleteSeriesDesc": "מחק את כל סדרת העסקאות החוזרות הזו",
      "deleteSeriesTooltip": "מחק את כל הסדרה החוזרת",
      "deleteTransactionTooltip": "מחק עסקה",
      "toggleTemplateError": "נכשל להחליף מצב תבנית",
      "orphaned": "התבנית נמחקה",
      "transactionDetails": "פרטי עסקה",
      "untitledTemplate": "תבנית ללא שם",
      "activeOnly": "פעילות",
      "pausedOnly": "מושהות",
      "loadingTemplates": "טוען תבניות...",
      "noMatchingTemplates": "אין תבניות תואמות",
      "createRecurringNote": "צור תבניות חוזרות כדי להפוך את העסקאות שלך לאוטומטיות",
      "generateError": "נכשל ליצור עסקאות חוזרות",
      "templateDeleteFailed": "נכשל למחוק תבנית",
      "skipSelected": "דלג על נבחרים",

      "skipDates": {
        "title": "דלג על תאריכים",
        "description": "בחר תאריכים לדילוג"
      },

      // Missing transaction keys - ADD TO MATCH ENGLISH
      "updateSuccess": "עסקה עודכנה בהצלחה",
      "transactionUpdated": "עסקה עודכנה",
      "noTransactionsDesc": "התחל לעקוב אחר הכספים שלך על ידי הוספת העסקה הראשונה שלך",
      "scheduled": "מתוכננות",
      "transactions": "עסקאות",
      "editSeries": "ערוך סדרה",
      "editSeriesDesc": "ערוך את זה ואת כל העסקאות העתידיות",
      "pause": "השהה",
      "pauseDesc": "השהה עסקאות חוזרות",
      "resume": "חדש",
      "skipOnce": "דלג פעם אחת",
      "deleteSeries": "מחק סדרה",
      "deleteTransactionDesc": "מחק עסקה זו",
      "paused": "מושהית",
      "updating": "מעדכן...",
      "deleting": "מוחק...",
      "skipping": "מדלג...",
      "generate": "צור",
      "editTemplateDesc": "ערוך תבנית זו",
      "skipNext": "דלג הבא",
      "skipNextDesc": "דלג על המופע הבא",
      "manageDates": "נהל תאריכים",
      "manageDatesDesc": "נהל תאריכים חוזרים",
      "deleteTemplate": "מחק תבנית",
      "editTransaction": "ערוך עסקה",
      "saveTransaction": "שמור עסקה",
      "editSingleOccurrence": "ערוך מופע יחיד",
      "editSingleDesc": "ערוך רק את המופע הזה",
      "saveSingle": "שמור יחיד",
      "editAllFuture": "ערוך את כל העתידיים",
      "saveSeries": "שמור סדרה",
      "saveTemplate": "שמור תבנית",
      "recurring": "חוזר",
      "oneTime": "חד פעמי",
      "singleEdit": "עריכה יחידה",
      "seriesEdit": "עריכת סדרה",
      "template": "תבנית",
      "editingTransaction": "עורך עסקה",
      "editingSingleOccurrence": "עורך מופע יחיד",
      "editingAllFuture": "עורך את כל העתידיים",
      "editingTemplate": "עורך תבנית",
      "oneTimeEditExplanation": "ערוך עסקה יחידה זו",
      "singleEditExplanation": "ערוך רק את המופע הזה מבלי להשפיע על עסקאות עתידיות",
      "seriesEditExplanation": "ערוך את זה ואת כל העסקאות העתידיות בסדרה",
      "templateEditExplanation": "ערוך את התבנית שיוצרת את העסקאות האלה",
      "descriptionOptional": "תיאור (אופציונלי)",
      "noDescription": "אין תיאור",
      "deleteError": "נכשל למחוק עסקה",
      "deleteConfirm": "אשר מחיקה",
      "deleteConfirmDesc": "האם אתה בטוח שברצונך למחוק עסקה זו?",

      "skipError": {
        "general": "נכשל לדלג על עסקה"
      },

      "delete": {
        "deleteOnce": "מחק פעם אחת",
        "skipDates": "דלג על תאריכים",
        "manageDates": "נהל תאריכים",
        "skipDescription": "דלג על תאריכים ספציפיים במקום למחוק",
        "stopRecurring": "הפסק חזרה",
        "deleteAll": "מחק הכל",
        "allDescription": "מחק את כל הסדרה החוזרת",
        "recurringInfo": "זוהי עסקה חוזרת",
        "cannotUndo": "לא ניתן לבטל פעולה זו",
        "skipModalInfo": "אתה יכול לדלג על תאריכים ספציפיים במקום",
        "allWarning": "זה ימחק את כל העסקאות בסדרה זו",
        "openSkipModal": "פתח מודל דילוג"
      },

      "deleteMessages": {
        "permanentDelete": "מחיקה קבועה",
        "permanentStop": "הפסקה קבועה של חזרה",
        "finalConfirmation": "נדרש אישור סופי",
        "summaryOfChanges": "סיכום השינויים",
        "deleteItem": "מחק פריט",
        "cancelFutureOccurrences": "בטל מופעים עתידיים",
        "summaryDeleteAll": "סיכום: מחק הכל",
        "thisActionCannotBeUndone": "לא ניתן לבטל פעולה זו",
        "confirmDeletion": "אשר מחיקה"
      },

      "deleteOptions": {
        "single": {
          "description": "מחק רק את העסקה הזו"
        },
        "future": {
          "description": "מחק את זה ואת כל העסקאות העתידיות"
        }
      }
    },

    "transactionDetails": "פרטי עסקה",

    "transactionCard": {
      "editButton": "ערוך עסקה",
      "deleteButton": "מחק עסקה",
      "nextOccurrence": "מופע הבא",
      "frequency": "תדירות",
      "dailyEquivalent": "שווי יומי",
      "startDate": "תאריך התחלה",
      "noScheduled": "לא מתוכנן",
      "hideDetails": "הסתר פרטים",
      "showDetails": "הצג פרטים",
      "recurringInfo": "עסקה חוזרת",
      "recurringNote": "{{type}} זה חוזר אוטומטית. שינויים עשויים להשפיע על מופעים עתידיים."
    },

    "actions": {
      "title": "הוסף עסקה",
      "buttontitle": "הוסף עסקה חדשה",
      "detailedTransaction": "עסקה מפורטת",
      "chooseAction": "בחר את הפעולה שלך למטה",
      "selectType": "בחר סוג עסקה",
      "smart": "חכם",
      "oneClick": "הוספה בקליק אחד",
      "smartDefaults": "ברירות מחדל חכמות",
      "customize": "התאמה אישית מלאה",
      "quickActions": "פעולות מהירות",
      "allOptions": "כל אפשרויות העסקה",
      "directEntry": "הזנה ישירה",
      "fullCustomization": "התאמה אישית מלאה",
      "transactionAdded": "העסקה שלך נוספה בהצלחה!",
      "quickExpense": "הוצאה מהירה",
      "quickExpenseDesc": "הוסף הוצאה של ₪100 מיידית",
      "quickIncome": "הכנסה מהירה",
      "quickIncomeDesc": "הוסף הכנסה של ₪1000 מיידית",
      "quickRecurring": "חוזר מהיר",
      "quickRecurringDesc": "הוסף הוצאה חוזרת חודשית",
      "quickAdd": "הוסף עסקה מהירה",
      "oneTimeExpense": "הוצאה חד פעמית",
      "oneTimeExpenseDesc": "הוסף עסקת הוצאה בודדת",
      "recurringExpense": "הוצאה חוזרת",
      "recurringExpenseDesc": "הגדר הוצאה חוזרת",
      "recurringSetup": "הגדרה חוזרת",
      "recurringSetupDesc": "הגדר עסקאות אוטומטיות",
      "oneTimeIncome": "הכנסה חד פעמית",
      "oneTimeIncomeDesc": "הוסף עסקת הכנסה בודדת",
      "recurringIncome": "הכנסה חוזרת",
      "recurringIncomeDesc": "הגדר הכנסה חוזרת",
      "defaultExpense": "הוצאה מהירה",
      "defaultIncome": "הכנסה מהירה",
      "defaultRecurringExpense": "הוצאה חוזרת חודשית",
      "defaultRecurringIncome": "הכנסה חוזרת חודשית",
      "fillDetails": "מלא פרטי עסקה",
      "amount": "סכום",
      "description": "תיאור",
      "descriptionPlaceholder": "הזן תיאור...",
      "selectCategory": "בחר קטגוריה",
      "category": "קטגוריה",
      "date": "תאריך",
      "frequency": "תדירות",
      "endDate": "תאריך סיום (אופציונלי)",
      "recurringOptions": "אפשרויות חזרה",
      "recurring": "חוזר",
      "oneTime": "חד פעמי",
      "dayOfWeek": "יום בשבוע",
      "example": "דוגמה",
      "examples": "דוגמאות",
      "expenseExample": "למשל, מכולת, דלק, קניות",
      "recurringExpenseExample": "למשל, דירה, ביטוח, מנוי",
      "incomeExample": "למשל, משכורת, בונוס, מתנה",
      "recurringIncomeExample": "למשל, משכורת, דיבידנד, הכנסה משכירות",

      "examplePlaceholders": {
        "coffee": "קפה עם חברים",
        "lunch": "ארוחת צהריים במסעדה",
        "salary": "משכורת חודשית",
        "rent": "תשלום דירה חודשי"
      },

      "add": "הוסף עסקה",
      "addIncome": "הוסף הכנסה",
      "addExpense": "הוסף הוצאה",
      "success": "הצלחה!",
      "added": "נוסף!",
      "create": "צור",
      "update": "עדכן",
      "save": "שמור",
      "cancel": "בטל",
      "creating": "יוצר...",
      "adding": "מוסיף...",
      "updating": "מעדכן...",
      "addSuccess": "עסקה נוספה בהצלחה",
      "updateSuccess": "עודכן בהצלחה",
      "historicalDateWarning": "מוסיף עסקה לתאריך היסטורי",
      "goToToday": "עבור להיום",

      "frequencies": {
        "daily": "יומי",
        "weekly": "שבועי",
        "monthly": "חודשי",
        "yearly": "שנתי",
        "oneTime": "חד פעמי"
      },

      "errors": {
        "addingTransaction": "שגיאה בהוספת עסקה",
        "invalidAmount": "אנא הזן סכום תקין",
        "invalidDate": "אנא הזן תאריך תקין",
        "descriptionRequired": "תיאור נדרש",
        "categoryRequired": "אנא בחר קטגוריה",
        "formErrors": "אנא תקן את השגיאות בטופס",
        "general": "אירעה שגיאה. אנא נסה שוב.",
        "updatingTransaction": "נכשל לעדכן עסקה",
        "amountRequired": "סכום נדרש"
      },

      "new": "חדש",
      "e.g., Salary, Bonus, Gift": "למשל, משכורת, בונוס, מתנה",
      "e.g., Salary, Dividend, Rental Income": "למשל, משכורת, דיבידנד, הכנסה משכירות",
      "e.g., Groceries, Gas, Shopping": "למשל, מכולת, דלק, קניות",
      "e.g., Rent, Insurance, Subscription": "למשל, דירה, ביטוח, מנוי",
      "expense": "הוצאה",
      "willUseDefault": "ישתמש בקטגוריית ברירת מחדל",
      "defaultToday": "ברירת מחדל להיום",
      "monthlyIncome": "הכנסה חודשית",
      "income": "הכנסה",
      "monthlyExpense": "הוצאה חודשית",
      "willUseFirstCategory": "ישתמש בקטגוריה הראשונה",
      "automaticPayments": "תשלומים אוטומטיים",
      "createRecurring": "צור חוזר",
      "amountRequired": "סכום נדרש!",
      "dayOfMonth": "יום בחודש",
      "dayOfMonthNote": "בחר יום בחודש (1-31)",
      "autoClosing": "סגירה אוטומטית",

      // Missing keys from English transactions  
      "transactionUpdated": "עסקה עודכנה",
      "transactions": "עסקאות",
      "noTransactionsDesc": "התחל לעקוב אחר הכספים שלך על ידי הוספת העסקה הראשונה שלך",
      "noMore": "אין עוד עסקאות",
      "fetchError": "לא ניתן לטעון עסקאות",
      "error": "שגיאה בטעינת עסקאות",
      "recent": "עסקאות אחרונות",
      "latestActivity": "פעילות אחרונה",
      "viewAll": "צפה בהכל",
      "loading": "טוען עסקאות...",
      "scheduled": "מתוכננות",
      "editSeries": "ערוך סדרה",
      "editSeriesDesc": "ערוך את זה ואת כל העסקאות העתידיות",
      "pause": "השהה",
      "pauseDesc": "השהה עסקאות חוזרות",
      "resume": "חדש",
      "skipOnce": "דלג פעם אחת",
      "deleteSeries": "מחק סדרה",
      "deleteTransactionDesc": "מחק עסקה זו",
      "paused": "מושהית",
      "deleting": "מוחק...",
      "skipping": "מדלג...",
      "generate": "צור",
      "editTemplateDesc": "ערוך תבנית זו",
      "skipNext": "דלג הבא",
      "skipNextDesc": "דלג על המופע הבא",
      "manageDates": "נהל תאריכים",
      "manageDatesDesc": "נהל תאריכים חוזרים",
      "deleteTemplate": "מחק תבנית",
      "editTransaction": "ערוך עסקה",
      "saveTransaction": "שמור עסקה",
      "editSingleOccurrence": "ערוך מופע יחיד",
      "editSingleDesc": "ערוך רק את המופע הזה",
      "saveSingle": "שמור יחיד",
      "editAllFuture": "ערוך את כל העתידיים",
      "saveSeries": "שמור סדרה",
      "saveTemplate": "שמור תבנית",
      "singleEdit": "עריכה יחידה",
      "seriesEdit": "עריכת סדרה",
      "template": "תבנית",
      "editingTransaction": "עורך עסקה",
      "editingSingleOccurrence": "עורך מופע יחיד",
      "editingAllFuture": "עורך את כל העתידיים",
      "editingTemplate": "עורך תבנית",
      "oneTimeEditExplanation": "ערוך עסקה יחידה זו",
      "singleEditExplanation": "ערוך רק את המופע הזה מבלי להשפיע על עסקאות עתידיות",
      "seriesEditExplanation": "ערוך את זה ואת כל העסקאות העתידיות בסדרה",
      "templateEditExplanation": "ערוך את התבנית שיוצרת את העסקאות האלה",
      "descriptionOptional": "תיאור (אופציונלי)",
      "noDescription": "אין תיאור",
      "deleteError": "נכשל למחוק עסקה",
      "deleteConfirm": "אשר מחיקה",
      "deleteConfirmDesc": "האם אתה בטוח שברצונך למחוק עסקה זו?",

      "skipError": {
        "general": "נכשל לדלג על עסקה"
      },

      "delete": {
        "deleteOnce": "מחק פעם אחת",
        "skipDates": "דלג על תאריכים",
        "manageDates": "נהל תאריכים",
        "skipDescription": "דלג על תאריכים ספציפיים במקום למחוק",
        "stopRecurring": "הפסק חזרה",
        "deleteAll": "מחק הכל",
        "allDescription": "מחק את כל הסדרה החוזרת",
        "recurringInfo": "זוהי עסקה חוזרת",
        "cannotUndo": "לא ניתן לבטל פעולה זו",
        "skipModalInfo": "אתה יכול לדלג על תאריכים ספציפיים במקום",
        "allWarning": "זה ימחק את כל העסקאות בסדרה זו",
        "openSkipModal": "פתח מודל דילוג"
      },

      "deleteMessages": {
        "permanentDelete": "מחיקה קבועה",
        "permanentStop": "הפסקה קבועה של חזרה",
        "finalConfirmation": "נדרש אישור סופי",
        "summaryOfChanges": "סיכום השינויים",
        "deleteItem": "מחק פריט",
        "cancelFutureOccurrences": "בטל מופעים עתידיים",
        "summaryDeleteAll": "סיכום: מחק הכל",
        "thisActionCannotBeUndone": "לא ניתן לבטל פעולה זו",
        "confirmDeletion": "אשר מחיקה"
      },

      "deleteOptions": {
        "single": {
          "description": "מחק רק את העסקה הזו"
        },
        "future": {
          "description": "מחק את זה ואת כל העסקאות העתידיות"
        }
      }
    },

    "categories": {
      "title": "קטגוריות",
      "manage": "נהל קטגוריות",
      "manager": "מנהל קטגוריות",
      "manageCategories": "נהל קטגוריות",
      "wizardSubtitle": "ארגן את הכספים שלך כמו קוסם",
      "addNew": "הוסף קטגוריה",
      "create": "צור קטגוריה",
      "createFirst": "צור קטגוריה ראשונה",
      "edit": "ערוך קטגוריה",
      "delete": "מחק קטגוריה",
      "deleteConfirm": "האם אתה בטוח שברצונך למחוק קטגוריה זו?",
      "name": "שם קטגוריה",
      "nameRequired": "שם קטגוריה נדרש",
      "description": "תיאור",
      "descriptionPlaceholder": "תיאור קטגוריה אופציונלי",
      "type": "סוג",
      "icon": "אייקון",
      "userCategories": "הקטגוריות שלי",
      "userCategoriesDesc": "הקטגוריות האישיות שלך",
      "defaultCategories": "קטגוריות ברירת מחדל",
      "defaultCategoriesDesc": "קטגוריות מערכת מובנות",
      "noUserCategories": "עדיין לא יצרת קטגוריות",
      "noUserCategoriesDesc": "צור קטגוריות מותאמות אישית כדי לארגן את הכספים שלך",
      "default": "ברירת מחדל",
      "selectCategory": "בחר קטגוריה",
      "selectCategoryHint": "אנא בחר קטגוריה עבור העסקה",
      "noCategoriesFound": "לא נמצאו קטגוריות",
      "createCategoriesFirst": "צור קטגוריות חדשות תחילה",
      "searchPlaceholder": "חפש קטגוריות...",
      "created": "קטגוריה נוצרה בהצלחה",
      "updated": "קטגוריה עודכנה בהצלחה",
      "deleted": "קטגוריה נמחקה בהצלחה",
      "saveFailed": "נכשל לשמור קטגוריה",
      "deleteFailed": "נכשל למחוק קטגוריה",
      "errorLoading": "שגיאה בטעינת קטגוריות",
      "errorGeneric": "אירעה שגיאה בעת טיפול בקטגוריות",
      "loading": "טוען קטגוריות...",
      "noResults": "לא נמצאו תוצאות",
      "noCategories": "לא נמצאו קטגוריות",
      "tryDifferentSearch": "נסה חיפוש אחר",
      "createFirstCategory": "צור את הקטגוריה הראשונה שלך",
      "namePlaceholder": "הזן שם קטגוריה",
      "required": "נדרש",
      "searchCategories": "חפש קטגוריות",
      "addCategory": "הוסף קטגוריה",
      "custom": "מותאם אישית",
      "noGeneralCategories": "אין קטגוריות כלליות זמינות",
      "defaultCategoriesWillAppear": "קטגוריות ברירת מחדל יופיעו כאן כשייטענו",
      "noCustomCategories": "אין קטגוריות מותאמות אישית זמינות",
      "createCategoriesInSettings": "צור קטגוריות מותאמות אישית בהגדרות",

      "filter": {
        "all": "הכל",
        "income": "הכנסות",
        "expense": "הוצאות"
      },

      "stats": {
        "total": "סך קטגוריות",
        "personal": "קטגוריות אישיות",
        "default": "ברירת מחדל"
      },

      "themes": {
        "dailyExpenses": "הוצאות יומיות",
        "billsAndUtilities": "חשבונות ושירותים",
        "lifestyle": "אורח חיים",
        "professional": "מקצועי",
        "workIncome": "הכנסות עבודה",
        "investments": "השקעות",
        "otherIncome": "הכנסה אחרת",
        "other": "אחר"
      },

      "General": "כללי",
      "Salary": "משכורת",
      "Freelance": "עבודה עצמאית",
      "Business Income": "הכנסה עסקית",
      "Investments": "השקעות",
      "Side Hustle": "עבודה צדדית",
      "Bonus": "בונוס",
      "Gift": "מתנה",
      "Rent": "דירה",
      "Groceries": "מכולת",
      "Utilities": "חשבונות",
      "Phone Bill": "חשבון טלפון",
      "Insurance": "ביטוח",
      "Transportation": "תחבורה",
      "Car Payment": "תשלום רכב",
      "Public Transport": "תחבורה ציבורית",
      "Food": "אוכל",
      "Dining Out": "אוכל בחוץ",
      "Coffee & Drinks": "קפה ומשקאות",
      "Entertainment": "בידור",
      "Streaming Services": "שירותי סטרימינג",
      "Movies": "סרטים",
      "Gaming": "גיימינג",
      "Shopping": "קניות",
      "Personal Care": "טיפוח אישי",
      "Clothing": "ביגוד",
      "Beauty": "יופי",
      "Health": "בריאות",
      "Medical": "רפואה",
      "Pharmacy": "בית מרקחת",
      "Fitness": "כושר",
      "Education": "חינוך",
      "Books": "ספרים",
      "Online Courses": "קורסים מקוונים",
      "Travel": "נסיעות",
      "Hotel": "מלון",
      "Flight": "טיסה",
      "Taxes": "מיסים",
      "Bank Fees": "עמלות בנק",
      "Credit Card": "כרטיס אשראי",
      "Savings": "חיסכון",
      "Other": "אחר",
      "Other Expense": "הוצאה אחרת",
      "Other Income": "הכנסה אחרת",
      "Bills & Utilities": "חשבונות ושירותים",
      "Business": "עסקים",
      "Food & Dining": "מזון ומסעדות",
      "Gifts & Donations": "מתנות ותרומות",
      "Healthcare": "בריאות",
      "Home & Garden": "בית וגינה",
      "Gifts": "מתנות",
      "Government": "ממשלה",
      "Investment": "השקעות",
      "Rental": "שכירות",
      "Quick Income": "הכנסה מהירה",
      "Quick Expense": "הוצאה מהירה"
    },

    "profile": {
      "title": "פרופיל",
      "personalInformation": "מידע אישי",
      "accountInformation": "פרטי חשבון",
      "profilePhoto": "תמונת פרופיל",
      "username": "שם משתמש",
      "email": "דואר אלקטרוני",
      "phone": "טלפון",
      "location": "מיקום",
      "website": "אתר אינטרנט",
      "bio": "אודות",
      "emailNotEditable": "לא ניתן לשנות דואר אלקטרוני",
      "changePassword": "שנה סיסמה",
      "currentPassword": "סיסמה נוכחית",
      "newPassword": "סיסמה חדשה",
      "confirmPassword": "אשר סיסמה חדשה",
      "changePhoto": "שנה תמונה",
      "uploadPhoto": "העלה תמונה",
      "photoHelper": "JPG, PNG או GIF. גודל מקסימלי 10MB",
      "uploading": "מעלה...",
      "photoUploaded": "תמונה הועלתה בהצלחה",
      "invalidImageType": "אנא בחר קובץ תמונה תקין (JPG, PNG, או GIF)",
      "imageTooLarge": "גודל התמונה חייב להיות פחות מ-10MB",
      "active": "פעיל",
      "subtitle": "נהל את פרטי החשבון וההעדפות שלך",
      "status": "סטטוס",
      "security": "אבטחה",
      "level": "רמה",
      "tier": "דרגה",
      "pro": "מקצועי",
      "premium": "פרימיום",
      "profileLastUpdate": "עדכון אחרון של הפרופיל",
      "unknown": "לא ידוע",
      "notUpdatedYet": "לא עודכן עדיין",
      "edit": "ערוך",
      "save": "שמור שינויים",
      "cancel": "בטל",
      "updateSuccess": "פרופיל עודכן בהצלחה",
      "updateError": "נכשל לעדכן פרופיל",
      "saveError": "נכשל לשמור שינויים",
      "accountInfo": "פרטי חשבון",
      "accountStatus": "סטטוס חשבון",
      "verified": "מאומת",
      "memberSince": "חבר מאז",
      "lastLogin": "התחברות אחרונה",

      "tabs": {
        "general": "כללי",
        "security": "אבטחה",
        "preferences": "העדפות",
        "billing": "חיוב",
        "notifications": "התראות",
        "privacy": "פרטיות"
      },

      "stats": {
        "totalTransactions": "סך עסקאות",
        "thisMonth": "החודש",
        "activeDays": "חבר זה",
        "successRate": "שיעור הצלחה",
        "days": "ימים",
        "months": "חודשים",
        "years": "שנים"
      },

      "quickActions": "פעולות מהירות",
      "exportData": "יצא נתונים",
      "notifications": "התראות",
      "comingSoon": "בקרוב",
      "logoutConfirm": "אשר התנתקות",
      "logoutConfirmDesc": "האם אתה בטוח שברצונך להתנתק?",
      "preferences": "העדפות",
      "appPreferences": "העדפות אפליקציה",
      "securitySettings": "הגדרות אבטחה",
      "billingSettings": "חיוב ומנוי",
      "language": "שפה",
      "currency": "מטבע",
      "theme": "ערכת נושא",
      "lightTheme": "בהיר",
      "darkTheme": "כהה",
      "systemTheme": "מערכת",
      "languageChanged": "שפה שונתה בהצלחה",
      "currencyChanged": "מטבע שונה בהצלחה",

      "budget": {
        "monthlyBudget": "תקציב חודשי",
        "enterAmount": "הזן סכום תקציב",
        "saving": "שומר..."
      },

      "templates": {
        "quickSetup": "הגדרה מהירה",
        "yourTemplates": "התבניות שלך",
        "setupComplete": "הגדרה הושלמה! {{count}} תבניות מוכנות",
        "setupOptional": "תבניות הן אופציונליות",
        "canAddMore": "אתה יכול להוסיף עוד תבניות בכל עת",
        "canSkipForNow": "אתה יכול לדלג על השלב הזה ולהוסיף תבניות מאוחר יותר",
        "carPayment": "תשלום רכב",
        "internet": "שירות אינטרנט"
      },

      "recurring": {
        "whatAre": {
          "title": "מה הן עסקאות חוזרות?",
          "description": "עסקאות חוזרות הן תשלומים או הכנסות שקורים אוטומטית לפי לוח זמנים קבוע. במקום להזין אותן ידנית בכל פעם, אתה מגדיר אותן פעם אחת ו-SpendWise מטפל בשאר."
        },

        "examples": {
          "title": "דוגמאות אמיתיות",
          "demo": "הפעל הדגמה",
          "salaryDesc": "ההכנסה החודשית שלך נרשמת אוטומטית",
          "rentDesc": "תשלום דיור חודשי שלא נשכח לעולם",
          "phoneDesc": "מנוי קבוע נרשם אוטומטית"
        },

        "benefits": {
          "title": "למה להשתמש בעסקאות חוזרות?",
          "timeTitle": "חוסך זמן",
          "timeDesc": "הגדר פעם אחת, עקוב אוטומטית תמיד",
          "insightsTitle": "תובנות טובות יותר",
          "insightsDesc": "ראה את דפוסי ההוצאות והמגמות האמיתיים שלך",
          "accuracyTitle": "הישאר מדויק",
          "accuracyDesc": "לא תשכח תשלומים קבועים יותר"
        },

        "cta": {
          "title": "מוכן להגדיר את העסקאות החוזרות הראשונות שלך?",
          "description": "בואו נוסיף עסקאות חוזרות נפוצות כדי להתחיל.",
          "button": "הגדר תבניות"
        }
      },
  
      "themeChanged": "ערכת נושא שונתה בהצלחה",
      "passwordChanged": "סיסמה שונתה בהצלחה",
      "incorrectPassword": "הסיסמה הנוכחית שגויה",
      "passwordChangeError": "נכשל לשנות סיסמה",
      "updatePassword": "עדכן סיסמה",
      "additionalSecurity": "אבטחה נוספת",
      "additionalSecurityDesc": "אימות דו-שלבי ותכונות אבטחה נוספות בקרוב",
      "customPreferences": "העדפות מותאמות אישית",
      "customPreferencesTitle": "נהל הגדרות מותאמות אישית",
      "addNewPreference": "הוסף העדפה חדשה",
      "preferenceKey": "שם הגדרה",
      "preferenceType": "סוג נתונים",
      "preferenceValue": "ערך",
      "addPreference": "הוסף הגדרה",
      "noCustomPreferences": "אין העדפות מותאמות אישית עדיין",
      "preferenceAdded": "העדפה נוספה בהצלחה",
      "preferenceRemoved": "העדפה הוסרה בהצלחה",
      "saveCustomPreferences": "שמור העדפות מותאמות אישית",
      "customPreferencesSaved": "העדפות מותאמות אישית נשמרו בהצלחה",
      "advancedPreferences": "העדפות מתקדמות",
      "preferencesEditor": "עורך העדפות",
      "preferencesEditorInfo": "ערוך את ההעדפות שלך כ-JSON. היזהר עם התחביר!",
      "rawPreferences": "העדפות JSON גולמיות",
      "preferencesUpdated": "העדפות עודכנו בהצלחה",
      "saveAllPreferences": "שמור את כל ההעדפות",
      "commonPreferences": "העדפות נפוצות",
      "notificationPreferences": "העדפות התראות",
      "privacyPreferences": "העדפות פרטיות",

      "notificationTypes": {
        "email": "התראות דואר אלקטרוני",
        "push": "התראות דחיפה",
        "sms": "התראות SMS",
        "recurring": "התראות עסקאות חוזרות",
        "reminders": "תזכורות תשלום"
      },

      "privacy": {
        "showProfile": "הצג פרופיל ציבורי",
        "showStats": "הצג סטטיסטיקות",
        "allowAnalytics": "אפשר אנליטיקה"
      },

      "typeString": "טקסט",
      "typeNumber": "מספר",
      "typeBoolean": "אמת/שקר",
      "typeJson": "אובייקט JSON",

      "placeholders": {
        "customKey": "myCustomSetting",
        "boolean": "true/false",
        "number": "123",
        "json": "{\"key\": \"value\"}",
        "string": "הערך שלי"
      },

      "export": {
        "selectFormat": "בחר פורמט",
        "csvDescription": "קובץ CSV (Excel/Google Sheets)",
        "jsonDescription": "קובץ JSON (לייבוא לאפליקציות אחרות)",
        "invalidFormat": "פורמט יצוא לא תקין נבחר",
        "formatUnavailable": "יצוא {format} אינו זמין",
        "preparing": "מכין יצוא {format}...",
        "processing": "מעבד את הייצוא שלך...",
        "progressStatus": "יצוא {format}: {progress}% הושלם",
        "title": "יצא את הנתונים שלך",
        "subtitle": "בחר את הפורמט המועדף עליך להורדה",
        "dataIncluded": "מה כלול בייצוא שלך",
        "loadingOptions": "טוען אפשרויות יצוא...",
        "formatsAvailable": "פורמטים זמינים",
        "csvFormat": "תואם ל-Excel, Google Sheets ויישומי גיליונות אלקטרוניים",
        "csvUseCase": "מושלם לניתוח נתונים, דיווחים ועיבוד נוסף",
        "jsonFormat": "פורמט קריא למכונה עם מבנה נתונים מלא ומטא-דאטה",
        "jsonUseCase": "אידיאלי למפתחים, מדעני נתונים ומשתמשים טכניים",
        "estimatedSize": "גודל",
        "instant": "הורדה מיידית",
        "security": "אבטחה ופרטיות",
        "httpsEncrypted": "מוצפן HTTPS",
        "notStored": "לא נשמר",
        "onDemand": "לפי דרישה בלבד",
        "userInfo": "יצוא עבור {username} • {currency} • {language}",
        "transactionsIncluded": "כל העסקאות (הכנסות והוצאות)",
        "categoriesIncluded": "קטגוריות ותיאורים",
        "summaryIncluded": "סיכום חשבון וסטטיסטיקות",
        "preferencesIncluded": "העדפות והגדרות משתמש"
      },

      "errors": {
        "usernameRequired": "שם משתמש נדרש",
        "usernameTooShort": "שם המשתמש חייב להיות לפחות 3 תווים",
        "emailRequired": "דואר אלקטרוני נדרש",
        "emailInvalid": "פורמט דואר אלקטרוני לא תקין",
        "keyRequired": "שם הגדרה נדרש",
        "keyExists": "שם הגדרה כבר קיים",
        "invalidJson": "פורמט JSON לא תקין",
        "invalidFileType": "אנא בחר קובץ תמונה",
        "fileTooLarge": "גודל הקובץ חייב להיות פחות מ-10MB",
        "uploadFailed": "נכשל להעלות תמונה"
      }
    },

    "stats": {
      "title": "סטטיסטיקות",
      "overview": "סקירה",
      "currentBalance": "יתרה נוכחית",
      "monthlyIncome": "הכנסות חודשיות",
      "monthlyExpenses": "הוצאות חודשיות",
      "totalTransactions": "סך עסקאות",
      "activeRecurring": "חוזרות פעילות",
      "quickOverview": "סקירה מהירה",
      "thisMonth": "החודש",
      "lastMonth": "החודש שעבר",
      "thisYear": "השנה",
      "allTime": "כל הזמן",
      "activeSubscriptions": "מנויים פעילים",
      "perMonth": "לחודש",
      "savingsRate": "שיעור חיסכון",
      "yearlyAverage": "ממוצע שנתי",
      "activityOverview": "סקירת פעילות",
      "dailyAverage": "ממוצע יומי",
      "perDay": "ליום",
      "trend": "מגמה",
      "categories": "קטגוריות",
      "topCategories": "קטגוריות מובילות",
      "noData": "אין נתונים זמינים",
      "noTrendData": "אין נתוני מגמה זמינים",
      "noCategoryData": "אין נתוני קטגוריות זמינים",
      "loadingStats": "טוען סטטיסטיקות..."
    },

    "forms": {
      "errors": {
        "required": "שדה זה נדרש",
        "invalidEmail": "כתובת דואר אלקטרוני לא תקינה",
        "invalidAmount": "סכום לא תקין",
        "invalidDate": "תאריך לא תקין",
        "passwordTooShort": "הסיסמה חייבת להיות לפחות 8 תווים",
        "passwordsDontMatch": "הסיסמאות אינן תואמות",
        "descriptionRequired": "תיאור נדרש",
        "endDateRequired": "תאריך סיום נדרש",
        "categoryRequired": "קטגוריה נדרשת",
        "usernameRequired": "שם משתמש נדרש",
        "emailRequired": "דואר אלקטרוני נדרש"
      },

      "placeholders": {
        "email": "your@email.com",
        "password": "••••••••",
        "amount": "0.00",
        "description": "הזן תיאור",
        "search": "חפש..."
      }
    },

    "validation": {
      "required": "שדה זה נדרש",
      "usernameRequired": "שם משתמש נדרש",
      "usernameTooShort": "שם המשתמש חייב להיות לפחות 3 תווים",
      "emailRequired": "דואר אלקטרוני נדרש",
      "emailInvalid": "פורמט דואר אלקטרוני לא תקין",
      "passwordRequired": "סיסמה נדרשת",
      "passwordTooShort": "הסיסמה חייבת להיות לפחות 8 תווים",
      "passwordNeedsNumber": "הסיסמה חייבת להכיל לפחות מספר אחד",
      "passwordNeedsUpper": "הסיסמה חייבת להכיל לפחות אות גדולה אחת",
      "passwordNeedsLower": "הסיסמה חייבת להכיל לפחות אות קטנה אחת",
      "passwordNeedsSpecial": "הסיסמה חייבת להכיל לפחות תו מיוחד אחד",
      "passwordsDontMatch": "הסיסמאות אינן תואמות",
      "agreeToTerms": "עליך להסכים לתנאים",
      "amountRequired": "סכום נדרש",
      "amountInvalid": "הסכום חייב להיות מספר תקין",
      "amountPositive": "הסכום חייב להיות גדול מ-0",
      "dateRequired": "תאריך נדרש",
      "dateInvalid": "פורמט תאריך לא תקין",
      "categoryRequired": "קטגוריה נדרשת"
    },

    "register": {
      "success": {
        "title": "הרשמה הצליחה!",
        "message": "הרשמה הושלמה בהצלחה! אנא התחבר כדי להמשיך."
      },

      "errors": {
        "registrationFailed": "הרשמה נכשלה. אנא נסה שוב.",
        "emailExists": "דואר אלקטרוני כבר קיים",
        "usernameExists": "שם משתמש כבר תפוס"
      }
    },

    "calendar": {
      "weekDays": ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
      "months": ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
      "monthsShort": ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'],
      "today": "היום",
      "previousMonth": "חודש קודם",
      "nextMonth": "חודש הבא",
      "selectDate": "בחר תאריך",
      "close": "סגור"
    },

    "accessibility": {
      "title": "נגישות",
      "menu": "תפריט נגישות",
      "openMenu": "פתח תפריט נגישות",
      "closeMenu": "סגור תפריט",
      "hide": "הסתר",
      "textSize": "גודל טקסט",
      "increaseFontSize": "הגדל טקסט",
      "decreaseFontSize": "הקטן טקסט",
      "highContrast": "ניגודיות גבוהה",
      "darkMode": "מצב כהה",
      "lightMode": "מצב בהיר",
      "resetSettings": "אפס הגדרות",
      "required": "נדרש",
      "compliance": "אתר זה עומד בתקנות נגישות בהתאם לתקן הישראלי (ת״י 5568).",
      "accessibilityStatement": "הצהרת נגישות",

      "statement": {
        "title": "הצהרת נגישות",
        "intro": "אתר SpendWise מחויב להנגיש את שירותיו לאנשים עם מוגבלויות, בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות (1998) ותקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות שירות), 2013.",
        "features": "תכונות נגישות באתר:",

        "featuresList": {
          "screenReader": "תאימות לקורא מסך",
          "colorContrast": "ניגודיות צבעים מתכווננת",
          "textSize": "התאמת גודל טקסט",
          "keyboardNav": "תמיכה בניווט במקלדת",
          "multiLanguage": "תמיכה בעברית ואנגלית"
        },
  
        "level": "רמת נגישות:",
        "levelDescription": "אתר זה עומד ברמת תאימות AA לפי הנחיות WCAG 2.1 ועומד בתקן הישראלי (ת״י 5568).",
        "contact": "יצירת קשר לבעיות נגישות:",
        "contactDescription": "אם נתקלת בבעיות נגישות או ברצונך לשלוח משוב לגבי נגישות באתר, אנא צור קשר עם רכז הנגישות שלנו:",
        "phone": "טלפון",
        "lastUpdated": "עודכן לאחרונה: 01/01/{{year}}",
        "close": "סגור"
      }
    },

    "privacy": {
      "title": "מדיניות פרטיות",
      "lastUpdated": "עודכן לאחרונה: {{date}}",

      "sections": {
        "intro": {
          "title": "הקדמה",
          "content": "SpendWise ('אנחנו', 'שלנו') מכבדת את פרטיותכם ומתחייבת להגן על המידע האישי שלכם בהתאם לחוקי פרטיות החלים ותקנות."
        },

        "dataCollection": {
          "title": "מידע שאנו אוספים",
          "content": "אנו אוספים מידע שאתם מספקים לנו ישירות (פרטי חשבון, נתונים פיננסיים) ומידע שנאסף אוטומטית דרך השימוש בשירות (נתוני שימוש, מידע על המכשיר)."
        },

        "dataUse": {
          "title": "איך אנו משתמשים במידע",
          "content": "המידע שלכם משמש לספק שירותי ניהול כספי, לשפר חוויית משתמש, להבטיח אבטחה ולעמוד בחובות חוקיות."
        },

        "dataProtection": {
          "title": "הגנת נתונים",
          "content": "אנו מיישמים אמצעי אבטחה מתאימים כולל הצפנה, שרתים מאובטחים וביקורות אבטחה קבועות כדי להגן על המידע האישי שלכם."
        },

        "userRights": {
          "title": "הזכויות שלכם",
          "content": "יש לכם זכות לגשת, לתקן, למחוק או לייצא את המידע האישי שלכם. צרו איתנו קשר לכל בקשה הקשורה למידע."
        },

        "contact": {
          "title": "צרו קשר",
          "content": "לשאלות הקשורות לפרטיות, צרו קשר: spendwise.verification@gmail.com"
        }
      }
    },

    "terms": {
      "title": "תנאי שירות",
      "lastUpdated": "עודכן לאחרונה: {{date}}",

      "sections": {
        "acceptance": {
          "title": "קבלת תנאים",
          "content": "על ידי שימוש ב-SpendWise, אתם מסכימים לתנאים והתנאים הללו. אם אינכם מסכימים, אנא הפסיקו להשתמש בשירות שלנו."
        },

        "service": {
          "title": "תיאור השירות",
          "content": "SpendWise מספקת כלים לניהול כספים אישיים כולל מעקב הוצאות, ניהול תקציב ואנליטיקה פיננסית."
        },

        "userResponsibilities": {
          "title": "אחריות המשתמש",
          "content": "אתם אחראים לשמירה על אבטחת החשבון, מתן מידע מדויק ושימוש בשירות בהתאם לחוקים החלים."
        },

        "limitations": {
          "title": "מגבלות השירות",
          "content": "השירות שלנו מסופק 'כפי שהוא' ללא אחריות. איננו אחראים לכל החלטות פיננסיות שנעשות על בסיס הכלים שלנו."
        },

        "termination": {
          "title": "סיום",
          "content": "כל צד יכול לסיים הסכם זה. עם הסיום, הגישה שלכם תיפסק אך זכויות שמירת הנתונים שלכם יישארו כפי שמפורט במדיניות הפרטיות שלנו."
        },

        "governingLaw": {
          "title": "חוק החל",
          "content": "תנאים אלה כפופים לחוק הישראלי. מחלוקות יפתרו בבתי המשפט הישראליים."
        },

        "contact": {
          "title": "צרו קשר",
          "content": "לשאלות על תנאים אלה, צרו קשר: spendwise.verification@gmail.com"
        }
      }
    },

    "floatingMenu": {
      "changeLanguage": "שנה שפה",
      "switchCurrency": "החלף מטבע",
      "toggleTheme": "החלף ערכת נושא",
      "switchToLight": "עבור למצב בהיר",
      "switchToDark": "עבור למצב כהה",
      "accessibility": "נגישות"
    },

    "footer": {
      "description": "כלי חכם לניהול כספי אישי שעוזר לך לעקוב אחר הוצאות ולנהל את התקציב שלך ביעילות.",
      "navigation": "ניווט",
      "legal": "משפטי",
      "support": "תמיכה",
      "supportTitle": "תמיכה",
      "supportDescription": "לשאלות ותמיכה, אנא צרו קשר:",
      "privacy": "מדיניות פרטיות",
      "terms": "תנאי שירות",
      "accessibility": "נגישות",
      "accessibilityStatement": "הצהרת נגישות",
      "copyright": "© {{year}} SpendWise. כל הזכויות שמורות.",
      "madeWith": "נעשה עם",
      "inIsrael": "בישראל",
      "close": "סגור",
      "followUs": "עקבו אחרינו",
      "newsletter": "ניוזלטר",
      "newsletterDesc": "קבלו טיפים פיננסיים ועדכונים",
      "missionStatement": "כלי חכם לניהול כספי אישי המסייע לך לעקוב אחר הוצאות ולנהל את התקציב ביעילות.",
      "privacyPolicy": "מדיניות פרטיות",
      "termsOfService": "תנאי שירות",
      "privacyProtectionLaw": "חוק הגנת הפרטיות",
      "supportMessage": "לשאלות ותמיכה, אנא צרו קשר:",
      "legalCompliance": "‏SpendWise פועלת בהתאם לכל התקנות הפיננסיות והגנת הפרטיות הרלוונטיות."
    },

    "notFound": {
      "title": "עמוד לא נמצא",
      "message": "העמוד שאתה מחפש לא קיים.",
      "suggestion": "יתכן שהועבר, נמחק, או שהזנת כתובת שגויה.",
      "goHome": "עבור לדשבורד",
      "needHelp": "צריך עזרה?",
      "helpMessage": "צור קשר עם צוות התמיכה שלנו אם אתה ממשיך להיתקל בבעיות."
    },

    "onboarding": {
      "common": {
        "next": "הבא",
        "previous": "הקודם",
        "skip": "דלג",
        "complete": "השלם הגדרה",
        "completing": "משלים...",
        "confirmClose": "האם אתה בטוח שברצונך לסגור? ההתקדמות שלך תישמר.",
        "of": "מתוך",
        "step": "שלב"
      },

      "welcome": {
        "title": "ברוכים הבאים ל-SpendWise!",
        "greeting": "שלום {{name}}!",
        "description": "בואו נגדיר את חוויית ניהול הכספים שלכם ונעזור לכם להבין איך SpendWise יכול לפשט את ניהול הכסף שלכם.",

        "features": {
          "recurring": {
            "title": "עסקאות חוזרות",
            "description": "הפוך את ההכנסות וההוצאות הקבועות שלך לאוטומטיות למעקב ללא מאמץ."
          },

          "analytics": {
            "title": "אנליטיקה חכמה",
            "description": "קבל תובנות על דפוסי ההוצאות והמגמות הפיננסיות שלך."
          },

          "security": {
            "title": "בטוח ופרטי",
            "description": "הנתונים הפיננסיים שלך מוצפנים ומאוחסנים בבטחה."
          }
        },

        "highlight": {
          "title": "עסקאות חוזרות",
          "subtitle": "המפתח לניהול פיננסי ללא מאמץ",
          "description": "הגדר עסקאות שקורות בקביעות - כמו משכורת, דירה או מנויים - ו-SpendWise יעקוב אחריהן אוטומטית עבורך."
        },

        "examples": {
          "salary": "משכורת חודשית",
          "rent": "תשלום דירה",
          "phone": "חשבון טלפון",
          "utilities": "שירותים"
        },

        "cta": {
          "description": "מוכן להשתלט על הכספים שלך? בואו נתחיל!",
          "button": "בואו נתחיל"
        },

        "stats": {
          "minutes": "דקות להגדרה",
          "steps": "שלבים פשוטים",
          "benefits": "יתרונות"
        },
        "profileTitle": "פרופיל אישי",
        "preferencesTitle": "העדפות",

        "profile": {
          "addPhoto": "הוסף תמונה",
          "uploadPrompt": "לחץ להוספת תמונת פרופיל"
        },

        "nextPrompt": {
          "title": "מוכן לצעד הבא?",
          "description": "בואו נלמד על העוצמה של עסקאות חוזרות ואיך הן יכולות לעזור לך לנהל את הכספים בצורה חכמה יותר!"
        },

        "quickSetup": {
          "description": "ההגדרות שלך נשמרות אוטומטית ואתה יכול לשנות אותן בכל עת מהדף הפרופיל"
        }
      },

      "preferences": {
        "title": "התאם את החוויה שלך",
        "subtitle": "הגדר את ההעדפות שלך כדי להתאים אישית את SpendWise",
        "description": "הגדר את ההגדרות האלה כדי להתאים אישית את חוויית SpendWise שלך. אתה יכול לשנות אותן בכל עת בפרופיל שלך.",
        "localization": "שפה ואזור",
        "language": "שפה",
        "currency": "מטבע",
        "appearance": "מראה",
        "theme": "ערכת נושא",

        "themes": {
          "light": "בהיר",
          "dark": "כהה",
          "system": "מערכת"
        },

        "budget": "תקציב חודשי",
        "monthlyBudget": "תקציב חודשי",
        "enterAmount": "הזן סכום תקציב",
        "saving": "שומר...",
        "comingSoon": "תכונות נוספות יתווספו בקרוב"
      },

      "recurring": {
        "title": "הבנת עסקאות חוזרות",
        "subtitle": "למד איך להפוך את המעקב הפיננסי לאוטומטי",
        "tagline": "אוטומציה חכמה למעקב פיננסי - הגדר פעם, עקוב תמיד",

        "compareTitle": "השוואה: חוזר לעומת חד-פעמי",
        "recurringLabel": "עסקה חוזרת (עם תג סגול)",
        "oneTimeLabel": "עסקה חד-פעמית (ללא תג)",

        "keyDiffTitle": "הבדלים מרכזיים:",
        "keyDiff": {
          "point1": "עסקאות חוזרות מסומנות בתג סגול וכוללות אפשרויות עריכה נוספות",
          "point2": "כוללות פעולות ייחודיות של 'השהיה' ו'דילוג'"
        },

        "howWorks": {
          "title": "איך זה עובד?",
          "desc1": "אתה קובע תאריך – הוא מתווסף לרשימה ולמאזנים בתאריך הזה אך מתפזר לאורך החודש מההתחלה",
          "peace": "תהיה רגוע!",
          "desc2": "הכל מאוזן מתחילת החודש – אין הפתעות!"
        },

        "toolsTitle": "כלים זמינים",

        "features": {
          "manager": {
            "title": "מנהל עסקאות חוזרות",
            "description": "ניהול מרכזי של כל העסקאות החוזרות"
          },
          "quickAdd": {
            "title": "הוספה מהירה",
            "description": "הוסף עסקאות מהדשבורד בלחיצה אחת"
          },
          "categories": {
            "title": "מנהל קטגוריות",
            "description": "נהל קטגוריות אישיות ומערכתיות"
          },
          "advanced": {
            "title": "דף עסקאות מתקדם",
            "description": "סינון וחיפוש מתקדם עם תובנות"
          }
        },

        "examples": {
          "salary": "משכורת חודשית",
          "salaryCat": "שכר",
          "coffee": "קפה בוקר",
          "coffeeCat": "אוכל ושתייה"
        }
      },

      "templates": {
        "title": "הוסף את העסקאות החוזרות הראשונות שלך",
        "subtitle": "הגדר עסקאות חוזרות נפוצות כדי להתחיל",
        "selected": "נבחרו {{count}} תבניות",
        "addCustom": "הוסף עסקה מותאמת אישית",
        "addCustomDesc": "צור עסקה חדשה עם הפרטים המדויקים שלך",
        "created": "{{count}} עסקאות חוזרות נוצרו בהצלחה!",
        "cta": {
          "button": "הוסף תבניות נבחרות"
        },
        "examples": {
          "salary": "משכורת חודשית",
          "rent": "שכר דירה",
          "phone": "חשבון טלפון",
          "internet": "אינטרנט",
          "groceries": "קניות חודשיות",
          "carInsurance": "ביטוח רכב",
          "gym": "מנוי חדר כושר",
          "netflix": "מנוי נטפליקס",
          "coffee": "קפה יומי"
        }
      },

      "step1": {
        "subtitle": "ברוכים הבאים למסע הפיננסי שלכם"
      },

      "step2": {
        "subtitle": "התאימו אישית את החוויה שלכם"
      },

      "step3": {
        "subtitle": "שלטו בעסקאות חוזרות"
      },

      "step4": {
        "subtitle": "הגדירו את התבניות הראשונות שלכם"
      },

      "exitConfirm": "האם אתה בטוח שברצונך לצאת מתהליך האונבורדינג? ההתקדמות שלך תישמר ותוכל להמשיך מאוחר יותר.",
      "closeExit": "סגור ויציאה",

      "prompt": {
        "title": "נראה שלא סיימת את חווית האונבורד",
        "description": "האם תרצה להמשיך ולסיים את ההדרכה, או שאתה מעדיף לדלג ולהתחיל להשתמש באפליקציה?",
        "skipStart": "דלג ותתחיל",
        "continue": "המשך הדרכה",
        "help": "תמיד תוכל לחזור להדרכה דרך תפריט העזרה"
      }
    },

    "recurring": {
      "whatAre": {
        "title": "מה הן עסקאות חוזרות?",
        "description": "עסקאות חוזרות הן תשלומים או הכנסות שקורים אוטומטית לפי לוח זמנים קבוע. במקום להזין אותן ידנית בכל פעם, אתה מגדיר אותן פעם אחת ו-SpendWise מטפל בשאר."
      },

      "examples": {
        "title": "דוגמאות אמיתיות",
        "demo": "הפעל הדגמה",
        "salaryDesc": "ההכנסה החודשית שלך נרשמת אוטומטית",
        "rentDesc": "תשלום דיור חודשי שלא נשכח לעולם",
        "phoneDesc": "מנוי קבוע נרשם אוטומטית"
      },

      "benefits": {
        "title": "למה להשתמש בעסקאות חוזרות?",
        "timeTitle": "חוסך זמן",
        "timeDesc": "הגדר פעם אחת, עקוב אוטומטית תמיד",
        "insightsTitle": "תובנות טובות יותר",
        "insightsDesc": "ראה את דפוסי ההוצאות והמגמות האמיתיים שלך",
        "accuracyTitle": "הישאר מדויק",
        "accuracyDesc": "לא תשכח תשלומים קבועים יותר"
      },

      "cta": {
        "title": "מוכן להגדיר את העסקה החוזרת הראשונה שלך?",
        "description": "הלאה, נעזור לך להוסיף עסקאות חוזרות נפוצות כדי להתחיל.",
        "button": "בואו נגדיר אותן"
      }
    },

    "templates": {
      "quickSetup": "הצעות הגדרה מהירה",
      "yourTemplates": "התבניות שלך",
      "createCustom": "צור תבנית מותאמת אישית",
      "setupComplete": "נהדר! הגדרת {{count}} עסקאות חוזרות",
      "setupOptional": "אין תבניות עדיין - זה בסדר!",
      "canAddMore": "תמיד אפשר להוסיף עוד מהדשבורד",
      "canSkipForNow": "אפשר להוסיף עסקאות חוזרות בכל עת מהדשבורד שלך",
      "addedFromOnboarding": "נוסף במהלך האונבורדינג",
      "carPayment": "תשלום רכב",
      "internet": "חשבון אינטרנט"
    },

    "budget": {
      "monthlyBudget": "תקציב חודשי",
      "enterAmount": "הזן סכום תקציב",
      "saving": "שומר...",
      "comingSoon": "תכונות נוספות יתווספו בקרוב"
    },

    "exchange": {
      "title": "מחשבון המרות מטבע",
      "subtitle": "המר בין מטבעות",
      "loading": "טוען שערי חליפין...",

      "error": {
        "title": "נכשל לטעון שערי חליפין",
        "message": "לא ניתן לטעון את שערי החליפין הנוכחיים. אנא בדוק את החיבור שלך.",
        "tryAgain": "נסה שוב"
      },

      "form": {
        "amountLabel": "סכום להמרה",
        "amountPlaceholder": "100",
        "fromLabel": "מ",
        "toLabel": "אל"
      },

      "result": {
        "rate": "1 {{from}} = {{rate}} {{to}}"
      },

      "popular": {
        "title": "המרות פופולריות"
      },

      "footer": {
        "liveRates": "שערים חיים • מתעדכן כל 5 דקות",
        "liveRatesMobile": "שערים חיים • עדכון כל 5 דק׳",
        "availableCurrencies": "{{count}} מטבעות",
        "possiblePairs": "{{count}} מטבעות • {{pairs}} זוגות"
      },

      "currencies": {
        "USD": "דולר אמריקאי",
        "ILS": "שקל ישראלי",
        "EUR": "יורו",
        "GBP": "פאונד בריטי",
        "JPY": "יין יפני",
        "CAD": "דולר קנדי",
        "AUD": "דולר אוסטרלי",
        "CHF": "פרנק שוויצרי"
      }
    },

    // Theme translations for theme toggle  
    "theme": {
      "dark": "כהה",
      "light": "בהיר"
    },

    // App initializer translations
    "app": {
      "initializer": {
        "authenticating": "מאמת...",
        "connectingToServer": "מתחבר לשרת...",
        "loadingSpendWise": "טוען את SpendWise...",
        "loadingData": "טוען נתונים...",
        "almostReady": "כמעט מוכן...",
        "serverStartingUp": "השרת מתחיל",
        "serverWakingMessage": "זה עשוי לקחת רגע בביקור הראשון...",
        "freeHostingMessage": "אירוח חינמי לוקח זמן להתעורר",
        "somethingWentWrong": "משהו השתבש",
        "initializationFailed": "נכשל לאתחל את האפליקציה",
        "checkingServer": "בודק מצב השרת...",
        "serverSleeping": "השרת ישן",
        "serverWarmingUp": "השרת מתחמם...",
        "serverReady": "השרת מוכן!"
      }
    }
  }
};

export const LanguageProvider = ({ children }) => {
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

    debugLog(`🌐 [LANGUAGE] Permanent change: ${language} → ${newLanguage}`);

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

    debugLog(`🌐 [LANGUAGE] Session change: ${effectiveLanguage} → ${newLanguage}`);

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
    debugLog(`🌐 [LANGUAGE] Resetting to saved preference: ${language}`);
    setSessionLanguage(null);
  };

  // ✅ FIX: Sync with user preferences via event system
  useEffect(() => {
    const handleUserPreferencesSync = (event) => {
      try {
        const { user } = event.detail;
        if (user?.preferences?.language) {
          const userLang = user.preferences.language;
          if (userLang !== language) {
            debugLog(`🌐 [LANGUAGE] Syncing with user preference: ${language} → ${userLang}`);
            setLanguage(userLang);
            setSessionLanguage(null); // Clear any session override
            localStorage.setItem('preferredLanguage', userLang);
          }
        }
      } catch (error) {
        console.warn('🌐 [LANGUAGE] Error syncing user preferences:', error);
      }
    };

    window.addEventListener('user-preferences-loaded', handleUserPreferencesSync);
    return () => window.removeEventListener('user-preferences-loaded', handleUserPreferencesSync);
  }, [language]);

  // ✅ ADD: Effect to sync language changes across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      try {
        if (e.key === 'preferredLanguage' && e.newValue !== language) {
          debugLog(`🌐 [LANGUAGE] Storage change detected: ${language} → ${e.newValue}`);
          setLanguage(e.newValue);
          setSessionLanguage(null); // Clear session override when permanent preference changes
        }
      } catch (error) {
        console.warn('🌐 [LANGUAGE] Error handling storage change:', error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [language]);

  // ✅ ADD: Debug log for language changes
  useEffect(() => {
    try {
      if (process.env.NODE_ENV === 'development') {
        debugLog(`🌐 [LANGUAGE] State update:`, {
          saved: language,
          session: sessionLanguage,
          effective: effectiveLanguage,
          isSessionOverride: !!sessionLanguage
        });
      }
    } catch (error) {
      // Silently handle debug errors
    }
  }, [effectiveLanguage, language, sessionLanguage]);

  // ✅ ADD: Listen for session reset events (logout)
  useEffect(() => {
    const handleSessionReset = () => {
      try {
        debugLog(`🌐 [LANGUAGE] Session reset detected - clearing session overrides`);
        resetToSavedLanguage();
      } catch (error) {
        console.warn('🌐 [LANGUAGE] Error handling session reset:', error);
      }
    };

    const handleLanguageReset = () => {
      try {
        debugLog(`🌐 [LANGUAGE] Language-specific reset detected`);
        resetToSavedLanguage();
      } catch (error) {
        console.warn('🌐 [LANGUAGE] Error handling language reset:', error);
      }
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
    try {
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
    } catch (error) {
      console.warn('🌐 [LANGUAGE] Translation error for key:', key, error);
      return key; // Fallback to key
    }
  };

  // ✅ ADD: Make translation function globally available for API error messages
  useEffect(() => {
    try {
      window.getTranslation = t;
      return () => {
        try {
          delete window.getTranslation;
        } catch (error) {
          // Silently handle cleanup errors
        }
      };
    } catch (error) {
      console.warn('🌐 [LANGUAGE] Error setting global translation function:', error);
    }
  }, [effectiveLanguage]);

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

  // (debugLog defined globally above)

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