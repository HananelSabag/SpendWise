/**
 * BANK SYNC TRANSLATIONS - Hebrew
 */

export default {
  // Panel / page title
  title: 'סנכרון בנק',
  subtitle: 'אינטגרציה עם bank-scraper',
  refresh: 'רענן נתונים',

  // Account balance
  accountBalance: 'יתרת חשבון',
  unavailable: 'לא זמין',
  unavailableNote: '{{bank}} אינו חושף יתרת חשבון דרך ספריית הסקרייפר',
  mainAccount: 'חשבון ראשי',
  balanceUnavailableNote: 'הבנק לא חושף יתרה דרך הספרייה — זמין רק בתוך אתר הבנק',

  // Transaction summary
  income: 'הכנסות',
  expenses: 'הוצאות',
  netActivity: 'נטו פעילות',
  transactions: '{{count}} תנועות',
  transactionsShort: 'תנועות',

  // Time
  justNow: 'כרגע',
  minutesAgo: 'לפני {{n}} דק\'',
  hoursAgo: 'לפני {{n}} שע\'',
  daysAgo: 'לפני {{n}} ימ\'',
  updatedAt: 'עודכן {{time}}',
  lastSync: 'סנכרון אחרון',
  syncedDaily: 'מסונכרן דרך bank-scraper · 3× ביום',

  // Empty / not synced
  notSynced: 'לא סונכרן אף בנק עדיין',
  notSyncedYet: 'לא מסונכרן עדיין',
  runScraper: 'הרץ את bank-scraper כדי לשלוף עסקאות',

  // Bank card
  enableBank: 'הפעל בנק',
  disableBank: 'כבה בנק',
  bankDisabledNote: 'עסקאות מבנק זה מוסתרות מהחישובים',

  // Load error
  loadError: 'לא ניתן לטעון נתוני סנכרון',

  // Remote trigger section
  remoteTrigger: 'טריגר מרחוק (serve.js)',
  serverUrl: 'כתובת שרת',
  enterServerAndKey: 'הכנס כתובת שרת ו-API Key',
  syncNow: 'סנכרן עכשיו',
  syncing: 'מסנכרן...',
  syncStarted: 'הסנכרון התחיל! הנתונים יופיעו כאן תוך כמה דקות',
  errorStatus: 'שגיאה: {{status}}',
  cannotConnect: 'לא ניתן להתחבר לשרת — ודא שהוא פעיל',
  serverSessionNote: 'הכתובת נשמרת רק ב-session זה (לא נשלח לשרת SpendWise)',

  // How it works
  howItWorks: 'איך זה עובד?',
  howItWorksStep1: 'bank-scraper רץ במחשב שלך (או שרת) ומתחבר לבנק',
  howItWorksStep2: 'הוא שולף עסקאות אחורה ל-30 יום ושולח לכאן אוטומטית',
  howItWorksStep3: 'עסקאות הבנק מופיעות ב-SpendWise כמו כל עסקה רגילה',
  howItWorksStep4: 'כל עסקה נוספת פעם אחת בלבד — מנגנון dedup מונע כפילויות',
  manualSyncTitle: 'סנכרון ידני',
  manualSyncOr: 'או',
  doubleClickBat: 'לחץ פעמיים על run.bat',
  mobileTrigger: 'טריגר מהמובייל',
  mobileTriggerNote: 'הפעל node serve.js במחשב, ולחץ "סנכרן עכשיו" מהאפליקציה',

  // Footer note
  toggleNote: 'הטוגלים שומרים מה מוצג — הנתונים תמיד בבסיס הנתונים',

  // Bank names
  bankNames: {
    yahav: 'בנק יהב',
    isracard: 'ישראכרט',
    max: 'מקס',
    discount: 'דיסקונט',
  },
};
