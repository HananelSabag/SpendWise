/**
 * 🍞 TOAST TRANSLATIONS - HEBREW  
 * Complete toast notification system translations
 * @version 1.0.0
 */

export default {
  // ✅ Authentication Toasts
  auth: {
    loginSuccess: "ברוכים השבים!",
    loginFailed: "ההתחברות נכשלה. אנא בדקו את פרטי הגישה שלכם.",
    logoutSuccess: "התנתקתם בהצלחה",
    logoutFailed: "נכשל להתנתק. אנא נסו שוב.",
    registrationSuccess: "החשבון נוצר בהצלחה! אנא בדקו את האימייל שלכם לאימות.",
    registrationFailed: "ההרשמה נכשלה. אנא נסו שוב.",
    googleLoginSuccess: "התחברתם בהצלחה עם Google!",
    googleLoginFailed: "ההתחברות עם Google נכשלה. אנא נסו שוב.",
    passwordResetSent: "הוראות איפוס סיסמה נשלחו לאימייל שלכם",
    passwordResetSuccess: "הסיסמה אופסה בהצלחה!",
    passwordResetFailed: "איפוס הסיסמה נכשל. אנא נסו שוב.",
    emailVerified: "האימייל אומת בהצלחה!",
    emailVerificationFailed: "אימות האימייל נכשל. אנא נסו שוב.",
    sessionExpired: "הפגישה שלכם פגה. אנא התחברו שוב.",
    unauthorizedAccess: "הגישה נדחתה. אנא התחברו כדי להמשיך.",
    accountLocked: "החשבון נחסם זמנית מסיבות אבטחה.",
    invalidCredentials: "אימייל או סיסמה שגויים. אנא נסו שוב.",
    networkError: "שגיאת רשת. אנא בדקו את החיבור שלכם ונסו שוב."
  },

  // ✅ Profile Management Toasts
  profile: {
    profileUpdated: "הפרופיל עודכן בהצלחה!",
    profileUpdateFailed: "עדכון הפרופיל נכשל. אנא נסו שוב.",
    avatarUploaded: "תמונת הפרופיל עודכנה בהצלחה!",
    avatarUploadFailed: "העלאת תמונת הפרופיל נכשלה. אנא נסו שוב.",
    avatarTooLarge: "תמונת הפרופיל חייבת להיות קטנה מ-5MB",
    preferencesUpdated: "ההעדפות עודכנו בהצלחה!",
    preferencesUpdateFailed: "עדכון ההעדפות נכשל. אנא נסו שוב.",
    passwordChanged: "הסיסמה שונתה בהצלחה!",
    passwordChangeFailed: "שינוי הסיסמה נכשל. אנא נסו שוב.",
    passwordMismatch: "הסיסמאות לא תואמות",
    passwordTooShort: "הסיסמה חייבת להיות לפחות 8 תווים",
    currentPasswordWrong: "הסיסמה הנוכחית שגויה",
    requiredFieldsMissing: "אנא מלאו את כל השדות הנדרשים"
  },

  // ✅ Data Export Toasts
  export: {
    csvExportStarted: "יצוא CSV החל - ההורדה תתחיל בקרוב",
    jsonExportStarted: "יצוא JSON החל - ההורדה תתחיל בקרוב",
    pdfExportStarted: "יצוא PDF החל - ההורדה תתחיל בקרוב",
    exportCompleted: "יצוא הנתונים הושלם בהצלחה!",
    exportFailed: "יצוא הנתונים נכשל. אנא נסו שוב.",
    csvExportFailed: "יצוא נתוני CSV נכשל",
    jsonExportFailed: "יצוא נתוני JSON נכשל",
    pdfExportFailed: "יצוא נתוני PDF נכשל",
    noDataToExport: "אין נתונים זמינים ליצוא",
    exportTooLarge: "נתוני היצוא גדולים מדי. אנא נסו עם טווח תאריכים קטן יותר."
  },

  // ✅ Transaction Management Toasts
  transactions: {
    transactionCreated: "העסקה נוצרה בהצלחה!",
    transactionUpdated: "העסקה עודכנה בהצלחה!",
    transactionDeleted: "העסקה נמחקה בהצלחה!",
    transactionCreateFailed: "יצירת העסקה נכשלה. אנא נסו שוב.",
    transactionUpdateFailed: "עדכון העסקה נכשל. אנא נסו שוב.",
    transactionDeleteFailed: "מחיקת העסקה נכשלה. אנא נסו שוב.",
    invalidAmount: "אנא הזינו סכום תקין",
    invalidDate: "אנא בחרו תאריך תקין",
    categoryRequired: "אנא בחרו קטגוריה",
    descriptionRequired: "אנא הזינו תיאור",
    bulkImportCompleted: "יבוא המוני הושלם בהצלחה!",
    bulkImportFailed: "היבוא ההמוני נכשל. אנא בדקו את פורמט הקובץ.",
    duplicateTransactionWarning: "העסקה הזו עלולה להיות כפולה"
  },

  // ✅ Category Management Toasts
  categories: {
    categoryCreated: "הקטגוריה נוצרה בהצלחה!",
    categoryUpdated: "הקטגוריה עודכנה בהצלחה!",
    categoryDeleted: "הקטגוריה נמחקה בהצלחה!",
    categoryCreateFailed: "יצירת הקטגוריה נכשלה. אנא נסו שוב.",
    categoryUpdateFailed: "עדכון הקטגוריה נכשל. אנא נסו שוב.",
    categoryDeleteFailed: "מחיקת הקטגוריה נכשלה. אנא נסו שוב.",
    categoryNameRequired: "שם הקטגוריה נדרש",
    categoryNameExists: "קטגוריה עם השם הזה כבר קיימת",
    categoryInUse: "לא ניתן למחוק קטגוריה הנמצאת בשימוש על ידי עסקאות",
    invalidCategoryIcon: "אנא בחרו סמל קטגוריה תקין",
    categoryLimitReached: "הגעתם למספר המקסימלי של קטגוריות"
  },

  // ✅ Settings & Preferences Toasts
  settings: {
    settingsSaved: "ההגדרות נשמרו בהצלחה!",
    settingsResetToDefault: "ההגדרות אופסו לערכי ברירת המחדל",
    settingsSaveFailed: "שמירת ההגדרות נכשלה. אנא נסו שוב.",
    themeChanged: "הנושא שונה בהצלחה!",
    languageChanged: "השפה שונתה בהצלחה!",
    currencyChanged: "המטבע שונה בהצלחה!",
    notificationsEnabled: "הודעות הופעלו בהצלחה!",
    notificationsDisabled: "הודעות בוטלו בהצלחה!",
    accessibilityEnabled: "תכונות נגישות הופעלו",
    accessibilityDisabled: "תכונות נגישות בוטלו"
  },

  // ✅ Data & Sync Toasts
  data: {
    dataLoaded: "הנתונים נטענו בהצלחה!",
    dataRefreshed: "הנתונים רוענו בהצלחה!",
    dataSynced: "הנתונים סונכרנו בהצלחה!",
    dataLoadFailed: "טעינת הנתונים נכשלה. אנא רעננו את הדף.",
    dataRefreshFailed: "רענון הנתונים נכשל. אנא נסו שוב.",
    dataSyncFailed: "סינכרון הנתונים נכשל. אנא בדקו את החיבור שלכם.",
    offlineMode: "אתם כרגע לא מחוברים. השינויים יסונכרנו כשהחיבור יחזור.",
    connectionRestored: "החיבור חזר! הנתונים מסונכרנים.",
    backupCreated: "גיבוי נתונים נוצר בהצלחה!",
    backupRestored: "גיבוי נתונים שוחזר בהצלחה!",
    backupFailed: "פעולת הגיבוי נכשלה. אנא נסו שוב."
  },

  // ✅ Validation & Error Toasts
  validation: {
    requiredField: "שדה זה נדרש",
    invalidEmail: "אנא הזינו כתובת אימייל תקינה",
    invalidPhone: "אנא הזינו מספר טלפון תקין",
    invalidUrl: "אנא הזינו כתובת אתר תקינה",
    invalidDate: "אנא בחרו תאריך תקין",
    invalidNumber: "אנא הזינו מספר תקין",
    invalidFormat: "פורמט לא תקין. אנא בדקו את הקלט שלכם.",
    fileTooLarge: "הקובץ גדול מדי. גודל מקסימלי הוא {maxSize}",
    invalidFileType: "סוג קובץ לא תקין. סוגים מותרים: {allowedTypes}",
    characterLimit: "מותרים עד {limit} תווים"
  },

  // ✅ System & Technical Toasts
  system: {
    pageNotFound: "הדף לא נמצא. מפנה ללוח הבקרה...",
    accessDenied: "הגישה נדחתה. אין לכם הרשאה לצפות בדף זה.",
    maintenanceMode: "המערכת בתחזוקה. אנא נסו שוב מאוחר יותר.",
    updateAvailable: "גרסה חדשה זמינה. אנא רעננו את הדף.",
    sessionTimeout: "אזהרת תום פגישה. הפגישה שלכם תפוג בעוד 5 דקות.",
    featureNotAvailable: "התכונה הזו לא זמינה בתוכנית הנוכחית שלכם",
    browserNotSupported: "הדפדפן שלכם לא נתמך. אנא עדכנו כדי להמשיך.",
    cookiesRequired: "נדרשים עוגיות כדי שהאפליקציה תעבוד כראוי",
    storageQuotaExceeded: "מכסת האחסון חרגה. אנא מחקו מידע כלשהו."
  },

  // ✅ Success Actions
  success: {
    actionCompleted: "הפעולה הושלמה בהצלחה!",
    changesSaved: "השינויים שלכם נשמרו",
    operationSuccess: "הפעולה הושלמה בהצלחה!",
    requestProcessed: "הבקשה שלכם עובדה",
    emailSent: "האימייל נשלח בהצלחה!",
    invitationSent: "ההזמנה נשלחה בהצלחה!",
    feedbackSubmitted: "תודה על המשוב שלכם!",
    supportTicketCreated: "פנייה לתמיכה נוצרה בהצלחה!"
  },

  // ✅ Loading & Progress
  loading: {
    pleaseWait: "אנא המתינו...",
    loading: "טוען...",
    processing: "מעבד את הבקשה שלכם...",
    saving: "שומר שינויים...",
    uploading: "מעלה קובץ...",
    downloading: "מוריד...",
    synchronizing: "מסנכרן נתונים...",
    connecting: "מתחבר...",
    preparing: "מכין...",
    almostDone: "כמעט סיימנו..."
  },

  // ✅ Common Actions
  common: {
    copied: "הועתק ללוח!",
    linkCopied: "הקישור הועתק ללוח!",
    imageDownloaded: "התמונה הורדה בהצלחה!",
    fileSaved: "הקובץ נשמר בהצלחה!",
    undoAction: "הפעולה בוטלה בהצלחה",
    redoAction: "הפעולה חזרה בהצלחה",
    itemAdded: "הפריט נוסף בהצלחה!",
    itemRemoved: "הפריט הוסר בהצלחה!",
    itemUpdated: "הפריט עודכן בהצלחה!",
    searchCompleted: "החיפוש הושלם",
    filterApplied: "הסינון הוחל בהצלחה",
    sortApplied: "המיון הוחל בהצלחה"
  }
}; 