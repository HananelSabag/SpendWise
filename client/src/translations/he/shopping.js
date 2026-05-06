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

  share: {
    button: "שתף רשימה",
    title: "שיתוף רשימת קניות",
    description: "הזן את האימייל של המשתמש שאיתו תרצה לשתף",
    emailLabel: "כתובת אימייל",
    emailPlaceholder: "חבר@example.com",
    send: "שלח הזמנה",
    sending: "שולח...",
    successMessage: "אם האימייל רשום במערכת, נשלחה הזמנה",
    pendingLabel: "הזמנות ממתינות",
    membersLabel: "משותף עם",
    remove: "הסר",
    leave: "עזוב רשימה משותפת",
    ownerBadge: "בעלים",
    sharedBadge: "משותף",
  },
};
