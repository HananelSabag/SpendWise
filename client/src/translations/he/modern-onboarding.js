/**
 * 🌍 Modern Onboarding Translations - Hebrew
 * Enhanced translation keys for new 3-step onboarding system (RTL)
 * @version 4.0.0 - MODERN REDESIGN
 */

export default {
  // ✅ כותרות ראשיות
  title: 'ברוכים הבאים ל-SpendWise!',
  subtitle: 'בואו נגדיר את החשבון שלכם ב-3 שלבים פשוטים',

  // ✅ התקדמות וניווט
  progress: {
    step: 'שלב {{current}} מתוך {{total}}',
    timeRemaining: 'נותרו {{minutes}} דקות',
    completed: 'הושלם',
    current: 'נוכחי'
  },

  // ✅ ניווט בחלון
  modal: {
    back: 'חזור',
    next: 'הבא',
    finish: 'סיום',
    finishNow: 'סיים עכשיו',
    close: 'סגור',
    completing: 'משלים...',
    skip: 'דלג'
  },

  // ✅ תוכן ספציפי לשלבים
  steps: {
    // שלב 1: פרופיל והעדפות
    profile: {
      title: 'פרופיל והעדפות',
      subtitle: 'הגדירו את הפרופיל שלכם והתאימו את החוויה',
      sections: {
        profile: 'פרופיל',
        preferences: 'העדפות',
        notifications: 'התראות'
      },
      profilePicture: {
        title: 'תמונת פרופיל',
        upload: 'לחצו להעלאת תמונת פרופיל',
        uploading: 'מעלה...',
        success: 'תמונת הפרופיל הועלתה בהצלחה!',
        error: 'העלאת תמונת הפרופיל נכשלה',
        sizeError: 'תמונת הפרופיל חייבת להיות קטנה מ-5MB'
      },
      personalInfo: {
        title: 'מידע אישי',
        firstName: 'שם פרטי',
        lastName: 'שם משפחה',
        firstNamePlaceholder: 'הזינו את השם הפרטי שלכם',
        lastNamePlaceholder: 'הזינו את שם המשפחה שלכם',
        required: 'נדרש'
      },
      hybridAuth: {
        title: 'הגדרת אימות היברידי',
        description: 'אתם מחוברים עם Google. צרו סיסמה כדי להתחבר גם עם אימייל בעת הצורך.',
        setPassword: 'הגדרת סיסמה',
        confirmPassword: 'אישור סיסמה',
        passwordPlaceholder: 'צרו סיסמה',
        confirmPlaceholder: 'אשרו סיסמה',
        active: 'אימות היברידי פעיל',
        activeDescription: 'תוכלו להתחבר הן עם Google והן עם אימייל/סיסמה'
      },
      language: {
        title: 'שפה',
        description: 'בחרו את השפה המועדפת עליכם',
        english: 'English',
        hebrew: 'עברית'
      },
      currency: {
        title: 'מטבע',
        description: 'בחרו את המטבע העיקרי שלכם',
        usd: 'דולר אמריקאי',
        eur: 'יורו',
        ils: 'שקל ישראלי',
        gbp: 'לירה סטרלינג'
      },
      theme: {
        title: 'העדפת נושא',
        description: 'בחרו את הנושא המועדף עליכם',
        light: 'בהיר',
        dark: 'כהה',
        auto: 'אוטומטי',
        lightDescription: 'ממשק בהיר לשימוש ביום',
        darkDescription: 'ממשק כהה לתאורה נמוכה',
        autoDescription: 'תואם את העדפת המערכת'
      },
      notifications: {
        title: 'העדפות התראות',
        email: 'התראות אימייל',
        emailDesc: 'עדכונים חשובים באימייל',
        push: 'התראות דחיפה',
        pushDesc: 'התראות בדפדפן',
        budgetAlerts: 'התראות תקציב',
        budgetAlertsDesc: 'כשאתם מתקרבים למגבלות הוצאה',
        recurring: 'תזכורות חוזרות',
        recurringDesc: 'עסקאות חוזרות קרובות',
        note: 'תוכלו לשנות את ההגדרות האלו בכל זמן בהגדרות הפרופיל. אנו ממליצים לשמור על התראות אימייל ותקציב מופעלות לעדכונים פיננסיים חשובים.'
      }
    },

    // שלב 2: חינוך
    education: {
      title: 'למדו את היסודות',
      subtitle: 'הבינו עסקאות ומעקב יתרות',
      sections: {
        overview: 'סקירה',
        transactions: 'עסקאות',
        balance: 'פאנל יתרה',
        benefits: 'יתרונות'
      },
      mainTitle: 'למדו את לוח המחוונים הפיננסי שלכם',
      mainSubtitle: 'הבנת איך SpendWise עוקב ומציג את הכסף שלכם',
      description: 'היסוד הזה יעזור לכם לקבל החלטות פיננסיות טובות יותר',
      
      transactionTypes: {
        title: 'שני סוגי עסקאות',
        description: 'הבנת ההבדל היא המפתח',
        oneTime: {
          title: 'חד-פעמיות',
          description: 'רכישות בודדות שאתם מזינים ידנית',
          examples: ['קפה', 'דלק', 'קניות']
        },
        recurring: {
          title: 'חוזרות',
          description: 'עסקאות אוטומטיות שחוזרות על עצמן לפי לוח זמנים',
          examples: ['משכורת', 'שכר דירה', 'מנויים']
        }
      },

      balancePanel: {
        title: 'לוח המחוונים הפיננסי שלכם',
        description: 'ראו את הכסף שלכם במבט אחד',
        features: {
          privacy: 'הסתרה/הצגה של יתרות לפרטיות',
          tracking: 'מעקב אחר שינויים לאורך זמן',
          overview: 'סקירה מהירה של הכנסות נגד הוצאות'
        },
        demo: {
          totalBalance: 'יתרה כוללת',
          acrossAccounts: 'על פני כל החשבונות',
          comparedTo: 'בהשוואה לחודש שעבר',
          income: 'הכנסות',
          expenses: 'הוצאות',
          savings: 'חסכונות'
        }
      },

      interactive: {
        title: 'הדגמה אינטראקטיבית של עסקאות',
        description: 'לחצו על עסקאות כדי לראות איך הן עובדות. שימו לב להבדלים הוויזואליים!',
        selected: 'מעולה! בחרתם {{count}} דוגמאות',
        explanation: 'שימו לב איך לעסקאות החוזרות יש עיצוב סגול, תגיות מיוחדות ומציגות את המועד הבא שלהן. זה מקל לזהות עסקאות אוטומטיות ברשימה!'
      },

      benefits: {
        title: 'למה הידע הזה חשוב',
        description: 'הבנת המושגים האלו תשנה את הניהול הפיננסי שלכם',
        financial: {
          title: 'יתרונות פיננסיים',
          budgeting: {
            title: 'תקצוב טוב יותר',
            description: 'עסקאות חוזרות עוזרות לחזות תזרים מזומנים עתידי ולתכנן מראש'
          },
          patterns: {
            title: 'זיהוי דפוסים',
            description: 'זיהוי קל של דפוסי הוצאות ועלויות מנויים'
          },
          progress: {
            title: 'מעקב התקדמות',
            description: 'ניטור הבריאות הפיננסית שלכם עם תובנות יתרה ברורות'
          }
        },
        practical: {
          title: 'יתרונות מעשיים',
          time: {
            title: 'חיסכון בזמן',
            description: 'אין צורך להזין ידנית משכורת, שכר דירה או מנויים כל חודש'
          },
          never_miss: {
            title: 'לא תפספסו',
            description: 'קבלו התראות על עסקאות חוזרות קרובות לפני שהן קורות'
          },
          privacy: {
            title: 'שליטה בפרטיות',
            description: 'הסתירו יתרות כששיתוף המסך או שימוש בציבור'
          }
        },
        conclusion: {
          title: 'אתם מוכנים לקחת שליטה!',
          description: 'עם הידע הזה, תוכלו להשתמש ביעילות ב-SpendWise כדי לשפר את הבריאות הפיננסית שלכם ולחסוך זמן בניהול הכסף.'
        }
      }
    },

    // שלב 3: תבניות
    templates: {
      title: 'הגדרה מהירה',
      subtitle: 'הוסיפו עסקאות חוזרות תוך שניות',
      mainTitle: 'הגדרת תבניות מהירה',
      mainSubtitle: 'הגדירו את העסקאות החוזרות שלכם תוך שניות',
      description: 'בחרו תבניות שמתאימות לאורח החיים שלכם - תמיד תוכלו להוסיף עוד מאוחר יותר',
      
      presets: {
        title: 'הגדרות מהירות מוכנות',
        basic: {
          name: 'הגדרה בסיסית',
          description: 'משכורת + שכר דירה + טלפון'
        },
        complete: {
          name: 'הגדרה מלאה',
          description: 'כל החיוניים + קצת אורח חיים'
        },
        minimal: {
          name: 'הגדרה מינימלית',
          description: 'רק משכורת לעת עתה'
        }
      },

      categories: {
        essentials: {
          title: 'חיוניים',
          description: 'עסקאות חוזרות הכרחיות'
        },
        income: {
          title: 'הכנסות',
          description: 'מקורות הכנסה קבועים'
        },
        lifestyle: {
          title: 'אורח חיים',
          description: 'בידור ואישי'
        },
        transportation: {
          title: 'תחבורה',
          description: 'תשלומי רכב ותחבורה'
        }
      },

      templates: {
        salary: 'משכורת חודשית',
        rent: 'שכר דירה/משכנתא',
        phone: 'חשבון טלפון',
        gym: 'מנוי חדר כושר',
        netflix: 'שירותי סטרימינג',
        coffee: 'תקציב קפה',
        freelance: 'הכנסה עצמאית',
        investment: 'תשואות השקעות',
        car_payment: 'תשלום רכב',
        insurance: 'ביטוח רכב'
      },

      summary: {
        title: 'הסיכום החודשי שלכם',
        description: 'בהתבסס על {{count}} תבניות שנבחרו',
        income: 'הכנסות חודשיות',
        expenses: 'הוצאות חודשיות',
        net: 'נטו חודשי',
        positive: 'תזרים מזומנים חיובי',
        negative: 'גירעון תקציב',
        sources: '{{count}} מקורות',
        recurring: '{{count}} חוזרות',
        selected: 'תבניות שנבחרו:',
        complete: 'השלימו הגדרה עם {{count}} תבניות'
      },

      benefits: {
        title: 'מה קורה הלאה?',
        automatic: {
          title: 'עסקאות אוטומטיות',
          description: 'אלו יתווספו לחשבון שלכם אוטומטית לפי לוח הזמנים שלהן'
        },
        adjustments: {
          title: 'התאמות קלות',
          description: 'שנו סכומים, השהו או שנו כל תבנית בכל זמן'
        },
        budgeting: {
          title: 'תקצוב טוב יותר',
          description: 'ראו את הדפוסים הפיננסיים שלכם ותכננו מראש בביטחון'
        },
        timeSaving: {
          title: 'חיסכון בזמן',
          description: 'אין יותר הזנה ידנית של אותן עסקאות כל חודש'
        }
      }
    }
  },

  // ✅ השלמה
  completion: {
    success: 'ההגדרה הושלמה בהצלחה! ברוכים הבאים ל-SpendWise!',
    failed: 'השלמת ההגדרה נכשלה. אנא נסו שוב.',
    completing: 'משלים את ההגדרה שלכם...',
    almostDone: 'כמעט סיימנו! מסיים את הגדרת החשבון...'
  },

  // ✅ פעולות נפוצות
  common: {
    cancel: 'ביטול',
    save: 'שמור',
    enabled: 'מופעל',
    disabled: 'מכובה',
    required: 'נדרש',
    optional: 'אופציונלי',
    recommended: 'מומלץ'
  },

  // ✅ הודעות אימות
  validation: {
    firstNameRequired: 'שם פרטי נדרש',
    lastNameRequired: 'שם משפחה נדרש',
    languageRequired: 'בחירת שפה נדרשת',
    currencyRequired: 'בחירת מטבע נדרשת',
    passwordRequired: 'סיסמה נדרשת לאימות היברידי',
    passwordTooShort: 'הסיסמה חייבת להיות לפחות 8 תווים',
    passwordsDoNotMatch: 'הסיסמאות אינן תואמות'
  }
};
