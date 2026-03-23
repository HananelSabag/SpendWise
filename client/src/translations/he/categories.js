/**
 * 🏷️ CATEGORIES TRANSLATIONS - HEBREW
 * תרגומים מקיפים למערכת ניהול הקטגוריות
 * @version 3.0.0 - NEW CATEGORY ARCHITECTURE
 */

export default {
  title: "מנהל הקטגוריות",
  subtitle: "נהל את {{count}} קטגוריות ההוצאות שלך",
  actions: {
    create: "צור קטגוריה",
    edit: "ערוך קטגוריה",
    delete: "מחק קטגוריה",
    duplicate: "שכפל קטגוריה",
    pin: "נעץ קטגוריה",
    unpin: "בטל נעיצה",
    show: "הצג קטגוריה",
    hide: "הסתר קטגוריה",
    export: "ייצא קטגוריות",
    import: "יבא קטגוריות",
    refresh: "רענן"
  },
  fields: {
    name: {
      label: "שם קטגוריה",
      placeholder: "הכנס שם קטגוריה...",
      description: "בחר שם תיאורי לקטגוריה שלך"
    },
    description: {
      label: "תיאור",
      placeholder: "תיאור אופציונלי...",
      description: "הוסף פרטים על הקטגוריה הזו (אופציונלי)"
    },
    icon: {
      label: "אייקון",
      search: "חפש אייקונים...",
      suggestions: "הצעות AI",
      selected: "אייקון נבחר",
      selectedDescription: "האייקון הזה ייצג את הקטגוריה שלך"
    },
    color: {
      label: "צבע"
    },
    type: {
      label: "סוג קטגוריה"
    },
    pinned: {
      label: "נעץ למעלה",
      description: "הצג קטגוריה זו בראש הרשימות"
    },
    hidden: {
      label: "הסתר קטגוריה",
      description: "הסתר קטגוריה זו מהתצוגות הרגילות"
    }
  },
  types: {
    income: "הכנסה",
    expense: "הוצאה",
    both: "שניהם",
    incomeDescription: "להכנסות ורווחים",
    expenseDescription: "להוצאות ועלויות",
    bothDescription: "גם להכנסות וגם להוצאות"
  },
  colors: {
    primary: "ראשי",
    secondary: "משני",
    neutral: "נייטרלי"
  },
  iconCategories: {
    general: "כללי",
    finance: "כספים",
    lifestyle: "אורח חיים",
    entertainment: "בידור",
    technology: "טכנולוגיה",
    transport: "תחבורה",
    health: "בריאות"
  },
  viewModes: {
    grid: "תצוגת רשת",
    list: "תצוגת רשימה",
    analytics: "תצוגת אנליטיקס"
  },
  sections: {
    basicInfo: "מידע בסיסי",
    visual: "התאמה ויזואלית",
    advanced: "אפשרויות מתקדמות",
    preview: "תצוגה מקדימה"
  },
  form: {
    addCategory: "הוסף קטגוריה חדשה",
    editCategory: "ערוך קטגוריה",
    duplicateCategory: "שכפל קטגוריה",
    editingCategory: "עורך {{name}}",
    saving: "שומר...",
    create: "צור",
    update: "עדכן",
    cancel: "בטל",
    unsaved: "לא נשמר",
    invalid: "לא תקין",
    valid: "תקין",
    unsavedChanges: "יש לך שינויים לא שמורים. האם אתה בטוח שאתה רוצה לבטל?",
    validationFailed: "אנא תקן את שגיאות האימות לפני השמירה",
    createSuccess: "הקטגוריה נוצרה בהצלחה",
    updateSuccess: "הקטגוריה עודכנה בהצלחה",
    submitFailed: "שמירת הקטגוריה נכשלה. אנא נסה שוב."
  },
  validation: {
    name: {
      required: "שם הקטגוריה נדרש",
      tooShort: "השם חייב להיות לפחות {{min}} תווים",
      tooLong: "השם לא יכול לעלות על {{max}} תווים",
      invalidCharacters: "השם יכול להכיל רק אותיות, מספרים, רווחים, מקפים, קווים תחתונים ואמפרסנד",
      duplicate: "קטגוריה עם השם הזה כבר קיימת"
    },
    description: {
      tooLong: "התיאור לא יכול לעלות על {{max}} תווים"
    },
    icon: {
      required: "אייקון נדרש",
      invalid: "האייקון הנבחר אינו תקין"
    },
    color: {
      required: "צבע נדרש",
      invalid: "הצבע חייב להיות קוד hex תקין (למשל, #3B82F6)"
    },
    type: {
      required: "סוג קטגוריה נדרש",
      invalid: "סוג קטגוריה לא תקין נבחר"
    }
  },
  search: {
    placeholder: "חפש קטגוריות...",
    noResults: "לא נמצאו קטגוריות התואמות ל\"{{query}}\"",
    noCategories: "לא נמצאו קטגוריות"
  },
  filters: {
    showHidden: "הצג מוסתרות",
    hideHidden: "הסתר מוסתרות",
    all: "כל הקטגוריות",
    income: "הכנסות בלבד",
    expense: "הוצאות בלבד",
    pinned: "נעוצות בלבד"
  },
  sort: {
    label: "מיין לפי",
    name: "שם",
    type: "סוג",
    usage: "שימוש",
    created: "תאריך יצירה",
    updated: "עודכן לאחרונה"
  },
  groups: {
    all: "כל הקטגוריות",
    pinned: "קטגוריות נעוצות",
    unpinned: "קטגוריות רגילות",
    income: "קטגוריות הכנסה",
    expense: "קטגוריות הוצאה",
    both: "קטגוריות מעורבות"
  },
  list: {
    empty: {
      title: "לא נמצאו קטגוריות",
      description: "התחל ביצירת הקטגוריה הראשונה שלך כדי לארגן את העסקאות שלך.",
      createFirst: "צור קטגוריה ראשונה"
    },
    groupCount: "{{count}} קטגוריות ({{selected}} נבחרו)"
  },
  grid: {
    empty: {
      title: "לא נמצאו קטגוריות",
      description: "התחל ביצירת הקטגוריה הראשונה שלך כדי לארגן את העסקאות שלך.",
      createFirst: "צור קטגוריה ראשונה"
    }
  },
  selection: {
    count: "{{count}} נבחרו",
    summary: "קטגוריות נבחרו",
    clear: "נקה בחירה"
  },
  status: {
    pinned: "נעוץ למעלה",
    hidden: "מוסתר מהתצוגה",
    active: "קטגוריה פעילה",
    unused: "קטגוריה לא בשימוש"
  },
  analytics: {
    title: "אנליטיקס קטגוריות",
    subtitle: "תובנות ומגמות עבור {{timeRange}}",
    refresh: "רענן נתונים",
    export: "ייצא נתונים",
    cards: {
      totalCategories: "סך הקטגוריות",
      activeCategories: "קטגוריות פעילות",
      avgTransactions: "ממוצע עסקאות",
      optimization: "המלצות"
    },
    topCategories: "הקטגוריות הנפוצות ביותר",
    recommendations: "טיפים לאופטימיזציה",
    growing: "קטגוריות צומחות",
    declining: "קטגוריות יורדות",
    detailedView: "אנליטיקס מפורט",
    detailedDescription: "נתוני אנליטיקס מקיפים וגרפים יגיעו בקרוב.",
    transactions: "עסקאות",
    total: "סכום",
    recentActivity: "פעילות אחרונה",
    noRecommendations: "אין המלצות אופטימיזציה כרגע.",
    noGrowingCategories: "אין קטגוריות צומחות בתקופה זו.",
    noDecliningCategories: "אין קטגוריות יורדות בתקופה זו.",
    viewModes: {
      overview: "סקירה",
      detailed: "מפורט",
      trends: "מגמות"
    }
  },
  export: {
    json: "ייצא כ-JSON",
    csv: "ייצא כ-CSV",
    report: "ייצא דוח"
  },
  modals: {
    create: {
      title: "צור קטגוריה חדשה"
    },
    edit: {
      title: "ערוך קטגוריה"
    }
  },
  notifications: {
    createSuccess: "הקטגוריה \"{{name}}\" נוצרה בהצלחה",
    updateSuccess: "הקטגוריה \"{{name}}\" עודכנה בהצלחה",
    deleteSuccess: "הקטגוריה נמחקה בהצלחה",
    createFailed: "יצירת הקטגוריה נכשלה",
    updateFailed: "עדכון הקטגוריה נכשל",
    deleteFailed: "מחיקת הקטגוריה נכשלה",
    pinSuccess: "הקטגוריה נעצה בהצלחה",
    unpinSuccess: "הקטגוריה הוסרה מהנעיצה בהצלחה",
    hideSuccess: "הקטגוריה הוסתרה בהצלחה",
    showSuccess: "הקטגוריה הוצגה בהצלחה"
  },
  confirmations: {
    delete: "האם אתה בטוח שברצונך למחוק את \"{{name}}\"? פעולה זו לא ניתנת לביטול.",
    deleteMultiple: "האם אתה בטוח שברצונך למחוק {{count}} קטגוריות? פעולה זו לא ניתנת לביטול.",
    hide: "האם אתה בטוח שברצונך להסתיר את \"{{name}}\"?",
    show: "האם אתה בטוח שברצונך להציג את \"{{name}}\"?"
  },
  preview: {
    sampleName: "קטגוריה לדוגמה",
    sampleDescription: "כך תיראה הקטגוריה שלך"
  },
  iconSelector: {
    aiSuggestions: "הצעות AI",
    searchPlaceholder: "חפש אייקונים...",
    noResults: "לא נמצאו אייקונים עבור \"{{query}}\"",
    noIcons: "אין אייקונים בקטגוריה זו",
    selected: "נבחר",
    selectedDescription: "האייקון הזה ייצג את הקטגוריה שלך"
  },
  bulk: {
    selected: "{{count}} קטגוריות נבחרו",
    deleteSelected: "מחק נבחרות",
    hideSelected: "הסתר נבחרות",
    showSelected: "הצג נבחרות",
    pinSelected: "נעץ נבחרות",
    unpinSelected: "בטל נעיצת נבחרות",
    exportSelected: "ייצא נבחרות",
    deleteSuccess: "{{count}} קטגוריות נמחקו בהצלחה",
    hideSuccess: "{{count}} קטגוריות הוסתרו בהצלחה",
    showSuccess: "{{count}} קטגוריות הוצגו בהצלחה",
    pinSuccess: "{{count}} קטגוריות נעצו בהצלחה",
    unpinSuccess: "{{count}} קטגוריות הוסרו מנעיצה בהצלחה",
    deleteFailed: "מחיקת הקטגוריות הנבחרות נכשלה",
    hideFailed: "הסתרת הקטגוריות הנבחרות נכשלה",
    showFailed: "הצגת הקטגוריות הנבחרות נכשלה",
    pinFailed: "נעיצת הקטגוריות הנבחרות נכשלה",
    unpinFailed: "ביטול נעיצת הקטגוריות הנבחרות נכשל"
  },
  uncategorized: "ללא קטגוריה"
};
