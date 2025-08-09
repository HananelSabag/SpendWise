/**
 * 📊 DASHBOARD TRANSLATIONS - HEBREW
 * Complete dashboard system translations for revolutionary UX
 * @version 3.0.0 - REVOLUTIONARY UPDATE
 */

export default {
  // Basic translations
  title: 'לוח בקרה',
  overview: 'סקירה כללית',
  analytics: 'אנליטיקה',
  goals: 'יעדים', 
  insights: 'תובנות',

  // ✅ FIXED: Account-related translations 
  accounts: {
    main: 'חשבון ראשי'
  },

  account: {
    noTransactions: 'אין תנועות עדיין'
  },

  // ✅ Balance Panel translations
  balance: {
    title: 'סקירת יתרה',
    loading: 'טוען נתוני יתרה...',
    error: 'שגיאה בטעינת נתוני יתרה',
    noData: 'אין נתוני יתרה זמינים',
    refreshed: 'היתרה עודכנה',
    dataUpdated: 'נתוני היתרה רוענו',
    refreshFailed: 'רענון נכשל',
    tryAgain: 'אנא נסה שוב',
    hidden: 'היתרה מוסתרת לשמירת פרטיות',
    income: 'הכנסות',
    expenses: 'הוצאות',
    total: 'יתרה נטו',
    currentDay: 'יום',
    daysInMonth: 'ימים/חודש',
    weekElapsed: 'ימי שבוע',
    lastUpdate: 'עודכן'
  },
  
  // ✅ Period translations
  periods: {
    daily: 'יומי',
    weekly: 'שבועי',
    monthly: 'חודשי',
    yearly: 'שנתי'
  },

  // ✅ FIXED: Common UI translations (no duplicates)
  common: {
    hide: 'הסתר',
    show: 'הצג',
    categoryTypes: {
      food: 'מזון ומסעדות',
      income: 'הכנסות',
      transport: 'תחבורה',
      entertainment: 'בילויים',
      bills: 'חשבונות ותשלומים'
    },
    transactions: {
      groceries: 'קניות במכולת',
      salary: 'משכורת',
      fuel: 'דלק',
      coffee: 'קפה',
      electricity: 'חשמל'
    }
  },

  // ✅ FIXED: Action translations for TransactionCard and other components (no duplicates)
  actions: {
    edit: 'ערוך',
    delete: 'מחק', 
    duplicate: 'שכפל',
    editTransaction: 'ערוך עסקה',
    showSummary: 'הצג סיכום',
    collapseSummary: 'הסתר סיכום',
    quickExpense: 'הוצאה מהירה',
    quickExpenseDesc: 'הוסף הוצאה מיידית',
    quickIncome: 'הכנסה מהירה',
    quickIncomeDesc: 'הוסף הכנסה מיידית',
    addTransaction: 'הוסף תנועה',
    addTransactionDesc: 'צור תנועה חדשה',
    viewAnalytics: 'צפה באנליטיקה',
    viewAnalyticsDesc: 'ראה תובנות פיננסיות',
    spendingBreakdown: 'פירוט הוצאות',
    spendingBreakdownDesc: 'ניתוח קטגוריות',
    setGoal: 'קבע יעד',
    setGoalDesc: 'צור יעד פיננסי',
    budgetPlanner: 'מתכנן תקציב',
    budgetPlannerDesc: 'תכנן את התקציב שלך',
    currencyConverter: 'המרת מטבע',
    currencyConverterDesc: 'המר מטבעות',
    schedulePayment: 'תזמן תשלום',
    schedulePaymentDesc: 'הגדר תשלום חוזר',
    popular: 'פופולרי',
    lastUsed: 'שימוש אחרון {{time}}',
    executed: '{{action}} בוצע בהצלחה',
    currencyConverterOpening: 'פותח המרת מטבע...'
  },

  // ✅ FIXED: Category translations
  category: {
    uncategorized: 'לא מקוטלג'
  },

  // ✅ Labels for transaction details
  labels: {
    updated: 'עודכן',
    transactionId: 'מזהה עסקה',
    fullDate: 'תאריך מלא',
    aiInsights: 'תובנות AI',
    created: 'נוצר',
    recurring: 'חוזר',
    recurringAmount: 'סכום חוזר'
  },

  // ✅ FIXED: Insights translations
  insights: {
    largeTransaction: 'עסקה גדולה',
    recurringPattern: 'דפוס חוזר',
    businessExpense: 'הוצאה עסקית'
  },
  
  // Welcome messages with time-based greetings
  welcome: {
    goodMorning: 'בוקר טוב, {{name}}! 🌅',
    goodAfternoon: 'צהריים טובים, {{name}}! ☀️',
    goodEvening: 'ערב טוב, {{name}}! 🌙',
    general: 'שלום, {{name}}! 👋'
  },
  
  // Time periods for balance tabs
  timePeriods: {
    daily: 'יומי',
    weekly: 'שבועי', 
    monthly: 'חודשי',
    yearly: 'שנתי'
  },
  
  // Balance and financial data
  balance: {
    title: 'יתרה נוכחית',
    income: 'הכנסות',
    expenses: 'הוצאות',
    net: 'סך הכל',
    change: 'שינוי',
    growth: 'צמיחה',
    balancesHidden: 'יתרות הוסתרו',
    balancesShown: 'יתרות מוצגות',
    refreshed: 'יתרה רוענה בהצלחה',
    // ✅ FIXED: הוספת תרגומי יתרה חסרים
    noData: 'לא קיימים נתוני יתרה',
    loading: 'טוען יתרה...',
    total: 'יתרה כוללת',
    currentDay: 'יום נוכחי',
    daysInMonth: 'ימים בחודש',
    weekElapsed: 'שבוע חלף',
    lastUpdate: 'עדכון אחרון',
    refreshFailed: 'רענון יתרה נכשל',
    dataUpdated: 'נתוני יתרה עודכנו',
    tryAgain: 'אנא נסה שוב'
  },

  // ✅ FIXED: Period summary translations
  periodSummary: {
    daily: 'פעילות פיננסית יומית',
    weekly: 'סיכום השבוע',
    monthly: 'סקירת החודש',
    yearly: 'התקדמות השנה'
  },
  
  // Quick Actions
  quickActions: {
    title: 'פעולות מהירות',
    addExpense: 'הוצאה מהירה',
    addIncome: 'הכנסה מהירה',
    addExpenseDesc: 'הוסף הוצאה מיידית',
    addIncomeDesc: 'הוסף הכנסה מיידית', 
    transfer: 'העברה',
    viewReports: 'דוחות',
    categories: 'קטגוריות',
    amount: 'סכום',
    description: 'תיאור',
    descriptionOptional: 'תיאור (אופציונלי)',
    category: 'קטגוריה',
    add: 'הוסף',
    adding: 'מוסיף...',
    cancel: 'ביטול',
    success: 'נוסף בהצלחה!',
    failed: 'נכשל בהוספת העסקה. אנא נסה שוב.',
    invalidAmount: 'אנא הכנס סכום תקין',
    enterAmount: 'הכנס סכום',
    smartCategory: 'קטגוריה חכמה:',
    placeholder: {
      amount: 'הכנס סכום...',
      description: 'תיאור (אופציונלי)',
      selectCategory: 'בחר קטגוריה'
    }
  },

  // ✅ FIXED: Notification messages
  notifications: {
    quickExpenseCreated: 'הוצאה מהירה נוספה בהצלחה!',
    quickExpenseFailed: 'נכשל בהוספת הוצאה מהירה',
    quickIncomeCreated: 'הכנסה מהירה נוספה בהצלחה!',
    quickIncomeFailed: 'נכשל בהוספת הכנסה מהירה'
  },
  
  // ✅ FIXED: Recent Transactions (no duplicates)
  recentTransactions: {
    title: 'תנועות אחרונות',
    viewAll: 'צפה בהכל',
    noTransactions: 'אין תנועות עדיין',
    noTransactionsDescription: 'התחל לעקוב אחר הכספים שלך על ידי הוספת התנועה הראשונה שלך',
    getStarted: 'התחל לעקוב אחר הכספים שלך על ידי הוספת התנועה הראשונה שלך',
    addFirst: 'הוסף תנועה',
    loading: 'טוען תנועות...',
    error: 'נכשל בטעינת התנועות',
    refreshed: 'תנועות עודכנו',
    refreshFailed: 'נכשל ברענון התנועות',
    showingCount: 'מציג {{count}} מתוך {{total}}',
    seeMore: 'ראה עוד',
    amount: 'סכום',
    date: 'תאריך',
    category: 'קטגוריה',
    lastUpdate: 'עודכן לאחרונה {time}',
    showing: 'מציג {count} תנועות',
    selected: 'נבחרו {{count}}'
  },
  
  // Stats and Tips
  stats: {
    title: 'סטטיסטיקות',
    thisMonth: 'החודש',
    lastMonth: 'חודש שעבר',
    totalTransactions: 'סה״כ תנועות',
    avgTransaction: 'ממוצע לתנועה',
    topCategory: 'קטגוריה מובילה'
  },
  
  tips: {
    title: 'טיפים חכמים 💡',
    savingTip: 'שמירת 20% מההכנסות תביא לכם ליעד החיסכון מהר יותר',
    budgetTip: 'עקבו אחר הוצאות יומיות כדי לשלוט טוב יותר בתקציב',
    categoryTip: 'חלקו הוצאות לקטגוריות יעזור לכם לזהות דפוסי הוצאה'
  },

  // הצעות חכמות
  suggestions: {
    title: 'הצעות חכמות',
    subtitle: 'פעולות מהירות לפי הפעילות שלכם',
    accept: 'החל',
    category: 'קטגוריה',
    generateNew: 'צור חדשות',
    showing: 'מציג {{count}} מתוך {{total}}',
    transactionCreated: 'תנועה נוספה מהצעה',
    failed: 'לא ניתן ליישם את ההצעה',
    // טקסטים ברירת מחדל להצעות
    morningCoffee: 'קפה של הבוקר',
    morningCoffeeDesc: 'אתם קונים קפה בבוקר לעיתים קרובות — לרשום את זה?',
    lunchRecurring: 'הגדר ארוחת צהריים כחוזרת',
    lunchRecurringDesc: 'הפכו את ארוחת הצהריים הקבועה להוצאה חוזרת לנוחות המעקב',
    emergencyFund: 'חיזוק קרן החירום',
    emergencyFundDesc: 'העבירו סכום קטן לחיסכון כדי להתקדם במטרה מהר יותר',
    types: {
      transaction: 'תנועה',
      recurring: 'חוזר',
      budget: 'תקציב',
      savings: 'חיסכון',
      insight: 'תובנה'
    }
  },

  // אמון/רמת ביטחון
  confidence: {
    high: 'גבוה',
    medium: 'בינוני',
    low: 'נמוך',
    explanation: 'רמת ביטחון: {{value}}%'
  },

  // קטגוריות מינימליות לשימוש ההצעות
  categories: {
    food: 'מזון ומסעדות',
    savings: 'חיסכון'
  },
  
  // Navigation and actions
  refresh: 'רענן',
  loading: 'טוען...',
  loadingDashboard: 'טוען לוח בקרה...',
  reloadPage: 'נסה שוב',
  
  // Error handling
  dashboardError: 'שגיאה בלוח הבקרה',
  dashboardErrorMessage: 'לא ניתן לטעון את נתוני לוח הבקרה',
  refreshed: 'לוח הבקרה רוענן בהצלחה',
  refreshError: 'רענון לוח הבקרה נכשל',
  
  // Additional UI elements
  greetings: {
    morning: 'בוקר טוב',
    afternoon: 'צהריים טובים', 
    evening: 'ערב טוב',
    night: 'לילה טוב'
  },

  // ✅ FIXED: Renamed from 'overview' to 'overviewSection' to avoid conflict
  overviewSection: {
    quickActions: {
      title: 'פעולות מהירות',
      security: 'אבטחה',
      share: 'שתף',
      smart: 'חכם',
      help: 'עזרה'
    },
    recentActivity: 'פעילות אחרונה',
    items: 'פריטים',
    viewAll: 'צפה בהכל',
    achievements: {
      title: 'הישגים'
    }
  },

  // Main sections
  sections: {
    balance: 'יתרה',
    transactions: 'עסקאות אחרונות', 
    analytics: 'ניתוחים',
    quickActions: 'פעולות מהירות',
    overview: 'סקירה כללית',
  },

  // Common elements that might be accessed from dashboard context
  commonElements: {
    profilePicture: 'תמונת פרופיל',
    categoryTypes: {
      food: 'מזון ומשקאות',
      income: 'הכנסות',
      transport: 'תחבורה',
      entertainment: 'בילויים',
      bills: 'חשבונות',
      shopping: 'קניות',
      health: 'בריאות',
      education: 'חינוך',
      travel: 'נסיעות',
      other: 'אחר'
    },
    transactions: {
      groceries: 'קניות בסופר',
      salary: 'משכורת',
      fuel: 'דלק לרכב',
      coffee: 'קפה',
      electricity: 'חשמל',
      water: 'מים',
      gas: 'גז',
      internet: 'אינטרנט',
      phone: 'טלפון',
      rent: 'שכר דירה'
    }
  },
  
  // Charts
  charts: {
    title: 'סקירה פיננסית',
    expenses: 'הוצאות לפי קטגוריה',
    income: 'מגמות הכנסות',
    balance: 'יתרה לאורך זמן'
  }
}; 