/**
 * 📊 DASHBOARD TRANSLATIONS - HEBREW
 * Complete dashboard system translations for revolutionary UX
 * @version 3.0.0 - REVOLUTIONARY UPDATE
 */

export default {
  // Welcome messages
  welcome: {
    title: "ברוכים השובים, {{name}}!",
    subtitle: "הנה סקירת המצב הכספי שלכם",
    greeting: {
      morning: "בוקר טוב, {{name}}!",
      afternoon: "צהריים טובים, {{name}}!",
      evening: "ערב טוב, {{name}}!"
    }
  },

  // View modes
  viewModes: {
    overview: "סקירה כללית",
    analytics: "ניתוח נתונים",
    goals: "יעדים",
    insights: "תובנות"
  },

  // Smart insights
  insights: {
    title: "תובנות חכמות",
    available: "זמינות",
    categories: {
      optimization: "אופטימיזציה",
      spending: "התראת הוצאות",
      goals: "התקדמות יעדים",
      trends: "ניתוח מגמות"
    },
    
    // Insight types
    savingsOpportunity: {
      title: "זוהתה הזדמנות לחיסכון",
      description: "בהתבסס על דפוסי ההוצאה שלכם, תוכלו לחסוך יותר על ידי אופטימיזציה של הוצאות המנויים."
    },
    spendingAlert: {
      title: "התראת תקציב",
      description: "הוצאות האוכל והמסעדות שלכם גבוהות ב-20% מהרגיל החודש."
    },
    goalAchievement: {
      title: "השגת יעד!",
      description: "כל הכבוד! אתם מקדימים את הלוח הזמנים ביעד קרן החירום שלכם."
    },

    // Insight metrics
    potential: "חיסכון פוטנציאלי",
    thisMonth: "החודש",
    overBudget: "מעל תקציב",
    category: "קטגוריה",
    completed: "הושלם",
    ahead: "מקדימים את הלוח",

    // Insight actions
    optimize: "אופטימיזציה עכשיו",
    adjustBudget: "התאמת תקציב",
    viewGoals: "צפייה ביעדים",
    
    // Detailed insights
    detailedTitle: "תובנות מפורטות",
    comingSoon: "תובנות מתקדמות מבוססות בינה מלאכותית בקרוב!"
  },

  // Financial health
  healthScore: {
    title: "בריאות כספית",
    tooltip: "ציון הבריאות הכלכלית הכולל שלכם",
    outOf100: "/ 100",
    levels: {
      excellent: "מעולה",
      good: "טוב",
      fair: "בינוני",
      poor: "דורש שיפור"
    }
  },

  health: {
    savingsRate: "שיעור חיסכון",
    budgetControl: "בקרת תקציב",
    expenseRatio: "יחס הוצאות",
    diversification: "גיוון"
  },

  // Balance panel
  balance: {
    title: "יתרת חשבון",
    available: "יתרה זמינה",
    pending: "ממתין",
    invested: "מושקע",
    savings: "חיסכונות",
    totalAssets: "סך הנכסים",
    
    trends: {
      title: "מגמות אחרונות",
      thisMonth: "החודש",
      lastMonth: "החודש שעבר",
      change: "שינוי",
      growth: "צמיחה"
    },

    insights: {
      title: "תובנות יתרה",
      cashFlow: "תזרים מזומנים",
      savingsGoal: "יעד חיסכון",
      spendingPattern: "דפוס הוצאות"
    }
  },

  // Quick actions
  quickActions: {
    title: "פעולות מהירות",
    addIncome: {
      title: "הוספת הכנסה",
      description: "רישום משכורת, עבודה עצמאית או הכנסות אחרות"
    },
    addExpense: {
      title: "הוספת הוצאה",
      description: "רישום קניות, חשבונות או הוצאות אחרות"
    },
    viewAnalytics: {
      title: "צפייה בניתוחים",
      description: "ניתוח מפורט של הוצאות והכנסות"
    },
    setGoals: {
      title: "הגדרת יעדים",
      description: "יצירה ומעקב אחר יעדים כספיים"
    },
    schedulePayment: {
      title: "תזמון תשלום",
      description: "הגדרת תשלומים חוזרים או עתידיים"
    },
    exportData: {
      title: "ייצוא נתונים",
      description: "הורדת הנתונים הכספיים שלכם"
    },

    // Smart suggestions
    smartSuggestion: {
      title: "הצעה חכמה",
      description: "המלצה מבוססת בינה מלאכותית על פי ההרגלים שלכם",
      action: "למידע נוסף"
    },

    moreActions: "פעולות נוספות",
    comingSoon: "התכונה בקרוב!"
  },

  // Statistics
  stats: {
    title: "סטטיסטיקות כספיות",
    subtitle: "הסקירה הכספית שלכם עבור {{period}}",
    
    // Metrics
    totalIncome: "סך הכנסות",
    totalExpenses: "סך הוצאות",
    netWorth: "שווי נטו",
    savingsRate: "שיעור חיסכון",
    expenseRatio: "יחס הוצאות",
    budgetUtilization: "ניצול תקציב",
    
    // Trends
    trends: {
      up: "עלייה מהתקופה הקודמת",
      down: "ירידה מהתקופה הקודמת",
      same: "זהה לתקופה הקודמת"
    }
  },

  // Recent transactions
  recentTransactions: {
    title: "עסקאות אחרונות",
    subtitle: "{{count}} עסקאות אחרונות",
    
    // Empty states
    noTransactions: "אין עסקאות עדיין",
    noTransactionsDesc: "התחילו בהוספת העסקה הראשונה שלכם",
    noFilteredTransactions: "אין עסקאות התואמות למסנן",
    
    // Stats
    showing: "מציג {{shown}} מתוך {{total}}",
    lastUpdate: "עודכן לאחרונה {{time}}",
    activeDays: "ימים פעילים"
  },

  // Charts
  charts: {
    title: "גרפים וניתוחים",
    subtitle: "נתונים כספיים עבור {{period}}",
    
    types: {
      bar: "גרף עמודות",
      line: "גרף קו",
      area: "גרף שטח",
      pie: "גרף עוגה"
    },
    
    noData: "אין נתונים זמינים",
    noDataDescription: "הוסיפו עסקאות כדי לראות את הגרפים שלכם",
    animations: "אנימציות",
    dataPoints: "{{count}} נקודות נתונים"
  },

  // Analytics section
  analytics: {
    title: "ניתוחים מתקדמים",
    comingSoon: "לוח ניהוח מקיף בקרוב!"
  },

  // Goals section
  goals: {
    title: "יעדים כספיים",
    comingSoon: "מעקב וניהול יעדים בקרוב!"
  },

  // Calendar
  calendar: {
    title: "לוח עסקאות",
    month: "חודש",
    week: "שבוע",
    today: "היום",
    transactions: "עסקאות",
    income: "הכנסות",
    expenses: "הוצאות"
  },

  // Filters
  filters: {
    all: "הכל",
    income: "הכנסות",
    expenses: "הוצאות"
  },

  // Actions
  actions: {
    addTransaction: "הוספת עסקה",
    refresh: "רענון",
    export: "ייצוא",
    viewAll: "צפייה בהכל",
    hideAmounts: "הסתרת סכומים",
    showAmounts: "הצגת סכומים",
    clearFilter: "ניקוי מסנן"
  },

  // Loading states
  loading: {
    dashboard: "טוען את הלוח שלכם...",
    transactions: "טוען עסקאות...",
    analytics: "טוען ניתוחים...",
    refreshing: "מרענן נתונים..."
  },

  // Success messages
  success: {
    dataRefreshed: "הלוח רוענן בהצלחה",
    transactionAdded: "העסקה נוספה בהצלחה",
    goalCreated: "היעד נוצר בהצלחה",
    exportCompleted: "הנתונים יוצאו בהצלחה"
  },

  // Error messages
  errors: {
    refreshFailed: "רענון נתוני הלוח נכשל",
    loadingFailed: "טעינת הלוח נכשלה",
    connectionError: "שגיאת חיבור - אנא נסו שוב",
    dataUnavailable: "נתוני הלוח אינם זמינים זמנית"
  },

  // Time periods
  periods: {
    today: "היום",
    week: "השבוע",
    month: "החודש",
    quarter: "הרבעון",
    year: "השנה",
    custom: "טווח מותאם"
  },

  // Performance metrics
  performance: {
    title: "מדדי ביצועים",
    monthlyGrowth: "צמיחה חודשית",
    savingsGoal: "התקדמות יעד חיסכון",
    budgetAdherence: "דבקות בתקציב",
    expenseOptimization: "אופטימיזציה של הוצאות"
  }
}; 