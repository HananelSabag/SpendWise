/**
 * Guess a supermarket aisle from what the user typed.
 *
 * Purely a convenience: adding an item should cost one field, so we pick the
 * aisle for you and leave the dropdown one tap away if the guess is wrong. It
 * never blocks, and an unknown word lands in "other".
 *
 * Matching is SCORED, not first-substring-wins. Hebrew stems are short and
 * overlap badly: "שוק" (a chicken drumstick) is a prefix of "שוקו", which used
 * to file chocolate milk under meat. A whole-word match therefore beats a
 * prefix match, a prefix match beats a mid-word substring, and a prefix that
 * leaves a long tail is penalised — so the longer, more specific term wins.
 *
 * Vocabulary is Hebrew-first because that is what gets typed here, and is
 * organised by the aisles Israeli supermarkets actually use.
 */

/** One-letter Hebrew prefixes that glue onto a noun: הלחם, וחלב, בשקית. */
const HEBREW_PREFIXES = /^[הובלמשכ]/;

const KEYWORDS = {
  produce: [
    // ירקות
    'עגבני', 'עגבניה', 'מלפפון', 'חסה', 'גזר', 'בצל', 'שום', 'פלפל', 'פלפלים',
    'קישוא', 'חציל', 'בטטה', 'תפוח אדמה', 'תפוד', 'תפוא', 'ברוקולי', 'כרובית',
    'כרוב', 'תרד', 'סלרי', 'צנון', 'צנונית', 'דלעת', 'דלורית', 'קולורבי',
    'שעועית ירוקה', 'אפונה טרי', 'תירס טרי', 'בצל ירוק', 'שמיר', 'פטרוזיל',
    'כוסבר', 'נענע', 'בזיליקום', 'רוקט', 'בייבי', 'חסת', 'ארטישוק', 'לפת',
    'פטרי', 'שמפיניון', 'נבטים', 'זיתים טרי', 'לימונים',
    // פירות
    'תפוח', 'תפוחים', 'בננ', 'תפוז', 'קלמנטינ', 'מנדרינ', 'אשכולית', 'לימון',
    'אבוקדו', 'תות', 'ענב', 'אבטיח', 'מלון', 'אפרסק', 'נקטרינ', 'שזיף', 'אגס',
    'רימון', 'מנגו', 'קיווי', 'אננס', 'תמר', 'תאנ', 'משמש', 'דובדבן', 'ליצ',
    'פסיפלור', 'קרמבול', 'פומלה', 'אפרסמון',
    'ירק', 'ירקות', 'פירות', 'סלט',
    // English
    'tomato', 'cucumber', 'lettuce', 'carrot', 'onion', 'garlic', 'apple',
    'banana', 'orange', 'lemon', 'avocado', 'pepper', 'strawberr', 'grape',
    'watermelon', 'melon', 'spinach', 'broccoli', 'cauliflower', 'cabbage',
    'zucchini', 'eggplant', 'potato', 'sweet potato', 'parsley', 'cilantro',
    'mint', 'basil', 'mushroom', 'salad', 'fruit', 'veg', 'lime', 'peach',
    'pear', 'plum', 'mango', 'kiwi', 'pineapple', 'date', 'fig',
  ],

  bakery: [
    'לחם', 'לחמני', 'פית', 'פיתה', 'חלה', 'בגט', 'באגט', 'קרואסון', 'רוגלך',
    'בורק', 'מאפה', 'מאפים', 'טורטיה', 'טורטיל', 'לאפה', 'פוקאצ', 'ציאבט',
    'בייגל', 'ביסקוויט שמרים', 'עוגת שמרים', 'קרקר לחם', 'מצות', 'קובה',
    'פרוסות', 'שיפון', 'כוסמין', 'דגנים לחם',
    'bread', 'pita', 'challah', 'roll', 'baguette', 'croissant', 'pastry',
    'tortilla', 'bun', 'bagel', 'focaccia', 'ciabatta',
  ],

  dairy_eggs: [
    'חלב', 'שוקו', 'גבינה', 'גבינת', 'גבינות', 'קוטג', 'יוגורט', 'יוגורטים',
    'שמנת', 'חמאה', 'ביצה', 'ביצים', 'לבן', 'אשל', 'מעדן', 'מילקי', 'דנונה',
    'צהובה', 'מוצרלה', 'פטה', 'בולגרית', 'ריקוטה', 'מסקרפונה', 'קממבר',
    'גאודה', 'עמק', 'תנובה', 'טרה', 'יטבתה', 'שמנת חמוצה', 'לברנה', 'כשקד',
    'משקה סויה', 'חלב שקדים', 'חלב שיבולת', 'טופו', 'קרם גבינה', 'ממרח גבינה',
    'milk', 'cheese', 'cottage', 'yogurt', 'yoghurt', 'cream', 'butter', 'egg',
    'mozzarella', 'feta', 'ricotta', 'tofu', 'gouda', 'camembert', 'kefir',
  ],

  meat_fish: [
    'בשר', 'עוף', 'הודו', 'שניצל', 'קציצ', 'נקניק', 'נקניקי', 'סלמון', 'טונה טרי',
    'דג', 'דגים', 'טחון', 'אנטריקוט', 'סינטה', 'פילה', 'כבד', 'פרגית', 'חזה עוף',
    'כנפיים', 'שוקיים', 'שוק עוף', 'המבורגר', 'קבב', 'דניס', 'לברק', 'מושט',
    'בקלה', 'אמנון', 'שווארמה', 'אסאדו', 'צלעות', 'לשון', 'כתף', 'צלי', 'סטייק',
    'עוף שלם', 'ירכיים', 'פסטרמה', 'סלמי', 'מרגז',
    'meat', 'chicken', 'turkey', 'schnitzel', 'sausage', 'salmon', 'fish',
    'beef', 'steak', 'lamb', 'burger', 'mince', 'liver', 'brisket', 'ribs',
  ],

  pantry: [
    'אורז', 'פסטה', 'ספגטי', 'פנה', 'נודלס', 'קמח', 'סוכר', 'מלח', 'פלפל שחור',
    'שמן', 'שמן זית', 'חומץ', 'רוטב', 'קטשופ', 'מיונז', 'חרדל', 'טחינה',
    'חומוס', 'שימור', 'שימורים', 'תירס', 'אפונה', 'קטניות', 'עדש', 'שעועית',
    'גרגירי', 'קוסקוס', 'בורגול', 'קינואה', 'פתיתים', 'שקד', 'אגוז', 'צימוק',
    'דבש', 'ריבה', 'תבלין', 'תבלינים', 'פפריקה', 'כמון', 'כורכום', 'אבקת מרק',
    'שקדי מרק', 'קפה', 'נס קפה', 'תה', 'סוכרזית', 'שמרים', 'אבקת אפייה',
    'סודה לשתייה', 'קורנפלור', 'רסק', 'פסטו', 'סילאן', 'ממרח', 'שוקולד למריחה',
    'נוטלה', 'חלבה', 'גרנולה', 'קורנפלקס', 'דגני בוקר', 'שיבולת שועל', 'קוואקר',
    'שמן קנולה', 'קוקוס', 'סירופ',
    'rice', 'pasta', 'spaghetti', 'flour', 'sugar', 'salt', 'oil', 'olive oil',
    'vinegar', 'sauce', 'ketchup', 'mayo', 'mustard', 'tahini', 'hummus',
    'canned', 'corn', 'lentil', 'bean', 'chickpea', 'couscous', 'quinoa',
    'almond', 'walnut', 'nut', 'raisin', 'honey', 'jam', 'spice', 'cereal',
    'coffee', 'tea', 'oats', 'granola', 'syrup', 'yeast',
  ],

  frozen: [
    'קפוא', 'קפואים', 'גלידה', 'גלידת', 'ארטיק', 'קרטיב', 'מלאווח', 'ג׳חנון',
    'ג\'חנון', 'בורקס קפוא', 'פיצה קפואה', 'צ׳יפס קפוא', 'שניצל קפוא',
    'ירקות קפואים', 'אפונה קפואה', 'קרח',
    'frozen', 'ice cream', 'icecream', 'popsicle', 'fries',
  ],

  snacks_sweets: [
    'חטיף', 'חטיפים', 'ביסלי', 'במבה', 'דוריטוס', 'צ׳יטוס', 'אפרופו', 'שוקולד',
    'סוכרי', 'ממתק', 'ממתקים', 'עוגי', 'עוגיות', 'ופל', 'ופלים', 'קרקר',
    'קרקרים', 'פיצוחים', 'גרעינים', 'בוטנים', 'פיסטוק', 'מסטיק', 'טופי',
    'מרשמלו', 'קליק', 'פסק זמן', 'מקופלת', 'תות במבה', 'חטיף אנרגיה', 'חלבון',
    'צ׳יפס', 'תפוצ׳יפס', 'פרינגלס', 'נשנוש',
    'snack', 'chocolate', 'candy', 'cookie', 'biscuit', 'wafer', 'chips',
    'cracker', 'gum', 'sweets', 'peanut', 'pistachio', 'popcorn',
  ],

  beverages: [
    'מים', 'מים מינרלים', 'סודה', 'קולה', 'קוקה', 'פפסי', 'ספרייט', 'פאנטה',
    'מיץ', 'תרכיז', 'משקה', 'משקאות', 'אנרגיה', 'איס טי', 'נביעות', 'עין גדי',
    'פריגת', 'פרימור', 'טמפו', 'שוופס', 'סן פלגרינו', 'לימונענע', 'קפה קר',
    'water', 'cola', 'coke', 'pepsi', 'sprite', 'juice', 'soda', 'drink',
    'lemonade', 'iced tea', 'energy drink',
  ],

  alcohol: [
    'בירה', 'בירות', 'יין', 'יינות', 'ערק', 'וודקה', 'ויסקי', 'רום', 'ג׳ין',
    'טקילה', 'ליקר', 'קוניאק', 'ברנדי', 'שמפניה', 'פרוסקו', 'קברנה', 'מרלו',
    'שרדונה', 'גולדסטאר', 'טובורג', 'הייניקן', 'קורונה', 'מכבי בירה',
    'beer', 'wine', 'vodka', 'whiskey', 'whisky', 'rum', 'gin', 'tequila',
    'liqueur', 'champagne', 'prosecco', 'arak',
  ],

  baby: [
    'חיתול', 'חיתולים', 'מגבונים', 'תינוק', 'תינוקות', 'מטרנה', 'סימילק',
    'נוטרילון', 'פורמולה', 'מוצץ', 'בקבוק תינוק', 'מחית', 'גרבר', 'דייסה',
    'בייבי סיטר', 'משחת החתלה', 'שמיניות',
    'diaper', 'nappy', 'wipe', 'baby', 'formula', 'pacifier', 'puree',
  ],

  household: [
    'ניקוי', 'אקונומיקה', 'סבון כלים', 'נוזל כלים', 'כביסה', 'אבקת כביסה',
    'מרכך כביסה', 'נייר טואלט', 'מגבות נייר', 'מגבוני ניקוי', 'שקיות אשפה',
    'אשפה', 'ספוג', 'ספוגים', 'מטהר', 'ריח', 'סמרטוט', 'מגב', 'מטליות',
    'אבקת ריצוף', 'סנו', 'ניקול', 'בדין', 'אג׳קס', 'טאץ', 'נייר סופג',
    'שקיות', 'ניילון נצמד', 'נייר אפייה', 'אלומיניום',
    'clean', 'bleach', 'dish soap', 'laundry', 'softener', 'toilet paper',
    'paper towel', 'garbage', 'trash', 'sponge', 'detergent', 'foil',
  ],

  disposables: [
    'חד פעמי', 'חד-פעמי', 'צלחות', 'כוסות', 'סכום', 'מזלגות', 'סכינים חד',
    'כפיות', 'מפיות', 'קשיות', 'מגשים', 'כוסות חד', 'צלחות חד',
    'disposable', 'plates', 'cups', 'napkin', 'cutlery', 'straw',
  ],

  personal_care: [
    'שמפו', 'מרכך שיער', 'סבון', 'סבון גוף', 'משחת שיניים', 'מברשת שיניים',
    'חוט דנטלי', 'דאודורנט', 'תחבושות', 'טמפונים', 'קרם', 'קרם גוף', 'גילוח',
    'סכיני גילוח', 'אפטר שייב', 'בושם', 'לק', 'אקמול', 'נורופן', 'ויטמין',
    'אדוויל', 'פלסטר', 'מקלוני אוזניים', 'ג׳ל רחצה', 'קרם הגנה', 'ניר לחות',
    'shampoo', 'conditioner', 'soap', 'toothpaste', 'toothbrush', 'floss',
    'deodorant', 'pad', 'tampon', 'cream', 'shave', 'razor', 'vitamin',
    'sunscreen', 'lotion', 'perfume',
  ],
};

/** Flattened once at module load. Longer keywords are more specific. */
const ENTRIES = Object.entries(KEYWORDS)
  .flatMap(([category, words]) => words.map((word) => ({ category, word })))
  .sort((a, b) => b.word.length - a.word.length);

const normalize = (value) => String(value || '').toLowerCase().trim();

/** Drop a single attached Hebrew prefix so "הלחם" still matches "לחם". */
const stripPrefix = (word) =>
  (word.length > 3 && HEBREW_PREFIXES.test(word) ? word.slice(1) : word);

/**
 * How well one keyword matches one word. Higher is better, 0 is no match.
 *
 * The tiers are what stop a short stem from hijacking a longer word:
 * an exact word beats a prefix, and a prefix that leaves a long tail is
 * worth less than one that leaves none.
 */
const scoreWord = (word, keyword) => {
  if (!word || !keyword) return 0;
  if (word === keyword) return 1000 + keyword.length;

  const bare = stripPrefix(word);
  if (bare === keyword) return 900 + keyword.length;

  if (bare.startsWith(keyword)) {
    const tail = bare.length - keyword.length;
    // Hebrew inflections are short (ים, ות, י). A long tail means a different word.
    return tail <= 3 ? 600 + keyword.length - tail * 40 : 0;
  }

  // Mid-word matches are only trustworthy for long, distinctive keywords.
  if (keyword.length >= 5 && bare.includes(keyword)) return 200 + keyword.length;

  return 0;
};

/**
 * @param {string} name what the user typed
 * @returns {string|null} a category key, or null when nothing looks like a match
 */
export function guessCategory(name) {
  const text = normalize(name);
  if (text.length < 2) return null;

  // Multi-word keywords ("שמן זית", "olive oil") are checked against the whole
  // phrase; single words against each word of it.
  const words = text.split(/[\s,./-]+/).filter(Boolean);

  let best = { score: 0, category: null };

  for (const { category, word: keyword } of ENTRIES) {
    let score = 0;

    if (keyword.includes(' ')) {
      if (text.includes(keyword)) score = 1200 + keyword.length;
    } else {
      for (const word of words) {
        score = Math.max(score, scoreWord(word, keyword));
      }
    }

    if (score > best.score) best = { score, category };
  }

  return best.category;
}
