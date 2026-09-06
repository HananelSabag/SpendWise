/**
 * The Family Hub's vocabulary — the canonical, language-neutral keys.
 *
 * These three lists are the contract between the database CHECK constraints
 * (migration 43), this API, and the client's mirror in
 * `client/src/components/features/family/familyMeta.js`. Labels are translations
 * and live only in the client; a Hebrew word must never become an identifier.
 *
 * A parity test asserts these match the migration exactly, so widening a list
 * means touching both places or the suite fails.
 */

/** What a monthly row does to the month. */
const ITEM_KINDS = ['income', 'fixed', 'variable', 'loan', 'savings'];

/** How rows are grouped for reading. Income rows use the first three. */
const CATEGORY_KEYS = [
  'salary', 'benefits', 'other_income',
  'housing', 'utilities', 'kids', 'food', 'transport',
  'insurance', 'health', 'communication', 'subscriptions',
  'leisure', 'debt', 'savings', 'other',
];

/** What kind of pot a balance is. */
const BALANCE_KINDS = ['savings', 'pension', 'study_fund', 'investment', 'emergency', 'other'];

const DEFAULT_CATEGORY = 'other';

const isItemKind = (value) => ITEM_KINDS.includes(String(value));
const isCategory = (value) => CATEGORY_KEYS.includes(String(value));
const isBalanceKind = (value) => BALANCE_KINDS.includes(String(value));

module.exports = {
  ITEM_KINDS,
  CATEGORY_KEYS,
  BALANCE_KINDS,
  DEFAULT_CATEGORY,
  isItemKind,
  isCategory,
  isBalanceKind,
};
