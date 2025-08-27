/**
 * 🪟 MODALS TRANSLATIONS - HEBREW
 * Modal dialogs, forms, and overlays translations
 * @version 1.0.0
 */

export default {
  // Edit Transaction Modal
  edit: {
    edit: {
      title: 'ערוך עסקה',
      subtitle: 'עדכן פרטי העסקה'
    },
    duplicate: {
      title: 'שכפל עסקה',
      subtitle: 'צור עותק של העסקה הזו'
    },
    view: {
      title: 'צפה בעסקה',
      subtitle: 'פרטי העסקה'
    },
    success: {
      updateTitle: 'העסקה עודכנה',
      updateMessage: 'העסקה עודכנה בהצלחה',
      duplicateTitle: 'העסקה שוכפלה',
      duplicateMessage: 'העסקה שוכפלה בהצלחה'
    }
  },

  // Delete Transaction Modal
  delete: {
    title: 'מחק עסקה',
    description: 'האם אתם בטוחים שברצונכם למחוק את העסקה הזו? פעולה זו לא ניתנת לביטול.',
    warning: 'זה יסיר לצמיתות את העסקה מהרשומות שלכם.',
    confirm: 'מחק עסקה',
    cancel: 'בטל',
    
    // Recurring transaction delete options
    recurring: {
      title: 'מחק עסקה חוזרת',
      options: 'בחרו אפשרות מחיקה:',
      single: 'מחק רק את המופע הזה',
      singleDescription: 'הסר רק את המופע הספציפי הזה של העסקה',
      future: 'מחק את זה ומופעים עתידיים',
      futureDescription: 'עצור יצירת עסקאות עתידיות מהתבנית הזו',
      all: 'מחק את כל המופעים',
      allDescription: 'הסר את כל העסקאות העבר והעתיד מהתבנית הזו',
      allWarning: 'זה ימחק את כל העסקאות מהתבנית החוזרת הזו, כולל עסקאות עבר.',
      futureWarning: 'זה יעצור עסקאות עתידיות אבל ישמור על עסקאות עבר.'
    }
  },

  // Common modal actions
  common: {
    close: 'סגור',
    save: 'שמור',
    cancel: 'בטל',
    confirm: 'אשר',
    delete: 'מחק',
    edit: 'ערוך',
    duplicate: 'שכפל',
    loading: 'טוען...',
    saving: 'שומר...',
    deleting: 'מוחק...'
  }
};

