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
    refreshed: 'יתרה רוענה בהצלחה'
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
    addExpense: 'הוסף הוצאה',
    addIncome: 'הוסף הכנסה', 
    transfer: 'העברה',
    viewReports: 'דוחות',
    categories: 'קטגוריות',
    amount: 'סכום',
    description: 'תיאור',
    category: 'קטגוריה',
    add: 'הוסף',
    cancel: 'ביטול',
    success: 'נוסף בהצלחה!',
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
    noTransactions: 'לא נמצאו תנועות',
    noTransactionsDescription: 'התחל לעקוב אחר הכספים שלך על ידי הוספת התנועה הראשונה שלך',
    amount: 'סכום',
    date: 'תאריך',
    category: 'קטגוריה',
    lastUpdate: 'עודכן לאחרונה {time}',
    showing: 'מציג {count} תנועות'
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