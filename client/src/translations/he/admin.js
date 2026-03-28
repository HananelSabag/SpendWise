/**
 * 🛡️ ADMIN TRANSLATIONS - Hebrew
 * Admin dashboard, user management, and system settings translations
 */

export default {
  dashboard: {
    title: "לוח בקרה מנהל",
    subtitle: "סקירת מערכת וניהול",
    welcome: "ברוך הבא, {{name}}!",
    roleStatus: "גישת מנהל מערכת"
  },
  filtersTitle: "סינונים",
  settingsAction: "הגדרות",
  backToDashboard: "חזרה ללוח הבקרה",
  dashboardPage: {
    title: "לוח בקרה מנהל",
    subtitle: "ניהול מערכת מלא וניהול משתמשים",
    welcome: "ברוכים השבים",
    roleStatus: "גישת מנהל מערכת",
    recentActivity: "פעילות אחרונה",
    liveEvents: "אירועי מערכת חיים"
  },
  activity: {
    empty: "אין פעילות אחרונה",
    invalidDate: "תאריך לא תקין",
    noActivity: "אין פעילות עדיין",
    noActivities: "לא נמצאו פעילויות",
    ofActivities: "{{shown}} מתוך {{total}} פעילויות",
    todaysActions: "פעולות היום",
    activeAdmins: "מנהלים פעילים",
    securityEvents: "אירועי אבטחה"
  },
  stats: {
    totalUsers: "סך הכל משתמשים",
    activeUsers: "משתמשים פעילים",
    adminUsers: "משתמשי מנהל",
    verifiedUsers: "משתמשים מאומתים",
    totalTransactions: "סך הכל עסקאות",
    totalCategories: "סך הכל קטגוריות",
    systemHealth: "בריאות המערכת",
    totalRevenue: "סך כל הסכומים",
    thisMonth: "החודש",
    today: "היום",
    verified: "מאומתים",
    fromAllTransactions: "מכל הפעולות",
    uptime: "זמינות",
    chartLoading: "הגרף יטען כאן",
    avgResponseTime: "זמן תגובה ממוצע",
    cacheHitRate: "אחוז פגיעות מטמון",
    activeConnections: "חיבורים פעילים",
    apiRequests: "בקשות API",
    userGrowth: "גדילת משתמשים",
    transactionVolume: "נפח עסקאות",
    performanceMetrics: "מדדי ביצועים",
    realtimeStats: "סטטיסטיקות בזמן אמת"
  },
  system: {
    status: "סטטוס המערכת",
    server: "שרת",
    online: "מקוון",
    database: "בסיס נתונים",
    connected: "מחובר",
    security: "אבטחה",
    realtimeHealth: "בריאות מערכת בזמן אמת",
    uptimePlaceholder: "99.9% זמינות",
    responsePlaceholder: "תגובה: 45ms",
    allChecksPassing: "כל הבדיקות עוברות"
  },
  systemStats: "סטטיסטיקות מערכת",
  statsDescription: "מדדי מערכת מקיפים ואנליטיקה",
  activityLog: "יומן פעילות",
  activityDescription: "מעקב אחר פעולות מנהל ופעילות מערכת",
  actions: {
    manageUsers: "ניהול משתמשים",
    manageUsersDesc: "צפייה וניהול חשבונות משתמשים",
    systemSettings: "הגדרות מערכת",
    systemSettingsDesc: "הגדרת פרמטרי מערכת",
    activityLog: "יומן פעילות",
    activityLogDesc: "צפייה בהיסטוריית פעילות מנהל",
    userBlocked: "המשתמש נחסם בהצלחה",
    userUnblocked: "חסימת המשתמש בוטלה בהצלחה",
    userDeleted: "המשתמש נמחק בהצלחה",
    systemControls: "בקרות מערכת",
    liveMonitoring: "ניטור חי"
  },
  users: {
    title: "ניהול משתמשים",
    subtitle: "נהל {{total}} משתמשים ברחבי המערכת",
    searchPlaceholder: "חפש משתמשים לפי שם, דוא\"ל, שם משתמש...",
    noUsers: "לא נמצאו משתמשים",
    noUsersDescription: "נסה לשנות את קריטריוני החיפוש או הסינון.",
    userDetails: "פרטי משתמש"
  },
  table: {
    user: "משתמש",
    role: "תפקיד",
    status: "סטטוס",
    activity: "פעילות",
    joinDate: "תאריך הצטרפות",
    actions: "פעולות",
    selectAll: "בחר הכל",
    when: "מתי",
    admin: "מנהל",
    action: "פעולה",
    target: "יעד"
  },
  filters: {
    allRoles: "כל התפקידים",
    allStatuses: "כל הסטטוסים",
    allVerified: "הכל",
    allActivity: "הכל",
    verified: "דוא\"ל מאומת",
    unverified: "לא מאומת",
    activeUsers: "פעיל (7 ימים)",
    inactiveUsers: "לא פעיל",
    filterByRole: "סנן לפי תפקיד",
    role: "תפקיד",
    status: "סטטוס",
    activity: "פעילות"
  },
  roles: {
    user: "משתמש",
    admin: "מנהל",
    superAdmin: "מנהל על"
  },
  confirmations: {
    deleteUser: "האם אתה בטוח שברצונך למחוק את המשתמש?"
  },
  dialogs: {
    deleteUser: {
      title: "מחיקת משתמש",
      message: "פעולה זו קבועה ותסיר את המשתמש וכל הנתונים הקשורים. ניתן לספק סיבה לצורך תיעוד.",
      reasonLabel: "סיבה (אופציונלי)",
      reasonPlaceholder: "הזן סיבה למחיקה...",
      confirm: "מחק משתמש",
      cancel: "בטל"
    },
    roleChange: {
      title: "שינוי תפקיד משתמש",
      message: "בחר תפקיד חדש למשתמש. השינוי נכנס לתוקף מיידית.",
      selectLabel: "בחר תפקיד",
      confirm: "עדכן תפקיד",
      cancel: "בטל",
      success: "תפקיד המשתמש עודכן בהצלחה"
    }
  },
  status: {
    active: "פעיל",
    blocked: "חסום",
    pending: "ממתין",
    inactive: "לא פעיל"
  },
  fields: {
    joinDate: "תאריך הצטרפות",
    lastLogin: "התחברות אחרונה",
    transactionCount: "מספר עסקאות",
    totalSpent: "סה\"כ הוצאות"
  },
  common: {
    refresh: "רענן",
    loading: "טוען...",
    error: "שגיאה",
    success: "הצלחה",
    never: "אף פעם",
    users: "משתמשים",
    selected: "נבחרו",
    filters: "מסננים",
    retry: "נסה שוב",
    backToDashboard: "חזרה ללוח הבקרה"
  },
  bulk: {
    block: "חסום נבחרים",
    unblock: "בטל חסימת נבחרים",
    delete: "מחק נבחרים",
    export: "ייצא נבחרים",
    clearSelection: "נקה בחירה",
    actionSuccess: "{{action}} הושלם עבור {{count}} משתמשים",
    actionError: "פעולה קבוצתית נכשלה",
    noSelection: "לא נבחרו משתמשים",
    notSupported: "פעולות קבוצתיות לא נתמכות",
    processing: "מעבד {{count}} משתמשים...",
    blockSuccess: "חסם בהצלחה {{count}} משתמשים",
    blockError: "נכשל בחסימת {{count}} משתמשים",
    unblockSuccess: "ביטל חסימה בהצלחה עבור {{count}} משתמשים",
    unblockError: "נכשל בביטול חסימת {{count}} משתמשים",
    deleteSuccess: "נמחק בהצלחה {{count}} משתמשים",
    deleteError: "נכשל במחיקת {{count}} משתמשים",
    exportSuccess: "יוצא בהצלחה {{count}} משתמשים",
    exportError: "נכשל בייצוא משתמשים",
    noDataToExport: "אין נתונים לייצוא",
    unknownAction: "פעולה לא ידועה"
  },
  errors: {
    statsLoadFailed: "טעינת הסטטיסטיקות נכשלה",
    usersLoadFailed: "טעינת המשתמשים נכשלה",
    actionFailed: "הפעולה נכשלה",
    accessDenied: "גישה נדחתה",
    adminRequired: "נדרשות הרשאות מנהל לגישה לעמוד זה",
    loadFailed: "נכשל בטעינת נתונים",
    generic: "משהו השתבש",
    permissionDenied: "אין הרשאה"
  },
  buttons: {
    overview: "סקירה",
    roleChange: "שינוי תפקיד",
    block: "חסום",
    unblock: "בטל חסימה",
    goToDashboard: "עבור לדף הבית",
    refreshPage: "רענן דף",
    exportCsv: "ייצא CSV",
    multiSelect: "בחירה מרובה"
  },
  multiSelect: {
    hint: "מצב בחירה מרובה פעיל - לחץ על משתמשים לבחירה"
  },
  csvHeaders: {
    name: "שם",
    email: "דוא\"ל",
    role: "תפקיד",
    status: "סטטוס",
    transactions: "עסקאות",
    totalAmount: "סכום כולל",
    currency: "מטבע",
    joinDate: "תאריך הצטרפות"
  },
  timeAgo: {
    justNow: "כעת",
    minutesAgo: "{{minutes}} דק",
    hoursAgo: "{{hours}} שע",
    daysAgo: "{{days}} ימים"
  },
  accessibility: {
    manageUsersLabel: "ניהול משתמשים",
    systemSettingsLabel: "הגדרות מערכת",
    activityLogLabel: "יומן פעילות"
  },
  settings: {
    title: "הגדרות מערכת",
    description: "קביעת הגדרות כלל-מערכתיות והעדפות (למנהל על בלבד)",
    categories: "קטגוריות",
    general: "כללי",
    security: "אבטחה",
    email: "דואל",
    features: "תכונות",
    analytics: "מעקב אנליטיקה",
    siteName: "שם האתר",
    siteNameDesc: "שם האפליקציה שלך",
    userRegistration: "רישום משתמשים",
    userRegistrationDesc: "אפשר למשתמשים חדשים להירשם",
    emailVerification: "נדרש אימות דואל",
    emailVerificationDesc: "דרוש אימות דואל עבור חשבונות חדשים",
    googleOAuth: "Google OAuth",
    googleOAuthDesc: "הפעל אימות Google OAuth",
    maintenanceMode: "מצב תחזוקה",
    maintenanceModeDesc: "הפעל מצב תחזוקה להגבלת גישה",
    analyticsDesc: "הפעל אנליטיקה ומעקב שימוש",
    notifications: "התראות מערכת",
    notificationsDesc: "הפעל התראות כלל-מערכתיות",
    supportEmail: "דוא\"ל תמיכה",
    supportEmailDesc: "כתובת הדוא\"ל המרכזית לתמיכה",
    emailSenderName: "שם שולח הדוא\"ל",
    emailSenderNameDesc: "שם התצוגה בהודעות דוא\"ל מערכת",
    analyticsProvider: "ספק אנליטיקה",
    analyticsProviderDesc: "מזהה (למשל plausible, ga4) לשילוב בצד הלקוח",
    loaded: "הגדרות נטענו בהצלחה",
    loadError: "נכשל בטעינת הגדרות",
    saved: "הגדרות נשמרו בהצלחה",
    saveError: "נכשל בשמירת הגדרות",
    apiReady: "מערכת הגדרות מוכנה",
    apiDesc: "הממשק מוכן לחיבור API בצד השרת. הגדרות נמצאות במצב הדגמה.",
    save: "שמור שינויים",
    saving: "שומר...",
    reset: "איפוס לברירות מחדל"
  },
  actionType: "סוג פעולה",
  adminUser: "מנהל מערכת",
  allActions: "כל הפעולות",
  allAdmins: "כל המנהלים",
  allTime: "כל הזמן",
  applyFilters: "החל סינונים",
  dateRange: "טווח תאריכים",
  filtersDescription: "סנן וחפש ביומני פעילות",
  last24Hours: "24 שעות אחרונות",
  last30Days: "30 ימים אחרונים",
  last7Days: "7 ימים אחרונים",
  recentActivity: "פעילות אחרונה",
  roleChange: "שינוי תפקיד",
  userBlock: "חסימת משתמש",
  userDelete: "מחיקת משתמש",
  userManagement: "ניהול משתמשים"
};
