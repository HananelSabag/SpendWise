/**
 * 🏷️ CATEGORIES TRANSLATIONS - HEBREW
 * תרגומים מקיפים למערכת ניהול הקטגוריות
 * @version 3.0.0 - NEW CATEGORY ARCHITECTURE
 */

export default {
  // כותרות ראשיות
  title: 'מנהל הקטגוריות',
  subtitle: 'נהל את {{count}} קטגוריות ההוצאות שלך',

  // פעולות
  actions: {
    create: 'צור קטגוריה',
    edit: 'ערוך קטגוריה',
    delete: 'מחק קטגוריה',
    duplicate: 'שכפל קטגוריה',
    pin: 'נעץ קטגוריה',
    unpin: 'בטל נעיצה',
    show: 'הצג קטגוריה',
    hide: 'הסתר קטגוריה',
    export: 'ייצא קטגוריות',
    import: 'יבא קטגוריות',
    refresh: 'רענן'
  },

  // שדות טופס
  fields: {
    name: {
      label: 'שם קטגוריה',
      placeholder: 'הכנס שם קטגוריה...',
      description: 'בחר שם תיאורי לקטגוריה שלך'
    },
    description: {
      label: 'תיאור',
      placeholder: 'תיאור אופציונלי...',
      description: 'הוסף פרטים על הקטגוריה הזו (אופציונלי)'
    },
    icon: {
      label: 'אייקון',
      search: 'חפש אייקונים...',
      suggestions: 'הצעות AI',
      selected: 'אייקון נבחר',
      selectedDescription: 'האייקון הזה ייצג את הקטגוריה שלך'
    },
    color: {
      label: 'צבע'
    },
    type: {
      label: 'סוג קטגוריה'
    },
    pinned: {
      label: 'נעץ למעלה',
      description: 'הצג קטגוריה זו בראש הרשימות'
    },
    hidden: {
      label: 'הסתר קטגוריה',
      description: 'הסתר קטגוריה זו מהתצוגות הרגילות'
    }
  },

  // סוגי קטגוריות
  types: {
    income: 'הכנסה',
    expense: 'הוצאה',
    both: 'שניהם',
    incomeDescription: 'להכנסות ורווחים',
    expenseDescription: 'להוצאות ועלויות',
    bothDescription: 'גם להכנסות וגם להוצאות'
  },

  // קטגוריות צבעים
  colors: {
    primary: 'ראשי',
    secondary: 'משני',
    neutral: 'נייטרלי'
  },

  // קטגוריות אייקונים
  iconCategories: {
    general: 'כללי',
    finance: 'כספים',
    lifestyle: 'אורח חיים',
    entertainment: 'בידור',
    technology: 'טכנולוגיה',
    transport: 'תחבורה',
    health: 'בריאות'
  },

  // מצבי תצוגה
  viewModes: {
    grid: 'תצוגת רשת',
    list: 'תצוגת רשימה',
    analytics: 'תצוגת אנליטיקס'
  },

  // חלקי טופס
  sections: {
    basicInfo: 'מידע בסיסי',
    visual: 'התאמה ויזואלית',
    advanced: 'אפשרויות מתקדמות',
    preview: 'תצוגה מקדימה'
  },

  // מצבי טופס
  form: {
    addCategory: 'הוסף קטגוריה חדשה',
    editCategory: 'ערוך קטגוריה',
    duplicateCategory: 'שכפל קטגוריה',
    editingCategory: 'עורך {{name}}',
    saving: 'שומר...',
    create: 'צור',
    update: 'עדכן',
    cancel: 'בטל',
    unsaved: 'לא נשמר',
    invalid: 'לא תקין',
    valid: 'תקין',
    unsavedChanges: 'יש לך שינויים לא שמורים. האם אתה בטוח שאתה רוצה לבטל?',
    validationFailed: 'אנא תקן את שגיאות האימות לפני השמירה',
    createSuccess: 'הקטגוריה נוצרה בהצלחה',
    updateSuccess: 'הקטגוריה עודכנה בהצלחה',
    submitFailed: 'שמירת הקטגוריה נכשלה. אנא נסה שוב.'
  },

  // הודעות אימות
  validation: {
    name: {
      required: 'שם הקטגוריה נדרש',
      tooShort: 'השם חייב להיות לפחות {{min}} תווים',
      tooLong: 'השם לא יכול לעלות על {{max}} תווים',
      invalidCharacters: 'השם יכול להכיל רק אותיות, מספרים, רווחים, מקפים, קווים תחתונים ואמפרסנד',
      duplicate: 'קטגוריה עם השם הזה כבר קיימת'
    },
    description: {
      tooLong: 'התיאור לא יכול לעלות על {{max}} תווים'
    },
    icon: {
      required: 'אייקון נדרש',
      invalid: 'האייקון הנבחר אינו תקין'
    },
    color: {
      required: 'צבע נדרש',
      invalid: 'הצבע חייב להיות קוד hex תקין (למשל, #3B82F6)'
    },
    type: {
      required: 'סוג קטגוריה נדרש',
      invalid: 'סוג קטגוריה לא תקין נבחר'
    }
  },

  // חיפוש ומסננים
  search: {
    placeholder: 'חפש קטגוריות...',
    noResults: 'לא נמצאו קטגוריות התואמות ל"{{query}}"',
    noCategories: 'לא נמצאו קטגוריות'
  },

  filters: {
    showHidden: 'הצג מוסתרות',
    hideHidden: 'הסתר מוסתרות',
    all: 'כל הקטגוריות',
    income: 'הכנסות בלבד',
    expense: 'הוצאות בלבד',
    pinned: 'נעוצות בלבד'
  },

  // מיון
  sort: {
    label: 'מיין לפי',
    name: 'שם',
    type: 'סוג',
    usage: 'שימוש',
    created: 'תאריך יצירה',
    updated: 'עודכן לאחרונה'
  },

  // קבוצות
  groups: {
    all: 'כל הקטגוריות',
    pinned: 'קטגוריות נעוצות',
    unpinned: 'קטגוריות רגילות',
    income: 'קטגוריות הכנסה',
    expense: 'קטגוריות הוצאה',
    both: 'קטגוריות מעורבות'
  },

  // רשימות
  list: {
    empty: {
      title: 'לא נמצאו קטגוריות',
      description: 'התחל ביצירת הקטגוריה הראשונה שלך כדי לארגן את העסקאות שלך.',
      createFirst: 'צור קטגוריה ראשונה'
    },
    groupCount: '{{count}} קטגוריות ({{selected}} נבחרו)'
  },

  // רשת
  grid: {
    empty: {
      title: 'לא נמצאו קטגוריות',
      description: 'התחל ביצירת הקטגוריה הראשונה שלך כדי לארגן את העסקאות שלך.',
      createFirst: 'צור קטגוריה ראשונה'
    }
  },

  // בחירה
  selection: {
    count: '{{count}} נבחרו',
    summary: 'קטגוריות נבחרו',
    clear: 'נקה בחירה'
  },

  // מחווני סטטוס
  status: {
    pinned: 'נעוץ למעלה',
    hidden: 'מוסתר מהתצוגה',
    active: 'קטגוריה פעילה',
    unused: 'קטגוריה לא בשימוש'
  },

  // אנליטיקס
  analytics: {
    title: 'אנליטיקס קטגוריות',
    subtitle: 'תובנות ומגמות עבור {{timeRange}}',
    refresh: 'רענן נתונים',
    export: 'ייצא נתונים',
    
    // כרטיסים
    cards: {
      totalCategories: 'סך הקטגוריות',
      activeCategories: 'קטגוריות פעילות',
      avgTransactions: 'ממוצע עסקאות',
      optimization: 'המלצות'
    },

    // חלקים
    topCategories: 'הקטגוריות הנפוצות ביותר',
    recommendations: 'טיפים לאופטימיזציה',
    growing: 'קטגוריות צומחות',
    declining: 'קטגוריות יורדות',
    detailedView: 'אנליטיקס מפורט',
    detailedDescription: 'נתוני אנליטיקס מקיפים וגרפים יגיעו בקרוב.',

    // נתונים
    transactions: 'עסקאות',
    total: 'סכום',
    recentActivity: 'פעילות אחרונה',
    noRecommendations: 'אין המלצות אופטימיזציה כרגע.',
    noGrowingCategories: 'אין קטגוריות צומחות בתקופה זו.',
    noDecliningCategories: 'אין קטגוריות יורדות בתקופה זו.',

    // מצבי תצוגה
    viewModes: {
      overview: 'סקירה',
      detailed: 'מפורט',
      trends: 'מגמות'
    }
  },

  // ייצוא
  export: {
    json: 'ייצא כ-JSON',
    csv: 'ייצא כ-CSV',
    report: 'ייצא דוח'
  },

  // חלונות
  modals: {
    create: {
      title: 'צור קטגוריה חדשה'
    },
    edit: {
      title: 'ערוך קטגוריה'
    }
  },

  // הודעות
  notifications: {
    createSuccess: 'הקטגוריה "{{name}}" נוצרה בהצלחה',
    updateSuccess: 'הקטגוריה "{{name}}" עודכנה בהצלחה',
    deleteSuccess: 'הקטגוריה נמחקה בהצלחה',
    createFailed: 'יצירת הקטגוריה נכשלה',
    updateFailed: 'עדכון הקטגוריה נכשל',
    deleteFailed: 'מחיקת הקטגוריה נכשלה',
    pinSuccess: 'הקטגוריה נעצה בהצלחה',
    unpinSuccess: 'הקטגוריה הוסרה מהנעיצה בהצלחה',
    hideSuccess: 'הקטגוריה הוסתרה בהצלחה',
    showSuccess: 'הקטגוריה הוצגה בהצלחה'
  },

  // אישורים
  confirmations: {
    delete: 'האם אתה בטוח שברצונך למחוק את "{{name}}"? פעולה זו לא ניתנת לביטול.',
    deleteMultiple: 'האם אתה בטוח שברצונך למחוק {{count}} קטגוריות? פעולה זו לא ניתנת לביטול.',
    hide: 'האם אתה בטוח שברצונך להסתיר את "{{name}}"?',
    show: 'האם אתה בטוח שברצונך להציג את "{{name}}"?'
  },

  // תצוגה מקדימה
  preview: {
    sampleName: 'קטגוריה לדוגמה',
    sampleDescription: 'כך תיראה הקטגוריה שלך'
  },

  // בורר אייקונים
  iconSelector: {
    aiSuggestions: 'הצעות AI',
    searchPlaceholder: 'חפש אייקונים...',
    noResults: 'לא נמצאו אייקונים עבור "{{query}}"',
    noIcons: 'אין אייקונים בקטגוריה זו',
    selected: 'נבחר',
    selectedDescription: 'האייקון הזה ייצג את הקטגוריה שלך'
  },

  // פעולות גורפות (לשימוש עתידי)
  bulk: {
    selected: '{{count}} קטגוריות נבחרו',
    deleteSelected: 'מחק נבחרות',
    hideSelected: 'הסתר נבחרות',
    showSelected: 'הצג נבחרות',
    pinSelected: 'נעץ נבחרות',
    unpinSelected: 'בטל נעיצת נבחרות',
    exportSelected: 'ייצא נבחרות',
    
    deleteSuccess: '{{count}} קטגוריות נמחקו בהצלחה',
    hideSuccess: '{{count}} קטגוריות הוסתרו בהצלחה',
    showSuccess: '{{count}} קטגוריות הוצגו בהצלחה',
    pinSuccess: '{{count}} קטגוריות נעצו בהצלחה',
    unpinSuccess: '{{count}} קטגוריות הוסרו מנעיצה בהצלחה',
    
    deleteFailed: 'מחיקת הקטגוריות הנבחרות נכשלה',
    hideFailed: 'הסתרת הקטגוריות הנבחרות נכשלה',
    showFailed: 'הצגת הקטגוריות הנבחרות נכשלה',
    pinFailed: 'נעיצת הקטגוריות הנבחרות נכשלה',
    unpinFailed: 'ביטול נעיצת הקטגוריות הנבחרות נכשל'
  }
}; 