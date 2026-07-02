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

  // ── חיבור בנק (שירות עצמי) ──
  connectBank: 'חבר בנק',
  connectBankSubtitle: 'סנכרון עסקאות אוטומטי, פעמיים ביום',
  myConnections: 'חיבורי הבנק שלי',
  noConnections: 'לא חובר אף בנק עדיין',
  noConnectionsHint: 'חבר את הבנק שלך והעסקאות יופיעו כאן אוטומטית',

  // שלבי אשף
  stepPickBank: 'בחר את הבנק שלך',
  stepCredentials: 'פרטי התחברות',
  stepConfirm: 'סיכום ואישור',
  back: 'חזרה',
  next: 'הבא',
  connect: 'חבר',
  connecting: 'מתחבר...',
  connected: 'הבנק חובר!',
  connectedNote: 'הסנכרון הראשון ירוץ תוך כמה שעות. העסקאות יופיעו אוטומטית.',
  done: 'סיום',

  // שדות פרטי התחברות (לפי בנק)
  fieldUsername: 'שם משתמש',
  fieldPassword: 'סיסמה',
  fieldNationalID: 'תעודת זהות',
  fieldId: 'מספר זהות',
  fieldCard6: '6 ספרות אחרונות של הכרטיס',
  fieldNum: 'קוד מזהה',
  displayNameLabel: 'כינוי (אופציונלי)',
  displayNamePlaceholder: 'למשל: החשבון הראשי שלי',

  // הסבר אבטחה
  securityTitle: 'הפרטים שלך מוגנים',
  securityPoint1: 'מוצפנים בדפדפן שלך עוד לפני שהם עוזבים את המכשיר',
  securityPoint2: 'השרתים שלנו שומרים רק מידע מוצפן שהם לא מסוגלים לקרוא',
  securityPoint3: 'רק מכונת הסנכרון יכולה לפענח — והיא לא שומרת כלום בדיסק',
  securityPoint4: 'אפשר למחוק את החיבור בכל רגע — המידע המוצפן נמחק לתמיד',
  consentLabel: 'אני מבין/ה ש-SpendWise יתחבר לחשבון הבנק שלי בשמי כדי לקרוא עסקאות',

  // כרטיס חיבור
  statusActive: 'פעיל',
  statusPaused: 'מושהה',
  statusError: 'דורש טיפול',
  pausedAfterFailures: 'הושהה אחרי כשלונות חוזרים — בדוק את פרטי ההתחברות והפעל מחדש',
  lastSyncLabel: 'סנכרון אחרון',
  neverSynced: 'טרם סונכרן',
  pause: 'השהה',
  resume: 'הפעל מחדש',
  delete: 'מחק',
  deleteConfirmTitle: 'למחוק את החיבור?',
  deleteConfirmBody: 'פרטי ההתחברות המוצפנים יימחקו לצמיתות. העסקאות שסונכרנו יישארו ב-SpendWise.',
  cancel: 'ביטול',

  // סנכרון ידני / מגבלות
  syncQueued: 'הסנכרון בתור! ירוץ תוך כ-30 דקות',
  syncQuotaReached: 'הגעת למגבלת הסנכרונים היומית (2 ביום) — מגן על חשבון הבנק שלך מחסימה',
  syncTooSoon: 'יש להמתין לפחות 3 שעות בין סנכרונים',
  syncInFlight: 'סנכרון כבר רץ כרגע',
  connectionPaused: 'החיבור מושהה',

  // היסטוריית סנכרונים
  recentSyncs: 'סנכרונים אחרונים',
  jobDone: 'הושלם',
  jobFailed: 'נכשל',
  jobPending: 'ממתין',
  jobRunning: 'רץ',
  triggerManual: 'ידני',
  triggerSchedule: 'מתוזמן',
  newTransactions: '{{n}} חדשות',

  // עדכון פרטים
  updateCredentials: 'עדכן פרטי התחברות',

  // Bank names
  bankNames: {
    yahav: 'בנק יהב',
    isracard: 'ישראכרט',
    max: 'מקס',
    discount: 'דיסקונט',
  },
};
