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
    sharedWith: "שיתוף עם",
    sharedWithCount: "שיתוף עם {{count}} אנשים",
  },

  inviteBanner: {
    invited: "{{name}} הזמין אותך לרשימה משותפת",
    moreInvitations: "+{{count}} הזמנות נוספות",
    tapToView: "לחץ לצפייה",
  },

  share: {
    button: "שתף רשימה",
    title: "שיתוף רשימת קניות",
    description: "הזן את האימייל של המשתמש שאיתו תרצה לשתף",
    emailLabel: "כתובת אימייל",
    emailPlaceholder: "חבר@example.com",
    emailRequired: "נדרש אימייל",
    emailInvalid: "אימייל לא תקין",
    send: "שלח הזמנה",
    sending: "שולח...",
    successMessage: "אם האימייל רשום במערכת, נשלחה הזמנה",
    pendingLabel: "הזמנות ממתינות",
    receivedLabel: "הזמנות שקיבלת",
    invitedYou: "הזמין אותך לרשימת קניות",
    accept: "אישור",
    decline: "דחייה",
    membersLabel: "משותף עם",
    memberBadge: "חבר",
    sharedWithMeLabel: "רשימות שמשותפות איתי",
    remove: "הסר",
    leave: "עזוב רשימה משותפת",
    ownerBadge: "בעלים",
    sharedBadge: "משותף",
    awaitingResponse: "ממתין לאישור",
    emptyTitle: "עדיין לא שיתפת את הרשימה",
    emptyDescription: "הזמן חברים להצטרף ולשתף ברשימה שלך",
  },
};
