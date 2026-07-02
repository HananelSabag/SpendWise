/**
 * BANK SYNC / BANK CONNECT TRANSLATIONS - Hebrew
 */

export default {
  // Page / panel title
  title: 'סנכרון בנק',
  refresh: 'רענן נתונים',

  // Account balance
  accountBalance: 'יתרת חשבון',
  unavailable: 'לא זמין',
  unavailableNote: '{{bank}} עדיין לא חושף יתרת חשבון',
  mainAccount: 'חשבון ראשי',
  balanceUnavailableNote: 'הבנק עדיין לא חושף יתרה — בדוק ישירות באתר הבנק',

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
  syncedDaily: 'מסונכרן אוטומטית · פעמיים ביום',

  // Errors
  loadError: 'לא ניתן לטעון נתוני סנכרון',

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
  syncNow: 'סנכרן עכשיו',
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

  // איך זה עובד
  howItWorks: 'איך זה עובד?',
  howItWorksStep1: 'אתה מחבר את הבנק — הפרטים מוצפנים בדפדפן שלך עוד לפני שהם נשלחים',
  howItWorksStep2: 'סוכן סנכרון מאובטח נכנס לבנק פעמיים ביום וקורא את העסקאות',
  howItWorksStep3: 'העסקאות מופיעות ב-SpendWise אוטומטית, בדיוק כמו אלו שאתה מוסיף ידנית',
  howItWorksStep4: 'כל עסקה נוספת פעם אחת בדיוק — כפילויות בלתי אפשריות',

  // Bank names
  bankNames: {
    yahav: 'בנק יהב',
    isracard: 'ישראכרט',
    max: 'מקס',
    discount: 'דיסקונט',
  },
};
