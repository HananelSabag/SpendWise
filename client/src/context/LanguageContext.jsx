// src/context/LanguageContext.jsx
import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext(null);

export const translations = {
  en: {
    register: {
      title: "Create your account",
      subtitle: "Start your financial journey with SpendWise",
      username: "Username",
      usernamePlaceholder: "Choose a username",
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
      features: {
        title: "Welcome Back!",
        description: "Sign in to continue managing your finances with SpendWise's powerful tools and insights.",
        feature1: "Track your daily expenses",
        feature2: "View financial analytics",
        feature3: "Plan your budget efficiently"
      }
    }
  },
  he: {
    register: {
      title: "צור חשבון",
      subtitle: "התחל את המסע הפיננסי שלך עם SpendWise",
      username: "שם משתמש",
      usernamePlaceholder: "בחר שם משתמש",
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
        passwordMatch: "הסיסמאות אינן תואמות",
        registrationFailed: "ההרשמה נכשלה"
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
      features: {
        title: "ברוך הבא!",
        description: "התחבר כדי להמשיך לנהל את הכספים שלך עם הכלים החזקים של SpendWise",
        feature1: "מעקב אחר הוצאות יומיות",
        feature2: "צפייה בניתוחים פיננסיים",
        feature3: "תכנון תקציב יעיל"
      }
    }
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'he' : 'en');
  };

  const value = {
    language,
    toggleLanguage,
    t: (key) => {
      const keys = key.split('.');
      let value = translations[language];
      for (const k of keys) {
        if (!value || !value[k]) return key;
        value = value[k];
      }
      return value;
    }
  };

  return (
    <LanguageContext.Provider value={value}>
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