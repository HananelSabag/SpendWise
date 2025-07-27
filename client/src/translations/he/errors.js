/**
 * ❌ ERROR TRANSLATIONS - Hebrew
 * תרגומי שגיאות - עברית
 */

export default {
  // שגיאות כלליות
  genericError: 'משהו השתבש',
  unexpectedError: 'אירעה שגיאה לא צפויה',
  tryAgain: 'אנא נסה שוב',
  contactSupport: 'אנא פנה לתמיכה אם הבעיה נמשכת',
  
  // שגיאות רשת
  networkError: 'שגיאת רשת. אנא בדוק את החיבור שלך.',
  connectionError: 'לא ניתן להתחבר לשרת',
  timeoutError: 'הבקשה פגה',
  serverError: 'שגיאת שרת. אנא נסה שוב מאוחר יותר.',
  serviceUnavailable: 'השירות לא זמין זמנית',
  
  // שגיאות הזדהות
  unauthorized: 'אין לך הרשאה לבצע פעולה זו',
  accessDenied: 'הגישה נדחתה',
  sessionExpired: 'התחברותך פגה. אנא התחבר שוב.',
  invalidToken: 'אסימון הזדהות לא תקין',
  accountBlocked: 'החשבון שלך נחסם',
  accountDeleted: 'החשבון שלך נמחק',
  
  // שגיאות אימות
  required: 'שדה זה נדרש',
  invalid: 'ערך לא תקין',
  tooShort: 'הערך קצר מדי',
  tooLong: 'הערך ארוך מדי',
  invalidEmail: 'אנא הכנס כתובת אימייל תקינה',
  invalidPassword: 'הסיסמה חייבת להכיל לפחות 8 תווים',
  passwordsDoNotMatch: 'הסיסמאות אינן תואמות',
  invalidAmount: 'אנא הכנס סכום תקין',
  invalidDate: 'אנא הכנס תאריך תקין',
  invalidNumber: 'אנא הכנס מספר תקין',
  
  // שגיאות טפסים
  formErrors: 'אנא תקן את השגיאות בטופס',
  requiredFields: 'אנא מלא את כל השדות הנדרשים',
  invalidForm: 'הטופס מכיל נתונים לא תקינים',
  
  // שגיאות נתונים
  notFound: 'הפריט המבוקש לא נמצא',
  alreadyExists: 'הפריט כבר קיים',
  cannotDelete: 'לא ניתן למחוק פריט זה',
  cannotUpdate: 'לא ניתן לעדכן פריט זה',
  noDataAvailable: 'אין נתונים זמינים',
  
  // שגיאות עסקאות
  invalidTransaction: 'נתוני עסקה לא תקינים',
  transactionNotFound: 'העסקה לא נמצאה',
  categoryRequired: 'אנא בחר קטגוריה',
  amountRequired: 'סכום נדרש',
  descriptionRequired: 'תיאור נדרש',
  cannotDeleteRecurring: 'לא ניתן למחוק עסקה חוזרת',
  cannotModifyPast: 'לא ניתן לשנות עסקאות עבר',
  
  // שגיאות קטגוריות
  categoryInUse: 'לא ניתן למחוק קטגוריה שיש בה עסקאות',
  cannotDeleteDefault: 'לא ניתן למחוק קטגוריות ברירת מחדל',
  categoryNameRequired: 'שם קטגוריה נדרש',
  invalidCategoryType: 'סוג קטגוריה לא תקין',
  
  // שגיאות קבצים
  fileTooLarge: 'גודל הקובץ חייב להיות פחות מ-10MB',
  invalidFileType: 'אנא בחר סוג קובץ תקין',
  uploadFailed: 'ההעלאה נכשלה. אנא נסה שוב.',
  noFileSelected: 'לא נבחר קובץ',
  
  // שגיאות ייצוא
  exportFailed: 'הייצוא נכשל. אנא נסה שוב.',
  noDataToExport: 'אין נתונים זמינים לייצוא',
  exportLimitReached: 'יותר מדי בקשות ייצוא. אנא המתן רגע.',
  
  // הגבלת קצב
  tooManyRequests: 'יותר מדי בקשות. אנא האט.',
  rateLimitExceeded: 'חריגה מהגבלת קצב. אנא נסה שוב מאוחר יותר.',
  
  // שגיאות מסד נתונים
  databaseError: 'אירעה שגיאת מסד נתונים',
  queryFailed: 'השאילתה נכשלה',
  connectionLost: 'החיבור למסד הנתונים אבד',
  
  // שגיאות מנהל
  adminAccessRequired: 'נדרשת גישת מנהל',
  superAdminRequired: 'נדרשת גישת מנהל על',
  cannotModifyOwnRole: 'לא ניתן לשנות את התפקיד שלך',
  cannotDeleteYourself: 'לא ניתן למחוק את החשבון שלך',
  
  // שגיאות עסקאות חוזרות
  cannotSkipNonRecurring: 'לא ניתן לדלג על עסקה לא חוזרת',
  cannotToggleNonTemplate: 'לא ניתן להחליף עסקה שאינה תבנית',
  cannotSkipNonTemplate: 'לא ניתן לדלג על עסקה שאינה תבנית',
  unknownInterval: 'סוג מרווח לא ידוע',
  noNextPayment: 'אין תאריך תשלום הבא זמין',
  invalidRecurringRule: 'חוק חוזר לא תקין',
  
  // שגיאות לוגיקה עסקית
  insufficientFunds: 'אין מספיק כסף',
  budgetExceeded: 'חריגה מהתקציב',
  limitReached: 'הגעת למגבלה',
  operationNotAllowed: 'הפעולה אינה מורשית',
  
  // שגיאות אבטחה
  suspiciousActivity: 'זוהתה פעילות חשודה',
  securityViolation: 'הפרת אבטחה',
  ipBlocked: 'כתובת ה-IP שלך נחסמה',
  accountLocked: 'החשבון ננעל מסיבות אבטחה',
  
  // שגיאות מערכת
  maintenanceMode: 'המערכת בתחזוקה',
  featureDisabled: 'התכונה מושבתת כרגע',
  resourceUnavailable: 'המשאב לא זמין זמנית',
  capacityExceeded: 'חריגה מקיבולת המערכת',
  
  // הצעות שחזור
  refreshPage: 'נסה לרענן את הדף',
  clearCache: 'נסה לנקות את הזיכרון הזמני של הדפדפן',
  checkConnection: 'בדוק את החיבור לאינטרנט',
  loginAgain: 'נסה להתחבר שוב',
  contactAdmin: 'צור קשר עם המנהל',
  
  // פעולות משתמש שנכשלו
  operationFailed: 'הפעולה נכשלה',
  saveFailed: 'שמירת השינויים נכשלה',
  deleteFailed: 'מחיקת הפריט נכשלה',
  updateFailed: 'עדכון הפריט נכשל',
  createFailed: 'יצירת הפריט נכשלה',
  loadFailed: 'טעינת הנתונים נכשלה',
  
  // שגיאות חיבור
  noInternetConnection: 'אין חיבור לאינטרנט',
  checkConnectionAndRetry: 'אנא בדוק את החיבור ונסה שוב',
  connectionIssues: 'בעיות חיבור',
  unableToVerifyLogin: 'לא ניתן לאמת את ההתחברות. אנא נסה שוב.',
  
  // שגיאות הרשאות
  superAdminRequired: 'נדרשת גישת מנהל על',
  adminRequired: 'נדרשת גישת מנהל',
  noPermission: 'אין לך הרשאה לגשת לדף זה'
}; 