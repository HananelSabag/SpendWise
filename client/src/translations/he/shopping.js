export default {
  title: "רשימת קניות",
  manageList: "נהל את הרשימות המשותפות שלך",
  loading: "טוען רשימת קניות...",
  itemsCount: "{{count}} פריטים",
  addItemAria: "הוסף פריט",
  allCategories: "הכל",

  error: {
    title: "שגיאה בטעינת הרשימה",
  },

  empty: {
    title: "הרשימה ריקה",
    description: "הוסף פריטים שתרצה לקנות, עם מחיר וקישור — הכל במקום אחד",
    addFirst: "הוסף פריט ראשון",
    filteredTitle: "אין פריטים בקטגוריה זו",
    filteredDescription: "נסה לבחור קטגוריה אחרת או הסר את הפילטר",
  },

  sheet: {
    addTitle: "הוספת פריט לרשימה",
    editTitle: "עריכת פריט",
    saveChanges: "שמור שינויים",
    addToList: "הוסף לרשימה",
  },

  fields: {
    name: {
      label: "שם המוצר",
      placeholder: "למשל: כסא גיימינג, מיקסר...",
    },
    category: {
      label: "קטגוריה",
    },
    price: {
      label: "מחיר משוער ₪",
    },
    url: {
      label: "קישור לקנייה (אופציונלי)",
    },
    notes: {
      label: "הערות (אופציונלי)",
      placeholder: "צבע, גודל, מפרט...",
    },
  },

  validation: {
    nameRequired: "שם המוצר הוא שדה חובה",
    urlInvalid: "הקישור חייב להתחיל ב־https://",
  },

  scrape: {
    fetching: "שואב פרטי מוצר...",
    success: "פרטי מוצר נטענו",
    failed: "לא הצלחתי לטעון — מלא ידנית",
    failedBlocked: "האתר חוסם גישה אוטומטית — מלא ידנית",
    failedTimeout: "פג זמן הטעינה — מלא ידנית",
    failedNoData: "לא נמצאו פרטי מוצר — מלא ידנית",
    imageFound: "תמונת מוצר נמצאה",
  },

  tabs: {
    personal: "רשימה שלי",
    shared: "משותף",
  },

  categories: {
    furniture: "ריהוט",
    kitchen: "מטבח",
    bedroom: "חדר שינה",
    electronics: "אלקטרוניקה",
    clothing: "ביגוד",
    other: "אחר",
  },

  card: {
    markAsBought: "סמן כנרכש",
    markAsNotBought: "סמן כלא נרכש",
    editAria: "ערוך פריט",
    deleteAria: "מחק פריט",
    confirmDelete: "מחק?",
    buyNow: "קנה עכשיו",
  },

  boughtSection: "נרכש ({{count}})",
  totalPending: "סה״כ לרכישה",
  spent: "הוצא",
  pendingItems: "{{count}} פריטים ממתינים",
  boughtItems: "{{count}} נרכשו",

  toasts: {
    fetchError: "שגיאה בטעינת הרשימה",
    createSuccess: "הפריט נוסף לרשימה",
    createError: "שגיאה בהוספת פריט",
    updateSuccess: "הפריט עודכן",
    updateError: "שגיאה בעדכון פריט",
    deleteSuccess: "הפריט נמחק",
    deleteError: "שגיאה במחיקת פריט",
  },

  sharingBanner: {
    youLead: "אתה מנהל",
    managedBy: "מנוהל על ידי {{name}}",
    andMore: "+{{count}} נוספים",
    tapToManage: "לחץ לניהול",
  },

  inviteBanner: {
    invited: "{{name}} הזמין אותך לרשימה משותפת",
    moreInvitations: "+{{count}} הזמנות נוספות",
    tapToView: "לחץ לצפייה",
  },

  share: {
    button: "שתף רשימה",
    title: "שיתוף רשימת קניות",
    description: "הזמן מישהו לרשימת הקניות שלך באמצעות אימייל. הם יוכלו להוסיף ולנהל פריטים יחד איתך.",
    emailLabel: "כתובת אימייל",
    emailPlaceholder: "הכנס כתובת אימייל...",
    emailRequired: "נא להזין כתובת אימייל",
    emailInvalid: "נא להזין כתובת אימייל תקינה",
    send: "שלח הזמנה",
    sending: "שולח...",
    successMessage: "ההזמנה נשלחה!",
    pendingLabel: "הזמנות ממתינות",
    receivedLabel: "הזמנות שהתקבלו",
    invitedYou: "הזמין אותך לרשימת קניות",
    accept: "קבל",
    decline: "דחה",
    membersLabel: "חברי הרשימה שלי",
    memberBadge: "חבר",
    sharedWithMeLabel: "שותף איתי",
    remove: "הסר",
    leave: "עזוב רשימה משותפת",
    ownerBadge: "בעלים",
    sharedBadge: "משותף",
    awaitingResponse: "ממתין לתגובה...",
    emptyTitle: "אין רשימות משותפות עדיין",
    emptyDescription: "הזמן מישהו לקנות יחד!",
    leaderBadge: "בעלים",
    disbandTitle: "הפסק שיתוף",
    disbandConfirm: "פעולה זו תסיר את כל החברים מהרשימה המשותפת וכולם יאבדו גישה. האם אתה בטוח?",
    disbandButton: "פרק שיתוף",
    leaveConfirm: "לא יהיה לך עוד גישה לרשימה המשותפת הזו.",
    leaveButton: "עזוב",
    cancel: "ביטול",
  },
};
