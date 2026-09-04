/**
 * Supermarket categories, in aisle order.
 *
 * The `key` is the value stored in the database (`grocery_items.category_key`)
 * and mirrors `server/services/groceryCategories.js` — changing one means
 * changing the other and the CHECK constraint in migration 40.
 *
 * Labels live in `translations/{en,he}/grocery.js` under `categories.<key>`.
 * Nothing here is a display string, on purpose.
 */

import {
  Apple, Croissant, Milk, Fish, Wheat, Snowflake,
  Candy, CupSoda, Baby, SprayCan, Sparkles, Package,
} from 'lucide-react';

export const GROCERY_CATEGORIES = [
  { key: 'produce',       icon: Apple,     tint: 'text-emerald-600 dark:text-emerald-400', chip: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { key: 'bakery',        icon: Croissant, tint: 'text-amber-600 dark:text-amber-400',     chip: 'bg-amber-50 dark:bg-amber-500/10' },
  { key: 'dairy_eggs',    icon: Milk,      tint: 'text-sky-600 dark:text-sky-400',         chip: 'bg-sky-50 dark:bg-sky-500/10' },
  { key: 'meat_fish',     icon: Fish,      tint: 'text-rose-600 dark:text-rose-400',       chip: 'bg-rose-50 dark:bg-rose-500/10' },
  { key: 'pantry',        icon: Wheat,     tint: 'text-orange-600 dark:text-orange-400',   chip: 'bg-orange-50 dark:bg-orange-500/10' },
  { key: 'frozen',        icon: Snowflake, tint: 'text-cyan-600 dark:text-cyan-400',       chip: 'bg-cyan-50 dark:bg-cyan-500/10' },
  { key: 'snacks_sweets', icon: Candy,     tint: 'text-pink-600 dark:text-pink-400',       chip: 'bg-pink-50 dark:bg-pink-500/10' },
  { key: 'beverages',     icon: CupSoda,   tint: 'text-indigo-600 dark:text-indigo-400',   chip: 'bg-indigo-50 dark:bg-indigo-500/10' },
  { key: 'baby',          icon: Baby,      tint: 'text-violet-600 dark:text-violet-400',   chip: 'bg-violet-50 dark:bg-violet-500/10' },
  { key: 'household',     icon: SprayCan,  tint: 'text-teal-600 dark:text-teal-400',       chip: 'bg-teal-50 dark:bg-teal-500/10' },
  { key: 'personal_care', icon: Sparkles,  tint: 'text-fuchsia-600 dark:text-fuchsia-400', chip: 'bg-fuchsia-50 dark:bg-fuchsia-500/10' },
  { key: 'other',         icon: Package,   tint: 'text-gray-500 dark:text-gray-400',       chip: 'bg-gray-100 dark:bg-gray-700/40' },
];

export const CATEGORY_BY_KEY = Object.fromEntries(
  GROCERY_CATEGORIES.map((category) => [category.key, category])
);

export const DEFAULT_CATEGORY = 'other';

/** Aisle position. Unknown keys sort last rather than crashing the sort. */
export const categoryOrder = (key) => {
  const index = GROCERY_CATEGORIES.findIndex((category) => category.key === key);
  return index === -1 ? GROCERY_CATEGORIES.length : index;
};

export const GROCERY_UNITS = ['unit', 'kg', 'g', 'l', 'ml', 'pack', 'box', 'bottle', 'bag'];
