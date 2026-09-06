/**
 * 📊 DASHBOARD TRANSLATIONS - HEBREW
 * Complete dashboard system translations for revolutionary UX
 * @version 3.0.0 - REVOLUTIONARY UPDATE
 */

import financialCycle from './financialCycle';

export default {
  title: "לוח בקרה",
  overview: "סקירה כללית",
  analytics: "אנליטיקה",
  goals: "יעדים",
  insightsPage: {
    back: "חזרה"
  },
  cycleV2: financialCycle,
  overdraft: {
    eyebrow: "מד מסגרת העו״ש",
    setupTitle: "מה מסגרת העו״ש שלך?",
    editTitle: "עדכון מסגרת העו״ש",
    setupHint: "עד איזה מינוס הבנק מאפשר לך להגיע? למשל, למסגרת של מינוס 5,000 ₪ יש להזין 5000. נשווה אותה ליתרה הצפויה בסוף המחזור.",
    setupHintMultiple: "הכנס את סך המסגרות שברצונך לעקוב אחריהן. כרגע ההשוואה נעשית מול היתרה הכוללת בחשבונות הבנק המחוברים.",
    limitLabel: "גובה מסגרת העו״ש",
    limitPlaceholder: "לדוגמה 5000",
    save: "שמירת מסגרת",
    cancel: "ביטול",
    edit: "עריכת מסגרת העו״ש",
    exceeded: "חריגה צפויה של {{amount}} מהמסגרת",
    warning: "צפוי להישאר מרווח של {{amount}} בלבד",
    remaining: "מרווח צפוי של {{amount}} עד המסגרת",
    safe: "מרווח צפוי של {{amount}} עד המסגרת",
    limitSummary: "מסגרת שהוגדרה: {{amount}}",
    basedOnForecast: "כולל הכנסות צפויות והוצאות בהערכה",
    basedOnKnown: "אחרי החיובים הידועים, ללא הכנסות עתידיות",
    used: "מינוס צפוי: {{amount}}",
    limitShort: "מסגרת: {{amount}}",
    knownScenario: "אחרי החיובים הידועים",
    forecastScenario: "כולל תחזית",
    activeScenario: "נבחר",
    scenarioExceeded: "{{amount}} מעבר למסגרת",
    scenarioRoom: "{{amount}} נותרו עד המסגרת",
    disclaimer: "ההשוואה היא לסוף המחזור ולמסגרת שהזנת, לא למסגרת שהתקבלה מהבנק. חריגה במהלך המחזור יכולה לקרות גם אם היתרה בסופו תקינה.",
    multiAccountWarning: "בחיבור כמה חשבונות זו השוואה מצרפית בלבד. יתרה חיובית בחשבון אחד אינה מבטלת חריגה בחשבון אחר.",
  },
  merchantWatch: {
    title: "בתי עסק במעקב", subtitle: "חוקים שבחרת מתוך עסקאות אמיתיות. הם מסמנים התאמות בלבד ולא משנים את החישובים.",
    watch: "עקוב אחרי בית העסק", close: "סגור", chooseRule: "בחר חוק", exactDescriptionHint: "נזהה רק את אותו תיאור עסקה. המעקב לא משנה קטגוריות או סכומים.",
    all: "כל עסקה", above: "מעל סכום", exact: "סכום מדויק", amountIls: "סכום בש״ח", save: "שמור מעקב",
    created: "המעקב נוסף למחזור הפיננסי", createFailed: "לא הצלחנו להוסיף מעקב", removeFailed: "לא הצלחנו להסיר את המעקב", loadFailed: "לא הצלחנו לטעון את המעקב.",
    ruleAbove: "מעל {{amount}}", ruleExact: "בדיוק {{amount}}", matches: "{{count}} התאמות", remove: "הסר מעקב",
    recentMatches: "התאמות אחרונות", noMatches: "אין עדיין עסקאות שמתאימות לחוקים האלה."
  },
  insights: {
    largeTransaction: "עסקה גדולה",
    recurringPattern: "דפוס חוזר",
    businessExpense: "הוצאה עסקית"
  },
  accounts: {
    main: "חשבון ראשי"
  },
  account: {
    noTransactions: "אין תנועות עדיין"
  },
  balance: {
    title: "יתרה נוכחית",
    subtitle: "סקירה פיננסית נוכחית",
    income: "הכנסות",
    expenses: "הוצאות",
    net: "סך הכל",
    change: "שינוי",
    growth: "צמיחה",
    balancesHidden: "יתרות הוסתרו",
    balancesShown: "יתרות מוצגות",
    hide: "הסתר יתרות",
    show: "הצג יתרות",
    spent: "הוצא",
    refresh: "רענון יתרה",
    refreshed: "יתרה רוענה בהצלחה",
    noData: "לא קיימים נתוני יתרה",
    loading: "טוען יתרה...",
    total: "יתרה כוללת",
    currentDay: "יום נוכחי",
    daysInMonth: "ימים בחודש",
    weekElapsed: "שבוע חלף",
    lastUpdate: "עדכון אחרון",
    refreshFailed: "רענון יתרה נכשל",
    dataUpdated: "נתוני יתרה עודכנו",
    tryAgain: "אנא נסה שוב",
    periodSelector: "בחירת תקופה",
    hideBalances: "הסתר יתרות",
    showBalances: "הצג יתרות"
  },
  periods: {
    daily: "יומי",
    weekly: "שבועי",
    monthly: "חודשי",
    yearly: "שנתי"
  },
  common: {
    noData: "אין נתונים",
    hide: "הסתר",
    show: "הצג",
    date: {
      today: "היום",
      yesterday: "אמש",
      daysAgo: "לפני {{count}} ימים"
    },
    categoryTypes: {
      food: "מזון ומסעדות",
      income: "הכנסות",
      transport: "תחבורה",
      entertainment: "בילויים",
      bills: "חשבונות ותשלומים"
    },
    transactions: {
      groceries: "קניות במכולת",
      salary: "משכורת",
      fuel: "דלק",
      coffee: "קפה",
      electricity: "חשמל"
    }
  },
  actions: {
    edit: "ערוך",
    delete: "מחק",
    duplicate: "שכפל",
    editTransaction: "ערוך עסקה",
    showSummary: "הצג סיכום",
    collapseSummary: "הסתר סיכום",
    quickExpense: "הוצאה מהירה",
    quickExpenseDesc: "הוסף הוצאה מיידית",
    quickIncome: "הכנסה מהירה",
    quickIncomeDesc: "הוסף הכנסה מיידית",
    addTransaction: "הוסף תנועה",
    addTransactionDesc: "צור תנועה חדשה",
    viewAnalytics: "צפה באנליטיקה",
    viewAnalyticsDesc: "ראה תובנות פיננסיות",
    spendingBreakdown: "פירוט הוצאות",
    spendingBreakdownDesc: "ניתוח קטגוריות",
    setGoal: "קבע יעד",
    setGoalDesc: "צור יעד פיננסי",
    budgetPlanner: "מתכנן תקציב",
    budgetPlannerDesc: "תכנן את התקציב שלך",
    currencyConverter: "המרת מטבע",
    currencyConverterDesc: "המר מטבעות",
    schedulePayment: "תזמן תשלום",
    schedulePaymentDesc: "הגדר תשלום חוזר",
    popular: "פופולרי",
    lastUsed: "שימוש אחרון {{time}}",
    executed: "{{action}} בוצע בהצלחה",
    currencyConverterOpening: "פותח המרת מטבע..."
  },
  category: {
    uncategorized: "לא מקוטלג"
  },
  labels: {
    updated: "עודכן",
    transactionId: "מזהה עסקה",
    fullDate: "תאריך מלא",
    aiInsights: "תובנות AI",
    created: "נוצר",
    recurring: "חוזר",
    recurringAmount: "סכום חוזר"
  },
  timePeriods: {
    daily: "יומי",
    weekly: "שבועי",
    monthly: "חודשי",
    yearly: "שנתי"
  },
  quickActions: {
    title: "פעולות מהירות",
    subtitle: "הוסף תנועות מיידיות",
    expense: "הוצאה",
    income: "הכנסה",
    addExpense: "הוסף הוצאה",
    addIncome: "הוסף הכנסה",
    addExpenseDesc: "הוסף הוצאה מיידית",
    addIncomeDesc: "הוסף הכנסה מיידית",
    transfer: "העברה",
    viewReports: "דוחות",
    categories: "קטגוריות",
    amount: "סכום",
    description: "תיאור",
    descriptionOptional: "תיאור (אופציונלי)",
    descriptionPlaceholder: "בשביל מה זה היה? (אופציונלי)",
    enterAmount: "הכנס סכום",
    category: "קטגוריה",
    add: "הוסף",
    adding: "מוסיף...",
    cancel: "ביטול",
    success: "נוסף בהצלחה!",
    failed: "נכשל בהוספת העסקה. אנא נסה שוב.",
    invalidAmount: "אנא הכנס סכום תקין",
    smartCategory: "קטגוריה חכמה:",
    addTransaction: "הוסף תנועה",
    manageCategories: "נהל קטגוריות",
    exportData: "ייצא נתונים",
    placeholder: {
      amount: "הכנס סכום...",
      description: "תיאור (אופציונלי)",
      selectCategory: "בחר קטגוריה"
    },
    typeSelector: "סוג תנועה",
    tip: "הכנס סכום ולחץ Enter או לחץ על כפתור ההוספה",
    back: "חזרה"
  },
  notifications: {
    quickExpenseCreated: "הוצאה מהירה נוספה בהצלחה!",
    quickExpenseFailed: "נכשל בהוספת הוצאה מהירה",
    quickIncomeCreated: "הכנסה מהירה נוספה בהצלחה!",
    quickIncomeFailed: "נכשל בהוספת הכנסה מהירה"
  },
  recentTransactions: {
    title: "תנועות אחרונות",
    viewAll: "צפה בהכל",
    noTransactions: "אין תנועות עדיין",
    noTransactionsDescription: "התחל לעקוב אחר הכספים שלך על ידי הוספת התנועה הראשונה שלך",
    getStarted: "התחל לעקוב אחר הכספים שלך על ידי הוספת התנועה הראשונה שלך",
    addFirst: "הוסף תנועה",
    loading: "טוען תנועות...",
    error: "נכשל בטעינת התנועות",
    refreshed: "תנועות עודכנו",
    refreshFailed: "נכשל ברענון התנועות",
    showingCount: "{{count}} עסקאות אחרונות",
    seeMore: "ראה עוד",
    amount: "סכום",
    date: "תאריך",
    category: "קטגוריה",
    lastUpdate: "עודכן לאחרונה {time}",
    showing: "מציג {{count}} תנועות",
    selected: "נבחרו {{count}}"
  },
  stats: {
    title: "סטטיסטיקות",
    thisMonth: "החודש",
    lastMonth: "חודש שעבר",
    totalTransactions: "סה״כ תנועות",
    avgTransaction: "ממוצע לתנועה",
    topCategory: "קטגוריה מובילה",
    monthlyBalance: "יתרה חודשית",
    positive: "חיובי",
    negative: "שלילי"
  },
  tips: {
    title: "טיפים חכמים 💡",
    subtitle: "תובנות אישיות לבריאות פיננסית טובה יותר",
    savingTip: "שמירת 20% מההכנסות תביא לכם ליעד החיסכון מהר יותר",
    budgetTip: "עקבו אחר הוצאות יומיות כדי לשלוט טוב יותר בתקציב",
    categoryTip: "חלקו הוצאות לקטגוריות יעזור לכם לזהות דפוסי הוצאה",
    progressTip: "עקבו אחר ההתקדמות עם יעדים שבועיים וחגגו ניצחונות קטנים",
    recurringTip: "הגדירו עסקאות חוזרות כדי לחסוך זמן ולא לפספס תשלומים",
    reviewTip: "בדקו את ההוצאות שלכם מדי חודש כדי לזהות תחומים לשיפור",
    trendTip: "חפשו מגמות הוצאה כדי לקבל החלטות פיננסיות טובות יותר",
    quickTip: "השתמשו בפעולות מהירות כדי להוסיף עסקאות תוך שניות",
    goalTip: "קבעו יעדים פיננסיים ברורים וחלקו אותם לאבני דרך קטנות יותר",
    habitTip: "בנו הרגלי כסף בריאים על ידי מעקב אחר הוצאות יומיות קטנות",
    rewardTip: "תגמלו את עצמכם כשאתם מגיעים ליעדי החיסכון שלכם",
    personalTip: "התאימו קטגוריות לסגנון ההוצאות האישי שלכם"
  },
  suggestions: {
    title: "הצעות חכמות",
    subtitle: "פעולות מהירות לפי הפעילות שלכם",
    accept: "החל",
    category: "קטגוריה",
    generateNew: "צור חדשות",
    showing: "מציג {{count}} מתוך {{total}}",
    transactionCreated: "תנועה נוספה מהצעה",
    failed: "לא ניתן ליישם את ההצעה",
    morningCoffee: "קפה של הבוקר",
    morningCoffeeDesc: "אתם קונים קפה בבוקר לעיתים קרובות — לרשום את זה?",
    lunchRecurring: "הגדר ארוחת צהריים כחוזרת",
    lunchRecurringDesc: "הפכו את ארוחת הצהריים הקבועה להוצאה חוזרת לנוחות המעקב",
    emergencyFund: "חיזוק קרן החירום",
    emergencyFundDesc: "העבירו סכום קטן לחיסכון כדי להתקדם במטרה מהר יותר",
    types: {
      transaction: "תנועה",
      recurring: "חוזר",
      budget: "תקציב",
      savings: "חיסכון",
      insight: "תובנה"
    }
  },
  confidence: {
    high: "גבוה",
    medium: "בינוני",
    low: "נמוך",
    explanation: "רמת ביטחון: {{value}}%"
  },
  categories: {
    food: "מזון ומסעדות",
    savings: "חיסכון"
  },
  refresh: "רענן",
  loading: "טוען...",
  loadingDashboard: "טוען לוח בקרה...",
  reloadPage: "נסה שוב",
  addExpense: "הוסף הוצאה",
  addIncome: "הוסף הכנסה",
  // Shared labels still used by the yearly review and cycle actions.
  cycle: {
    income: "הכנסות",
    expenses: "הוצאות",
    bankMovement: "השינוי בחשבון",
    updateFailed: "לא הצלחנו לשמור את השינוי — נסה שוב",
    loan: "הלוואה",
    yearlyTitle: "סקירה שנתית",
    pickYear: "בחר שנה",
    yearlySavings: "חיסכון",
    savingsRate: "שיעור חיסכון",
    monthByMonth: "חודש אחר חודש",
    categoryTrends: "קטגוריות הוצאה מובילות",
    noYearData: "אין מחזורים מלאים בשנה הזאת",
    yearlyError: "לא הצלחנו לטעון את השנה הזאת",
  },

  mainAccount: "חשבון ראשי",
  breakdown: {
    title: "הוצאות לפי סוג",
    auto: "אוטומטי",
    autoHint: "קבוצות \"אוטומטי\" מוערכות מתיאורי העסקאות הבנקאיות",
    other: "אחר"
  },
  manualEntry: "רשומה ידנית",
  manualEntryActions: {
    addExpense: "הוצאה חד פעמית",
    addIncome: "הכנסה חד פעמית"
  },
  dashboardError: "שגיאה בלוח הבקרה",
  dashboardErrorMessage: "לא ניתן לטעון את נתוני לוח הבקרה",
  retryingIn: "ניסיון חוזר בעוד {{countdown}} שניות…",
  goToProfile: "עבור לפרופיל",
  refreshed: "לוח הבקרה רוענן בהצלחה",
  refreshError: "רענון לוח הבקרה נכשל",
  greetings: {
    morning: "בוקר טוב",
    afternoon: "צהריים טובים",
    evening: "ערב טוב",
    night: "לילה טוב"
  },
  overviewSection: {
    quickActions: {
      title: "פעולות מהירות",
      security: "אבטחה",
      share: "שתף",
      smart: "חכם",
      help: "עזרה"
    },
    recentActivity: "פעילות אחרונה",
    items: "פריטים",
    viewAll: "צפה בהכל",
    achievements: {
      title: "הישגים"
    }
  },
  sections: {
    balance: "יתרה",
    transactions: "עסקאות אחרונות",
    analytics: "ניתוחים",
    quickActions: "פעולות מהירות",
    overview: "סקירה כללית"
  },
  commonElements: {
    profilePicture: "תמונת פרופיל",
    categoryTypes: {
      food: "מזון ומשקאות",
      income: "הכנסות",
      transport: "תחבורה",
      entertainment: "בילויים",
      bills: "חשבונות",
      shopping: "קניות",
      health: "בריאות",
      education: "חינוך",
      travel: "נסיעות",
      other: "אחר"
    },
    transactions: {
      groceries: "קניות בסופר",
      salary: "משכורת",
      fuel: "דלק לרכב",
      coffee: "קפה",
      electricity: "חשמל",
      water: "מים",
      gas: "גז",
      internet: "אינטרנט",
      phone: "טלפון",
      rent: "שכר דירה"
    }
  },
  charts: {
    title: "סקירה פיננסית",
    expenses: "הוצאות לפי קטגוריה",
    income: "מגמות הכנסות",
    balance: "יתרה לאורך זמן"
  },
  quickStats: "נתונים מהירים",
  recentActivity: "פעילות אחרונה",
  income: "הכנסות",
  expenses: "הוצאות",
  transactions: "עסקאות",
  reports: "דוחות",
  settings: "הגדרות"
};
