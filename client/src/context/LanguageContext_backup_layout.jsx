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

const translations = {
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
      "operationSuccess": "Operation completed successfully"
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
      "fileTooLarge": "File size must be less than 5MB",
      "invalidFileType": "Please select a valid file type",
      "uploadFailed": "Upload failed. Please try again.",
      "databaseError": "Database error occurred",
      "queryFailed": "Query failed to execute",
      "connectionError": "Connection to database failed",
      "unexpectedError": "An unexpected error occurred",
      "operationTimeout": "Operation timed out. Please try again.",
      "unknownError": "An unknown error occurred",
      "generic": "Something went wrong. Please try again."
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

    "errors": {
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
    "generic": "אירעה שגיאה. אנא נסו שוב.",
    "network": "שגיאת רשת. אנא בדקו את החיבור שלכם.",
    "validation": "אנא בדקו את הטופס לשגיאות.",
    "unauthorized": "אין לכם הרשאה לבצע פעולה זו.",
    "notFound": "הפריט המבוקש לא נמצא.",
    "server": "שגיאת שרת. אנא נסו שוב מאוחר יותר.",
    "timeout": "פג זמן הבקשה. אנא נסו שוב.",
    "unknown": "אירעה שגיאה לא ידועה."
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
    "comingSoon": "בקרוב...",
    "refresh": "רענן",
    "delete": "מחק",
    "edit": "ערוך",
    "available": "זמין",
    "close": "סגור",
    "next": "הבא",
    "previous": "הקודם",
    "submit": "שלח",
    "reset": "איפוס",
    "search": "חפש",
    "filter": "סינון",
    "filters": "סינונים",
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
    "sessionOverrideActive": "עקיפת העדפות פעילה",
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
    "advanced": "פילטרים מתקדמים",
    "customRange": "טווח מותאם",
    "change": "שנה",
    "logout": "התנתק",
    "weak": "חלש",
    "fair": "בינוני",
    "good": "טוב",
    "strong": "חזק",
    "protected": "מוגן",
    "uploadFailed": "ההעלאה נכשלה. אנא נסה שוב.",
    "passwordMinLength": "הסיסמה חייבת להיות באורך של 8 תווים לפחות",
    "passwordsDoNotMatch": "הסיסמאות אינן תואמות",
    "usernameRequired": "שם משתמש נדרש"
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
    "recurringManagerDesc": "Manage your recurring transactions and templates"
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
    "stepAccountInfo": "פרטי חשבון",
    "stepSecurity": "אבטחה"
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
      "fetchError": "Unable to load transactions",
      "loading": "Loading transactions..."
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
    "recurringNote": "{{type}} זה/זו חוזר/ת אוטומטית. שינויים יכולים להשפיע על מופעים עתידיים."
  },

  "actions": {
    "title": "הוסף עסקה",
    "buttontitle": "הוסף עסקה חדשה",
    "detailedTransaction": "עסקה מפורטת",
    "chooseAction": "בחר את הפעולה למטה",
    "selectType": "בחר סוג עסקה",
    "smart": "חכם",
    "oneClick": "הוספה בקליק",
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
    "quickRecurring": "קבוע מהיר",
    "quickRecurringDesc": "הוסף הוצאה חוזרת חודשית",
    "quickAdd": "הוסף עסקה מהירה",
    "oneTimeExpense": "הוצאה חד פעמית",
    "oneTimeExpenseDesc": "הוסף עסקת הוצאה בודדת",
    "recurringExpense": "הוצאה חוזרת",
    "recurringExpenseDesc": "הגדר הוצאה חוזרת",
    "recurringSetup": "הגדרת חוזרת",
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
    "dayOfWeek": "יום בשבוע",
    "example": "דוגמה",
    "examples": "דוגמאות",
    "expenseExample": "לדוגמה: קניות, דלק, קניות",
    "recurringExpenseExample": "לדוגמה: שכר דירה, ביטוח, מנוי",
    "incomeExample": "לדוגמה: משכורת, בונוס, מתנה",
    "recurringIncomeExample": "לדוגמה: משכורת, דיבידנד, שכר דירה",

    "examplePlaceholders": {
      "coffee": "קפה עם חברים",
      "lunch": "ארוחת צהריים במסעדה",
      "salary": "משכורת חודשית",
      "rent": "שכר דירה חודשי"
    },

    "add": "הוסף עסקה",
    "addIncome": "הוסף הכנסה",
    "addExpense": "הוסף הוצאה",
    "success": "הצלחה!",
    "added": "נוסף!",
    "create": "צור",
    "update": "עדכן",

    "frequencies": {
      "daily": "יומי",
      "weekly": "שבועי",
      "monthly": "חודשי",
      "yearly": "שנתי",
      "oneTime": "חד פעמי"
    },

    "errors": {
      "amountRequired": "סכום נדרש",
      "categoryRequired": "אנא בחר קטגוריה",
      "formErrors": "אנא תקן את שגיאות הטופס",
      "addingTransaction": "שגיאה בהוספת עסקה",
      "updatingTransaction": "שגיאה בעדכון עסקה"
    },

    "new": "חדש",
    "e.g., Salary, Bonus, Gift": "לדוגמה: משכורת, בונוס, מתנה",
    "e.g., Salary, Dividend, Rental Income": "לדוגמה: משכורת, דיבידנד, הכנסה משכירות",
    "e.g., Groceries, Gas, Shopping": "לדוגמה: קניות מזון, דלק, קניות",
    "e.g., Rent, Insurance, Subscription": "לדוגמה: שכר דירה, ביטוח, מנוי",
    "expense": "הוצאה",
    "willUseDefault": "יעשה שימוש בקטגוריית ברירת המחדל",
    "defaultToday": "ברירת מחדל להיום",
    "monthlyIncome": "הכנסה חודשית",
    "income": "הכנסה",
    "monthlyExpense": "הוצאה חודשית",
    "willUseFirstCategory": "יעשה שימוש בקטגוריה הראשונה",
    "automaticPayments": "תשלומים אוטומטיים",
    "createRecurring": "צור חוזר",
    "amountRequired": "סכום נדרש",
    "dayOfMonth": "יום בחודש",
    "updateSuccess": "עודכן בהצלחה",
    "save": "Save",
    "cancel": "Cancel",
    "creating": "Creating...",
    "adding": "Adding...",
    "updating": "Updating...",
    "addSuccess": "Transaction Added Successfully",
    "historicalDateWarning": "Adding transaction to historical date",
    "goToToday": "Go to Today"
  },

  "categories": {
    "title": "קטגוריות",
    "manage": "נהל קטגוריות",
    "manageCategories": "ניהול קטגוריות",
    "wizardSubtitle": "ארגן את הכספים שלך כמו אשף",
    "addNew": "הוסף קטגוריה",
    "create": "צור קטגוריה",
    "createFirst": "צור קטגוריה ראשונה",
    "edit": "ערוך קטגוריה",
    "delete": "מחק קטגוריה",
    "deleteConfirm": "האם אתה בטוח שברצונך למחוק קטגוריה זו?",
    "name": "שם הקטגוריה",
    "nameRequired": "שם הקטגוריה נדרש",
    "description": "תיאור",
    "descriptionPlaceholder": "תיאור אופציונלי לקטגוריה",
    "type": "סוג",
    "icon": "אייקון",
    "userCategories": "הקטגוריות שלי",
    "userCategoriesDesc": "הקטגוריות האישיות שלך",
    "defaultCategories": "קטגוריות ברירת מחדל",
    "defaultCategoriesDesc": "קטגוריות מובנות במערכת",
    "noUserCategories": "עדיין לא יצרת קטגוריות משלך",
    "noUserCategoriesDesc": "צור קטגוריות מותאמות אישית לניהול הכספים שלך",
    "default": "ברירת מחדל",
    "selectCategory": "בחר קטגוריה",
    "selectCategoryHint": "אנא בחר קטגוריה עבור העסקה",
    "noCategoriesFound": "לא נמצאו קטגוריות",
    "createCategoriesFirst": "צור קטגוריות חדשות תחילה",
    "searchPlaceholder": "חפש קטגוריות...",
    "created": "הקטגוריה נוצרה בהצלחה",
    "updated": "הקטגוריה עודכנה בהצלחה",
    "deleted": "הקטגוריה נמחקה בהצלחה",
    "saveFailed": "שמירת הקטגוריה נכשלה",
    "deleteFailed": "מחיקת הקטגוריה נכשלה",
    "required": "חובה",
    "searchCategories": "חפש קטגוריות",
    "addCategory": "הוסף קטגוריה",
    "custom": "מותאם אישית",
    "noGeneralCategories": "אין קטגוריות כלליות זמינות",
    "defaultCategoriesWillAppear": "קטגוריות ברירת המחדל יופיעו כאן כשייטענו",
    "noCustomCategories": "אין קטגוריות מותאמות אישית זמינות",
    "createCategoriesInSettings": "צור קטגוריות מותאמות אישית בהגדרות",

    "filter": {
      "all": "הכל",
      "income": "הכנסות",
      "expense": "הוצאות"
    },

    "stats": {
      "total": "סה״כ קטגוריות",
      "personal": "קטגוריות אישיות",
      "default": "ברירת מחדל"
    },

    "themes": {
      "dailyExpenses": "הוצאות יומיומיות",
      "billsAndUtilities": "חשבונות ושירותים",
      "lifestyle": "אורח חיים",
      "professional": "מקצועי",
      "workIncome": "הכנסות מעבודה",
      "investments": "השקעות",
      "otherIncome": "הכנסות אחרות",
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
    "Rent": "שכירות",
    "Groceries": "מכולת",
    "Utilities": "חשבונות",
    "Phone Bill": "חשבון טלפון",
    "Insurance": "ביטוח",
    "Transportation": "תחבורה",
    "בנזין/תחבורה": "בנזין/תחבורה",
    "Car Payment": "תשלום רכב",
    "Public Transport": "תחבורה ציבורית",
    "Food": "אוכל",
    "Dining Out": "אוכל בחוץ",
    "Coffee & Drinks": "קפה ומשקאות",
    "Entertainment": "בידור",
    "בידור": "בידור",
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
    "אחר": "אחר",
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
    "בריאות": "בריאות",
    "חינוך": "חינוך",
    "חשבונות": "חשבונות",
    "טיפוח": "טיפוח",
    "מזון": "מזון",
    "מסעדות": "מסעדות",
    "נסיעות": "נסיעות",
    "ספורט": "ספורט",
    "צדקה": "צדקה",
    "קניות": "קניות",
    "השקעות": "השקעות",
    "מתנות": "מתנות",
    "פריים": "פרימיום",
    "משפחה": "משפחה",
    "עסקים": "עסקים",
    "משכורת": "משכורת",
    "עבודה עצמאית": "עבודה עצמאית",
    "הכנסה מהירה": "הכנסה מהירה",
    "מכולת": "מכולת",
    "תחבורה": "תחבורה",
    "הוצאה מהירה": "הוצאה מהירה",
    "כללי": "כללי",
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
    "emailNotEditable": "לא ניתן לשנות את הדואר האלקטרוני",
    "changePassword": "שינוי סיסמה",
    "currentPassword": "סיסמה נוכחית",
    "newPassword": "סיסמה חדשה",
    "confirmPassword": "אישור סיסמה חדשה",
    "changePhoto": "שנה תמונה",
    "uploadPhoto": "העלה תמונה",
    "photoHelper": "JPG, PNG או GIF. גודל מקסימלי 5MB",
    "uploading": "מעלה...",
    "photoUploaded": "התמונה הועלתה בהצלחה",
    "invalidImageType": "אנא בחר קובץ תמונה תקין (JPG, PNG, או GIF)",
    "imageTooLarge": "גודל התמונה חייב להיות פחות מ-5MB",
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
    "cancel": "ביטול",
    "updateSuccess": "הפרופיל עודכן בהצלחה",
    "updateError": "נכשל בעדכון הפרופיל",
    "saveError": "נכשל בשמירת השינויים",
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
      "totalTransactions": "סך העסקאות",
      "thisMonth": "החודש",
      "activeDays": "חבר כבר",
      "successRate": "אחוז הצלחה",
      "days": "ימים",
      "months": "חודשים",
      "years": "שנים"
    },

    "quickActions": "פעולות מהירות",
    "exportData": "ייצוא נתונים",
    "notifications": "התראות",
    "comingSoon": "בקרוב",
    "logoutConfirm": "אישור התנתקות",
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
    "languageChanged": "השפה שונתה בהצלחה",
    "currencyChanged": "המטבע שונה בהצלחה",

    "budget": {
      "monthlyBudget": "תקציב חודשי",
      "enterAmount": "הכניסו סכום תקציב",
      "optional": "אופציונלי"
    },

    "templates": {
      "quickSetup": "הגדרה מהירה",
      "yourTemplates": "התבניות שלכם",
      "setupComplete": "הגדרה הושלמה! {{count}} תבניות מוכנות",
      "setupOptional": "תבניות הן אופציונליות",
      "canAddMore": "תוכלו להוסיף עוד תבניות בכל זמן",
      "canSkipForNow": "תוכלו לדלג על השלב הזה ולהוסיף תבניות מאוחר יותר",
      "carPayment": "תשלום רכב",
      "internet": "שירות אינטרנט"
    },

    "recurring": {
      "whatAre": {
        "title": "מה הן עסקאות חוזרות?",
        "description": "עסקאות חוזרות הן תשלומים או הכנסות שקורים באופן קבוע - כמו המשכורת, שכר דירה, או מנויים חודשיים. במקום להכניס אותם ידנית בכל פעם, תוכלו להגדיר אותם פעם אחת ו-SpendWise יעקוב אחריהם אוטומטית."
      },

      "examples": {
        "title": "דוגמה",
        "demo": "הדגמה",
        "salaryDesc": "המשכורת החודשית שלכם מתווספת אוטומטית כהכנסה",
        "rentDesc": "תשלום שכר דירה חודשי נרשם כהוצאה",
        "phoneDesc": "חשבון הטלפון מנוכה אוטומטית כל חודש"
      },

      "benefits": {
        "title": "למה להשתמש בעסקאות חוזרות?",
        "timeTitle": "חיסכון בזמן",
        "timeDesc": "אין צורך להזין ידנית את אותן עסקאות כל חודש",
        "insightsTitle": "תובנות טובות יותר",
        "insightsDesc": "קבלו תחזיות מדויקות של המצב הכלכלי העתידי שלכם",
        "accuracyTitle": "דיוק מושלם",
        "accuracyDesc": "לעולם לא תשכחו לעקוב אחר תשלומים או הכנסות קבועות"
      },

      "cta": {
        "title": "מוכנים להגדיר את העסקאות החוזרות הראשונות שלכם?",
        "description": "בואו נוסיף כמה עסקאות חוזרות נפוצות כדי להתחיל.",
        "button": "הגדרת תבניות"
      }
    },

    "themeChanged": "ערכת הנושא שונתה בהצלחה",
    "passwordChanged": "הסיסמה שונתה בהצלחה",
    "incorrectPassword": "הסיסמה הנוכחית שגויה",
    "passwordChangeError": "נכשל בשינוי הסיסמה",
    "updatePassword": "עדכן סיסמה",
    "additionalSecurity": "אבטחה נוספת",
    "additionalSecurityDesc": "אימות דו-שלבי ותכונות אבטחה נוספות בקרוב",
    "customPreferences": "העדפות מותאמות אישית",
    "customPreferencesTitle": "נהל הגדרות מותאמות אישית",
    "addNewPreference": "הוסף העדפה חדשה",
    "preferenceKey": "שם ההגדרה",
    "preferenceType": "סוג נתונים",
    "preferenceValue": "ערך",
    "addPreference": "הוסף הגדרה",
    "noCustomPreferences": "אין העדפות מותאמות אישית עדיין",
    "preferenceAdded": "ההעדפה נוספה בהצלחה",
    "preferenceRemoved": "ההעדפה הוסרה בהצלחה",
    "saveCustomPreferences": "שמור העדפות מותאמות אישית",
    "customPreferencesSaved": "ההעדפות המותאמות אישית נשמרו בהצלחה",
    "advancedPreferences": "העדפות מתקדמות",
    "preferencesEditor": "עורך העדפות",
    "preferencesEditorInfo": "ערוך את ההעדפות שלך כ-JSON. היזהר עם התחביר!",
    "rawPreferences": "העדפות JSON גולמיות",
    "preferencesUpdated": "ההעדפות עודכנו בהצלחה",
    "saveAllPreferences": "שמור את כל ההעדפות",
    "commonPreferences": "העדפות נפוצות",
    "notificationPreferences": "העדפות התראות",
    "privacyPreferences": "העדפות פרטיות",

    "notificationTypes": {
      "email": "התראות דוא״ל",
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
      "csvDescription": "קובץ CSV (אקסל/גוגל שיטס)",
      "jsonDescription": "קובץ JSON (לייבוא לאפליקציות אחרות)",
      "invalidFormat": "פורמט יצוא לא תקין נבחר",
      "formatUnavailable": "יצוא {format} אינו זמין",
      "preparing": "מכין יצוא {format}...",
      "processing": "מעבד את הייצוא שלך...",
      "progressStatus": "יצוא {format}: {progress}% הושלם",
      "title": "יצא את הנתונים שלך",
      "subtitle": "בחר את הפורמט המועדף עליך להורדה",
      "dataIncluded": "מה כלול בייצוא שלך",
      "loadingOptions": "טוען אפשרויות ייצוא...",
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
      "userInfo": "יצוא עבור {username} • {currency} • {language}"
    },

    "errors": {
      "usernameRequired": "שם משתמש נדרש",
      "usernameTooShort": "שם המשתמש חייב להכיל לפחות 3 תווים",
      "emailRequired": "דואר אלקטרוני נדרש",
      "emailInvalid": "פורמט דואר אלקטרוני לא תקין",
      "keyRequired": "שם ההגדרה נדרש",
      "keyExists": "שם ההגדרה כבר קיים",
      "invalidJson": "פורמט JSON לא תקין",
      "invalidFileType": "אנא בחר קובץ תמונה",
      "fileTooLarge": "גודל הקובץ חייב להיות קטן מ-5MB",
      "uploadFailed": "העלאת התמונה נכשלה"
    }
  },

  "stats": {
    "title": "סטטיסטיקות",
    "overview": "סקירה",
    "currentBalance": "יתרה נוכחית",
    "monthlyIncome": "הכנסות חודשיות",
    "monthlyExpenses": "הוצאות חודשיות",
    "totalTransactions": "סך העסקאות",
    "activeRecurring": "מנויים פעילים",
    "quickOverview": "סקירה מהירה",
    "thisMonth": "החודש",
    "lastMonth": "החודש שעבר",
    "thisYear": "השנה",
    "allTime": "כל הזמנים",
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
      "invalidEmail": "כתובת דוא״ל לא תקינה",
      "invalidAmount": "סכום לא תקין",
      "invalidDate": "תאריך לא תקין",
      "passwordTooShort": "הסיסמה חייבת להכיל לפחות 8 תווים",
      "passwordsDontMatch": "הסיסאות אינן תואמות",
      "descriptionRequired": "תיאור נדרש",
      "endDateRequired": "תאריך סיום נדרש",
      "categoryRequired": "קטגוריה נדרשת",
      "usernameRequired": "שם משתמש נדרש",
      "emailRequired": "דוא״ל נדרש"
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
    "usernameTooShort": "שם המשתמש חייב להכיל לפחות 3 תווים",
    "emailRequired": "דואר אלקטרוני נדרש",
    "emailInvalid": "פורמט דואר אלקטרוני לא תקין",
    "passwordRequired": "סיסמה נדרשת",
    "passwordTooShort": "הסיסמה חייבת להכיל לפחות 8 תווים",
    "passwordNeedsNumber": "הסיסמה חייבת להכיל לפחות מספר אחד",
    "passwordNeedsUpper": "הסיסמה חייבת להכיל לפחות אות גדולה אחת",
    "passwordNeedsLower": "הסיסמה חייבת להכיל לפחות אות קטנה אחת",
    "passwordNeedsSpecial": "הסיסמה חייבת להכיל לפחות תו מיוחד אחד",
    "passwordsDontMatch": "הסיסאות אינן תואמות",
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
      "title": "ההרשמה הצליחה!",
      "message": "ההרשמה בוצעה בהצלחה! אנא התחבר כדי להמשיך."
    },

    "errors": {
      "registrationFailed": "ההרשמה נכשלה. אנא נסה שוב.",
      "emailExists": "הדוא״ל כבר קיים",
      "usernameExists": "שם המשתמש כבר תפוס"
    }
  },

  "calendar": {
    "weekDays": "['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']",
    "months": "['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']",
    "monthsShort": "['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳']",
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
    "resetSettings": "איפוס הגדרות",
    "required": "חובה",
    "compliance": "אתר זה תואם לתקנות נגישות בהתאם לתקן הישראלי (ת\"י 5568).",
    "accessibilityStatement": "הצהרת נגישות",

    "statement": {
      "title": "הצהרת נגישות",
      "intro": "אתר SpendWise מחויב להנגיש את שירותיו לאנשים עם מוגבלויות, בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות (התשנ\"ח-1998) ותקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע\"ג-2013.",
      "features": "תכונות נגישות באתר:",

      "featuresList": {
        "screenReader": "תאימות לקורא מסך",
        "colorContrast": "ניגודיות צבעים מתכווננת",
        "textSize": "התאמת גודל טקסט",
        "keyboardNav": "תמיכה בניווט במקלדת",
        "multiLanguage": "תמיכה בעברית ובאנגלית"
      },

      "level": "דרגת הנגישות:",
      "levelDescription": "אתר זה עומד ברמת תאימות AA לפי הנחיות WCAG 2.1 ועומד בתקן הישראלי (ת\"י 5568).",
      "contact": "יצירת קשר בנושאי נגישות:",
      "contactDescription": "אם נתקלת בבעיות נגישות או ברצונך לשלוח משוב לגבי הנגישות באתר, אנא צור קשר עם רכז הנגישות שלנו:",
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
        "content": "SpendWise (\"אנחנו\", \"שלנו\") מכבדת את פרטיותכם ומתחייבת להגן על המידע האישי שלכם בהתאם לחוק הגנת הפרטיות התשמ\"א-1981 ותקנותיו."
      },

      "dataCollection": {
        "title": "המידע שאנו אוספים",
        "content": "אנו אוספים מידע שאתם מספקים לנו ישירות (פרטי חשבון, נתונים פיננסיים) ומידע שנאסף אוטומטית דרך השימוש בשירות (נתוני שימוש, מידע על המכשיר)."
      },

      "dataUse": {
        "title": "איך אנו משתמשים במידע",
        "content": "המידע שלכם משמש לספק את שירותי ניהול הכספים, לשפר את חוויית המשתמש, להבטיח אבטחה ולעמוד בחובות חוקיות."
      },

      "dataProtection": {
        "title": "הגנה על המידע",
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
    "title": "תקנון שימוש",
    "lastUpdated": "עודכן לאחרונה: {{date}}",

    "sections": {
      "acceptance": {
        "title": "הסכמה לתנאים",
        "content": "על ידי שימוש ב-SpendWise, אתם מסכימים לתנאים והתנאים הללו. אם אינכם מסכימים, אנא הפסיקו להשתמש בשירות שלנו."
      },

      "service": {
        "title": "תיאור השירות",
        "content": "SpendWise מספקת כלים לניהול כספים אישיים כולל מעקב הוצאות, ניהול תקציב ואנליטיקה פיננסית."
      },

      "userResponsibilities": {
        "title": "אחריות המשתמש",
        "content": "אתם אחראים לשמירה על אבטחת החשבון, למתן מידע מדויק ולשימוש בשירות בהתאם לחוקים החלים."
      },

      "limitations": {
        "title": "מגבלות השירות",
        "content": "השירות שלנו מסופק \"כפי שהוא\" ללא אחריות. איננו אחראים להחלטות פיננסיות שנעשות על בסיס הכלים שלנו."
      },

      "termination": {
        "title": "סיום הסכם",
        "content": "כל צד יכול לסיים הסכם זה. עם הסיום, הגישה שלכם תיפסק אך זכויות שמירת הנתונים שלכם יישארו כפי שמפורט במדיניות הפרטיות."
      },

      "governingLaw": {
        "title": "חוק החל",
        "content": "תנאים אלה כפופים לחוק הישראלי. מחלוקות ייפתרו בבתי המשפט הישראליים."
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
    "description": "כלי חכם לניהול פיננסי אישי שעוזר לך לעקוב אחר הוצאות ולנהל את התקציב שלך ביעילות.",
    "navigation": "ניווט",
    "legal": "משפטי",
    "support": "תמיכה",
    "supportTitle": "תמיכה",
    "supportDescription": "לשאלות ותמיכה, אנא צרו קשר:",
    "privacy": "מדיניות פרטיות",
    "terms": "תנאי שימוש",
    "accessibility": "נגישות",
    "accessibilityStatement": "הצהרת נגישות",
    "copyright": "© {{year}} SpendWise. כל הזכויות שמורות.",
    "madeWith": "נעשה עם",
    "inIsrael": "בישראל",
    "close": "סגור",
    "followUs": "עקבו אחרינו",
    "newsletter": "ניוזלטר",
    "newsletterDesc": "קבלו טיפים פיננסיים ועדכונים"
  },

  "notFound": {
    "title": "הדף לא נמצא",
    "message": "הדף שאתה מחפש לא קיים.",
    "suggestion": "ייתכן שהוא הועבר, נמחק, או שהזנת כתובת שגויה.",
    "goHome": "חזרה לדשבורד",
    "needHelp": "צריך עזרה?",
    "helpMessage": "צור קשר עם צוות התמיכה אם אתה ממשיך להיתקל בבעיות."
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
          "description": "הפכו את ההכנסות וההוצאות הקבועות שלכם לאוטומטיות למעקב קל."
        },

        "analytics": {
          "title": "אנליטיקה חכמה",
          "description": "קבלו תובנות על דפוסי ההוצאות והמגמות הפיננסיות שלכם."
        },

        "security": {
          "title": "בטוח ופרטי",
          "description": "הנתונים הפיננסיים שלכם מוצפנים ומאוחסנים בבטחה."
        }
      },

      "highlight": {
        "title": "עסקאות חוזרות",
        "subtitle": "המפתח לניהול פיננסי קל",
        "description": "הגדירו עסקאות שקורות באופן קבוע - כמו משכורת, שכר דירה או מנויים - ו-SpendWise יעקוב אחריהן אוטומטית עבורכם."
      },

      "examples": {
        "salary": "משכורת חודשית",
        "rent": "תשלום דירה",
        "phone": "חשבון טלפון",
        "utilities": "שירותים"
      },

      "cta": {
        "description": "מוכנים להשתלט על הכספים שלכם? בואו נתחיל!",
        "button": "בואו נתחיל"
      },

      "stats": {
        "minutes": "דקות הגדרה",
        "steps": "שלבים פשוטים",
        "benefits": "יתרונות"
      }
    },

    "preferences": {
      "title": "התאימו את החוויה שלכם",
      "subtitle": "הגדירו את ההעדפות שלכם כדי להתאים אישית את SpendWise",
      "description": "הגדירו את ההגדרות האלה כדי להתאים אישית את חוויית SpendWise שלכם. תוכלו לשנות אותן בכל זמן בפרופיל שלכם.",
      "localization": "שפה ואזור",
      "language": "שפה",
      "currency": "מטבע",
      "appearance": "מראה",
      "theme": "נושא",

      "themes": {
        "light": "בהיר",
        "dark": "כהה",
        "system": "מערכת"
      },

      "budget": "תקציב חודשי",
      "monthlyBudget": "תקציב חודשי",
      "enterAmount": "הכניסו סכום תקציב",
      "saving": "שומר..."
    },

    "recurring": {
      "title": "הבנת עסקאות חוזרות",
      "subtitle": "למדו איך להפוך את המעקב הפיננסי לאוטומטי"
    },

    "templates": {
      "title": "הוסיפו את העסקאות החוזרות הראשונות שלכם",
      "subtitle": "הגדירו עסקאות חוזרות נפוצות כדי להתחיל"
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
    }
  },

  "recurring": {
    "whatAre": {
      "title": "מה הן עסקאות חוזרות?",
      "description": "עסקאות חוזרות הן תשלומים או הכנסות שקורים אוטומטית לפי לוח זמנים קבוע. במקום להכניס אותן ידנית בכל פעם, אתם מגדירים אותן פעם אחת ו-SpendWise מטפל בשאר."
    },

    "examples": {
      "title": "דוגמאות אמיתיות",
      "demo": "הפעל הדגמה",
      "salaryDesc": "ההכנסה החודשית שלכם נרשמת אוטומטית",
      "rentDesc": "תשלום דיור חודשי שלא נשכח אף פעם",
      "phoneDesc": "מנוי קבוע נרשם אוטומטית"
    },

    "benefits": {
      "title": "למה להשתמש בעסקאות חוזרות?",
      "timeTitle": "חוסך זמן",
      "timeDesc": "הגדרה פעם אחת, מעקב אוטומטי לתמיד",
      "insightsTitle": "תובנות טובות יותר",
      "insightsDesc": "רואים את דפוסי ההוצאות והמגמות האמיתיים שלכם",
      "accuracyTitle": "נשארים מדויקים",
      "accuracyDesc": "לא שוכחים תשלומים קבועים יותר"
    },

    "cta": {
      "title": "מוכנים להגדיר את העסקה החוזרת הראשונה שלכם?",
      "description": "בשלב הבא, נעזור לכם להוסיף עסקאות חוזרות נפוצות כדי להתחיל.",
      "button": "בואו נגדיר אותן"
    }
  },

  "templates": {
    "quickSetup": "הצעות הגדרה מהירה",
    "yourTemplates": "התבניות שלכם",
    "createCustom": "צור תבנית מותאמת אישית",
    "setupComplete": "מעולה! הגדרתם {{count}} עסקאות חוזרות",
    "setupOptional": "אין תבניות עדיין - זה בסדר!",
    "canAddMore": "תמיד אפשר להוסיף עוד מהדשבורד",
    "canSkipForNow": "אפשר להוסיף עסקאות חוזרות בכל זמן מהדשבורד שלכם",
    "addedFromOnboarding": "נוסף במהלך האונבורדינג",
    "carPayment": "תשלום רכב",
    "internet": "חשבון אינטרנט"
  },

  "budget": {
    "monthlyBudget": "תקציב חודשי",
    "enterAmount": "הכניסו סכום תקציב",
    "optional": "אופציונלי",
    "saving": "שומר..."
  },

  "exchange": {
    "title": "מחשבון המרות",
    "subtitle": "המרה בין מטבעות",
    "loading": "טוען שערי חליפין...",

    "error": {
      "title": "נכשל בטעינת שערי חליפין",
      "message": "לא ניתן לטעון את שערי החליפין העדכניים. אנא בדקו את החיבור.",
      "tryAgain": "נסו שוב"
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
      "liveRatesMobile": "שערים חיים • עדכון כל 5 דק",
      "availableCurrencies": "{{count}} מטבעות",
      "possiblePairs": "{{count}} מטבעות • {{pairs}} צמדים"
    },

    "currencies": {
      "USD": "דולר אמריקאי",
      "ILS": "שקל ישראלי",
      "EUR": "יורו",
      "GBP": "פאונד בריטי",
      "JPY": "יֵן יפני",
      "CAD": "דולר קנדי",
      "AUD": "דולר אוסטרלי",
      "CHF": "פרנק שוויצרי"
    }
  },

  he: {
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
        "operationSuccess": "Operation completed successfully"
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
        "fileTooLarge": "File size must be less than 5MB",
        "invalidFileType": "Please select a valid file type",
        "uploadFailed": "Upload failed. Please try again.",
        "databaseError": "Database error occurred",
        "queryFailed": "Query failed to execute",
        "connectionError": "Connection to database failed",
        "unexpectedError": "An unexpected error occurred",
        "operationTimeout": "Operation timed out. Please try again.",
        "unknownError": "An unknown error occurred",
        "generic": "Something went wrong. Please try again."
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

      "errors": {
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
      "generic": "אירעה שגיאה. אנא נסו שוב.",
      "network": "שגיאת רשת. אנא בדקו את החיבור שלכם.",
      "validation": "אנא בדקו את הטופס לשגיאות.",
      "unauthorized": "אין לכם הרשאה לבצע פעולה זו.",
      "notFound": "הפריט המבוקש לא נמצא.",
      "server": "שגיאת שרת. אנא נסו שוב מאוחר יותר.",
      "timeout": "פג זמן הבקשה. אנא נסו שוב.",
      "unknown": "אירעה שגיאה לא ידועה."
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
      "comingSoon": "בקרוב...",
      "refresh": "רענן",
      "delete": "מחק",
      "edit": "ערוך",
      "available": "זמין",
      "close": "סגור",
      "next": "הבא",
      "previous": "הקודם",
      "submit": "שלח",
      "reset": "איפוס",
      "search": "חפש",
      "filter": "סינון",
      "filters": "סינונים",
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
      "sessionOverrideActive": "עקיפת העדפות פעילה",
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
      "advanced": "פילטרים מתקדמים",
      "customRange": "טווח מותאם",
      "change": "שנה",
      "logout": "התנתק",
      "weak": "חלש",
      "fair": "בינוני",
      "good": "טוב",
      "strong": "חזק",
      "protected": "מוגן",
      "uploadFailed": "ההעלאה נכשלה. אנא נסה שוב.",
      "passwordMinLength": "הסיסמה חייבת להיות באורך של 8 תווים לפחות",
      "passwordsDoNotMatch": "הסיסמאות אינן תואמות",
      "usernameRequired": "שם משתמש נדרש"
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
      "recurringManagerDesc": "Manage your recurring transactions and templates"
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
      "stepAccountInfo": "פרטי חשבון",
      "stepSecurity": "אבטחה"
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
        "title": "סקירת יתרה",
        "subtitle": "הכנסות מול הוצאות",
        "error": "לא ניתן לטעון נתוני יתרה",
        "backToToday": "חזרה להיום",
        "income": "הכנסות",
        "expenses": "הוצאות",
        "total": "יתרה נטו",
        "periods": {
          "daily": "יומי",
          "weekly": "שבועי",
          "monthly": "חודשי",
          "yearly": "שנתי"
        }
      },

      "transactions": {
        "recent": "Recent Transactions",
        "latestActivity": "Latest Activity",
        "viewAll": "View All",
        "noTransactions": "No transactions yet",
        "noTransactionsDesc": "Start tracking your finances by adding your first transaction",
        "fetchError": "Unable to load transactions",
        "loading": "Loading transactions..."
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
      "recurringNote": "{{type}} זה/זו חוזר/ת אוטומטית. שינויים יכולים להשפיע על מופעים עתידיים."
    },

    "actions": {
      "title": "הוסף עסקה",
      "buttontitle": "הוסף עסקה חדשה",
      "detailedTransaction": "עסקה מפורטת",
      "chooseAction": "בחר את הפעולה למטה",
      "selectType": "בחר סוג עסקה",
      "smart": "חכם",
      "oneClick": "הוספה בקליק",
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
      "quickRecurring": "קבוע מהיר",
      "quickRecurringDesc": "הוסף הוצאה חוזרת חודשית",
      "quickAdd": "הוסף עסקה מהירה",
      "oneTimeExpense": "הוצאה חד פעמית",
      "oneTimeExpenseDesc": "הוסף עסקת הוצאה בודדת",
      "recurringExpense": "הוצאה חוזרת",
      "recurringExpenseDesc": "הגדר הוצאה חוזרת",
      "recurringSetup": "הגדרת חוזרת",
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
      "dayOfWeek": "יום בשבוע",
      "example": "דוגמה",
      "examples": "דוגמאות",
      "expenseExample": "לדוגמה: קניות, דלק, קניות",
      "recurringExpenseExample": "לדוגמה: שכר דירה, ביטוח, מנוי",
      "incomeExample": "לדוגמה: משכורת, בונוס, מתנה",
      "recurringIncomeExample": "לדוגמה: משכורת, דיבידנד, שכר דירה",

      "examplePlaceholders": {
        "coffee": "קפה עם חברים",
        "lunch": "ארוחת צהריים במסעדה",
        "salary": "משכורת חודשית",
        "rent": "שכר דירה חודשי"
      },

      "add": "הוסף עסקה",
      "addIncome": "הוסף הכנסה",
      "addExpense": "הוסף הוצאה",
      "success": "הצלחה!",
      "added": "נוסף!",
      "create": "צור",
      "update": "עדכן",

      "frequencies": {
        "daily": "יומי",
        "weekly": "שבועי",
        "monthly": "חודשי",
        "yearly": "שנתי",
        "oneTime": "חד פעמי"
      },

      "errors": {
        "amountRequired": "סכום נדרש",
        "categoryRequired": "אנא בחר קטגוריה",
        "formErrors": "אנא תקן את שגיאות הטופס",
        "addingTransaction": "שגיאה בהוספת עסקה",
        "updatingTransaction": "שגיאה בעדכון עסקה"
      },

      "new": "חדש",
      "e.g., Salary, Bonus, Gift": "לדוגמה: משכורת, בונוס, מתנה",
      "e.g., Salary, Dividend, Rental Income": "לדוגמה: משכורת, דיבידנד, הכנסה משכירות",
      "e.g., Groceries, Gas, Shopping": "לדוגמה: קניות מזון, דלק, קניות",
      "e.g., Rent, Insurance, Subscription": "לדוגמה: שכר דירה, ביטוח, מנוי",
      "expense": "הוצאה",
      "willUseDefault": "יעשה שימוש בקטגוריית ברירת המחדל",
      "defaultToday": "ברירת מחדל להיום",
      "monthlyIncome": "הכנסה חודשית",
      "income": "הכנסה",
      "monthlyExpense": "הוצאה חודשית",
      "willUseFirstCategory": "יעשה שימוש בקטגוריה הראשונה",
      "automaticPayments": "תשלומים אוטומטיים",
      "createRecurring": "צור חוזר",
      "amountRequired": "סכום נדרש",
      "dayOfMonth": "יום בחודש",
      "updateSuccess": "עודכן בהצלחה",
      "save": "Save",
      "cancel": "Cancel",
      "creating": "Creating...",
      "adding": "Adding...",
      "updating": "Updating...",
      "addSuccess": "Transaction Added Successfully",
      "historicalDateWarning": "Adding transaction to historical date",
      "goToToday": "Go to Today"
    },

    "categories": {
      "title": "קטגוריות",
      "manage": "נהל קטגוריות",
      "manageCategories": "ניהול קטגוריות",
      "wizardSubtitle": "ארגן את הכספים שלך כמו אשף",
      "addNew": "הוסף קטגוריה",
      "create": "צור קטגוריה",
      "createFirst": "צור קטגוריה ראשונה",
      "edit": "ערוך קטגוריה",
      "delete": "מחק קטגוריה",
      "deleteConfirm": "האם אתה בטוח שברצונך למחוק קטגוריה זו?",
      "name": "שם הקטגוריה",
      "nameRequired": "שם הקטגוריה נדרש",
      "description": "תיאור",
      "descriptionPlaceholder": "תיאור אופציונלי לקטגוריה",
      "type": "סוג",
      "icon": "אייקון",
      "userCategories": "הקטגוריות שלי",
      "userCategoriesDesc": "הקטגוריות האישיות שלך",
      "defaultCategories": "קטגוריות ברירת מחדל",
      "defaultCategoriesDesc": "קטגוריות מובנות במערכת",
      "noUserCategories": "עדיין לא יצרת קטגוריות משלך",
      "noUserCategoriesDesc": "צור קטגוריות מותאמות אישית לניהול הכספים שלך",
      "default": "ברירת מחדל",
      "selectCategory": "בחר קטגוריה",
      "selectCategoryHint": "אנא בחר קטגוריה עבור העסקה",
      "noCategoriesFound": "לא נמצאו קטגוריות",
      "createCategoriesFirst": "צור קטגוריות חדשות תחילה",
      "searchPlaceholder": "חפש קטגוריות...",
      "created": "הקטגוריה נוצרה בהצלחה",
      "updated": "הקטגוריה עודכנה בהצלחה",
      "deleted": "הקטגוריה נמחקה בהצלחה",
      "saveFailed": "שמירת הקטגוריה נכשלה",
      "deleteFailed": "מחיקת הקטגוריה נכשלה",
      "required": "חובה",
      "searchCategories": "חפש קטגוריות",
      "addCategory": "הוסף קטגוריה",
      "custom": "מותאם אישית",
      "noGeneralCategories": "אין קטגוריות כלליות זמינות",
      "defaultCategoriesWillAppear": "קטגוריות ברירת המחדל יופיעו כאן כשייטענו",
      "noCustomCategories": "אין קטגוריות מותאמות אישית זמינות",
      "createCategoriesInSettings": "צור קטגוריות מותאמות אישית בהגדרות",

      "filter": {
        "all": "הכל",
        "income": "הכנסות",
        "expense": "הוצאות"
      },

      "stats": {
        "total": "סה״כ קטגוריות",
        "personal": "קטגוריות אישיות",
        "default": "ברירת מחדל"
      },

      "themes": {
        "dailyExpenses": "הוצאות יומיומיות",
        "billsAndUtilities": "חשבונות ושירותים",
        "lifestyle": "אורח חיים",
        "professional": "מקצועי",
        "workIncome": "הכנסות מעבודה",
        "investments": "השקעות",
        "otherIncome": "הכנסות אחרות",
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
      "Rent": "שכירות",
      "Groceries": "מכולת",
      "Utilities": "חשבונות",
      "Phone Bill": "חשבון טלפון",
      "Insurance": "ביטוח",
      "Transportation": "תחבורה",
      "בנזין/תחבורה": "בנזין/תחבורה",
      "Car Payment": "תשלום רכב",
      "Public Transport": "תחבורה ציבורית",
      "Food": "אוכל",
      "Dining Out": "אוכל בחוץ",
      "Coffee & Drinks": "קפה ומשקאות",
      "Entertainment": "בידור",
      "בידור": "בידור",
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
      "אחר": "אחר",
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
      "בריאות": "בריאות",
      "חינוך": "חינוך",
      "חשבונות": "חשבונות",
      "טיפוח": "טיפוח",
      "מזון": "מזון",
      "מסעדות": "מסעדות",
      "נסיעות": "נסיעות",
      "ספורט": "ספורט",
      "צדקה": "צדקה",
      "קניות": "קניות",
      "השקעות": "השקעות",
      "מתנות": "מתנות",
      "פריים": "פרימיום",
      "משפחה": "משפחה",
      "עסקים": "עסקים",
      "משכורת": "משכורת",
      "עבודה עצמאית": "עבודה עצמאית",
      "הכנסה מהירה": "הכנסה מהירה",
      "מכולת": "מכולת",
      "תחבורה": "תחבורה",
      "הוצאה מהירה": "הוצאה מהירה",
      "כללי": "כללי",
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
      "emailNotEditable": "לא ניתן לשנות את הדואר האלקטרוני",
      "changePassword": "שינוי סיסמה",
      "currentPassword": "סיסמה נוכחית",
      "newPassword": "סיסמה חדשה",
      "confirmPassword": "אישור סיסמה חדשה",
      "changePhoto": "שנה תמונה",
      "uploadPhoto": "העלה תמונה",
      "photoHelper": "JPG, PNG או GIF. גודל מקסימלי 5MB",
      "uploading": "מעלה...",
      "photoUploaded": "התמונה הועלתה בהצלחה",
      "invalidImageType": "אנא בחר קובץ תמונה תקין (JPG, PNG, או GIF)",
      "imageTooLarge": "גודל התמונה חייב להיות פחות מ-5MB",
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
      "cancel": "ביטול",
      "updateSuccess": "הפרופיל עודכן בהצלחה",
      "updateError": "נכשל בעדכון הפרופיל",
      "saveError": "נכשל בשמירת השינויים",
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
        "totalTransactions": "סך העסקאות",
        "thisMonth": "החודש",
        "activeDays": "חבר כבר",
        "successRate": "אחוז הצלחה",
        "days": "ימים",
        "months": "חודשים",
        "years": "שנים"
      },

      "quickActions": "פעולות מהירות",
      "exportData": "ייצוא נתונים",
      "notifications": "התראות",
      "comingSoon": "בקרוב",
      "logoutConfirm": "אישור התנתקות",
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
      "languageChanged": "השפה שונתה בהצלחה",
      "currencyChanged": "המטבע שונה בהצלחה",

      "budget": {
        "monthlyBudget": "תקציב חודשי",
        "enterAmount": "הכניסו סכום תקציב",
        "optional": "אופציונלי"
      },

      "templates": {
        "quickSetup": "הגדרה מהירה",
        "yourTemplates": "התבניות שלכם",
        "setupComplete": "הגדרה הושלמה! {{count}} תבניות מוכנות",
        "setupOptional": "תבניות הן אופציונליות",
        "canAddMore": "תוכלו להוסיף עוד תבניות בכל זמן",
        "canSkipForNow": "תוכלו לדלג על השלב הזה ולהוסיף תבניות מאוחר יותר",
        "carPayment": "תשלום רכב",
        "internet": "שירות אינטרנט"
      },

      "recurring": {
        "whatAre": {
          "title": "מה הן עסקאות חוזרות?",
          "description": "עסקאות חוזרות הן תשלומים או הכנסות שקורים באופן קבוע - כמו המשכורת, שכר דירה, או מנויים חודשיים. במקום להכניס אותם ידנית בכל פעם, תוכלו להגדיר אותם פעם אחת ו-SpendWise יעקוב אחריהם אוטומטית."
        },

        "examples": {
          "title": "דוגמה",
          "demo": "הדגמה",
          "salaryDesc": "המשכורת החודשית שלכם מתווספת אוטומטית כהכנסה",
          "rentDesc": "תשלום שכר דירה חודשי נרשם כהוצאה",
          "phoneDesc": "חשבון הטלפון מנוכה אוטומטית כל חודש"
        },

        "benefits": {
          "title": "למה להשתמש בעסקאות חוזרות?",
          "timeTitle": "חיסכון בזמן",
          "timeDesc": "אין צורך להזין ידנית את אותן עסקאות כל חודש",
          "insightsTitle": "תובנות טובות יותר",
          "insightsDesc": "קבלו תחזיות מדויקות של המצב הכלכלי העתידי שלכם",
          "accuracyTitle": "דיוק מושלם",
          "accuracyDesc": "לעולם לא תשכחו לעקוב אחר תשלומים או הכנסות קבועות"
        },

        "cta": {
          "title": "מוכנים להגדיר את העסקאות החוזרות הראשונות שלכם?",
          "description": "בואו נוסיף כמה עסקאות חוזרות נפוצות כדי להתחיל.",
          "button": "הגדרת תבניות"
        }
      },

      "themeChanged": "ערכת הנושא שונתה בהצלחה",
      "passwordChanged": "הסיסמה שונתה בהצלחה",
      "incorrectPassword": "הסיסמה הנוכחית שגויה",
      "passwordChangeError": "נכשל בשינוי הסיסמה",
      "updatePassword": "עדכן סיסמה",
      "additionalSecurity": "אבטחה נוספת",
      "additionalSecurityDesc": "אימות דו-שלבי ותכונות אבטחה נוספות בקרוב",
      "customPreferences": "העדפות מותאמות אישית",
      "customPreferencesTitle": "נהל הגדרות מותאמות אישית",
      "addNewPreference": "הוסף העדפה חדשה",
      "preferenceKey": "שם ההגדרה",
      "preferenceType": "סוג נתונים",
      "preferenceValue": "ערך",
      "addPreference": "הוסף הגדרה",
      "noCustomPreferences": "אין העדפות מותאמות אישית עדיין",
      "preferenceAdded": "ההעדפה נוספה בהצלחה",
      "preferenceRemoved": "ההעדפה הוסרה בהצלחה",
      "saveCustomPreferences": "שמור העדפות מותאמות אישית",
      "customPreferencesSaved": "ההעדפות המותאמות אישית נשמרו בהצלחה",
      "advancedPreferences": "העדפות מתקדמות",
      "preferencesEditor": "עורך העדפות",
      "preferencesEditorInfo": "ערוך את ההעדפות שלך כ-JSON. היזהר עם התחביר!",
      "rawPreferences": "העדפות JSON גולמיות",
      "preferencesUpdated": "ההעדפות עודכנו בהצלחה",
      "saveAllPreferences": "שמור את כל ההעדפות",
      "commonPreferences": "העדפות נפוצות",
      "notificationPreferences": "העדפות התראות",
      "privacyPreferences": "העדפות פרטיות",

      "notificationTypes": {
        "email": "התראות דוא״ל",
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
        "csvDescription": "קובץ CSV (אקסל/גוגל שיטס)",
        "jsonDescription": "קובץ JSON (לייבוא לאפליקציות אחרות)",
        "invalidFormat": "פורמט יצוא לא תקין נבחר",
        "formatUnavailable": "יצוא {format} אינו זמין",
        "preparing": "מכין יצוא {format}...",
        "processing": "מעבד את הייצוא שלך...",
        "progressStatus": "יצוא {format}: {progress}% הושלם",
        "title": "יצא את הנתונים שלך",
        "subtitle": "בחר את הפורמט המועדף עליך להורדה",
        "dataIncluded": "מה כלול בייצוא שלך",
        "loadingOptions": "טוען אפשרויות ייצוא...",
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
        "userInfo": "יצוא עבור {username} • {currency} • {language}"
      },

      "errors": {
        "usernameRequired": "שם משתמש נדרש",
        "usernameTooShort": "שם המשתמש חייב להכיל לפחות 3 תווים",
        "emailRequired": "דואר אלקטרוני נדרש",
        "emailInvalid": "פורמט דואר אלקטרוני לא תקין",
        "keyRequired": "שם ההגדרה נדרש",
        "keyExists": "שם ההגדרה כבר קיים",
        "invalidJson": "פורמט JSON לא תקין",
        "invalidFileType": "אנא בחר קובץ תמונה",
        "fileTooLarge": "גודל הקובץ חייב להיות קטן מ-5MB",
        "uploadFailed": "העלאת התמונה נכשלה"
      }
    },

    "stats": {
      "title": "סטטיסטיקות",
      "overview": "סקירה",
      "currentBalance": "יתרה נוכחית",
      "monthlyIncome": "הכנסות חודשיות",
      "monthlyExpenses": "הוצאות חודשיות",
      "totalTransactions": "סך העסקאות",
      "activeRecurring": "מנויים פעילים",
      "quickOverview": "סקירה מהירה",
      "thisMonth": "החודש",
      "lastMonth": "החודש שעבר",
      "thisYear": "השנה",
      "allTime": "כל הזמנים",
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
        "invalidEmail": "כתובת דוא״ל לא תקינה",
        "invalidAmount": "סכום לא תקין",
        "invalidDate": "תאריך לא תקין",
        "passwordTooShort": "הסיסמה חייבת להכיל לפחות 8 תווים",
        "passwordsDontMatch": "הסיסאות אינן תואמות",
        "descriptionRequired": "תיאור נדרש",
        "endDateRequired": "תאריך סיום נדרש",
        "categoryRequired": "קטגוריה נדרשת",
        "usernameRequired": "שם משתמש נדרש",
        "emailRequired": "דוא״ל נדרש"
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
      "usernameTooShort": "שם המשתמש חייב להכיל לפחות 3 תווים",
      "emailRequired": "דואר אלקטרוני נדרש",
      "emailInvalid": "פורמט דואר אלקטרוני לא תקין",
      "passwordRequired": "סיסמה נדרשת",
      "passwordTooShort": "הסיסמה חייבת להכיל לפחות 8 תווים",
      "passwordNeedsNumber": "הסיסמה חייבת להכיל לפחות מספר אחד",
      "passwordNeedsUpper": "הסיסמה חייבת להכיל לפחות אות גדולה אחת",
      "passwordNeedsLower": "הסיסמה חייבת להכיל לפחות אות קטנה אחת",
      "passwordNeedsSpecial": "הסיסמה חייבת להכיל לפחות תו מיוחד אחד",
      "passwordsDontMatch": "הסיסאות אינן תואמות",
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
        "title": "ההרשמה הצליחה!",
        "message": "ההרשמה בוצעה בהצלחה! אנא התחבר כדי להמשיך."
      },

      "errors": {
        "registrationFailed": "ההרשמה נכשלה. אנא נסה שוב.",
        "emailExists": "הדוא״ל כבר קיים",
        "usernameExists": "שם המשתמש כבר תפוס"
      }
    },

    "calendar": {
      "weekDays": "['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']",
      "months": "['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']",
      "monthsShort": "['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳']",
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
      "resetSettings": "איפוס הגדרות",
      "required": "חובה",
      "compliance": "אתר זה תואם לתקנות נגישות בהתאם לתקן הישראלי (ת\"י 5568).",
      "accessibilityStatement": "הצהרת נגישות",

      "statement": {
        "title": "הצהרת נגישות",
        "intro": "אתר SpendWise מחויב להנגיש את שירותיו לאנשים עם מוגבלויות, בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות (התשנ\"ח-1998) ותקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע\"ג-2013.",
        "features": "תכונות נגישות באתר:",

        "featuresList": {
          "screenReader": "תאימות לקורא מסך",
          "colorContrast": "ניגודיות צבעים מתכווננת",
          "textSize": "התאמת גודל טקסט",
          "keyboardNav": "תמיכה בניווט במקלדת",
          "multiLanguage": "תמיכה בעברית ובאנגלית"
        },

        "level": "דרגת הנגישות:",
        "levelDescription": "אתר זה עומד ברמת תאימות AA לפי הנחיות WCAG 2.1 ועומד בתקן הישראלי (ת\"י 5568).",
        "contact": "יצירת קשר בנושאי נגישות:",
        "contactDescription": "אם נתקלת בבעיות נגישות או ברצונך לשלוח משוב לגבי הנגישות באתר, אנא צור קשר עם רכז הנגישות שלנו:",
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
          "content": "SpendWise (\"אנחנו\", \"שלנו\") מכבדת את פרטיותכם ומתחייבת להגן על המידע האישי שלכם בהתאם לחוק הגנת הפרטיות התשמ\"א-1981 ותקנותיו."
        },

        "dataCollection": {
          "title": "המידע שאנו אוספים",
          "content": "אנו אוספים מידע שאתם מספקים לנו ישירות (פרטי חשבון, נתונים פיננסיים) ומידע שנאסף אוטומטית דרך השימוש בשירות (נתוני שימוש, מידע על המכשיר)."
        },

        "dataUse": {
          "title": "איך אנו משתמשים במידע",
          "content": "המידע שלכם משמש לספק את שירותי ניהול הכספים, לשפר את חוויית המשתמש, להבטיח אבטחה ולעמוד בחובות חוקיות."
        },

        "dataProtection": {
          "title": "הגנה על המידע",
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
      "title": "תקנון שימוש",
      "lastUpdated": "עודכן לאחרונה: {{date}}",

      "sections": {
        "acceptance": {
          "title": "הסכמה לתנאים",
          "content": "על ידי שימוש ב-SpendWise, אתם מסכימים לתנאים והתנאים הללו. אם אינכם מסכימים, אנא הפסיקו להשתמש בשירות שלנו."
        },

        "service": {
          "title": "תיאור השירות",
          "content": "SpendWise מספקת כלים לניהול כספים אישיים כולל מעקב הוצאות, ניהול תקציב ואנליטיקה פיננסית."
        },

        "userResponsibilities": {
          "title": "אחריות המשתמש",
          "content": "אתם אחראים לשמירה על אבטחת החשבון, למתן מידע מדויק ולשימוש בשירות בהתאם לחוקים החלים."
        },

        "limitations": {
          "title": "מגבלות השירות",
          "content": "השירות שלנו מסופק \"כפי שהוא\" ללא אחריות. איננו אחראים להחלטות פיננסיות שנעשות על בסיס הכלים שלנו."
        },

        "termination": {
          "title": "סיום הסכם",
          "content": "כל צד יכול לסיים הסכם זה. עם הסיום, הגישה שלכם תיפסק אך זכויות שמירת הנתונים שלכם יישארו כפי שמפורט במדיניות הפרטיות."
        },

        "governingLaw": {
          "title": "חוק החל",
          "content": "תנאים אלה כפופים לחוק הישראלי. מחלוקות ייפתרו בבתי המשפט הישראליים."
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
      "description": "כלי חכם לניהול פיננסי אישי שעוזר לך לעקוב אחר הוצאות ולנהל את התקציב שלך ביעילות.",
      "navigation": "ניווט",
      "legal": "משפטי",
      "support": "תמיכה",
      "supportTitle": "תמיכה",
      "supportDescription": "לשאלות ותמיכה, אנא צרו קשר:",
      "privacy": "מדיניות פרטיות",
      "terms": "תנאי שימוש",
      "accessibility": "נגישות",
      "accessibilityStatement": "הצהרת נגישות",
      "copyright": "© {{year}} SpendWise. כל הזכויות שמורות.",
      "madeWith": "נעשה עם",
      "inIsrael": "בישראל",
      "close": "סגור",
      "followUs": "עקבו אחרינו",
      "newsletter": "ניוזלטר",
      "newsletterDesc": "קבלו טיפים פיננסיים ועדכונים"
    },

    "notFound": {
      "title": "הדף לא נמצא",
      "message": "הדף שאתה מחפש לא קיים.",
      "suggestion": "ייתכן שהוא הועבר, נמחק, או שהזנת כתובת שגויה.",
      "goHome": "חזרה לדשבורד",
      "needHelp": "צריך עזרה?",
      "helpMessage": "צור קשר עם צוות התמיכה אם אתה ממשיך להיתקל בבעיות."
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
            "description": "הפכו את ההכנסות וההוצאות הקבועות שלכם לאוטומטיות למעקב קל."
          },

          "analytics": {
            "title": "אנליטיקה חכמה",
            "description": "קבלו תובנות על דפוסי ההוצאות והמגמות הפיננסיות שלכם."
          },

          "security": {
            "title": "בטוח ופרטי",
            "description": "הנתונים הפיננסיים שלכם מוצפנים ומאוחסנים בבטחה."
          }
        },

        "highlight": {
          "title": "עסקאות חוזרות",
          "subtitle": "המפתח לניהול פיננסי קל",
          "description": "הגדירו עסקאות שקורות באופן קבוע - כמו משכורת, שכר דירה או מנויים - ו-SpendWise יעקוב אחריהן אוטומטית עבורכם."
        },

        "examples": {
          "salary": "משכורת חודשית",
          "rent": "תשלום דירה",
          "phone": "חשבון טלפון",
          "utilities": "שירותים"
        },

        "cta": {
          "description": "מוכנים להשתלט על הכספים שלכם? בואו נתחיל!",
          "button": "בואו נתחיל"
        },

        "stats": {
          "minutes": "דקות הגדרה",
          "steps": "שלבים פשוטים",
          "benefits": "יתרונות"
        }
      },

      "preferences": {
        "title": "התאימו את החוויה שלכם",
        "subtitle": "הגדירו את ההעדפות שלכם כדי להתאים אישית את SpendWise",
        "description": "הגדירו את ההגדרות האלה כדי להתאים אישית את חוויית SpendWise שלכם. תוכלו לשנות אותן בכל זמן בפרופיל שלכם.",
        "localization": "שפה ואזור",
        "language": "שפה",
        "currency": "מטבע",
        "appearance": "מראה",
        "theme": "נושא",

        "themes": {
          "light": "בהיר",
          "dark": "כהה",
          "system": "מערכת"
        },

        "budget": "תקציב חודשי",
        "monthlyBudget": "תקציב חודשי",
        "enterAmount": "הכניסו סכום תקציב",
        "saving": "שומר..."
      },

      "recurring": {
        "title": "הבנת עסקאות חוזרות",
        "subtitle": "למדו איך להפוך את המעקב הפיננסי לאוטומטי"
      },

      "templates": {
        "title": "הוסיפו את העסקאות החוזרות הראשונות שלכם",
        "subtitle": "הגדירו עסקאות חוזרות נפוצות כדי להתחיל"
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
      }
    },

    "recurring": {
      "whatAre": {
        "title": "מה הן עסקאות חוזרות?",
        "description": "עסקאות חוזרות הן תשלומים או הכנסות שקורים אוטומטית לפי לוח זמנים קבוע. במקום להכניס אותן ידנית בכל פעם, אתם מגדירים אותן פעם אחת ו-SpendWise מטפל בשאר."
      },

      "examples": {
        "title": "דוגמאות אמיתיות",
        "demo": "הפעל הדגמה",
        "salaryDesc": "ההכנסה החודשית שלכם נרשמת אוטומטית",
        "rentDesc": "תשלום דיור חודשי שלא נשכח אף פעם",
        "phoneDesc": "מנוי קבוע נרשם אוטומטית"
      },

      "benefits": {
        "title": "למה להשתמש בעסקאות חוזרות?",
        "timeTitle": "חוסך זמן",
        "timeDesc": "הגדרה פעם אחת, מעקב אוטומטי לתמיד",
        "insightsTitle": "תובנות טובות יותר",
        "insightsDesc": "רואים את דפוסי ההוצאות והמגמות האמיתיים שלכם",
        "accuracyTitle": "נשארים מדויקים",
        "accuracyDesc": "לא שוכחים תשלומים קבועים יותר"
      },

      "cta": {
        "title": "מוכנים להגדיר את העסקה החוזרת הראשונה שלכם?",
        "description": "בשלב הבא, נעזור לכם להוסיף עסקאות חוזרות נפוצות כדי להתחיל.",
        "button": "בואו נגדיר אותן"
      }
    },

    "templates": {
      "quickSetup": "הצעות הגדרה מהירה",
      "yourTemplates": "התבניות שלכם",
      "createCustom": "צור תבנית מותאמת אישית",
      "setupComplete": "מעולה! הגדרתם {{count}} עסקאות חוזרות",
      "setupOptional": "אין תבניות עדיין - זה בסדר!",
      "canAddMore": "תמיד אפשר להוסיף עוד מהדשבורד",
      "canSkipForNow": "אפשר להוסיף עסקאות חוזרות בכל זמן מהדשבורד שלכם",
      "addedFromOnboarding": "נוסף במהלך האונבורדינג",
      "carPayment": "תשלום רכב",
      "internet": "חשבון אינטרנט"
    },

    "budget": {
      "monthlyBudget": "תקציב חודשי",
      "enterAmount": "הכניסו סכום תקציב",
      "optional": "אופציונלי",
      "saving": "שומר..."
    },

    "exchange": {
      "title": "מחשבון המרות",
      "subtitle": "המרה בין מטבעות",
      "loading": "טוען שערי חליפין...",

      "error": {
        "title": "נכשל בטעינת שערי חליפין",
        "message": "לא ניתן לטעון את שערי החליפין העדכניים. אנא בדקו את החיבור.",
        "tryAgain": "נסו שוב"
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
        "liveRatesMobile": "שערים חיים • עדכון כל 5 דק",
        "availableCurrencies": "{{count}} מטבעות",
        "possiblePairs": "{{count}} מטבעות • {{pairs}} צמדים"
      },

      "currencies": {
        "USD": "דולר אמריקאי",
        "ILS": "שקל ישראלי",
        "EUR": "יורו",
        "GBP": "פאונד בריטי",
        "JPY": "יֵן יפני",
        "CAD": "דולר קנדי",
        "AUD": "דולר אוסטרלי",
        "CHF": "פרנק שוויצרי"
      }
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
      try {
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
          console.log(`🌐 [LANGUAGE] Storage change detected: ${language} → ${e.newValue}`);
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
        console.log(`🌐 [LANGUAGE] State update:`, {
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
        console.log(`🌐 [LANGUAGE] Session reset detected - clearing session overrides`);
        resetToSavedLanguage();
      } catch (error) {
        console.warn('🌐 [LANGUAGE] Error handling session reset:', error);
      }
    };

    const handleLanguageReset = () => {
      try {
        console.log(`🌐 [LANGUAGE] Language-specific reset detected`);
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