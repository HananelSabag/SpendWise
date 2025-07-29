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
  },

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
    subtitle: 'ניהול חשבונות משתמשים והרשאות',
    searchPlaceholder: 'חפש משתמשים...',
    noUsers: 'לא נמצאו משתמשים',
    noUsersDesc: 'אין משתמשים התואמים לקריטריונים שלך',
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

  // System
  system: {
    status: 'סטטוס',
    server: 'שרת',
    database: 'מסד נתונים',
    security: 'אבטחה',
    online: 'מקוון',
    connected: 'מחובר',
  },

  // Common
  common: {
    refresh: 'רענן',
    loading: 'טוען...',
    error: 'שגיאה',
    success: 'הצלחה',
  },

  // Errors
  errors: {
    statsLoadFailed: 'טעינת הסטטיסטיקות נכשלה',
    usersLoadFailed: 'טעינת המשתמשים נכשלה',
    actionFailed: 'הפעולה נכשלה',
  },
}; 