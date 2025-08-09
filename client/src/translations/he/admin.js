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
    searchPlaceholder: 'חפש משתמשים...',
    noUsers: 'לא נמצאו משתמשים',
    noUsersDesc: 'אין משתמשים התואמים לקריטריונים שלך',
    userDetails: 'פרטי משתמש',
  },

  // Table
  table: {
    user: 'משתמש',
    role: 'תפקיד',
    status: 'סטטוס',
    joinDate: 'תאריך הצטרפות',
    actions: 'פעולות',
  },

  // Filters
  filters: {
    allRoles: 'כל התפקידים',
    filterByRole: 'סנן לפי תפקיד',
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

  // Status
  status: {
    active: 'פעיל',
    blocked: 'חסום', 
    pending: 'ממתין',
    inactive: 'לא פעיל',
  },

  // Users Management - Additional keys
  users: {
    title: 'ניהול משתמשים',
    subtitle: 'ניהול חשבונות משתמשים והרשאות',
    searchPlaceholder: 'חפש משתמשים...',
    noUsers: 'לא נמצאו משתמשים',
    noUsersDesc: 'אין משתמשים התואמים לקריטריונים שלך',
    userDetails: 'פרטי משתמש',
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
  },

  // Errors - Additional keys
  errors: {
    statsLoadFailed: 'טעינת הסטטיסטיקות נכשלה',
    usersLoadFailed: 'טעינת המשתמשים נכשלה',
    actionFailed: 'הפעולה נכשלה',
    accessDenied: 'גישה נדחתה',
    adminRequired: 'נדרשות הרשאות מנהל לגישה לעמוד זה',
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