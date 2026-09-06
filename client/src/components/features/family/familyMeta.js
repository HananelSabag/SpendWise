/**
 * Family Hub vocabulary — the client mirror of `server/services/familyTaxonomy.js`.
 *
 * The keys here are the contract with the database CHECK constraints; the words
 * a person reads live in `translations/{en,he}/family.js`. Never let a Hebrew
 * label become an identifier.
 *
 * Colours carry meaning and are used consistently across the page:
 *   emerald = money arriving          rose    = committed and unavoidable
 *   amber   = flexible, their choice   violet  = debt
 *   sky     = money kept on purpose    indigo  = the leftover, the headline
 */

import {
  Baby, Banknote, Building2, Car, Coins, CreditCard, GraduationCap, HeartPulse,
  Home, Landmark, PiggyBank, Repeat, Shield, ShoppingCart, Smartphone, Sparkles,
  Ticket, TrendingUp, Umbrella, Wallet, Zap,
} from 'lucide-react';

/** The five things a monthly row can be, in the order the page reads them. */
export const ITEM_KINDS = ['income', 'fixed', 'loan', 'savings', 'variable'];

export const KIND_META = {
  income:   { icon: Banknote,    tone: 'emerald', defaultCategory: 'salary' },
  fixed:    { icon: Repeat,      tone: 'rose',    defaultCategory: 'housing' },
  loan:     { icon: Landmark,    tone: 'violet',  defaultCategory: 'debt' },
  savings:  { icon: PiggyBank,   tone: 'sky',     defaultCategory: 'savings' },
  variable: { icon: ShoppingCart, tone: 'amber',  defaultCategory: 'food' },
};

export const CATEGORY_KEYS = [
  'salary', 'benefits', 'other_income',
  'housing', 'utilities', 'kids', 'food', 'transport',
  'insurance', 'health', 'communication', 'subscriptions',
  'leisure', 'debt', 'savings', 'other',
];

export const CATEGORY_ICONS = {
  salary: Banknote,
  benefits: Coins,
  other_income: Wallet,
  housing: Home,
  utilities: Zap,
  kids: Baby,
  food: ShoppingCart,
  transport: Car,
  insurance: Shield,
  health: HeartPulse,
  communication: Smartphone,
  subscriptions: Ticket,
  leisure: Sparkles,
  debt: Landmark,
  savings: PiggyBank,
  other: CreditCard,
};

/** Which categories make sense for which kind — keeps the picker short. */
export const CATEGORIES_FOR_KIND = {
  income: ['salary', 'benefits', 'other_income'],
  fixed: ['housing', 'utilities', 'kids', 'insurance', 'health', 'communication',
          'subscriptions', 'transport', 'other'],
  variable: ['food', 'transport', 'leisure', 'kids', 'health', 'other'],
  loan: ['debt'],
  savings: ['savings'],
};

export const BALANCE_KINDS = ['savings', 'pension', 'study_fund', 'investment', 'emergency', 'other'];

export const BALANCE_META = {
  savings:    { icon: PiggyBank,     tone: 'sky' },
  pension:    { icon: Umbrella,      tone: 'indigo' },
  study_fund: { icon: GraduationCap, tone: 'emerald' },
  investment: { icon: TrendingUp,    tone: 'violet' },
  emergency:  { icon: Shield,        tone: 'amber' },
  other:      { icon: Building2,     tone: 'slate' },
};

/**
 * One-tap starters for the first sit-down.
 *
 * They fill in a NAME and a CATEGORY and nothing else — the amount is always
 * theirs to type. A screen whose whole purpose is an honest picture must never
 * pre-fill a number nobody verified.
 */
export const SUGGESTIONS = {
  income: [
    { key: 'salary', category: 'salary' },
    { key: 'partnerSalary', category: 'salary' },
    { key: 'childAllowance', category: 'benefits' },
    { key: 'sideIncome', category: 'other_income' },
  ],
  fixed: [
    { key: 'mortgage', category: 'housing' },
    { key: 'rent', category: 'housing' },
    { key: 'arnona', category: 'housing' },
    { key: 'electricity', category: 'utilities' },
    { key: 'water', category: 'utilities' },
    { key: 'gas', category: 'utilities' },
    { key: 'buildingFee', category: 'housing' },
    { key: 'daycare', category: 'kids' },
    { key: 'healthInsurance', category: 'insurance' },
    { key: 'carInsurance', category: 'insurance' },
    { key: 'homeInsurance', category: 'insurance' },
    { key: 'internet', category: 'communication' },
    { key: 'cellular', category: 'communication' },
    { key: 'subscriptions', category: 'subscriptions' },
  ],
  variable: [
    { key: 'groceries', category: 'food' },
    { key: 'fuel', category: 'transport' },
    { key: 'eatingOut', category: 'leisure' },
    { key: 'pharmacy', category: 'health' },
    { key: 'clothing', category: 'other' },
  ],
  loan: [
    { key: 'bankLoan', category: 'debt' },
    { key: 'carLoan', category: 'debt' },
    { key: 'creditLoan', category: 'debt' },
  ],
  savings: [
    { key: 'monthlySaving', category: 'savings' },
    { key: 'kidsSaving', category: 'savings' },
  ],
};

/** Tailwind classes per tone, written out so the JIT compiler can see them. */
export const TONE = {
  emerald: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-900',
    bar: 'bg-emerald-500',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  },
  rose: {
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-900',
    bar: 'bg-rose-500',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
  },
  violet: {
    text: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-900',
    bar: 'bg-violet-500',
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  },
  sky: {
    text: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    border: 'border-sky-200 dark:border-sky-900',
    bar: 'bg-sky-500',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  },
  amber: {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-900',
    bar: 'bg-amber-500',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  },
  indigo: {
    text: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-200 dark:border-indigo-900',
    bar: 'bg-indigo-500',
    chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
  },
  slate: {
    text: 'text-slate-600 dark:text-slate-300',
    bg: 'bg-slate-50 dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-800',
    bar: 'bg-slate-400',
    chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
};

/** The bucket key a row belongs to. NULL owner is "joint" — a real answer. */
export const ownerKey = (row) => (row?.owner_user_id == null ? 'joint' : String(row.owner_user_id));
