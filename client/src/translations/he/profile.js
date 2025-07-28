/**
 * 👤 PROFILE TRANSLATIONS - HEBREW
 * תרגומים לעמוד הפרופיל - עברית
 */

export default {
  // כותרת ראשית
  title: 'פרופיל',
  subtitle: 'נהל את המידע האישי והעדפות החשבון שלך',
  
  // לשוניות ראשיות  
  tabs: {
    personal: 'מידע אישי',
    security: 'אבטחה',
    export: 'ייצוא נתונים',
    preferences: 'העדפות',
    notifications: 'התראות'
  },
  
  // מידע אישי
  personal: {
    title: 'פרטים אישיים',
    subtitle: 'עדכן את הפרטים האישיים שלך',
    
    // שדות
    fields: {
      firstName: 'שם פרטי',
      lastName: 'שם משפחה', 
      username: 'שם משתמש',
      email: 'כתובת אימייל',
      phone: 'מספר טלפון',
      dateOfBirth: 'תאריך לידה',
      address: 'כתובת',
      city: 'עיר',
      country: 'מדינה',
      zipCode: 'מיקוד'
    },
    
    // תמונת פרופיל
    avatar: {
      title: 'תמונת פרופיל',
      subtitle: 'עדכן את התמונה שלך',
      upload: 'העלה תמונה חדשה',
      remove: 'הסר תמונה',
      change: 'שנה תמונה',
      uploading: 'מעלה תמונה...',
      success: 'התמונה עודכנה בהצלחה',
      error: 'שגיאה בהעלאת התמונה',
      requirements: 'גודל מקסימלי: 5MB, פורמטים: JPG, PNG, GIF'
    },
    
    // פעולות
    actions: {
      save: 'שמור שינויים',
      cancel: 'ביטול',
      reset: 'איפוס',
      edit: 'ערוך'
    },
    
    // הודעות
    messages: {
      saved: 'הפרטים נשמרו בהצלחה',
      error: 'שגיאה בשמירת הפרטים',
      validation: 'אנא מלא את כל השדות הנדרשים'
    }
  },
  
  // אבטחה
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
      requirements: 'הסיסמה חייבת להכיל לפחות 8 תווים'
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
  
  // העדפות
  preferences: {
    title: 'העדפות',
    subtitle: 'התאם את החוויה שלך',
    
    // שפה ואזור
    language: {
      title: 'שפה ואזור',
      language: 'שפה',
      currency: 'מטבע',
      dateFormat: 'פורמט תאריך',
      timezone: 'אזור זמן'
    },
    
    // תצוגה
    display: {
      title: 'תצוגה',
      theme: 'ערכת נושא',
      density: 'צפיפות',
      animations: 'אנימציות'
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
  
  // פעולות כלליות
  actions: {
    save: 'שמור',
    cancel: 'ביטול',
    delete: 'מחק',
    edit: 'ערוך',
    update: 'עדכן',
    confirm: 'אשר',
    back: 'חזור'
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