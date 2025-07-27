/**
 * 🇮🇱 Hebrew Onboarding Translations
 * Complete RTL translation keys for onboarding system
 * @version 3.0.0 - COMPLETE HEBREW TRANSLATION COVERAGE
 */

export default {
  // ✅ התקדמות וניווט
  progress: {
    welcome: 'ברוכים הבאים',
    preferences: 'העדפות',
    categories: 'קטגוריות',
    templates: 'תבניות',
    ready: 'מוכן',
    step: 'שלב {{current}} מתוך {{total}}',
    stepDescription: 'השלימו את ההתקנה כדי להפיק את המקסימום מ-SpendWise',
    complete: 'הושלם',
    timeRemaining: 'נותרו {{minutes}} דקות'
  },

  // ✅ ניווט בחלון
  modal: {
    back: 'חזור',
    next: 'הבא',
    skip: 'דלג',
    finish: 'סיים',
    close: 'סגור',
    completing: 'משלים...',
    unsavedChanges: 'יש לכם שינויים שלא נשמרו. האם אתם בטוחים שאתם רוצים לעזוב?',
    keyboardHint: 'השתמשו בקיצורי מקלדת',
    nextShortcut: 'הבא',
    backShortcut: 'חזור',
    skipShortcut: 'דלג',
    readyToComplete: 'מוכן להשלמת ההתקנה!'
  },

  // ✅ תוכן הטמעה ראשי
  title: 'ברוכים הבאים ל-SpendWise!',
  subtitle: 'בואו נגדיר את החשבון שלכם בכמה שלבים פשוטים',

  // ✅ מערכת תבניות
  templates: {
    title: 'הגדירו את התבניות שלכם',
    subtitle: 'צרו עסקאות חוזרות כדי לאתמת את מעקב ההוצאות שלכם',
    selected: '{{count}} תבניות נבחרו',
    setupComplete: 'הגדרת התבניות הושלמה!',
    templatesAdded: '{{count}} תבניות נוספו בהצלחה',
    setupFailed: 'הגדרת התבניות נכשלה',
    customCreated: 'תבנית מותאמת אישית נוצרה בהצלחה',
    createFailed: 'יצירת תבנית מותאמת אישית נכשלה',
    setting: 'מגדיר תבניות...',
    continue: 'המשך עם {{count}} תבניות',
    creating: 'יוצר...',
    create: 'צור תבנית',
    createCustom: 'צור תבנית מותאמת אישית',
    createFirst: 'צרו את התבנית הראשונה שלכם',
    addCustom: 'הוסף מותאם אישית',
    custom: 'מותאם אישית',
    loadMore: 'טען עוד תבניות',

    // קטגוריות תבניות
    categories: {
      popular: 'פופולרי',
      income: 'הכנסות',
      essential: 'חיוני',
      lifestyle: 'אורח חיים',
      custom: 'מותאם אישית',
      popularDescription: 'התבניות הנפוצות ביותר',
      incomeDescription: 'משכורת, עבודה עצמאית והכנסות אחרות',
      essentialDescription: 'שכר דירה, חשמל והוצאות הכרחיות',
      lifestyleDescription: 'בידור, אוכל והוצאות אישיות',
      customDescription: 'התבניות המותאמות אישית שלכם'
    },

    // תבניות פופולריות
    popular: {
      salary: 'משכורת חודשית',
      rent: 'שכר דירה חודשי',
      groceries: 'קניות מזון',
      streaming: 'שירותי סטרימינג',
      carPayment: 'תשלום רכב'
    },

    // תבניות הכנסות
    income: {
      primarySalary: 'משכורת עיקרית',
      freelance: 'הכנסה עצמאית',
      investments: 'תשואות השקעות',
      bonus: 'בונוס רבעוני'
    },

    // תבניות חיוניות
    essential: {
      utilities: 'שירותים',
      phone: 'חשבון טלפון',
      insurance: 'ביטוח',
      internet: 'אינטרנט'
    },

    // תבניות אורח חיים
    lifestyle: {
      gym: 'מנוי חדר כושר',
      coffee: 'קפה ומשקאות',
      travel: 'קרן נסיעות',
      diningOut: 'אוכל במסעדות'
    },

    // טופס תבנית
    form: {
      description: 'תיאור',
      descriptionPlaceholder: 'הזינו תיאור תבנית...',
      amount: 'סכום',
      type: 'סוג',
      category: 'קטגוריה',
      frequency: 'תדירות',
      selectCategory: 'בחרו קטגוריה',
      selectFrequency: 'בחרו תדירות',
      preview: 'תצוגה מקדימה'
    },

    // אימות תבנית
    validation: {
      required: 'אנא מלאו את כל השדות הנדרשים',
      descriptionRequired: 'תיאור נדרש',
      descriptionTooShort: 'התיאור חייב להיות לפחות 3 תווים',
      descriptionTooLong: 'התיאור חייב להיות פחות מ-50 תווים',
      amountRequired: 'הסכום חייב להיות גדול מ-0',
      amountTooLarge: 'הסכום לא יכול לעלות על $1,000,000'
    },

    // חיפוש תבניות
    search: {
      placeholder: 'חפשו תבניות...',
      noResults: 'לא נמצאו תבניות',
      noResultsDescription: 'לא נמצאו תבניות שתואמות ל"{{query}}". נסו מילת חיפוש אחרת.',
      results: '{{count}} תוצאות עבור "{{query}}"'
    },

    // סיכום תבניות
    summary: {
      title: 'סיכום תבניות',
      description: 'בחרתם {{count}} תבניות לאוטומציה',
      templates: 'תבניות'
    },

    // פעולות תבנית
    edit: 'ערוך תבנית',
    delete: 'מחק תבנית',
    duplicate: 'שכפל תבנית',
    activate: 'הפעל',
    deactivate: 'כבה'
  },

  // ✅ מערכת העדפות
  preferences: {
    title: 'ההעדפות שלכם',
    subtitle: 'התאימו את חוויית SpendWise שלכם',
    sectionDesc: 'הגדירו את ההעדפות שלכם כדי לתת אופי אישי לחוויה שלכם',
    stepProgress: 'סעיף {{current}} מתוך {{total}}',
    saved: 'ההעדפות נשמרו בהצלחה',
    savedDescription: 'ההעדפות שלכם הוחלו',
    saveFailed: 'שמירת ההעדפות נכשלה',
    saving: 'שומר העדפות...',
    complete: 'השלם הגדרה',
    nextSection: 'סעיף הבא',
    previousSection: 'קודם',
    completed: '{{count}} סעיפים הושלמו',
    required: 'נדרש',
    quickComplete: 'דלג להשלמה',

    // העדפות שפה
    language: {
      title: 'שפה ואיזור',
      description: 'בחרו את השפה המועדפת עליכם',
      sectionDesc: 'בחרו את השפה וההעדפות האזוריות שלכם',
      current: 'נוכחי',
      rtl: 'טקסט מימין לשמאל',
      preview: 'תצוגה מקדימה',
      sampleText: 'כך ייראה הטקסט בשפה שבחרתם',
      help: 'תוכלו לשנות את זה מאוחר יותר בהגדרות'
    },

    // העדפות נושא
    theme: {
      title: 'מראה',
      description: 'בחרו את הנושא המועדף עליכם',
      sectionDesc: 'התאימו את המראה החזותי של SpendWise',
      light: 'בהיר',
      dark: 'כהה',
      auto: 'אוטומטי',
      lightDescription: 'ממשק בהיר לשימוש ביום',
      darkDescription: 'ממשק כהה לסביבות עם תאורה נמוכה',
      autoDescription: 'תואם את העדפת המערכת שלכם',
      current: 'נוכחי',
      preview: 'תצוגה מקדימה',
      currentlyUsing: 'משתמש כרגע בנושא {{theme}}',
      systemDetected: 'העדפת מערכת זוהתה: {{theme}}',
      help: 'הנושא יוחל מיד'
    },

    // העדפות מטבע
    currency: {
      title: 'מטבע',
      description: 'בחרו את המטבע העיקרי שלכם',
      sectionDesc: 'הגדירו את מטבע ברירת המחדל שלכם לעסקאות',
      popular: 'פופולרי',
      popularTitle: 'מטבעות פופולריים',
      selected: 'נבחר',
      searchPlaceholder: 'חפשו מטבעות...',
      searchResults: '{{count}} תוצאות עבור "{{query}}"',
      noResults: 'לא נמצאו מטבעות עבור "{{query}}"',
      sample: 'דוגמה',
      preview: 'תצוגה מקדימה של מטבע',
      help: 'כל הסכומים יוצגו במטבע זה'
    },

    // העדפות התראות
    notifications: {
      title: 'התראות',
      description: 'נהלו את העדפות ההתראות שלכם',
      sectionDesc: 'בחרו איך אתם רוצים לקבל התראות',
      enablePush: 'הפעלת התראות דחיפה',
      enablePushDesc: 'קבלו התראות מיידיות במכשיר שלכם לעדכונים חשובים',
      allowNotifications: 'אפשר התראות',
      permissionGranted: 'התראות הופעלו בהצלחה',
      permissionDenied: 'התראות נדחו. תוכלו להפעיל אותן מאוחר יותר בהגדרות.',
      permissionError: 'בקשת הרשאת התראות נכשלה',
      permissionRequired: 'נדרשת הרשאת דפדפן',
      notSupported: 'התראות אינן נתמכות בדפדפן זה',
      recommended: 'מומלץ',
      help: 'תוכלו לשנות את ההגדרות האלו בכל זמן',

      // ערוצי התראות
      channels: {
        title: 'ערוצי התראות',
        push: 'התראות דחיפה',
        email: 'אימייל',
        sms: 'SMS',
        pushDesc: 'התראות מיידיות בדפדפן',
        emailDesc: 'התראות אימייל לתיבת הדואר שלכם',
        smsDesc: 'הודעות טקסט לטלפון שלכם'
      },

      // קטגוריות התראות
      categories: {
        essential: 'חיוני',
        activity: 'פעילות',
        reports: 'דוחות',
        marketing: 'שיווק',
        essentialDesc: 'התראות ביטחון ותקציב קריטיות',
        activityDesc: 'פעילות עסקאות וחשבון',
        reportsDesc: 'סיכומים שבועיים וחודשיים',
        marketingDesc: 'עדכוני מוצר וקידום מכירות'
      },

      // התראות ספציפיות
      security: {
        title: 'התראות ביטחון',
        description: 'התראות ביטחון חשובות'
      },
      budget: {
        title: 'התראות תקציב',
        description: 'כשאתם מתקרבים למגבלות הוצאה'
      },
      transactions: {
        title: 'התראות עסקאות',
        description: 'התראות עסקאות חדשות'
      },
      recurring: {
        title: 'תזכורות חוזרות',
        description: 'עסקאות חוזרות קרובות'
      },
      weekly: {
        title: 'דוחות שבועיים',
        description: 'סיכום ההוצאות השבועי שלכם'
      },
      monthly: {
        title: 'דוחות חודשיים',
        description: 'סקירת הכספים החודשית שלכם'
      },
      marketing: {
        title: 'עדכוני מוצר',
        description: 'תכונות חדשות והודעות'
      },

      // הגדרות התראות
      settings: {
        title: 'הגדרות התראות'
      },

      // סיכום התראות
      summary: {
        title: 'סיכום התראות',
        enabled: 'מופעל',
        channels: 'ערוצים פעילים'
      }
    }
  },

  // ✅ מערכת השלמה
  completion: {
    title: 'ההגדרה הושלמה!',
    subtitle: 'ברוכים הבאים ל-SpendWise',
    success: 'ההטמעה הושלמה בהצלחה!',
    failed: 'השלמת ההטמעה נכשלה. אנא נסו שוב.',
    description: 'החשבון שלכם מוכן כעת לשימוש. התחילו לעקוב אחר ההוצאות שלכם והגיעו ליעדים הפיננסיים שלכם!'
  },

  // ✅ תוויות סוג
  templateTypes: {
    income: 'הכנסה',
    expense: 'הוצאה'
  },

  // ✅ תוויות תדירות
  frequencies: {
    weekly: 'שבועי',
    monthly: 'חודשי',
    quarterly: 'רבעוני',
    yearly: 'שנתי'
  },

  // ✅ פעולות נפוצות
  common: {
    cancel: 'ביטול',
    save: 'שמור',
    enabled: 'מופעל',
    disabled: 'מכובה',
    back: 'חזור',
    continue: 'המשך',
    complete: 'השלם',
    skip: 'דלג',
    next: 'הבא',
    previous: 'קודם',
    close: 'סגור'
  }
}; 