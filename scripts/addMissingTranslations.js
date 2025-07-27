const fs = require('fs');
const path = require('path');

// Define missing translations that need to be added
const missingTranslations = {
  english: {
    // App initializer translations
    "app": {
      "initializer": {
        "serverStartingUp": "Server Starting Up",
        "serverWakingMessage": "Our server is waking up from sleep mode. This takes about 30-60 seconds.",
        "freeHostingMessage": "Free hosting wakes up slowly - hang tight!",
        "loadingSpendWise": "Loading SpendWise",
        "authenticating": "Authenticating...",
        "connectingToServer": "Connecting to server...",
        "loadingData": "Loading your data...",
        "almostReady": "Almost ready!",
        "somethingWentWrong": "Something went wrong",
        "initializationFailed": "Failed to initialize the app. Please try refreshing.",
        "checkingServer": "Checking server...",
        "serverSleeping": "Server sleeping",
        "serverWarmingUp": "Server warming up...",
        "serverReady": "Server ready!"
      }
    },
    // Theme translations
    "theme": {
      "light": "Light",
      "dark": "Dark",
      "switchToLight": "Switch to light mode",
      "switchToDark": "Switch to dark mode"
    }
  },
  hebrew: {
    // App initializer translations
    "app": {
      "initializer": {
        "serverStartingUp": "השרת מתחיל",
        "serverWakingMessage": "השרת שלנו מתעורר ממצב שינה. זה לוקח בערך 30-60 שניות.",
        "freeHostingMessage": "אירוח חינמי מתעורר לאט - המתינו בסבלנות!",
        "loadingSpendWise": "טוען את SpendWise",
        "authenticating": "מאמת...",
        "connectingToServer": "מתחבר לשרת...",
        "loadingData": "טוען את הנתונים שלך...",
        "almostReady": "כמעט מוכן!",
        "somethingWentWrong": "משהו השתבש",
        "initializationFailed": "אתחול האפליקציה נכשל. אנא נסה לרענן.",
        "checkingServer": "בודק שרת...",
        "serverSleeping": "השרת ישן",
        "serverWarmingUp": "השרת מתחמם...",
        "serverReady": "השרת מוכן!"
      }
    },
    // Theme translations
    "theme": {
      "light": "בהיר",
      "dark": "כהה",
      "switchToLight": "החלף למצב בהיר",
      "switchToDark": "החלף למצב כהה"
    }
  }
};

function addMissingTranslations() {
  const languageContextPath = path.join(__dirname, '../client/src/context/LanguageContext.jsx');
  let content = fs.readFileSync(languageContextPath, 'utf8');

  // For demonstration, let's add missing translations manually by finding insertion points
  console.log('Adding missing translations to LanguageContext.jsx...');
  
  // Note: This is a simplified approach. In production, you'd want proper AST parsing
  // For now, we'll manually update the files we need to fix.
  
  console.log('Missing translations to add:');
  console.log('English:', JSON.stringify(missingTranslations.english, null, 2));
  console.log('Hebrew:', JSON.stringify(missingTranslations.hebrew, null, 2));
  
  // Instead of modifying the large file programmatically, let's proceed with manual fixes
  console.log('\nPlease manually add these translations to the LanguageContext.jsx file.');
  console.log('We will proceed with fixing the component files to use translation keys.');
}

if (require.main === module) {
  addMissingTranslations();
}

module.exports = { missingTranslations }; 