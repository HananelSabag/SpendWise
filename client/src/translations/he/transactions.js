/**
 * 💰 TRANSACTIONS TRANSLATIONS - HEBREW
 * Complete transaction system translations
 * @version 2.0.0
 */

export default {
  title: "עסקאות",
  subtitle: "נהלו את העסקאות הפיננסיות שלכם",
  total: "סה״כ",
  loading: "טוען עסקאות...",
  types: {
    income: "הכנסה",
    expense: "הוצאה",
    transfer: "העברה",
    all: "כל הסוגים"
  },
  transaction: {
    type: {
      income: "הכנסה",
      expense: "הוצאה"
    }
  },
  fields: {
    description: {
      label: "תיאור",
      placeholder: "הכניסו תיאור עסקה"
    },
    amount: {
      label: "סכום",
      placeholder: "0.00",
      helper: "הכניסו את סכום העסקה"
    },
    category: {
      label: "קטגוריה",
      placeholder: "בחרו קטגוריה",
      search: "חפשו קטגוריות...",
      createNew: "צרו קטגוריה חדשה",
      helper: "בחר קטגוריה מהרשימה או צור חדשה"
    },
    date: {
      label: "תאריך",
      helper: "תאריך העסקה",
      helperWithTime: "תאריך ושעת העסקה"
    },
    type: {
      label: "סוג העסקה",
      helper: "בחרו אם זו הכנסה או הוצאה"
    },
    tags: {
      label: "תגיות",
      placeholder: "הוסיפו תגיות...",
      helper: "תגיות לארגון ומיון (אופציונלי)"
    },
    notes: {
      label: "הערות",
      placeholder: "הערות נוספות...",
      helper: "מידע נוסף על העסקה (אופציונלי)"
    },
    receipt: "קבלה",
    recurring: {
      title: "עסקה חוזרת",
      description: "הגדר עסקה שחוזרת בקביעות",
      frequency: "תדירות",
      interval: "חזור כל",
      endType: "סוג סיום",
      endDate: "תאריך סיום",
      maxOccurrences: "מספר מופעים"
    },
    advanced: {
      title: "הגדרות מתקדמות"
    }
  },
  frequencies: {
    daily: "יומית",
    weekly: "שבועית",
    monthly: "חודשית",
    quarterly: "רבעונית",
    yearly: "שנתית"
  },
  endTypes: {
    never: "לעולם לא",
    date: "בתאריך",
    occurrences: "אחרי מספר"
  },
  placeholders: {
    description: "הכניסו תיאור עסקה",
    amount: "0.00",
    selectCategory: "בחרו קטגוריה",
    recurringDescription: "מנוי חודשי, קניות שבועיות, וכו'",
    searchTransactions: "חפשו עסקאות...",
    addTags: "הוסיפו תגיות...",
    notes: "הערות נוספות..."
  },
  actions: {
    add: "הוסף עסקה",
    addTransaction: "הוסף עסקה",
    edit: "ערוך עסקה",
    delete: "מחק עסקה",
    duplicate: "שכפל",
    save: "שמור",
    cancel: "בטל",
    close: "סגור",
    next: "הבא",
    previous: "הקודם",
    create: "צור",
    update: "עדכן",
    filter: "סנן",
    sort: "מיין",
    search: "חפש",
    export: "ייצא",
    import: "ייבא",
    refresh: "רענן",
    clearFilters: "נקה מסננים",
    options: "אפשרויות",
    selectAll: "בחר הכל",
    deselectAll: "בטל בחירת הכל",
    bulkActions: "פעולות מרובות",
    viewDetails: "הצג פרטים",
    select: "בחר"
  },
  labels: {
    recurring: "חוזר",
    oneTime: "חד פעמי",
    template: "תבנית",
    noDescription: "ללא תיאור",
    uncategorized: "ללא קטגוריה",
    noReceipt: "ללא קבלה",
    hasReceipt: "יש קבלה",
    verified: "מאומת",
    pending: "ממתין",
    failed: "נכשל"
  },
  viewMode: {
    cards: "כרטיסים",
    list: "רשימה",
    compact: "קומפקטי",
    table: "טבלה"
  },
  search: {
    placeholder: "חפש לפי תיאור, קטגוריה או סכום...",
    noResults: "לא נמצאו עסקאות",
    results: "נמצאו {{count}} תוצאות"
  },
  filter: {
    title: "מסננים",
    types: "סוגי עסקאות",
    categories: "קטגוריות",
    dateRange: "טווח תאריכים",
    amountRange: "טווח סכומים",
    status: "סטטוס",
    tags: "תגיות",
    hasReceipt: "יש קבלה",
    isRecurring: "חוזר"
  },
  sort: {
    title: "מיין לפי",
    date: "תאריך",
    amount: "סכום",
    description: "תיאור",
    category: "קטגוריה",
    type: "סוג",
    status: "סטטוס",
    created: "תאריך יצירה"
  },
  dateRange: {
    title: "טווח תאריכים",
    all: "כל הזמן",
    today: "היום",
    yesterday: "אתמול",
    week: "השבוע",
    lastWeek: "השבוע שעבר",
    month: "החודש",
    lastMonth: "החודש שעבר",
    quarter: "הרבעונית",
    year: "השנה",
    custom: "טווח מותאם"
  },
  statistics: {
    total: "סך הכל",
    income: "הכנסות",
    expenses: "הוצאות",
    net: "נטו",
    average: "ממוצע",
    count: "כמות",
    highest: "הגבוה ביותר",
    lowest: "הנמוך ביותר"
  },
  emptyStates: {
    noTransactions: "אין עסקאות עדיין",
    noTransactionsDesc: "התחילו בהוספת העסקה הראשונה שלכם",
    noResults: "אין עסקאות תואמות",
    noResultsDesc: "נסו להתאים את החיפוש או המסננים",
    noRecurring: "אין עסקאות חוזרות",
    noRecurringDesc: "הגדירו עסקאות חוזרות כדי לאוטמט את הכספים שלכם"
  },
  selection: {
    count: "{{count}} נבחרו",
    none: "לא נבחר כלום",
    all: "הכל נבחר"
  },
  recurring: {
    active: "פעיל",
    paused: "מושהה",
    nextRun: "הרצה הבאה",
    created: "נוצר",
    never: "לעולם לא",
    title: "עסקאות חוזרות",
    description: "נהלו את העסקאות החוזרות והתבניות שלכם",
    manage: "ניהול חוזרות",
    tooltip: "עסקה חוזרת",
    create: {
      title: "צור עסקה חוזרת",
      subtitle: "הגדר עסקאות אוטומטיות"
    },
    edit: {
      title: "ערוך עסקה חוזרת",
      subtitle: "עדכן הגדרות עסקה חוזרת"
    },
    steps: {
      setup: {
        title: "הגדרת עסקה חוזרת",
        description: "הגדר את פרטי העסקה החוזרת"
      },
      preview: {
        title: "תצוגה מקדימה",
        description: "בדוק את ההגדרות לפני שמירה"
      },
      confirm: {
        title: "אישור יצירה",
        description: "אשר את יצירת העסקה החוזרת"
      }
    },
    modal: {
      createTitle: "צור עסקה חוזרת",
      editTitle: "ערוך עסקה חוזרת"
    },
    frequency: {
      title: "תדירות",
      daily: "יומית",
      weekly: "שבועית",
      biweekly: "דו-שבועית",
      monthly: "חודשית",
      quarterly: "רבעונית",
      yearly: "שנתית",
      custom: "מותאמת"
    },
    interval: {
      title: "חזור כל",
      every: "כל",
      daily: "יום {{count}}",
      daily_plural: "{{count}} ימים",
      weekly: "שבוע {{count}}",
      weekly_plural: "{{count}} שבועות",
      monthly: "חודש {{count}}",
      monthly_plural: "{{count}} חודשים",
      yearly: "שנה {{count}}",
      yearly_plural: "{{count}} שנים"
    },
    endType: {
      title: "תאריך סיום",
      never: "לעולם לא",
      neverDesc: "המשך ללא הגבלה",
      date: "בתאריך",
      dateDesc: "סיום בתאריך מסוים",
      occurrences: "אחרי מספר",
      occurrencesDesc: "סיום אחרי מספר מופעים"
    },
    startDate: "תאריך התחלה",
    endDate: "תאריך סיום",
    maxOccurrences: "מספר מופעים",
    isActive: "פעיל",
    nextDate: "עסקה הבאה",
    lastDate: "עסקה אחרונה",
    summary: {
      title: "סיכום",
      preview: "תצוגה מקדימה של עסקאות קרובות"
    },
    preview: {
      title: "עסקאות קרובות",
      moreTransactions: "...ועוד"
    },
    pause: "השהה",
    resume: "המשך",
    skip: "דלג על הבא",
    occurrencesCount: "מופע {{count}}",
    occurrencesCount_plural: "{{count}} מופעים",
    totalTemplates: "סה״כ תבניות",
    activeTemplates: "תבניות פעילות",
    monthlyIncome: "הכנסות חודשיות",
    monthlyExpenses: "הוצאות חודשיות"
  },
  recurringShort: {
    loading: "טוען עסקאות חוזרות..."
  },
  delete: {
    title: "מחק עסקה",
    description: "האם אתם בטוחים שברצונכם למחוק את העסקה הזו?",
    warning: "פעולה זו לא ניתנת לביטול.",
    confirm: "מחק עסקה",
    recurring: {
      title: "מחק עסקה חוזרת",
      options: "מה תרצו למחוק?",
      single: "רק המופע הזה",
      singleDescription: "מחק רק את העסקה הבודדת הזו",
      future: "זה ועתידיים",
      futureDescription: "מחק את זה ואת כל המופעים העתידיים",
      all: "כל המופעים",
      allDescription: "מחק את כל המופעים העבר והעתיד",
      allWarning: "זה ימחק את כל המופעים של העסקה החוזרת הזו.",
      futureWarning: "זה ימחק את המופע הזה ואת כל העתידיים."
    },
    confirmDelete: "Confirm Delete"
  },
  status: {
    completed: "הושלם",
    pending: "ממתין",
    failed: "נכשל",
    cancelled: "בוטל",
    scheduled: "מתוזמן",
    processing: "מעובד"
  },
  categories: {
    title: "קטגוריות",
    add: "הוסף קטגוריה",
    edit: "ערוך קטגוריה",
    delete: "מחק קטגוריה",
    income: "קטגוריות הכנסה",
    expense: "קטגוריות הוצאה",
    uncategorized: "ללא קטגוריה",
    salary: "משכורת",
    freelance: "עבודה עצמאית",
    investment: "השקעות",
    business: "עסקים",
    gifts: "מתנות",
    other: "אחר",
    food: "אוכל ומסעדות",
    transportation: "תחבורה",
    shopping: "קניות",
    entertainment: "בידור",
    bills: "חשבונות ושירותים",
    healthcare: "בריאות",
    education: "חינוך",
    travel: "נסיעות",
    home: "בית וגינה",
    personal: "טיפוח אישי"
  },
  tags: {
    title: "תגיות",
    add: "הוסף תגית",
    popular: "תגיות פופולריות",
    recent: "תגיות אחרונות",
    business: "עסקי",
    personal: "אישי",
    essential: "חיוני",
    luxury: "מותרות",
    subscription: "מנוי",
    onetime: "חד פעמי",
    tax: "ניתן לניכוי במס"
  },
  validation: {
    descriptionRequired: "תיאור נדרש",
    amountRequired: "סכום נדרש וחייב להיות גדול מ-0",
    amountInvalid: "אנא הכניסו סכום תקין",
    categoryRequired: "קטגוריה נדרשת",
    dateRequired: "תאריך נדרש",
    dateInvalid: "אנא הכניסו תאריך תקין",
    startDateRequired: "תאריך התחלה נדרש",
    endDateRequired: "תאריך סיום נדרש",
    endDateAfterStart: "תאריך הסיום חייב להיות אחרי תאריך ההתחלה",
    occurrencesRequired: "מספר מופעים נדרש",
    intervalRequired: "מרווח חייב להיות לפחות 1",
    pleaseFixErrors: "אנא תקנו את השגיאות למעלה"
  },
  success: {
    transactionAdded: "העסקה נוספה בהצלחה",
    transactionUpdated: "העסקה עודכנה בהצלחה",
    transactionDeleted: "העסקה נמחקה בהצלחה",
    recurringCreated: "עסקה חוזרת נוצרה בהצלחה",
    recurringUpdated: "עסקה חוזרת עודכנה בהצלחה",
    transactionsImported: "{{count}} עסקאות יובאו בהצלחה",
    dataExported: "נתונים יוצאו בהצלחה",
    refreshed: "עסקאות רוענו"
  },
  errors: {
    addingFailed: "הוספת העסקה נכשלה",
    updatingFailed: "עדכון העסקה נכשל",
    deletingFailed: "מחיקת העסקה נכשלה",
    loadingFailed: "טעינת העסקאות נכשלה",
    savingFailed: "שמירת העסקה נכשלה",
    importFailed: "ייבוא העסקאות נכשל",
    exportFailed: "ייצוא הנתונים נכשל",
    refreshFailed: "רענון העסקאות נכשל",
    invalidFile: "פורמט קובץ לא תקין",
    networkError: "שגיאת רשת התרחשה",
    serverError: "שגיאת שרת התרחשה"
  },
  loadingStates: {
    loading: "טוען עסקאות...",
    saving: "שומר עסקה...",
    deleting: "מוחק עסקה...",
    importing: "מייבא עסקאות...",
    exporting: "מייצא נתונים...",
    refreshing: "מרענן..."
  },
  export: {
    title: "ייצא עסקאות",
    format: "פורמט ייצוא",
    dateRange: "טווח תאריכים",
    categories: "קטגוריות",
    includeRecurring: "כלול חוזרות",
    includeDeleted: "כלול מחוקות",
    fileName: "שם קובץ",
    download: "הורד",
    csv: "קובץ CSV",
    excel: "קובץ אקסל",
    pdf: "דוח PDF",
    json: "נתוני JSON"
  },
  import: {
    title: "ייבא עסקאות",
    selectFile: "בחר קובץ",
    fileFormat: "פורמט קובץ",
    mapping: "מיפוי עמודות",
    preview: "תצוגה מקדימה",
    import: "ייבא",
    skipDuplicates: "דלג על כפולות",
    updateExisting: "עדכן קיימות"
  },
  receipts: {
    title: "קבלה",
    upload: "העלה קבלה",
    view: "הצג קבלה",
    download: "הורד",
    delete: "מחק קבלה",
    dragDrop: "גרור ושחרר קבלה כאן או לחץ להעלאה",
    maxSize: "גודל קובץ מקסימלי: 10MB",
    supportedFormats: "פורמטים נתמכים: JPG, PNG, PDF"
  },
  analytics: {
    title: "ניתוח עסקאות",
    trends: "מגמות",
    categories: "פירוק קטגוריות",
    monthly: "ניתוח חודשי",
    comparison: "השוואת תקופות",
    insights: "תובנות"
  },
  modals: {
    add: {
      title: "הוסף עסקה חדשה",
      subtitle: "צור עסקה חדשה למעקב הוצאות והכנסות",
      success: {
        title: "העסקה נוספה",
        message: "העסקה שלכם נוספה בהצלחה לחשבון."
      }
    },
    edit: {
      edit: {
        title: "ערוך עסקה",
        subtitle: "עדכן פרטי העסקה"
      }
    },
    delete: {
      title: "מחק עסקה",
      subtitle: "האם אתם בטוחים שברצונכם למחוק את העסקה הזו?",
      warning: "פעולה זו לא ניתנת לביטול."
    }
  },
  tabs: {
    all: "כל העסקאות",
    upcoming: "קרובות",
    recurring: "חוזרות"
  },
  formTabs: {
    oneTime: {
      title: "עסקה חד פעמית",
      subtitle: "עסקה אחת בלבד",
      description: "צור עסקה יחידה שתבוצע פעם אחת"
    },
    recurring: {
      title: "עסקה חוזרת",
      subtitle: "עסקה אוטומטית",
      description: "צור תבנית שתיצור עסקאות אוטומטית בעתיד"
    },
    changeWarning: "שינוי הטאב יאפס את הטופס. להמשיך?"
  },
  badges: {
    advanced: "מתקדם"
  },
  form: {
    addTransaction: "הוסף עסקה",
    cancel: "בטל",
    create: "צור עסקה",
    save: "שמור שינויים",
    update: "עדכן עסקה",
    selectType: "בחר את סוג העסקה שברצונך ליצור",
    oneTimeSubtitle: "פרטי העסקה החד-פעמית",
    recurringSubtitle: "הגדר תבנית לעסקאות אוטומטיות",
    createTemplate: "צור תבנית",
    updateTemplate: "עדכן תבנית",
    editTransaction: "ערוך עסקה",
    editingTransaction: "עורך עסקה",
    unsaved: "לא נשמר",
    invalid: "לא תקין",
    valid: "תקין",
    saving: "שומר...",
    createSuccess: "העסקה נוצרה בהצלחה",
    recurringCreateSuccess: "תבנית העסקה החוזרת נוצרה בהצלחה!",
    editMode: "במצב עריכה - לא ניתן לשנות את סוג העסקה",
    unsavedChanges: "יש לך שינויים שלא נשמרו"
  },
  datePicker: {
    today: "היום",
    yesterday: "אתמול",
    thisWeek: "השבוע",
    lastWeek: "השבוע שעבר",
    thisMonth: "החודש",
    lastMonth: "החודש שעבר"
  },
  notes: {
    suggestions: {
      receipt: "יש קבלה",
      business: "הוצאה עסקית",
      personal: "הוצאה אישית",
      gift: "מתנה",
      emergency: "חירום"
    }
  },
  upcoming: {
    title: "עסקאות קרובות",
    subtitle: "העסקאות המתוכננות שלכם",
    loading: "טוען עסקאות קרובות...",
    noUpcoming: "אין עסקאות קרובות",
    noUpcomingDesc: "אין עסקאות עתידיות מתוכננות. הגדירו עסקאות חוזרות כדי לראות אותן כאן.",
    nextCount: "הבאות {{count}} עסקאות",
    manage: "ניהול",
    manageRecurring: "ניהול חוזרות",
    transactions: "עסקאות",
    totalAmount: "סה\"כ",
    showingNext: "מציג את {{count}} הקרובות",
    viewAll: "הצג הכל",
    totalTransactions: "סה״כ קרובות",
    expectedIncome: "הכנסות צפויות",
    expectedExpenses: "הוצאות צפויות",
    recurringTemplates: "מתבניות",
    tomorrow: "מחר",
    thisWeek: "השבוע",
    later: "מאוחר יותר"
  },
  recurringManager: {
    title: "מנהל עסקאות חוזרות",
    subtitle: "נהלו את העסקאות החוזרות שלכם",
    active: "פעיל",
    paused: "מושהה",
    total: "סה״כ",
    totalAmount: "סה״כ חודשי",
    avgAmount: "סכום ממוצע",
    addNew: "הוסף חדש",
    addFirst: "הוסף תבנית ראשונה",
    created: "נוצר",
    totalRuns: "סה״כ הרצות",
    lastRun: "הרצה אחרונה",
    nextRun: "הרצה הבאה",
    never: "לעולם לא",
    indefinite: "בלתי מוגבל",
    endDate: "תאריך סיום",
    confirmDelete: "למחוק את \"{{name}}\"?",
    deleteSuccess: "תבנית נמחקה בהצלחה",
    deleteFailed: "מחיקת התבנית נכשלה",
    deleteTemplate: "מחק תבנית",
    deleteChoose: "בחרו מה למחוק:",
    deleteTemplateOnly: "תבנית בלבד (שמור עסקאות)",
    deleteTemplateOnlyDesc: "השבתת תבנית אך שמירה על כל היסטוריית העסקאות",
    deleteFuture: "תבנית + עסקאות עתידיות",
    deleteFutureDesc: "הסרת תבנית וכל העסקאות העתידיות המתוכננות",
    deleteCurrentAndFuture: "תבנית + חודש נוכחי ועתידי",
    deleteCurrentAndFutureDesc: "הסרת תבנית ועסקאות מהחודש הנוכחי והלאה",
    deleteAll: "תבנית + כל העסקאות",
    deleteAllDesc: "הסרה מוחלטת של תבנית וכל היסטוריית העסקאות",
    statusUpdated: "הסטטוס עודכן בהצלחה",
    statusUpdateFailed: "עדכון הסטטוס נכשל",
    templateSaved: "תבנית נשמרה בהצלחה",
    noRecurring: "אין תבניות חוזרות",
    noRecurringDesc: "צרו עסקאות חוזרות כדי להוסיף אוטומציה למעקב הפיננסי",
    noMatches: "אין תבניות מתאימות",
    noMatchesDesc: "נסו לשנות את המסננים",
    loading: "טוען תבניות...",
    loadError: "טעינת עסקאות חוזרות נכשלה",
    searchPlaceholder: "חפשו תבניות...",
    templates: "תבניות",
    upcoming: "קרובות",
    upcomingTitle: "עסקאות קרובות",
    upcomingDesc: "העסקאות החוזרות הקרובות שלכם יופיעו כאן",
    filter: {
      allStatus: "כל הסטטוסים",
      active: "פעילות בלבד",
      paused: "מושהות בלבד",
      allTypes: "כל הסוגים"
    },
    frequency: {
      daily: "יומי",
      weekly: "שבועי",
      monthly: "חודשי",
      yearly: "שנתי"
    }
  },
  stats: {
    totalTransactions: "סה״כ עסקאות",
    totalIncome: "סה״כ הכנסות",
    totalExpenses: "סה״כ הוצאות",
    recurringTransactions: "חוזרות",
    netAmount: "סכום נטו",
    averageTransaction: "עסקה ממוצעת"
  },
  count: "עסקאות",
  net: "נטו",
  allTab: {
    title: "העסקאות שלך",
    description: "מציג את העסקאות שלך עם סינון חכם. גלול למטה כדי לטעון עוד עסקאות עבר."
  },
  advancedFilters: "מסננים מתקדמים",
  selected: "נבחרו",
  bulkActions: "בחרו פעולה להחיל על העסקאות הנבחרות",
  noDescription: "ללא תיאור",
  autoGenerating: "יוצר אוטומטית...",
  empty: {
    title: "לא נמצאו עסקאות",
    description: "התחילו לעקוב אחר הכספים שלכם על ידי הוספת העסקה הראשונה."
  },
  addExpense: "Add Expense",
  addIncome: "Add Income",
  andMore: "And More",
  futureTransactions: "Future Transactions",
  noFutureTransactions: "No Future Transactions"
};
