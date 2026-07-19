/**
 * Dev-only visual harness for the financial cycle UI.
 *
 * The dashboard sits behind Google auth, so the components cannot be driven headlessly.
 * This mounts them standalone with the exact payload GET /api/v1/cycles returns, which makes
 * layout, RTL and dark mode reviewable without anyone's credentials. Served from
 * /preview.html and never part of the app bundle (Vite only builds index.html).
 *
 * It now imports the REAL en/he dashboard translations (not a hand-kept subset), so a missing
 * or English-leaking key shows up here exactly as it would in the app.
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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '../index.css';
import enDash from '../translations/en/dashboard';
import heDash from '../translations/he/dashboard';
import FinancialCycleCard from '../components/features/dashboard/FinancialCycleCard';
import CycleOverviewTab from '../components/features/insights/CycleOverviewTab';
import CycleCardsTab from '../components/features/insights/CycleCardsTab';
import CycleControlTab from '../components/features/insights/CycleControlTab';
// Captured verbatim from GET /api/v1/cycles/current against the real database, so what
// renders here is the actual end of the chain rather than numbers typed by hand.
import liveCycle from './liveCycle.json';

const formatCurrency = (value) => `₪${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const previewQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});
previewQueryClient.setQueryData(['merchantWatches'], { rules: [], matches: [] });

/** Resolve a dotted key against the real translation tree and interpolate {{count}} etc. */
function makeT(dict) {
  return (key, opts = {}) => {
    const node = key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict);
    let value = typeof node === 'string' ? node : (opts.fallback != null ? opts.fallback : key);
    if (typeof value === 'string') value = value.replace(/\{\{(\w+)\}\}/g, (_, k) => (opts[k] != null ? opts[k] : ''));
    return value;
  };
}

const mkTxns = (rows) => rows.map(([id, date, description, amount, extra = {}]) => ({ id, date, processedDate: date, description, amount, pending: false, currency: null, installments: null, ...extra }));

/** The real running cycle for user 1 as the API returns it, now with card events + provenance. */
const CYCLE = {
  window: { index: 0, start: '2026-07-09', end: '2026-08-09', running: true, projectedEnd: true, salary: { date: '2026-07-09', amount: 13327.75, description: 'הורייזן טכנו-י' } },
  income: { salary: 13327.75, other: 0, total: 13327.75, items: mkTxns([[900, '2026-07-09', 'הורייזן טכנולוגיות משכורת', 13327.75]]) },
  expenses: {
    cards: 15618.41,
    direct: 2209.38,
    total: 17827.79,
    events: [
      { chargeDate: '2026-07-10', total: -12805.22, count: 81, class: 'statement', source: 'max', accountNumber: '2254', partial: false, future: false, txns: mkTxns([
        [11, '2026-07-05', 'שופרסל דיל גילה', -247.90], [12, '2026-07-06', 'רמי לוי', -389.20], [13, '2026-07-04', 'ALIEXPRESS', -384.95, { currency: 'USD' }],
        [14, '2026-07-03', 'פז יעלים', -300.00], [15, '2026-07-02', 'נטפליקס', -55.90, { installments: { number: 1, total: 12 } }],
      ]) },
      { chargeDate: '2026-07-08', total: -147.99, count: 3, class: 'immediate', source: 'max', accountNumber: '2254', partial: false, future: false, txns: mkTxns([
        [21, '2026-07-08', 'Google Cloud', -62.32, { currency: 'USD' }], [22, '2026-07-08', 'OpenAI', -32.00, { currency: 'USD' }], [23, '2026-07-08', 'Anthropic', -53.67, { currency: 'USD' }],
      ]) },
      { chargeDate: '2026-07-10', total: -2665.20, count: 20, class: 'statement', source: 'visa_cal', accountNumber: '9962', partial: false, future: false, txns: mkTxns([
        [31, '2026-07-01', 'סופר פארם', -132.40], [32, '2026-07-03', 'ארומה', -46.00], [33, '2026-07-05', 'דלק', -300.00],
      ]) },
      { chargeDate: '2026-07-02', total: -1200.00, count: 7, class: 'immediate', source: 'max', accountNumber: '8345', partial: false, future: false, txns: mkTxns([
        [41, '2026-07-02', 'שופרסל דיל', -320.00], [42, '2026-07-02', 'קפה', -18.00], [43, '2026-07-02', 'החזר', 61.41], [44, '2026-07-02', 'ALIEXPRESS', -140.20, { currency: 'USD' }],
      ]) },
    ],
    directItems: mkTxns([[51, '2026-07-11', 'פרעון הלוואה', -1046.45], [52, '2026-07-10', 'טפחות ס.ביטו-י', -73.01], [53, '2026-07-06', 'משיכת מזומן', -1089.92]]),
  },
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
  needsReview: [], reversals: [], partials: [],
  unreconciledCardEvents: [],
  // The running cycle is a forward reset: what still has to enter/leave before the household
  // reset completes. Captured shape from GET /api/v1/cycles/current (migration 33+).
  forwardReset: {
    mode: 'automatic', status: 'open', completionDate: '2026-08-10',
    expectedIncoming: 13327.75, knownCardOut: 2823.79, estimatedCardOut: 15470.42,
    estimatedFixedOut: 1171.86, knownNetChange: -2823.79, estimatedNetChange: 685.47,
    stages: [
      { kind: 'recurring', date: '2026-07-26', amount: -1098.85, label: 'פרעון הלוואה' },
      { kind: 'recurring', date: '2026-08-01', amount: -73.01, label: 'טפחות ס.ביטו-י' },
      { kind: 'income', date: '2026-08-09', amount: 13327.75, label: 'הורייזן טכנו', primary: true },
      { kind: 'card', date: '2026-08-10', amount: -2823.79, estimatedAmount: -15470.42, label: 'MAX ••••2254' },
      { kind: 'card', date: '2026-08-10', amount: -1200.00, estimatedAmount: -2665.20, label: 'CAL ••••9962', primary: false },
    ],
  },
  nextCardForecast: {
    salaryAmount: 13327.75, knownTotal: 2823.79, estimatedTotal: 15470.42,
    bills: [
      { source: 'max', accountNumber: '2254', chargeDate: '2026-08-10', knownAmount: 1823.79, estimatedAmount: 12805.22, historyCount: 3 },
      { source: 'visa_cal', accountNumber: '9962', chargeDate: '2026-08-10', knownAmount: 1000.00, estimatedAmount: 2665.20, historyCount: 3 },
    ],
  },
  cards: [
    { source: 'max', accountNumber: '2254', settlement: { mode: 'aggregated' }, statementDay: { certain: true, day: 10 } },
    { source: 'visa_cal', accountNumber: '9962', settlement: { mode: 'aggregated' }, statementDay: { certain: true, day: 10 } },
    { source: 'max', accountNumber: '8345', settlement: { mode: 'passthrough' }, statementDay: { certain: false } },
  ],
};

/** A partial (incomplete) cycle — the oldest statement is excluded, so figures understate reality. */
const PARTIAL = {
  ...CYCLE,
  window: { ...CYCLE.window, start: '2026-05-09', end: '2026-06-09', running: false, projectedEnd: false },
  operatingNet: -9288.12,
  financing: { total: 0, count: 0 },
  bankMovement: -9288.12,
  projection: null,
  partials: [{ chargeDate: '2026-05-10', total: -9468.19, count: 60, class: 'statement', source: 'max', accountNumber: '2254', partial: true, future: false, txns: [] }],
};

const CONTROL_CYCLE = {
  ...CYCLE,
  decisions: Array.from({ length: 19 }, (_, index) => {
    const positive = index % 5 === 0;
    const salary = index === 0;
    const excluded = index % 7 === 0 && !salary;
    return {
      transactionId: 1000 + index,
      date: `2026-07-${String((index % 18) + 1).padStart(2, '0')}`,
      processedDate: `2026-07-${String((index % 18) + 1).padStart(2, '0')}`,
      description: salary ? 'Horizon salary' : (positive ? `Refund ${index}` : `Card purchase ${index}`),
      amount: salary ? 13327.75 : (positive ? 89.9 : -(42 + index * 11.35)),
      source: salary ? 'leumi' : 'max',
      accountNumber: salary ? '3478' : '2254',
      classification: salary ? 'salary' : (positive ? 'refund' : (excluded ? 'transfer' : 'expense')),
      included: !salary && !excluded,
      automatic: true,
      override: null,
      editable: true,
      needsAction: index === 6,
      impactLine: excluded || salary ? 'none' : 'expenses',
      impactAmount: excluded || salary ? 0 : (positive ? -(89.9) : 42 + index * 11.35),
      reason: salary ? 'opening_salary_previous_cycle' : (positive ? 'auto_card_immediate' : (excluded ? 'user_override' : 'auto_card_accruing')),
    };
  }),
};

function Panel({ title, children, width = 'max-w-md' }) {
  return (
    <div className={`w-full ${width}`}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">{title}</p>
      {children}
    </div>
  );
}

function Preview() {
  const [lang, setLang] = useState('he');
  const [dark, setDark] = useState(false);
  const t = makeT(lang === 'he' ? heDash : enDash);

  return (
    <div className={dark ? 'dark' : ''}>
      <div dir={lang === 'he' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-100 p-6 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex gap-2">
            <button onClick={() => setLang(lang === 'he' ? 'en' : 'he')} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white">{lang === 'he' ? 'EN' : 'עברית'}</button>
            <button onClick={() => setDark(!dark)} className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-bold text-white dark:bg-gray-200 dark:text-gray-900">{dark ? 'Light' : 'Dark'}</button>
          </div>
          <div className="flex flex-wrap gap-6">
            <Panel title="LIVE — GET /api/v1/cycles/current">
              <FinancialCycleCard cycle={liveCycle.cycle} salaryTracking={liveCycle.salaryTracking} totalOutstanding={liveCycle.totalOutstanding} formatCurrency={formatCurrency} t={t} language={lang} onOpenCycle={() => {}} />
            </Panel>
            <Panel title="dashboard card — deficit + borrowed">
              <FinancialCycleCard cycle={CYCLE} formatCurrency={formatCurrency} t={t} language={lang} totalOutstanding={36828.21} onOpenCycle={() => {}} />
            </Panel>
            <Panel title="OVERVIEW tab (running)" width="max-w-lg">
              <CycleOverviewTab cycle={CYCLE} salaryTracking={{ status: 'scheduled' }} formatCurrency={formatCurrency} t={t} language={lang} />
            </Panel>
            <Panel title="OVERVIEW tab (partial cycle)" width="max-w-lg">
              <CycleOverviewTab cycle={PARTIAL} salaryTracking={{ status: 'scheduled' }} formatCurrency={formatCurrency} t={t} language={lang} />
            </Panel>
            <Panel title="CARDS tab — money first" width="max-w-lg">
              <CycleCardsTab cycle={CYCLE} formatCurrency={formatCurrency} t={t} language={lang} />
            </Panel>
            <Panel title="CONTROL tab — compact mobile flow" width="max-w-lg">
              <CycleControlTab
                cycle={CONTROL_CYCLE}
                salaryTracking={{ status: 'scheduled', last: CYCLE.window.salary, typicalAmount: 13327.75, expectedNext: '2026-08-09' }}
                signatures={[{ id: 1 }]}
                fundingForecast={{ streams: [{ signatureId: 1, expectedDate: '2026-08-09', expectedAmount: 13327.75, description: 'Horizon salary', primary: true }] }}
                settings={{ engineMode: 'automatic', manualAnchorDay: null }}
                formatCurrency={formatCurrency}
                t={t}
                language={lang}
              />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('preview-root')).render(
  <QueryClientProvider client={previewQueryClient}>
    <Preview />
  </QueryClientProvider>,
);
