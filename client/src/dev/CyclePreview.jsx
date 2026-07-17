/**
 * Dev-only visual harness for the financial cycle UI.
 *
 * The dashboard sits behind Google auth, so the components cannot be driven headlessly.
 * This mounts them standalone with the exact payload GET /api/v1/cycles returns, which makes
 * layout, RTL and dark mode reviewable without anyone's credentials. Served from
 * /preview.html and never part of the app bundle (Vite only builds index.html).
 *
 * `liveCycle.json` holds a real user's salary, employer and debts, so it is gitignored and
 * absent on a fresh clone. Regenerate it against your own local server before opening this:
 *
 *   node -e "const s=require('./server/services/cycleService'),d=require('./server/config/db');
 *   s.getFinancialCycles(1).then(r=>{require('fs').writeFileSync(
 *     'client/src/dev/liveCycle.json', JSON.stringify({status:r.status,cycle:r.current,
 *     salaryTracking:r.salaryTracking,totalOutstanding:r.totalOutstanding},null,1));
 *   }).finally(()=>d.pool.end())"
 */

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../index.css';
import FinancialCycleCard from '../components/features/dashboard/FinancialCycleCard';
// Captured verbatim from GET /api/v1/cycles/current against the real database, so what
// renders here is the actual end of the chain rather than numbers typed by hand.
import liveCycle from './liveCycle.json';

const formatCurrency = (value) => `₪${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const EN = {
  'cycle.title': 'This financial cycle', 'cycle.hint': 'From your salary to the next one', 'cycle.soFar': 'so far',
  'cycle.income': 'Income', 'cycle.expenses': 'Expenses', 'cycle.operatingNet': 'Net — how you are living',
  'cycle.deficitHint': 'You are spending more than you earn', 'cycle.surplusHint': 'You earned more than you spent',
  'cycle.financing': 'Borrowed this cycle', 'cycle.financingHint': 'It covered the gap — and you pay it back',
  'cycle.bankMovement': 'What the account actually did', 'cycle.stillExpected': 'Still expected before your next salary',
  'cycle.projectedEnd': 'Estimated end of cycle', 'cycle.outstanding': 'Open debt', 'cycle.openDetails': 'Full breakdown',
  'cycle.salaryLate': 'Your salary has not come in yet — keep an eye on it.',
  'cycle.linkSalaryTitle': 'Link your salary to see your cycle',
  'cycle.linkSalaryHint': 'Your financial cycle runs from one salary to the next. Point us at your salary once and we take it from there.',
  'cycle.linkSalaryCta': 'Link salary',
};

const HE = {
  'cycle.title': 'המחזור הפיננסי הנוכחי', 'cycle.hint': 'מהמשכורת שלך ועד הבאה', 'cycle.soFar': 'עד עכשיו',
  'cycle.income': 'הכנסות', 'cycle.expenses': 'הוצאות', 'cycle.operatingNet': 'נטו — איך אתה באמת חי',
  'cycle.deficitHint': 'אתה מוציא יותר ממה שנכנס', 'cycle.surplusHint': 'הכנסת יותר ממה שהוצאת',
  'cycle.financing': 'נלקח כהלוואה במחזור', 'cycle.financingHint': 'זה כיסה את הפער — ואתה מחזיר את זה',
  'cycle.bankMovement': 'מה שבאמת קרה בחשבון', 'cycle.stillExpected': 'עוד צפוי לפני המשכורת הבאה',
  'cycle.projectedEnd': 'שערוך סוף מחזור', 'cycle.outstanding': 'חוב פתוח', 'cycle.openDetails': 'פירוט מלא',
  'cycle.salaryLate': 'המשכורת שלך עוד לא נכנסה — שים לב.',
  'cycle.linkSalaryTitle': 'קשר את המשכורת כדי לראות את המחזור',
  'cycle.linkSalaryHint': 'המחזור הפיננסי שלך רץ ממשכורת למשכורת. תראה לנו את המשכורת פעם אחת — ומכאן אנחנו ממשיכים.',
  'cycle.linkSalaryCta': 'קשר משכורת',
};

/** The real running cycle for user 1 as the API returns it (spec §7). */
const CYCLE = {
  window: { index: 0, start: '2026-07-09', end: '2026-08-09', running: true, projectedEnd: true, salary: { date: '2026-07-09', amount: 13327.75, description: 'הורייזן טכנו-י' } },
  income: { salary: 13327.75, other: 0, total: 13327.75 },
  expenses: { cards: 16601.79, direct: 2209.38, total: 18811.17, events: [] },
  operatingNet: -5483.42,
  financing: { total: 12805.22, count: 1 },
  bankMovement: 7321.8,
  projection: {
    upcoming: [
      { kind: 'recurring', date: '2026-07-26', amount: -1098.85, label: 'פרעון הלוואה', certainty: 'estimated' },
      { kind: 'recurring', date: '2026-08-01', amount: -73.01, label: 'טפחות ס.ביטו-י', certainty: 'estimated' },
    ],
    upcomingTotal: -1171.86,
    projectedOperatingNet: -6655.28,
    estimate: true,
  },
  needsReview: [], reversals: [], partials: [], cards: [],
};

/** A healthy month: no borrowing, salary covers the spending. */
const SURPLUS = {
  ...CYCLE,
  income: { salary: 13327.75, other: 1250, total: 14577.75 },
  expenses: { cards: 6100.2, direct: 2209.38, total: 8309.58, events: [] },
  operatingNet: 6268.17,
  financing: { total: 0, count: 0 },
  bankMovement: 6268.17,
  projection: null,
};

function Panel({ title, children }) {
  return (
    <div className="w-full max-w-md">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">{title}</p>
      {children}
    </div>
  );
}

function Preview() {
  const [lang, setLang] = useState('he');
  const [dark, setDark] = useState(false);
  const dict = lang === 'he' ? HE : EN;
  const t = (key, options) => dict[key] || (options && options.fallback) || key;

  return (
    <div className={dark ? 'dark' : ''}>
      <div dir={lang === 'he' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-100 p-6 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex gap-2">
            <button onClick={() => setLang(lang === 'he' ? 'en' : 'he')} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white">{lang === 'he' ? 'EN' : 'עברית'}</button>
            <button onClick={() => setDark(!dark)} className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-bold text-white dark:bg-gray-200 dark:text-gray-900">{dark ? 'Light' : 'Dark'}</button>
          </div>
          <div className="flex flex-wrap gap-6">
            <Panel title="LIVE — straight from GET /api/v1/cycles/current">
              <FinancialCycleCard
                cycle={liveCycle.cycle}
                salaryTracking={liveCycle.salaryTracking}
                totalOutstanding={liveCycle.totalOutstanding}
                formatCurrency={formatCurrency}
                t={t}
                language={lang}
                onOpenCycle={() => {}}
              />
            </Panel>
            <Panel title="deficit + borrowed (real data)">
              <FinancialCycleCard cycle={CYCLE} formatCurrency={formatCurrency} t={t} language={lang} totalOutstanding={36828.21} onOpenCycle={() => {}} />
            </Panel>
            <Panel title="salary late">
              <FinancialCycleCard cycle={CYCLE} salaryTracking={{ status: 'late', daysLate: 7 }} formatCurrency={formatCurrency} t={t} language={lang} totalOutstanding={36828.21} onOpenCycle={() => {}} />
            </Panel>
            <Panel title="surplus, nothing borrowed">
              <FinancialCycleCard cycle={SURPLUS} formatCurrency={formatCurrency} t={t} language={lang} onOpenCycle={() => {}} />
            </Panel>
            <Panel title="no salary linked">
              <FinancialCycleCard needsSalaryLink cycle={null} formatCurrency={formatCurrency} t={t} language={lang} onLinkSalary={() => {}} />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('preview-root')).render(<Preview />);
