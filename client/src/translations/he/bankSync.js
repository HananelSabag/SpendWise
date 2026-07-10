/**
 * BANK SYNC / BANK CONNECT TRANSLATIONS - Hebrew
 */

export default {
  // Page / panel title
  title: 'סנכרון בנק',
  // כותרת כרטיס ריכוז היתרות בדשבורד — לא "סנכרון בנק"; הדשבורד הוא הבית
  // הפיננסי של המשתמש, לא מסך טכני של סנכרון.
  balanceHeroTitle: 'ריכוז יתרות',
  refresh: 'רענן נתונים',

  // Account balance
  accountBalance: 'יתרת חשבון',
  accountsListTitle: 'חשבונות בנק',
  totalBankBalance: 'סך יתרת הבנק',
  totalExcludesUnavailable: 'הסכום אינו כולל חשבונות שלא חושפים יתרה',
  unavailable: 'לא זמין',
  unavailableNote: '{{bank}} עדיין לא חושף יתרת חשבון',
  balanceNeedsBank: 'חבר חשבון בנק כדי לראות יתרה — חברות אשראי מציגות חיובים בלבד',
  mainAccount: 'חשבון ראשי',
  balanceUnavailableNote: 'הבנק עדיין לא חושף יתרה — בדוק ישירות באתר הבנק',

  // Transaction summary
  income: 'הכנסות',
  expenses: 'הוצאות',
  cardCharges: 'חיובים בדף החשבון',
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
  saveError: 'השמירה נכשלה — נסה שוב',
  statsLoadError: 'לא הצלחנו לטעון את היתרה — הנתונים שלך בטוחים, זו בעיית תקשורת',
  connectionsLoadError: 'לא הצלחנו לטעון את חיבורי הבנק — נסה שוב',
  retry: 'נסה שוב',

  // ── חיבור בנק (שירות עצמי) ──
  connectBank: 'חבר בנק',
  connectBankSubtitle: 'סנכרון עסקאות אוטומטי, פעמיים ביום',
  myConnections: 'חיבורי הבנק שלי',
  bankAccounts: 'חשבונות בנק',
  creditCards: 'חברות אשראי',
  creditCardShort: 'אשראי',
  cardActivity: 'פעילות כרטיס',
  noConnections: 'לא חובר אף בנק עדיין',
  noConnectionsHint: 'חבר את הבנק שלך והעסקאות יופיעו כאן אוטומטית',

  // מה כל מקור מספק + תזמון סנכרון אוטומטי (E3)
  banksProvide: 'יתרת חשבון אמיתית והיסטוריית עסקאות מלאה',
  cardsProvide: 'חיובי כרטיס מפורטים — אלה מופיעים מאוחר יותר כחיוב מרוכז אחד בחשבון הבנק',
  nextAutoSync: 'הסנכרון האוטומטי הבא בסביבות {{time}}',
  nextAutoSyncTomorrow: 'הסנכרון האוטומטי הבא בסביבות {{time}} מחר',
  bankSectionEmpty: 'לא חובר חשבון בנק עדיין',
  cardSectionEmpty: 'לא חוברה חברת אשראי עדיין',
  addBank: 'הוספת בנק',
  addCard: 'הוספת חברת אשראי',

  // מחזור פיננסי — ההגדרה שמניעה כל סיכום תקופתי בדשבורד
  financialCycleTitle: 'מחזור פיננסי',
  financialCycleValue: 'החודש הפיננסי שלך מתחיל ביום {{day}}',
  financialCycleHint: 'כל הסיכומים בדשבורד מבוססים על התקופה הזו — בנפרד מיתרת הבנק בזמן אמת. הקש על יום כדי לשנות.',
  financialCycleSaved: 'המחזור הפיננסי עודכן',

  // שלבי אשף
  stepPickBank: 'בחר את הבנק שלך',
  stepPickBankOnly: 'בחר את הבנק שלך',
  stepPickCard: 'בחר את חברת האשראי שלך',
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
  fieldUserCode: 'קוד משתמש',
  fieldPassword: 'סיסמה',
  fieldNationalID: 'תעודת זהות',
  fieldId: 'מספר זהות',
  fieldCard6: '6 ספרות אחרונות של הכרטיס',
  fieldNum: 'קוד מזהה',
  displayNameLabel: 'כינוי (אופציונלי)',
  displayNamePlaceholder: 'למשל: החשבון הראשי שלי',
  replacesExistingNote: 'המוסד הזה כבר מחובר — שמירה כאן מחליפה את פרטי ההתחברות השמורים.',
  betaBadge: 'בטא',
  betaNote: 'המוסד הזה נתמך במלואו אבל עדיין לא נבדק מול חשבון אמיתי. אם סנכרון נכשל — ספרו לנו.',

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
  pausedAfterFailures: 'הושהה אחרי כשלונות חוזרים — בדרך כלל סיסמת בנק שהשתנתה',
  tryAgain: 'נסה שוב',
  lastSyncLabel: 'סנכרון אחרון',
  neverSynced: 'טרם סונכרן',
  pause: 'השהה',
  resume: 'הפעל מחדש',
  delete: 'מחק',
  deleteConfirmTitle: 'למחוק את החיבור?',
  deleteConfirmBody: 'פרטי ההתחברות המוצפנים יימחקו לצמיתות.',
  deleteKeepsDataNote: 'העסקאות והיתרות שסונכרנו יישארו ב-SpendWise, אלא אם תסמן את התיבה למטה.',
  deletePurgeLabel: 'מחק גם את כל העסקאות והיתרות שסונכרנו מהמקור הזה',
  cancel: 'ביטול',

  // מצבי משימה חיים (בכרטיס החיבור)
  jobWaiting: 'הסנכרון בתור — ממתין לסוכן הסנכרון',
  jobWaitingHint: 'ירוץ כשמחשב הסנכרון שלך דלוק (תוך כ-30 דקות)',
  jobSyncing: 'מסנכרן עכשיו…',
  lastAttemptFailed: 'הסנכרון האחרון נכשל: {{error}}',

  // סנכרון ידני / מגבלות
  syncNow: 'סנכרן עכשיו',
  syncQueued: 'הסנכרון בתור! ירוץ תוך כ-30 דקות',
  syncQuotaReached: 'הגעת למגבלת הסנכרונים היומית (2 ביום) — מגן על חשבון הבנק שלך מחסימה',
  syncTooSoon: 'יש להמתין לפחות 3 שעות בין סנכרונים',
  nextSyncAt: 'הסנכרון הידני הבא זמין ב-{{time}}',
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

  // toggle סנכרון לכל חשבון
  accounts: 'חשבונות',
  accountSyncOn: 'מסתנכרן',
  accountSyncOff: 'לא מסתנכרן',
  accountDisabledHint: 'עסקאות מחשבון זה לא מיובאות',
  accountAsOf: '{{count}} עסקאות · נכון ל-{{date}}',
  accountNoActivity: 'עדיין לא סונכרנו עסקאות',
  chargedLabel: 'חויב',

  // שיטת סנכרון — השרת של SpendWise מול המחשב האישי של המשתמש
  syncMethodTitle: 'איך הסנכרון שלך רץ',
  syncMethodSubtitle: 'בחר איזה מחשב מתחבר לבנק שלך.',
  syncMethodDefaultTitle: 'השרת של SpendWise',
  syncMethodDefaultBody: 'בלי הגדרות - אנחנו מטפלים בזה בשבילך.',
  syncMethodOwnTitle: 'המחשב שלי',
  syncMethodOwnBody: 'מריצים את ה-SpendWise Agent בעצמכם; רק המחשב שלכם רואה את פרטי ההתחברות לבנק.',
  syncMethodOwnTipLabel: 'איך זה עובד?',
  syncMethodOwnTipStep1: 'מורידים את ה-Agent ומחלצים את התיקייה לכל מקום במחשב.',
  syncMethodOwnTipStep2: 'פותחים את SpendWiseWorker ולוחצים כאן על "קבלת קוד חיבור".',
  syncMethodOwnTipStep3: 'מקלידים את הקוד ב-Agent — וזה כל התהליך.',
  syncMethodOwnTipStep4: 'מחברים מחדש את הבנקים; מעכשיו הסנכרונים רצים מהמחשב הזה.',
  syncMethodOwnTipPrivacy: 'מחשב מחובר מריץ אך ורק את הסנכרונים של החשבון שלך — הוא לא יכול לראות או להריץ עבודות של משתמש אחר, ופרטי הבנק לא עוזבים אותו.',
  syncMethodDownload: 'הורדת ה-Agent',
  syncMethodSmartScreenHint: 'ייתכן שווינדוס יציג אזהרת אבטחה כי האפליקציה עדיין לא חתומה דיגיטלית - לחצו על "מידע נוסף" ואז "הפעל בכל זאת".',
  syncMethodGenerateCode: 'קבלת קוד חיבור',
  syncMethodCodeExpires: 'פג תוקף בעוד {{minutes}} דקות',
  syncMethodCodeHint: 'פתחו את SpendWise Agent במחשב שלכם והזינו את הקוד הזה.',
  syncMethodWaiting: 'ממתין שהמחשב שלך יתחבר...',
  syncMethodPaired: 'מחובר - {{label}}',
  syncMethodPairedSince: 'מחובר מאז {{date}}',
  syncMethodUnpair: 'חזרה לשרת של SpendWise',
  syncMethodUnpairConfirmTitle: 'להחליף שיטת סנכרון?',
  syncMethodSwitchConfirmTitle: 'להעביר את הסנכרון למחשב שלך?',
  syncMethodUnpairConfirmBody: 'הבנקים שלך היו מחוברים דרך {{label}}. אחרי המעבר תצטרך לחבר אותם מחדש - התחברויות שמורות לא עוברות אוטומטית.',
  syncMethodSwitchToOwnConfirmBody: 'אחרי חיבור המחשב שלך תצטרך לחבר מחדש את הבנקים - התחברויות שמורות לא עוברות אוטומטית למכשיר החדש.',
  syncMethodConfirm: 'החלף בכל זאת',
  syncMethodCancel: 'ביטול',
  syncMethodError: 'לא הצלחנו להגיע לשירות החיבור - נסה שוב',

  // חשבון בנק מול חברת אשראי — הסבר המודל בעמוד הסנכרון
  sourceModelTitle: 'חשבון בנק או חברת אשראי?',
  sourceModelSubtitle: 'SpendWise מפריד ביניהם כדי שהדשבורד יציג תזרים אמיתי בלי לספור חיובי אשראי פעמיים.',
  sourceModelBankTitle: 'חשבון בנק',
  sourceModelBankText: 'מציג יתרה אמיתית, משכורת/הכנסות, העברות, משיכות מזומן, עמלות, הלוואות ואת חיוב האשראי החודשי המרוכז.',
  sourceModelCardTitle: 'חברת אשראי',
  sourceModelCardText: 'מציגה קניות מפורטות בכרטיס. אין לה יתרת בנק; כשיש פירוט קניות, SpendWise לא סופר שוב את חיוב האשראי שירד מהבנק.',

  // היקף הנתונים בכרטיס הסטטיסטיקה — כסף לפי תקופה, ספירה מאז ומעולם
  statsScopeNote: 'הכנסות והוצאות מתייחסות לתקופה הפיננסית שנבחרה; מונה העסקאות כולל את כל מה שסונכרן אי פעם.',
  cardStatsScopeNote: 'החיובים מחושבים לפי תאריך החיוב/הפירעון שחברת האשראי דיווחה, כדי שסכום המחזור יתאים לדף החשבון שלה. מונה העסקאות כולל את כל מה שסונכרן אי פעם.',

  // איך זה עובד
  howItWorks: 'איך זה עובד?',
  howItWorksStep1: 'אתה מחבר את הבנק — הפרטים מוצפנים בדפדפן שלך עוד לפני שהם נשלחים',
  howItWorksStep2: 'סוכן סנכרון מאובטח נכנס לבנק פעמיים ביום וקורא את העסקאות',
  howItWorksStep3: 'העסקאות מופיעות ב-SpendWise אוטומטית, בדיוק כמו אלו שאתה מוסיף ידנית',
  howItWorksStep4: 'כל עסקה נוספת פעם אחת בדיוק — כפילויות בלתי אפשריות',

  // Bank names
  bankNames: {
    yahav: 'בנק יהב',
    hapoalim: 'בנק הפועלים',
    leumi: 'בנק לאומי',
    mizrahi: 'בנק מזרחי טפחות',
    discount: 'בנק דיסקונט',
    mercantile: 'בנק מרכנתיל',
    otsar_hahayal: 'בנק אוצר החייל',
    beinleumi: 'הבנק הבינלאומי',
    massad: 'בנק מסד',
    pagi: 'בנק פאגי',
    isracard: 'ישראכרט',
    amex: 'אמריקן אקספרס',
    visa_cal: 'כאל',
    max: 'מקס',
  },
};
