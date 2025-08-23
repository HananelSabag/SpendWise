/**
 * 👤 PROFILE TRANSLATIONS - HEBREW
 * תרגומים לעמוד הפרופיל - עברית
 */

export default {
  page: {
    title: 'פרופיל',
    subtitle: 'נהל את החשבון וההעדפות שלך'
  },
  // Navigation tabs
  tabs: {
    personal: 'מידע אישי',
    preferences: 'העדפות',
    security: 'אבטחה',
    export: 'ייצוא נתונים'
  },

  // Messages
  messages: {
    profileUpdated: 'הפרופיל עודכן בהצלחה',
    preferencesUpdated: 'ההעדפות עודכנו בהצלחה',
    passwordChanged: 'הסיסמה שונתה בהצלחה',
    uploadSuccess: 'תמונת הפרופיל הועלתה בהצלחה',
    uploadError: 'העלאת תמונת הפרופיל נכשלה'
  },

  // Personal Info section
  personal: {
    title: 'מידע אישי',
    profilePictureTitle: 'תמונת פרופיל',
    profilePictureAlt: 'תמונת פרופיל',
    changePicture: 'שנה תמונה',
    firstName: 'שם פרטי',
    lastName: 'שם משפחה',
    email: 'אימייל',
    phone: 'טלפון',
    location: 'מיקום',
    website: 'אתר אינטרנט',
    birthday: 'תאריך לידה',
    bio: 'ביוגרפיה',
    bioPlaceholder: 'ספר לנו על עצמך...',
    memberSince: 'חבר מאז'
  },

  // Preferences section
  preferences: {
    title: 'העדפות יישום',
    subtitle: 'התאם את חוויית SpendWise שלך עם ההגדרות הללו.',
    language: 'שפה',
    theme: 'ערכת נושא',
    currency: 'מטבע',
    savePreferences: 'שמור העדפות'
  },

  // Security section
  security: {
    title: 'אבטחה וחשבון',
    subtitle: 'נהל את הגדרות האבטחה שלך',
    
    // סיסמה
    password: {
      title: 'שינוי סיסמה',
      current: 'סיסמה נוכחית',
      new: 'סיסמה חדשה',
      confirm: 'אימות סיסמה חדשה',
      change: 'שנה סיסמה',
      success: 'הסיסמה שונתה בהצלחה',
      error: 'שגיאה בשינוי הסיסמה',
      requirements: 'הסיסמה חייבת להכיל לפחות 8 תווים',
      requirements: 'הסיסמה חייבת להיות באורך של 8 תווים לפחות',
      policy: 'הסיסמה חייבת לכלול לפחות אות אחת ומספר אחד'
    },
    
    // הפעלה דו-שלבית
    twoFactor: {
      title: 'הפעלה דו-שלבית',
      subtitle: 'הוסף רובד אבטחה נוסף לחשבון שלך',
      enable: 'הפעל 2FA',
      disable: 'בטל 2FA',
      status: 'סטטוס',
      enabled: 'מופעל',
      disabled: 'מבוטל'
    },
    
    // התחברות אחרונה
    lastActivity: {
      title: 'פעילות אחרונה',
      subtitle: 'עיין בהתחברויות האחרונות שלך',
      device: 'מכשיר',
      location: 'מיקום',
      time: 'זמן',
      current: 'הפעלה נוכחית'
    }
  },
  
  // ייצוא נתונים
  export: {
    title: 'ייצוא נתונים',
    subtitle: 'הורד את הנתונים שלך',
    
    // אפשרויות ייצוא
    options: {
      all: 'כל הנתונים',
      transactions: 'עסקאות בלבד',
      categories: 'קטגוריות בלבד',
      custom: 'מותאם אישית'
    },
    
    // פורמטים
    formats: {
      csv: 'CSV',
      json: 'JSON',
      pdf: 'PDF',
      excel: 'Excel'
    },
    
    // תקופת זמן
    dateRange: {
      title: 'בחר תקופה',
      all: 'כל התקופה',
      lastMonth: 'חודש אחרון',
      lastYear: 'שנה אחרונה',
      custom: 'תקופה מותאמת'
    },
    
    // פעולות
    actions: {
      download: 'הורד נתונים',
      preview: 'תצוגה מקדימה',
      schedule: 'תזמן ייצוא'
    },
    
    // הודעות
    messages: {
      preparing: 'מכין את הקובץ...',
      ready: 'הקובץ מוכן להורדה',
      error: 'שגיאה ביצירת הקובץ',
      emailSent: 'הקובץ נשלח לאימייל שלך'
    }
  },
  
  // התראות
  notifications: {
    title: 'התראות',
    subtitle: 'בחר איך ומתי לקבל התראות',
    
    // סוגי התראות
    types: {
      email: 'אימייל',
      push: 'התראות דחיפה',
      sms: 'SMS',
      inApp: 'התראות באפליקציה'
    },
    
    // קטגוריות
    categories: {
      transactions: 'עסקאות',
      budgets: 'תקציבים',
      goals: 'יעדים',
      security: 'אבטחה',
      marketing: 'שיווק'
    }
  },

  // ✅ ADDED: Overview section for ProfileOverview.jsx component
  overview: {
    // Recent Activity
    recentActivity: 'פעילות אחרונה',
    items: 'פריטים',
    viewAll: 'צפה בהכל',

    // Activity Types
    activity: {
      expense: 'הוצאה חדשה',
      expenseDesc: 'הוספת הוצאה לתקציב',
      income: 'הכנסה חדשה', 
      incomeDesc: 'הוספת הכנסה לחשבון',
      achievement: 'הישג חדש',
      achievementDesc: 'השגת יעד חדש',
      setting: 'עדכון הגדרות',
      settingDesc: 'שינוי הגדרות האפליקציה'
    },

    // Achievements
    achievements: {
      title: 'הישגים',
      saver: 'חוסך מקצועי',
      saverDesc: 'חסכת מעל 1000₪ החודש',
      streak: 'רצף יומי',
      streakDesc: '7 ימים רצופים של מעקב',
      categories: 'מנהל קטגוריות',
      categoriesDesc: 'יצרת 5 קטגוריות מותאמות',
      budgeter: 'מתקצב חכם',
      budgeterDesc: 'נשארת בתקציב 3 חודשים'
    },

    // Quick Actions
    quickActions: {
      title: 'פעולות מהירות',
      export: 'ייצא נתונים',
      preferences: 'העדפות',
      security: 'אבטחה',
      share: 'שתף',
      smart: 'חכם',
      help: 'עזרה'
    }
  },
  
  // פעולות כלליות
  actions: {
    save: 'שמור',
    cancel: 'ביטול',
    delete: 'מחק',
    edit: 'ערוך',
    update: 'עדכן',
    confirm: 'אשר',
    back: 'חזור',
    // תואם לשימוש t('profile.actions.success')
    success: 'הצלחה'
  },
  
  // הודעות כלליות
  messages: {
    loading: 'טוען...',
    saving: 'שומר...',
    saved: 'נשמר בהצלחה',
    error: 'אירעה שגיאה',
    success: 'הפעולה הושלמה בהצלחה'
  }
}; 