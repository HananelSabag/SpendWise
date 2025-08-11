/**
 * 🛡️ ADMIN TRANSLATIONS - Hebrew
 * Admin dashboard, user management, and system settings translations
 */

export default {
  // Dashboard
  dashboard: {
    title: 'לוח בקרה מנהל',
    subtitle: 'סקירת מערכת וניהול',
    welcome: 'ברוך הבא, {{name}}!',
    roleStatus: 'גישת מנהל מערכת'
  },

  // Dashboard Page
  dashboardPage: {
    title: 'לוח בקרה מנהל',
    subtitle: 'ניהול מערכת מלא וניהול משתמשים',
    welcome: 'ברוכים השבים',
    roleStatus: 'גישת מנהל מערכת'
  },

  // Stats
  stats: {
    totalUsers: 'סך הכל משתמשים',
    activeUsers: 'משתמשים פעילים',
    adminUsers: 'משתמשי מנהל',
    verifiedUsers: 'משתמשים מאומתים',
    totalTransactions: 'סך הכל עסקאות',
    totalCategories: 'סך הכל קטגוריות',
    systemHealth: 'בריאות המערכת',
    totalRevenue: 'סך כל הסכומים',
    thisMonth: 'החודש',
    today: 'היום',
    verified: 'מאומתים',
    fromAllTransactions: 'מכל הפעולות'
  },

  // System Status
  system: {
    status: 'סטטוס המערכת',
    server: 'שרת',
    online: 'מקוון',
    database: 'בסיס נתונים',
    connected: 'מחובר',
    security: 'אבטחה'
  },

  // Navigation & Pages
  systemStats: 'סטטיסטיקות מערכת',
  statsDescription: 'מדדי מערכת מקיפים ואנליטיקה',
  activityLog: 'יומן פעילות',
  activityDescription: 'מעקב אחר פעולות מנהל ופעילות מערכת',

  // Actions
  actions: {
    manageUsers: 'ניהול משתמשים',
    manageUsersDesc: 'צפייה וניהול חשבונות משתמשים',
    systemSettings: 'הגדרות מערכת',
    systemSettingsDesc: 'הגדרת פרמטרי מערכת',
    activityLog: 'יומן פעילות',
    activityLogDesc: 'צפייה בהיסטוריית פעילות מנהל',
    userBlocked: 'המשתמש נחסם בהצלחה',
    userUnblocked: 'חסימת המשתמש בוטלה בהצלחה',
    userDeleted: 'המשתמש נמחק בהצלחה',
  },

  // Users Management
  users: {
    title: 'ניהול משתמשים',
    subtitle: 'נהל {{total}} משתמשים ברחבי המערכת',
    searchPlaceholder: 'חפש משתמשים לפי שם, דוא"ל, שם משתמש...',
    noUsers: 'לא נמצאו משתמשים',
    noUsersDescription: 'נסה לשנות את קריטריוני החיפוש או הסינון.',
    userDetails: 'פרטי משתמש',
  },

  // Table
  table: {
    user: 'משתמש',
    role: 'תפקיד',
    status: 'סטטוס',
    activity: 'פעילות',
    joinDate: 'תאריך הצטרפות',
    actions: 'פעולות',
    selectAll: 'בחר הכל'
  },

  // Filters
  filters: {
    allRoles: 'כל התפקידים',
    allStatuses: 'כל הסטטוסים',
    allVerified: 'הכל',
    allActivity: 'הכל',
    verified: 'מאומת',
    unverified: 'לא מאומת',
    activeUsers: 'פעיל (7 ימים)',
    inactiveUsers: 'לא פעיל',
    filterByRole: 'סנן לפי תפקיד',
    role: 'תפקיד',
    status: 'סטטוס',
    verified: 'דוא"ל מאומת',
    activity: 'פעילות'
  },

  // Roles
  roles: {
    user: 'משתמש',
    admin: 'מנהל',
    superAdmin: 'מנהל על',
  },

  // Confirmations
  confirmations: {
    deleteUser: 'האם אתה בטוח שברצונך למחוק את המשתמש?',
  },

  // Dialogs
  dialogs: {
    deleteUser: {
      title: 'מחיקת משתמש',
      message: 'פעולה זו קבועה ותסיר את המשתמש וכל הנתונים הקשורים. ניתן לספק סיבה לצורך תיעוד.',
      reasonLabel: 'סיבה (אופציונלי)',
      reasonPlaceholder: 'הזן סיבה למחיקה...',
      confirm: 'מחק משתמש',
      cancel: 'בטל'
    },
    roleChange: {
      title: 'שינוי תפקיד משתמש',
      message: 'בחר תפקיד חדש למשתמש. השינוי נכנס לתוקף מיידית.',
      selectLabel: 'בחר תפקיד',
      confirm: 'עדכן תפקיד',
      cancel: 'בטל',
      success: 'תפקיד המשתמש עודכן בהצלחה'
    }
  },

  // Status
  status: {
    active: 'פעיל',
    blocked: 'חסום', 
    pending: 'ממתין',
    inactive: 'לא פעיל',
  },



  // Fields
  fields: {
    joinDate: 'תאריך הצטרפות',
    lastLogin: 'התחברות אחרונה',
    transactionCount: 'מספר עסקאות',
    totalSpent: 'סה"כ הוצאות',
  },

  // Common - Additional keys
  common: {
    refresh: 'רענן',
    loading: 'טוען...',
    error: 'שגיאה',
    success: 'הצלחה',
    never: 'אף פעם',
    users: 'משתמשים',
    selected: 'נבחרו',
    filters: 'מסננים'
  },

  // Bulk operations
  bulk: {
    block: 'חסום נבחרים',
    unblock: 'בטל חסימת נבחרים',
    delete: 'מחק נבחרים',
    export: 'ייצא נבחרים',
    actionSuccess: '{{action}} הושלם עבור {{count}} משתמשים',
    actionError: 'פעולה קבוצתית נכשלה'
  },

  // Errors - Additional keys
  errors: {
    statsLoadFailed: 'טעינת הסטטיסטיקות נכשלה',
    usersLoadFailed: 'טעינת המשתמשים נכשלה',
    actionFailed: 'הפעולה נכשלה',
    accessDenied: 'גישה נדחתה',
    adminRequired: 'נדרשות הרשאות מנהל לגישה לעמוד זה',
  },

  // Buttons
  buttons: {
    overview: 'סקירה',
    roleChange: 'שינוי תפקיד',
    block: 'חסום',
    unblock: 'בטל חסימה'
  },

  // Admin Settings
  settings: {
    title: 'הגדרות מערכת',
    description: 'קביעת הגדרות כלל-מערכתיות והעדפות (למנהל על בלבד)',
    categories: 'קטגוריות',
    general: 'כללי',
    security: 'אבטחה',
    email: 'דואל',
    features: 'תכונות',
    analytics: 'אנליטיקה',
    
    // General Settings
    siteName: 'שם האתר',
    siteNameDesc: 'שם האפליקציה שלך',
    userRegistration: 'רישום משתמשים',
    userRegistrationDesc: 'אפשר למשתמשים חדשים להירשם',
    emailVerification: 'נדרש אימות דואל',
    emailVerificationDesc: 'דרוש אימות דואל עבור חשבונות חדשים',
    googleOAuth: 'Google OAuth',
    googleOAuthDesc: 'הפעל אימות Google OAuth',
    
    // Security Settings
    maintenanceMode: 'מצב תחזוקה',
    maintenanceModeDesc: 'הפעל מצב תחזוקה להגבלת גישה',
    
    // Feature Settings
    analytics: 'מעקב אנליטיקה',
    analyticsDesc: 'הפעל אנליטיקה ומעקב שימוש',
    notifications: 'התראות מערכת',
    notificationsDesc: 'הפעל התראות כלל-מערכתיות',
    supportEmail: 'דוא"ל תמיכה',
    supportEmailDesc: 'כתובת הדוא"ל המרכזית לתמיכה',
    emailSenderName: 'שם שולח הדוא"ל',
    emailSenderNameDesc: 'שם התצוגה בהודעות דוא"ל מערכת',
    analyticsProvider: 'ספק אנליטיקה',
    analyticsProviderDesc: 'מזהה (למשל plausible, ga4) לשילוב בצד הלקוח',
    
    // Status Messages
    loaded: 'הגדרות נטענו בהצלחה',
    loadError: 'נכשל בטעינת הגדרות',
    saved: 'הגדרות נשמרו בהצלחה',
    saveError: 'נכשל בשמירת הגדרות',
    
    // API Integration
    apiReady: 'מערכת הגדרות מוכנה',
    apiDesc: 'הממשק מוכן לחיבור API בצד השרת. הגדרות נמצאות במצב הדגמה.'
  },
}; 