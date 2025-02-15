import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const translations = {
  en: {
    register: {
      title: "Create your account",
      subtitle: "Start your financial journey with SpendWise",
      username: "First Name + Last Name",
      usernamePlaceholder: "Enter Your name",
      email: "Email address",
      emailPlaceholder: "Enter your email",
      password: "Password",
      passwordPlaceholder: "Create a password",
      confirmPassword: "Confirm Password",
      confirmPasswordPlaceholder: "Confirm your password",
      createAccount: "Create account",
      creatingAccount: "Creating account...",
      alreadyHaveAccount: "Already have an account?",
      signInInstead: "Sign in instead",
      features: {
        title: "Daily Personal Finance Tracker",
        description: "Join SpendWise today and take control of your financial future with our intuitive and powerful finance management tools.",
        feature1: "Real-time expense tracking",
        feature2: "Smart budget planning",
        feature3: "Detailed financial insights"
      },
      errors: {
        passwordMatch: "Passwords do not match",
        registrationFailed: "Registration failed"
      },
      success: {
        title: "Registration successful!",
        message: "You will be redirected to the login page shortly."
      }
    },
    login: {
      title: "Sign in",
      subtitle: "Access your SpendWise account",
      email: "Email address",
      emailPlaceholder: "Enter your email",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      rememberMe: "Remember me",
      forgotPassword: "Forgot password?",
      signIn: "Sign in",
      signingIn: "Signing in...",
      noAccount: "Don't have an account?",
      createAccount: "Create an account",
      invalidCredentials: "Invalid email or password",
      features: {
        title: "Welcome Back!",
        description: "Sign in to continue managing your finances with SpendWise's powerful tools and insights.",
        feature1: "Track your daily expenses",
        feature2: "View financial analytics",
        feature3: "Plan your budget efficiently"
      }
    },
    home: {
      nav: {
        overview: "Home",
        transactions: "Transactions",
        settings: "Settings",
        logout: "Logout",
        profile: "Profile",
        transctionsMangment: "Transaction Management"
      },
      balance: {
        daily: "Daily",
        weekly: "Weekly",
        monthly: "Monthly",
        yearly: "Yearly",
        income: "Income",
        expenses: "Expenses",
        total: "Total Balance",
        remaining: "Remaining Balance",
        error: "Error loading balance data",
        calculatedAt: "Calculated at",
        tooltip: "Select a date to view the balance of income, expenses, and net balance for the day, week, month, or year based on the selected date. A quick return button will allow you to easily switch back to the current day.",
        backToToday: "Reset to today's date",
        period: {
          asOf: "As of {{date}}:",
          fromTo: "{{start}} - {{end}}",
          monthYear: "{{month}} {{year}}",
          yearOnly: "Year {{year}}"
        }
      },
      transactions: {
        recent: "Recent Transactions",
        noTransactions: "No recent transactions",
        viewAll: "View All"
      },

    },
    categories: {
      Salary: "Salary",
      Freelance: "Freelance",
      Investments: "Investments",
      Rent: "Rent",
      Groceries: "Groceries",
      Transportation: "Transportation",
      Utilities: "Utilities",
      Entertainment: "Entertainment",
      General: "General"
    },
    transactions: {
      title: "Transaction Management",
      noTransactions: "No transactions for this date",
      fetchError: "Error loading transactions",
      deleteConfirm: "Are you sure you want to delete this transaction?",
      recurring: "Recurring",
      oneTime: "One-time",
      editTitle: "Edit Transaction",
      delete: "Delete Transaction",
      selectDate: "Select Date",
      dateWithTransactions: "Has Transactions",
      noTransactionsOnDate: "No Transactions",
      transactionsForDay: "Transactions for :",
      currentDate: "Current Date",
      editTransaction: "Edit Transaction",
      filters: {
        title: "Filter Transactions",
        filterButton: "Filter",
        income: "Income",
        expense: "Expense",
        recurring: "Recurring",
        oneTime: "One-Time",

      }

    },
    common: {
      loading: "Loading...",
      retry: "Retry",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      back: "Back"
    },
    actions: {
      title: "Add Transaction",
      panel: {
        subtitle: "Add new transactions and manage recurring payments"
      },
      buttontitle: "Add Transactions",
      oneTimeExpense: "One-time Expense",
      recurringExpense: "Recurring Expense",
      oneTimeIncome: "One-time Income",
      recurringIncome: "Recurring Income",
      amount: "Amount",
      amountPlaceholder: "Enter the amount",
      description: "Description",
      descriptionPlaceholder: "Add a description",
      category: "Category",
      frequency: "Frequency",
      frequencies: {
        daily: "Daily",
        weekly: "Weekly",
        monthly: "Monthly"
      },
      add: "Add Transaction",
      errors: {
        amountRequired: "Amount is required",
        addingTransaction: "Error adding transaction"
      },
      default: {
        expense: "General Expense",
        income: "General Income"
      },
      quickExpense: {
        placeholder: "Enter amount",
        add: "Quick Expense",
        amountRequired: "Amount required",
        error: "Failed to add",
         addincome:"Quick Income"
      }
    },


    profile: {
      title: "Profile Settings",
      username: "Username",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmPassword: "Confirm Password",
      dailyBalance: "Daily Balance",
      logout: "Logout",
      passwordMismatch: "Passwords do not match",
      updateSuccess: "Profile updated successfully",
      updateError: "Failed to update profile",
      cancel: "Cancel",
      save: "Save Changes",
    },
    floatingMenu: {
      changeLanguage: "עברית",
      switchCurrency: "Switch Currency",
    }

  },
  he: {
    register: {
      title: "צור חשבון",
      subtitle: "התחל את המסע הפיננסי שלך עם SpendWise",
      username: "שם פרטי + שם משפחה",
      usernamePlaceholder: "הכנס את השם שלך",
      email: "כתובת אימייל",
      emailPlaceholder: "הכנס את האימייל שלך",
      password: "סיסמה",
      passwordPlaceholder: "צור סיסמה",
      confirmPassword: "אימות סיסמה",
      confirmPasswordPlaceholder: "אמת את הסיסמה",
      createAccount: "צור חשבון",
      creatingAccount: "יוצר חשבון...",
      alreadyHaveAccount: "כבר יש לך חשבון?",
      signInInstead: "התחבר כאן",
      features: {
        title: "מנהל פיננסי אישי יומי",
        description: "הצטרף אלינו היום וקח שליטה על העתיד הפיננסי שלך עם כלי ניהול פיננסים חכמים ואינטואיטיבים.",
        feature1: "מעקב הוצאות בזמן אמת",
        feature2: "תכנון תקציב חכם",
        feature3: "תובנות פיננסיות מפורטות"
      },
      errors: {
        registrationFailed: "ההרשמה נכשלה"
      },
      success: {
        title: "נרשמת בהצלחה!",
        message: "מיד תעבור לעמוד הכניסה."
      }
    },
    login: {
      title: "התחברות",
      subtitle: "התחבר לחשבון שלך",
      email: "כתובת אימייל",
      emailPlaceholder: "הכנס את האימייל שלך",
      password: "סיסמה",
      passwordPlaceholder: "הכנס את הסיסמה שלך",
      rememberMe: "זכור אותי",
      forgotPassword: "שכחת סיסמה?",
      signIn: "התחבר",
      signingIn: "מתחבר...",
      noAccount: "אין לך חשבון?",
      createAccount: "צור חשבון",
      invalidCredentials: "אימייל או סיסמה שגויים",
      features: {
        title: "ברוך הבא!",
        description: "התחבר כדי להמשיך לנהל את הכספים שלך עם הכלים החזקים של SpendWise",
        feature1: "מעקב אחר הוצאות יומיות",
        feature2: "צפייה בניתוחים פיננסיים",
        feature3: "תכנון תקציב יעיל"
      }
    },
    home: {
      nav: {
        overview: "דף בית",
        transactions: "עסקאות",
        settings: "הגדרות",
        logout: "התנתק",
        profile: "פרופיל",
        transctionsMangment: "ניהול עסקאות"
      },
      balance: {
        daily: "יומי",
        weekly: "שבועי",
        monthly: "חודשי",
        yearly: "שנתי",
        income: "הכנסות",
        expenses: "הוצאות",
        total: "יתרה כוללת",
        remaining: "יתרה נותרת",
        error: "שגיאה בטעינת נתוני המאזן",
        calculatedAt: "חושב בתאריך",
        tooltip: "בחר תאריך כדי להציג את מאזן ההכנסות, ההוצאות והיתרה ליום, שבוע, חודש או שנה בהתבסס על התאריך שנבחר. כפתור חזרה יאפשר לך לשוב במהירות ליום הנוכחי.",
        backToToday: "חזור לתאריך הנוכחי",
        period: {
          asOf: "נכון לתאריך: {{date}}",
          fromTo: "{{start}} - {{end}}",
          monthYear: "נכון לחודש: {{month}} {{year}}",
          yearOnly: "נכון לשנת: {{year}}"
        }
      },
      transactions: {
        recent: "עסקאות אחרונות",
        noTransactions: "אין עסקאות אחרונות",
        viewAll: "הצג הכל"
      },

    },
    categories: {
      Salary: "משכורת",
      Freelance: "פרילנס",
      Investments: "השקעות",
      Rent: "שכירות",
      Groceries: "מצרכים",
      Transportation: "תחבורה",
      Utilities: "חשבונות",
      Entertainment: "בידור",
      General: "כללי"
    },
    transactions: {
      title: "ניהול עסקאות",
      noTransactions: "אין עסקאות לתאריך זה",
      fetchError: "שגיאה בטעינת העסקאות",
      deleteConfirm: "האם אתה בטוח שברצונך למחוק עסקה זו?",
      recurring: "חוזרת",
      oneTime: "חד פעמית",
      editTitle: "עריכת עסקה",
      delete: "מחיקת עסקה",
      selectDate: "בחירת תאריך",
      dateWithTransactions: "יש עסקאות",
      noTransactionsOnDate: "אין עסקאות",
      transactionsForDay: "עסקאות עבור:",
      currentDate: "תאריך נוכחי",
      editTransaction: "עריכת עסקה",
      filters: {
        title: "סינון עסקאות",
        filterButton: "סנן",
        income: "הכנסות",
        expense: "הוצאות",
        recurring: "חוזרות",
        oneTime: "חד פעמיות"
      }
    },
    common: {
      loading: "טוען...",
      retry: "נסה שוב",
      save: "שמור",
      cancel: "ביטול",
      edit: "ערוך",
      delete: "מחק",
      back: "חזור"
    },
    actions: {
      title: "הוספת עסקה",
      panel: {
        subtitle: "הוסף עסקאות חדשות וניהול תשלומים קבועים"
      },
      buttontitle: "הוספת עסקאות",
      oneTimeExpense: "הוצאה חד פעמית",
      recurringExpense: "הוצאה חוזרת",
      oneTimeIncome: "הכנסה חד פעמית",
      recurringIncome: "הכנסה חוזרת",
      amount: "סכום",
      amountPlaceholder: "הכנס סכום",
      description: "תיאור",
      descriptionPlaceholder: "הוסף תיאור",
      category: "קטגוריה",
      frequency: "תדירות",
      frequencies: {
        daily: "יומי",
        weekly: "שבועי",
        monthly: "חודשי"
      },
      add: "הוסף עסקה",
      errors: {
        amountRequired: "חובה להזין סכום",
        addingTransaction: "שגיאה בהוספת העסקה"
      },
      default: {
        expense: "הוצאה כללית",
        income: "הכנסה כללית"
      },
      quickExpense: {
        placeholder: "הכנס סכום",
        add: "הוצאה מהירה",
        amountRequired: "נדרש סכום",
        error: "הוספה נכשלה",
        addincome:"הכנסה מהירה"
      }
    },
    profile: {
      title: "הגדרות פרופיל",
      username: "שם משתמש",
      currentPassword: "סיסמה נוכחית",
      newPassword: "סיסמה חדשה",
      confirmPassword: "אימות סיסמה",
      dailyBalance: "מאזן יומי",
      logout: "התנתקות",
      passwordMismatch: "הסיסמאות אינן תואמות",
      updateSuccess: "הפרופיל עודכן בהצלחה",
      updateError: "עדכון הפרופיל נכשל",
      cancel: "ביטול",
      save: "שמור שינויים",
    },
    floatingMenu: {
      changeLanguage: "English",
      switchCurrency: "החלף מטבע",
    }
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('appLanguage');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const newLanguage = prev === 'en' ? 'he' : 'en';
      localStorage.setItem('appLanguage', newLanguage);
      return newLanguage;
    });
  };

  const t = (key, variables) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value[k];
      if (!value) return key;
    }
    if (variables) {
      Object.keys(variables).forEach((varKey) => {
        value = value.replace(`{{${varKey}}}`, variables[varKey]);
      });
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
