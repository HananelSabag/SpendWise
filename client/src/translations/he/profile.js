/**
 * 👤 PROFILE TRANSLATIONS - HEBREW
 * תרגומים לעמוד הפרופיל - עברית
 */

export default {
  page: {
    title: "פרופיל",
    subtitle: "נהל את החשבון וההעדפות שלך"
  },
  tabs: {
    personal: "מידע אישי",
    preferences: "העדפות",
    security: "אבטחה",
    export: "ייצוא נתונים",
    accountSettings: "הגדרות חשבון",
    accountSettingsDesc: "נהל את הפרופיל וההעדפות שלך"
  },
  messages: {
    loading: "טוען...",
    saving: "שומר...",
    saved: "נשמר בהצלחה",
    error: "אירעה שגיאה",
    success: "הפעולה הושלמה בהצלחה"
  },
  personal: {
    title: "מידע אישי",
    profilePictureTitle: "תמונת פרופיל",
    profilePictureAlt: "תמונת פרופיל",
    changePicture: "שנה תמונה",
    firstName: "שם פרטי",
    lastName: "שם משפחה",
    email: "אימייל",
    phone: "טלפון",
    location: "מיקום",
    website: "אתר אינטרנט",
    birthday: "תאריך לידה",
    bio: "ביוגרפיה",
    bioPlaceholder: "ספר לנו על עצמך...",
    memberSince: "חבר מאז",
    changePhoto: "שנה תמונה",
    setPhoto: "קבע תמונה",
    newPhotoDesc: "זו תהיה תמונת הפרופיל החדשה שלך",
    processingImage: "מעבד תמונה…",
    imageTooLargeAfterCompression: "התמונה גדולה מדי לאחר דחיסה ({{size}}MB). בחר תמונה קטנה יותר.",
    imageProcessingFailed: "עיבוד התמונה נכשל. נסה תמונה אחרת."
  },
  preferences: {
    title: "העדפות יישום",
    subtitle: "התאם את חוויית SpendWise שלך עם ההגדרות הללו.",
    language: {
      title: "שפה ואזור",
      language: "שפה",
      currency: "מטבע",
      dateFormat: "פורמט תאריך",
      timezone: "אזור זמן"
    },
    theme: "ערכת נושא",
    currency: "מטבע",
    savePreferences: "שמור העדפות",
    themeOptions: {
      system: "אוטומטי",
      light: "בהיר",
      dark: "כהה"
    },
    display: {
      title: "תצוגה",
      theme: "ערכת נושא",
      density: "צפיפות",
      animations: "אנימציות"
    }
  },
  security: {
    title: "אבטחה וחשבון",
    subtitle: "נהל את הגדרות האבטחה שלך",
    password: {
      title: "שינוי סיסמה",
      current: "סיסמה נוכחית",
      new: "סיסמה חדשה",
      confirm: "אימות סיסמה חדשה",
      change: "שנה סיסמה",
      success: "הסיסמה שונתה בהצלחה",
      error: "שגיאה בשינוי הסיסמה",
      requirements: "הסיסמה חייבת להיות באורך של 8 תווים לפחות",
      policy: "הסיסמה חייבת לכלול לפחות אות אחת ומספר אחד"
    },
    setPassword: "קבע סיסמה",
    updatePassword: "עדכן סיסמה",
    googleSignInNote: "התחברת עם Google. ניתן להוסיף סיסמה כדי להתחבר גם עם אימייל.",
    currentPasswordPlaceholder: "סיסמה נוכחית",
    newPasswordPlaceholder: "סיסמה חדשה (8 תווים לפחות, אות + ספרה)",
    confirmPasswordPlaceholder: "אימות סיסמה חדשה",
    twoFactor: {
      title: "הפעלה דו-שלבית",
      subtitle: "הוסף רובד אבטחה נוסף לחשבון שלך",
      enable: "הפעל 2FA",
      disable: "בטל 2FA",
      status: "סטטוס",
      enabled: "מופעל",
      disabled: "מבוטל"
    },
    lastActivity: {
      title: "פעילות אחרונה",
      subtitle: "עיין בהתחברויות האחרונות שלך",
      device: "מכשיר",
      location: "מיקום",
      time: "זמן",
      current: "הפעלה נוכחית"
    }
  },
  export: {
    title: "ייצוא נתונים",
    subtitle: "הורד את הנתונים שלך",
    options: {
      all: "כל הנתונים",
      transactions: "עסקאות בלבד",
      categories: "קטגוריות בלבד",
      custom: "מותאם אישית"
    },
    formats: {
      csv: "CSV",
      json: "JSON",
      pdf: "PDF",
      excel: "Excel"
    },
    csvLabel: "ייצוא כ-CSV",
    csvDesc: "פורמט גיליון אלקטרוני עבור Excel / Google Sheets",
    jsonLabel: "ייצוא כ-JSON",
    jsonDesc: "פורמט נתונים גולמי למפתחים",
    pdfLabel: "ייצוא כ-PDF",
    pdfDesc: "דוח מעוצב מוכן להדפסה או שיתוף",
    dateRange: {
      title: "בחר תקופה",
      all: "כל התקופה",
      lastMonth: "חודש אחרון",
      lastYear: "שנה אחרונה",
      custom: "תקופה מותאמת"
    },
    actions: {
      download: "הורד נתונים",
      preview: "תצוגה מקדימה",
      schedule: "תזמן ייצוא"
    },
    messages: {
      preparing: "מכין את הקובץ...",
      ready: "הקובץ מוכן להורדה",
      error: "שגיאה ביצירת הקובץ",
      emailSent: "הקובץ נשלח לאימייל שלך"
    }
  },
  notifications: {
    title: "התראות",
    subtitle: "בחר איך ומתי לקבל התראות",
    types: {
      email: "אימייל",
      push: "התראות דחיפה",
      sms: "SMS",
      inApp: "התראות באפליקציה"
    },
    categories: {
      transactions: "עסקאות",
      budgets: "תקציבים",
      goals: "יעדים",
      security: "אבטחה",
      marketing: "שיווק"
    }
  },
  overview: {
    recentActivity: "פעילות אחרונה",
    items: "פריטים",
    viewAll: "צפה בהכל",
    activity: {
      expense: "הוצאה חדשה",
      expenseDesc: "הוספת הוצאה לתקציב",
      income: "הכנסה חדשה",
      incomeDesc: "הוספת הכנסה לחשבון",
      achievement: "הישג חדש",
      achievementDesc: "השגת יעד חדש",
      setting: "עדכון הגדרות",
      settingDesc: "שינוי הגדרות האפליקציה"
    },
    achievements: {
      title: "הישגים",
      saver: "חוסך מקצועי",
      saverDesc: "חסכת מעל 1000₪ החודש",
      streak: "רצף יומי",
      streakDesc: "7 ימים רצופים של מעקב",
      categories: "מנהל קטגוריות",
      categoriesDesc: "יצרת 5 קטגוריות מותאמות",
      budgeter: "מתקצב חכם",
      budgeterDesc: "נשארת בתקציב 3 חודשים"
    },
    quickActions: {
      title: "פעולות מהירות",
      export: "ייצא נתונים",
      preferences: "העדפות",
      security: "אבטחה",
      share: "שתף",
      smart: "חכם",
      help: "עזרה"
    }
  },
  actions: {
    save: "שמור",
    cancel: "ביטול",
    delete: "מחק",
    edit: "ערוך",
    update: "עדכן",
    confirm: "אשר",
    back: "חזור",
    success: "הצלחה"
  },
  avatarTooLarge: "תמונת הפרופיל גדולה מדי",
  avatarUploaded: "תמונת הפרופיל הועלתה",
  avatarUploadFailed: "העלאת תמונת הפרופיל נכשלה",
  currentPasswordWrong: "הסיסמה הנוכחית שגויה",
  passwordChanged: "הסיסמה שונתה בהצלחה",
  passwordChangeFailed: "שינוי הסיסמה נכשל",
  passwordMismatch: "הסיסמאות אינן תואמות",
  passwordTooShort: "הסיסמה קצרה מדי",
  preferencesUpdated: "ההעדפות עודכנו",
  profileUpdated: "הפרופיל עודכן",
  profileUpdateFailed: "עדכון הפרופיל נכשל",
  requiredFieldsMissing: "יש למלא שדות חובה"
};
