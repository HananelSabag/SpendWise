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
    net: 'נטו',
    change: 'שינוי',
    growth: 'צמיחה'
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
  
  // Recent Transactions
  recentTransactions: {
    title: 'תנועות אחרונות',
    viewAll: 'צפה בהכל',
    noTransactions: 'לא נמצאו תנועות',
    amount: 'סכום',
    date: 'תאריך',
    category: 'קטגוריה'
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

  // Overview section expected by Dashboard components
  overview: {
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

  // Common elements that might be accessed from dashboard context
  common: {
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
  }
}; 