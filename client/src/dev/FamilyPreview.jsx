/**
 * Dev-only visual harness for the Family Hub UI.
 *
 * The page sits behind Google auth, so it cannot be driven headlessly. This
 * mounts its three panels standalone with the exact shape GET /api/v1/family/overview
 * returns, which makes layout, RTL and dark mode reviewable without anyone's
 * credentials. Served from /family-preview.html and never part of the app bundle
 * (Vite only builds index.html).
 *
 * It imports the REAL en/he `family` translations, so a missing or
 * English-leaking key shows up here exactly as it would in the app.
 *
 * The fixture is synthetic. No real salary, balance or debt belongs in this file.
 */

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../index.css';
import enFamily from '../translations/en/family';
import heFamily from '../translations/he/family';
import FamilyOverviewPanel from '../components/features/family/FamilyOverviewPanel';
import FamilyFlowPanel from '../components/features/family/FamilyFlowPanel';
import FamilyAssetsPanel from '../components/features/family/FamilyAssetsPanel';

const formatCurrency = (value) =>
  `₪${Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

/** Resolve a dotted key against the real translation tree and interpolate {{count}} etc. */
function makeT(dict) {
  return (key, opts = {}) => {
    const node = key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict);
    let value = typeof node === 'string' ? node : (opts.fallback != null ? opts.fallback : key);
    if (typeof value === 'string') value = value.replace(/\{\{(\w+)\}\}/g, (_, k) => (opts[k] != null ? opts[k] : ''));
    return value;
  };
}

const MEMBERS = [
  { id: 1, name: 'חננאל', email: 'a@example.com' },
  { id: 44, name: 'נופר', email: 'b@example.com' },
];

const row = (id, over) => ({
  id, kind: 'fixed', name: '', amount: 0, owner_user_id: null,
  category_key: 'other', is_active: true, ...over,
});

const ITEMS = [
  row(1, { kind: 'income', name: 'משכורת', amount: 13000, owner_user_id: 1, category_key: 'salary', charge_day: 9 }),
  row(2, { kind: 'income', name: 'משכורת', amount: 9000, owner_user_id: 44, category_key: 'salary', charge_day: 1 }),
  row(3, { kind: 'income', name: 'קצבת ילדים', amount: 190, owner_user_id: 44, category_key: 'benefits' }),
  row(4, { kind: 'fixed', name: 'משכנתא', amount: 4500, owner_user_id: 44, category_key: 'housing', charge_day: 1 }),
  row(5, { kind: 'fixed', name: 'מעון', amount: 3000, owner_user_id: 1, category_key: 'kids', charge_day: 10 }),
  row(6, { kind: 'fixed', name: 'ארנונה', amount: 620, owner_user_id: 1, category_key: 'housing' }),
  row(7, { kind: 'fixed', name: 'חשמל, מים וגז', amount: 900, category_key: 'utilities' }),
  row(8, { kind: 'fixed', name: 'ביטוח בריאות לכל המשפחה', amount: 480, owner_user_id: 1, category_key: 'insurance' }),
  row(9, { kind: 'fixed', name: 'סלולר ואינטרנט', amount: 260, category_key: 'communication', is_active: false }),
  row(10, { kind: 'loan', name: 'הלוואה מהבנק', amount: 1500, owner_user_id: 1, category_key: 'debt', lender: 'לאומי', outstanding_amount: 21000, payments_left: 14, end_date: '2027-11-01' }),
  row(11, { kind: 'loan', name: 'הלוואת רכב', amount: 1000, owner_user_id: 1, category_key: 'debt', lender: 'מזרחי', outstanding_amount: 14000 }),
  row(12, { kind: 'savings', name: 'חיסכון חודשי', amount: 500, category_key: 'savings' }),
  row(13, { kind: 'variable', name: 'קניות סופר', amount: 3000, category_key: 'food' }),
  row(14, { kind: 'variable', name: 'דלק', amount: 800, owner_user_id: 1, category_key: 'transport' }),
];

const BALANCES = [
  { id: 1, kind: 'pension', name: 'פנסיה', amount: 120000, owner_user_id: 1, institution: 'מגדל', monthly_contribution: 1800, as_of: '2026-09-01', is_active: true },
  { id: 2, kind: 'pension', name: 'פנסיה', amount: 80000, owner_user_id: 44, institution: 'כלל', monthly_contribution: 1200, is_active: true },
  { id: 3, kind: 'study_fund', name: 'קרן השתלמות', amount: 45000, owner_user_id: 1, institution: 'אלטשולר', is_active: true },
  { id: 4, kind: 'savings', name: 'חיסכון משותף', amount: 25000, institution: 'לאומי', as_of: '2026-08-15', is_active: true },
];

// The same arithmetic the server does, inlined so the harness needs no API.
const SUMMARY = (() => {
  const active = ITEMS.filter((r) => r.is_active !== false);
  const sum = (kind) => active.filter((r) => r.kind === kind).reduce((t, r) => t + r.amount, 0);
  const income = sum('income'); const fixed = sum('fixed');
  const loans = sum('loan'); const savings = sum('savings'); const variable = sum('variable');
  const committed = fixed + loans + savings;
  const people = ['1', '44', 'joint'].map((key) => {
    const owned = active.filter((r) => String(r.owner_user_id ?? 'joint') === key);
    const kind = (k) => owned.filter((r) => r.kind === k).reduce((t, r) => t + r.amount, 0);
    const personCommitted = kind('fixed') + kind('loan') + kind('savings');
    return {
      key,
      userId: key === 'joint' ? null : Number(key),
      name: MEMBERS.find((m) => String(m.id) === key)?.name || null,
      income: kind('income'),
      fixed: kind('fixed'),
      loan: kind('loan'),
      savings: kind('savings'),
      variable: kind('variable'),
      committed: personCommitted,
      available: kind('income') - personCommitted,
    };
  });
  const assetsTotal = BALANCES.reduce((t, b) => t + b.amount, 0);
  const debtTotal = active.filter((r) => r.kind === 'loan')
    .reduce((t, r) => t + (r.outstanding_amount || 0), 0);
  return {
    monthly: {
      income, fixed, loans, savings, committed,
      available: income - committed,
      variablePlanned: variable,
      projected: income - committed - variable,
      committedRatio: income > 0 ? Math.min(1, committed / income) : null,
    },
    people,
    assets: {
      total: assetsTotal,
      byKind: { pension: 200000, study_fund: 45000, savings: 25000 },
      byOwner: { 1: 165000, 44: 80000, joint: 25000 },
      monthlyContributions: 3000,
    },
    debt: { total: debtTotal, loansMissingBalance: 0 },
    netWorth: assetsTotal - debtTotal,
    counts: { items: ITEMS.length, activeItems: active.length, balances: BALANCES.length, activeBalances: BALANCES.length },
  };
})();

const TABS = ['overview', 'flow', 'assets'];

function Preview() {
  const [lang, setLang] = useState('he');
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState('overview');
  const t = makeT(lang === 'he' ? heFamily : enFamily);

  useEffect(() => {
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.classList.toggle('dark', dark);
  }, [lang, dark]);

  const noop = () => {};

  return (
    <div className={`min-h-screen ${dark ? 'dark' : ''}`}>
      <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex flex-wrap gap-2">
            <button onClick={() => setLang(lang === 'he' ? 'en' : 'he')} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white">{lang.toUpperCase()}</button>
            <button onClick={() => setDark(!dark)} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white">{dark ? 'dark' : 'light'}</button>
            {TABS.map((id) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${tab === id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
              >
                {t(`tabs.${id}`)}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <FamilyOverviewPanel
              summary={SUMMARY}
              members={MEMBERS}
              formatCurrency={formatCurrency}
              t={t}
              hasRows
              onGoToFlow={() => setTab('flow')}
              onGoToAssets={() => setTab('assets')}
              onAddFirst={noop}
            />
          )}

          {tab === 'flow' && (
            <FamilyFlowPanel
              items={ITEMS}
              members={MEMBERS}
              formatCurrency={formatCurrency}
              t={t}
              onAdd={noop}
              onEdit={noop}
            />
          )}

          {tab === 'assets' && (
            <FamilyAssetsPanel
              balances={BALANCES}
              loans={ITEMS.filter((i) => i.kind === 'loan')}
              summary={SUMMARY}
              members={MEMBERS}
              formatCurrency={formatCurrency}
              t={t}
              language={lang}
              onAddBalance={noop}
              onEditBalance={noop}
            />
          )}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('preview-root')).render(<Preview />);
