/**
 * Grocery category keys — language-neutral domain identifiers.
 *
 * The order here IS the aisle order the active list renders in. Display labels
 * live in the client translation files (`translations/{en,he}/grocery.js`);
 * never store a translated label in the database.
 *
 * The same list is duplicated as a CHECK constraint on `grocery_items`
 * (migration 40). Adding a category means changing both.
 */

const CATEGORY_KEYS = [
  'produce',
  'bakery',
  'dairy_eggs',
  'meat_fish',
  'pantry',
  'frozen',
  'snacks_sweets',
  'beverages',
  'alcohol',
  'baby',
  'household',
  'disposables',
  'personal_care',
  'other',
];

const CATEGORY_SET = new Set(CATEGORY_KEYS);

const DEFAULT_CATEGORY = 'other';

/** Aisle position, 0-based. Unknown keys sort last. */
const categoryOrder = (key) => {
  const index = CATEGORY_KEYS.indexOf(key);
  return index === -1 ? CATEGORY_KEYS.length : index;
};

const isValidCategory = (key) => CATEGORY_SET.has(key);

/** Units are free-form but capped to a known set so the UI stays predictable. */
const UNIT_KEYS = ['unit', 'kg', 'g', 'l', 'ml', 'pack', 'box', 'bottle', 'bag'];
const UNIT_SET = new Set(UNIT_KEYS);
const isValidUnit = (key) => UNIT_SET.has(key);

module.exports = {
  CATEGORY_KEYS,
  DEFAULT_CATEGORY,
  UNIT_KEYS,
  categoryOrder,
  isValidCategory,
  isValidUnit,
};
