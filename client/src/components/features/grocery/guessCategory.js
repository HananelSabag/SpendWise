/**
 * Guess a supermarket category from what the user typed.
 *
 * Purely a convenience: adding an item should cost one field, so we pick the
 * aisle for you and leave the chip one tap away if the guess is wrong. Never
 * blocks or corrects the user, and an unknown word simply lands in "other".
 *
 * Hebrew first, because that's what gets typed here in practice. Matching is on
 * whole words (or a prefix, for Hebrew's attached prefixes like "ה"/"ו"), so
 * "בשר" doesn't match inside an unrelated longer word.
 */

const KEYWORDS = {
  produce: [
    'עגבני', 'מלפפון', 'חסה', 'גזר', 'בצל', 'שום', 'תפוח', 'בננ', 'תפוז', 'לימון',
    'אבוקדו', 'פלפל', 'תות', 'ענב', 'אבטיח', 'מלון', 'תרד', 'ברוקולי', 'כרוב',
    'קישוא', 'חציל', 'בטטה', 'תפוד', 'פטרוזיל', 'כוסבר', 'נענע', 'בזיליקום', 'פטרי',
    'ירק', 'פירות', 'סלרי', 'צנון', 'דלעת', 'אפרסק', 'אגס', 'שזיף', 'רימון', 'מנגו',
    'tomato', 'cucumber', 'lettuce', 'carrot', 'onion', 'garlic', 'apple', 'banana',
    'orange', 'lemon', 'avocado', 'pepper', 'strawberr', 'grape', 'watermelon',
    'melon', 'spinach', 'broccoli', 'cabbage', 'zucchini', 'eggplant', 'potato',
    'parsley', 'cilantro', 'mint', 'basil', 'mushroom', 'salad', 'fruit', 'veg',
  ],
  bakery: [
    'לחם', 'פית', 'חלה', 'לחמני', 'בגט', 'קרואסון', 'עוג', 'בורק', 'מאפה', 'טורטי',
    'באגט', 'רוגלך', 'פוקאצ',
    'bread', 'pita', 'challah', 'roll', 'baguette', 'croissant', 'cake', 'pastry',
    'tortilla', 'bun', 'bagel',
  ],
  dairy_eggs: [
    'חלב', 'גבינ', 'קוטג', 'יוגורט', 'שמנת', 'חמאה', 'ביצ', 'לבן', 'מעדן', 'צהוב',
    'מוצרלה', 'פטה', 'בולגרית', 'ריקוט', 'טופו',
    'milk', 'cheese', 'cottage', 'yogurt', 'yoghurt', 'cream', 'butter', 'egg',
    'mozzarella', 'feta', 'ricotta', 'tofu',
  ],
  meat_fish: [
    'בשר', 'עוף', 'הודו', 'שניצל', 'קציצ', 'נקניק', 'סלמון', 'טונה', 'דג', 'טחון',
    'אנטריקוט', 'כבד', 'פרגית', 'חזה', 'כנפי', 'שוק', 'המבורגר', 'קבב', 'דניס',
    'meat', 'chicken', 'turkey', 'schnitzel', 'sausage', 'salmon', 'tuna', 'fish',
    'beef', 'steak', 'lamb', 'burger', 'mince',
  ],
  pantry: [
    'אורז', 'פסטה', 'ספגטי', 'קמח', 'סוכר', 'מלח', 'שמן', 'חומץ', 'רוטב', 'קטשופ',
    'מיונז', 'חרדל', 'טחינה', 'חומוס', 'שימור', 'תירס', 'קטני', 'עדש', 'שעועית',
    'קוסקוס', 'בורגול', 'קינוא', 'שקד', 'אגוז', 'דבש', 'ריב', 'תבלין', 'פתית',
    'שוקולד למריחה', 'קפה', 'תה', 'סוכריות טחינה',
    'rice', 'pasta', 'spaghetti', 'flour', 'sugar', 'salt', 'oil', 'vinegar',
    'sauce', 'ketchup', 'mayo', 'mustard', 'tahini', 'hummus', 'canned', 'corn',
    'lentil', 'bean', 'couscous', 'quinoa', 'almond', 'nut', 'honey', 'jam',
    'spice', 'cereal', 'coffee', 'tea',
  ],
  frozen: [
    'קפוא', 'גליד', 'מלאווח', 'ג׳חנון', 'צ׳יפס', 'שקדי מרק', 'פיצה קפואה',
    'frozen', 'ice cream', 'icecream', 'fries', 'pizza',
  ],
  snacks_sweets: [
    'חטיף', 'ביסלי', 'במב', 'שוקולד', 'סוכרי', 'עוגי', 'ופל', 'צ׳יפס תפוחי',
    'קרקר', 'פיצוח', 'גרעינ', 'מסטיק', 'ממתק',
    'snack', 'chocolate', 'candy', 'cookie', 'biscuit', 'wafer', 'chips',
    'cracker', 'gum', 'sweets',
  ],
  beverages: [
    'מים', 'קול', 'משק', 'מיץ', 'סודה', 'בירה', 'יין', 'תרכיז', 'שתי', 'ספרייט',
    'water', 'cola', 'coke', 'juice', 'soda', 'beer', 'wine', 'drink', 'sprite',
  ],
  baby: [
    'חיתול', 'מגבונ', 'תינוק', 'מטרנ', 'סימילק', 'פורמול', 'מוצץ',
    'diaper', 'nappy', 'wipe', 'baby', 'formula', 'pacifier',
  ],
  household: [
    'ניקוי', 'אקונומיק', 'סבון כלים', 'כביס', 'מרכך', 'נייר טואלט', 'מגבת נייר',
    'שקית', 'אשפה', 'ספוג', 'מטהר', 'נוזל כלים', 'רצפ', 'סמרטוט',
    'clean', 'bleach', 'dish soap', 'laundry', 'softener', 'toilet paper',
    'paper towel', 'garbage', 'trash', 'sponge', 'detergent',
  ],
  personal_care: [
    'שמפו', 'מרכך שיער', 'סבון', 'משחת שיניים', 'מברשת שיניים', 'דאודורנט',
    'תחבוש', 'קרם', 'גילוח', 'אקמול', 'ויטמין',
    'shampoo', 'conditioner', 'soap', 'toothpaste', 'toothbrush', 'deodorant',
    'pad', 'tampon', 'cream', 'shave', 'vitamin',
  ],
};

// Longest keyword first so "סבון כלים" wins over "סבון".
const ENTRIES = Object.entries(KEYWORDS)
  .flatMap(([category, words]) => words.map((word) => ({ category, word })))
  .sort((a, b) => b.word.length - a.word.length);

/**
 * @param {string} name what the user typed
 * @returns {string|null} a category key, or null when nothing looks like a match
 */
export function guessCategory(name) {
  const text = String(name || '').toLowerCase().trim();
  if (text.length < 2) return null;

  const match = ENTRIES.find(({ word }) => text.includes(word));
  return match ? match.category : null;
}
