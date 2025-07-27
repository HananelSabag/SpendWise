/**
 * 🎯 ONBOARDING TRANSLATIONS - HEBREW
 * Complete translations for the new mobile-first onboarding experience
 * @version 2.0.0
 */

export default {
  // Main onboarding modal
  modal: {
    title: "ברוכים הבאים ל-SpendWise!",
    subtitle: "בואו נגדיר את ניהול הכספים האישי שלכם בכמה צעדים פשוטים",
    skip: "דלג לעת עתה",
    skipConfirm: "לדלג על ההתקנה?",
    skipMessage: "תמיד תוכלו להשלים את ההגדרה מאוחר יותר מהגדרות הפרופיל.",
    yes: "כן, דלג",
    no: "המשך התקנה",
    next: "הבא",
    back: "חזרה",
    finish: "בואו נתחיל",
    completing: "מגדיר את החשבון שלך...",
    error: "משהו השתבש. אנא נסה שוב.",
    close: "סגור"
  },

  // Progress indicator
  progress: {
    step: "שלב {{current}} מתוך {{total}}",
    welcome: "ברוכים הבאים",
    preferences: "העדפות", 
    categories: "קטגוריות",
    templates: "תבניות",
    ready: "מוכן!"
  },

  // Welcome step
  welcome: {
    title: "ברוכים הבאים ל-SpendWise! 💰",
    subtitle: "המסע שלכם לניהול כספי טוב יותר מתחיל כאן",
    description: "SpendWise עוזר לכם לעקוב אחר הוצאות, לנהל הכנסות ולהשיג יעדים פיננסיים עם תובנות יפות ואינטליגנטיות.",
    features: {
      title: "מה תקבלו:",
      tracking: {
        title: "מעקב הוצאות חכם",
        description: "עקבו אחר ההוצאות שלכם בקלות עם קטגוריות ותובנות חכמות"
      },
      analytics: {
        title: "אנליטיקה פיננסית", 
        description: "גרפים יפים ותובנות להבנת הרגלי הכסף שלכם"
      },
      goals: {
        title: "תקציב ויעדים",
        description: "הגדירו יעדי חיסכון ותקציבים כדי להישאר על המסלול"
      },
      mobile: {
        title: "עיצוב ידידותי לנייד",
        description: "חוויה מושלמת בכל המכשירים שלכם"
      }
    },
    cta: "בואו נתחיל!",
    timeEstimate: "לוקח בערך 2 דקות"
  },

  // Preferences step
  preferences: {
    title: "התאמה אישית של החוויה 🎨",
    subtitle: "הגדירו את ההעדפות שלכם לחוויה הטובה ביותר",
    
    language: {
      title: "שפה",
      description: "בחרו בשפה המועדפת עליכם",
      options: {
        en: "אנגלית",
        he: "עברית",
        es: "ספרדית",
        fr: "צרפתית",
        de: "גרמנית",
        ar: "ערבית"
      }
    },
    
    currency: {
      title: "מטבע עיקרי",
      description: "המטבע הראשי שלכם למעקב פיננסי",
      options: {
        USD: "דולר אמריקני ($)",
        EUR: "יורו (€)",
        ILS: "שקל ישראלי (₪)",
        GBP: "לירה בריטית (£)",
        JPY: "ין יפני (¥)",
        CNY: "יואן סיני (¥)",
        CAD: "דולר קנדי ($)",
        AUD: "דולר אוסטרלי ($)"
      }
    },
    
    theme: {
      title: "ערכת עיצוב",
      description: "בחרו איך SpendWise ייראה",
      options: {
        light: "ערכת בהיר",
        dark: "ערכת כהה", 
        auto: "ברירת מחדל של המערכת"
      }
    },

    dateFormat: {
      title: "פורמט תאריך",
      description: "איך תאריכים יוצגו",
      options: {
        "DD/MM/YYYY": "יום/חודש/שנה",
        "MM/DD/YYYY": "חודש/יום/שנה (אמריקני)",
        "YYYY-MM-DD": "שנה-חודש-יום (ISO)",
        "DD.MM.YYYY": "יום.חודש.שנה (אירופאי)"
      }
    },

    notifications: {
      title: "התראות",
      description: "הישארו מעודכנים על הכספים שלכם",
      email: "התראות במייל",
      push: "התראות דחיפה", 
      sms: "הודעות SMS",
      recurring: "תזכורות עסקאות חוזרות",
      budgetAlerts: "התראות תקציב"
    }
  },

  // Categories step
  categories: {
    title: "בחרו את הקטגוריות שלכם 📂",
    subtitle: "בחרו את קטגוריות ההוצאות וההכנסות שתשתמשו בהן הכי הרבה",
    description: "אל תדאגו - תמיד תוכלו להוסיף, להסיר או להתאים קטגוריות מאוחר יותר.",
    
    tabs: {
      expense: "קטגוריות הוצאות",
      income: "קטגוריות הכנסות",
      both: "כל הקטגוריות"
    },
    
    defaultCategories: {
      title: "קטגוריות מומלצות",
      description: "קטגוריות פופולריות בהתבסס על ההעדפות שלכם"
    },
    
    customCategories: {
      title: "צור קטגוריה מותאמת",
      name: "שם הקטגוריה",
      namePlaceholder: "הכניסו שם קטגוריה...",
      description: "תיאור (רשות)",
      descriptionPlaceholder: "מה הקטגוריה הזו כוללת...",
      icon: "בחרו איקון",
      color: "בחרו צבע",
      type: "סוג קטגוריה",
      add: "הוסף קטגוריה",
      creating: "יוצר..."
    },
    
    selectedCount: "{{count}} קטגוריות נבחרו",
    minRequired: "בחרו לפחות 3 קטגוריות כדי להמשיך",
    
    popular: {
      title: "קטגוריות פופולריות",
      subtitle: "הכי נפוצות בקרב משתמשי SpendWise"
    }
  },

  // Templates step (recurring transactions)
  templates: {
    title: "הגדירו עסקאות חוזרות 🔄",
    subtitle: "בצעו אוטומציה של ההכנסות וההוצאות הקבועות שלכם",
    description: "חסכו זמן על ידי הגדרת עסקאות שקורות באופן קבוע - כמו משכורת, שכר דירה או מנויים.",
    
    skip: "דלג על השלב הזה",
    skipMessage: "אגדיר עסקאות חוזרות מאוחר יותר",
    
    add: "הוסף עסקה חוזרת",
    edit: "ערוך תבנית",
    delete: "מחק תבנית",
    
    form: {
      type: "סוג עסקה",
      typeOptions: {
        income: "הכנסה",
        expense: "הוצאה"
      },
      
      amount: "סכום",
      amountPlaceholder: "0.00",
      
      description: "תיאור",
      descriptionPlaceholder: "למשל: משכורת חודשית, תשלום שכר דירה...",
      
      category: "קטגוריה", 
      categoryPlaceholder: "בחרו קטגוריה...",
      
      frequency: "תדירות",
      frequencyOptions: {
        daily: "יומי",
        weekly: "שבועי", 
        monthly: "חודשי"
      },
      
      startDate: "תאריך התחלה",
      endDate: "תאריך סיום (רשות)",
      
      dayOfWeek: "יום בשבוע",
      dayOfMonth: "יום בחודש",
      
      preview: "תצוגה מקדימה של העסקאות הבאות",
      save: "שמור תבנית",
      saving: "שומר..."
    },
    
    examples: {
      title: "דוגמאות נפוצות",
      salary: {
        title: "משכורת חודשית",
        description: "הכנסה חוזרת מהעבודה שלכם"
      },
      rent: {
        title: "תשלום שכר דירה", 
        description: "הוצאת דיור חודשית"
      },
      subscription: {
        title: "שירותי מנוי",
        description: "נטפליקס, ספוטיפיי וכו'"
      },
      utilities: {
        title: "חשבונות שירותים",
        description: "חשמל, מים, אינטרנט"
      }
    },
    
    templateCount: "{{count}} תבניות נוצרו",
    recommended: "אנו ממליצים להגדיר 2-4 עסקאות קבועות"
  },

  // Success/completion step
  completion: {
    title: "הכל מוכן! 🎉",
    subtitle: "החשבון שלכם ב-SpendWise מוכן לעזור לכם לנהל את הכספים",
    
    summary: {
      title: "סיכום הגדרות",
      language: "שפה: {{language}}",
      currency: "מטבע: {{currency}}", 
      theme: "ערכת עיצוב: {{theme}}",
      categories: "קטגוריות: {{count}} נבחרו",
      templates: "חוזרות: {{count}} תבניות"
    },
    
    nextSteps: {
      title: "הצעדים הבאים",
      addTransaction: {
        title: "הוסיפו את העסקה הראשונה",
        description: "התחילו במעקב על ידי הוספת הוצאה או הכנסה"
      },
      exploreAnalytics: {
        title: "חקרו את האנליטיקה",
        description: "צפו בתובנות על דפוסי ההוצאות שלכם"
      },
      setGoals: {
        title: "הגדירו יעדים פיננסיים", 
        description: "צרו תקציבים ויעדי חיסכון"
      },
      inviteFriends: {
        title: "שתפו עם חברים",
        description: "עזרו לאחרים לקחת שליטה על הכספים שלהם"
      }
    },
    
    cta: "התחילו להשתמש ב-SpendWise",
    processing: "מסיימים את ההגדרה שלכם..."
  },

  // Error messages
  errors: {
    loadingFailed: "טעינת נתוני ההתקנה נכשלה",
    savingFailed: "שמירת ההעדפות שלכם נכשלה", 
    completionFailed: "השלמת הגדרת ההתקנה נכשלה",
    networkError: "שגיאת רשת - אנא בדקו את החיבור שלכם",
    serverError: "שגיאת שרת - אנא נסו שוב מאוחר יותר",
    validationError: "אנא מלאו את כל השדות הנדרשים",
    categoryCreateFailed: "יצירת קטגוריה מותאמת נכשלה",
    templateCreateFailed: "יצירת תבנית חוזרת נכשלה"
  },

  // Success messages
  success: {
    preferencesSaved: "ההעדפות נשמרו בהצלחה!",
    categoriesSelected: "הקטגוריות הוגדרו!",
    templateCreated: "תבנית חוזרת נוצרה!",
    templateUpdated: "תבנית חוזרת עודכנה!",
    templateDeleted: "תבנית חוזרת נמחקה!",
    onboardingComplete: "ברוכים הבאים ל-SpendWise! החשבון שלכם מוכן."
  },

  // Tooltips and help
  help: {
    language: "בחרו בשפה לממשק SpendWise",
    currency: "זה יהיה המטבע הראשי שלכם לכל העסקאות",
    theme: "ערכת אוטומטית עוברת בין בהיר לכהה בהתבסס על המערכת שלכם",
    dateFormat: "זה משפיע על איך תאריכים מוצגים בכל האפליקציה",
    categories: "קטגוריות עוזרות לארגן את העסקאות שלכם לתובנות טובות יותר",
    recurring: "עסקאות חוזרות נוצרות אוטומטית בהתבסס על הלוח הזמנים שלכם",
    frequency: "כמה פעמים העסקה הזו אמורה לחזור על עצמה",
    dayOfMonth: "באיזה יום בחודש (1-31) לעסקאות חודשיות",
    dayOfWeek: "באיזה יום בשבוע לעסקאות שבועיות"
  }
}; 