/**
 * The financial cycle — salary to salary. This is the number the user actually lives by,
 * so it leads the dashboard while the calendar month is retro detail on /insights.
 *
 * Shows the three lines that are all true at once (FINANCIAL_CYCLE_SPEC.md §3c): what you
 * earned vs spent (operatingNet), what you borrowed (financing), and what the account really
 * did (bankMovement). Counting borrowed money as income would turn a −14,129 month into a
 * comfortable +1,870 lie; hiding it would leave a −14,129 nobody can explain. So: both.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CalendarRange, Coins, Landmark, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import CycleBreakdown from './CycleBreakdown';

/**
 * The window end is exclusive, and the running cycle has not reached its end yet — so show
 * "9 Jul – today" while it runs and the real last day once it closes. Raw ISO dates are not
 * something anyone wants to read on a dashboard.
 */
function formatWindow(window, language) {
  if (!window?.start || !window?.end) return '';
  const start = new Date(`${window.start}T12:00:00`);
  const end = new Date(`${window.end}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
  if (!window.running) end.setDate(end.getDate() - 1);

  const formatter = new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: start.getFullYear() === end.getFullYear() ? undefined : 'numeric',
  });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

/** Short, readable date for a projected item ("26 Jul"), not an ISO stamp. */
function formatDay(iso, language) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-US', { day: 'numeric', month: 'short' }).format(date);
}

function Line({ label, value, hint, formatCurrency, tone = 'neutral', bold = false }) {
  const tones = {
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-rose-600 dark:text-rose-400',
    neutral: 'text-gray-900 dark:text-white',
    muted: 'text-gray-500 dark:text-gray-400',
  };
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className={cn('truncate text-sm', bold ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400')}>{label}</p>
        {/* The verdict ("you are spending more than you earn") is the whole point of the row —
            it wraps rather than truncates, however narrow the screen gets. */}
        {hint && <p className="text-[11px] leading-tight text-gray-400 dark:text-gray-500">{hint}</p>}
      </div>
      <p className={cn('shrink-0 tabular-nums', bold ? 'text-lg font-black' : 'text-sm font-semibold', tones[tone])}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

export default function FinancialCycleCard({
  cycle,
  salaryTracking,
  totalOutstanding = 0,
  formatCurrency,
  t,
  onOpenCycle,
  onLinkSalary,
  needsSalaryLink = false,
  language = 'en',
}) {
  // Salary is the anchor of the whole model — without it there is no window to show, so we
  // ask for the link instead of inventing one.
  if (needsSalaryLink) {
    return (
      <section className="glass-card rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-indigo-50 p-2 text-indigo-500 dark:bg-indigo-950/30"><Wallet className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('cycle.linkSalaryTitle', { fallback: 'Link your salary to see your cycle' })}</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('cycle.linkSalaryHint', { fallback: 'Your financial cycle runs from one salary to the next. Point us at your salary once and we take it from there.' })}</p>
            <button type="button" onClick={onLinkSalary} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700">
              {t('cycle.linkSalaryCta', { fallback: 'Link salary' })}<ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!cycle) return null;

  const { window, income, expenses, operatingNet, financing, bankMovement, projection } = cycle;
  const isDeficit = operatingNet < 0;
  const salaryLate = salaryTracking?.status === 'late';

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {t('cycle.title', { fallback: 'This financial cycle' })}
          </h3>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              <CalendarRange className="h-3 w-3" />
              {formatWindow(window, language)}
            </span>
            {window.running && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                {t('cycle.soFar', { fallback: 'so far' })}
              </span>
            )}
          </span>
          <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
            {t('cycle.hint', { fallback: 'From your salary to the next one' })}
          </p>
        </div>
      </div>

      {/* Salary is the anchor: if it has not landed, say so before anything else. */}
      {salaryLate && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-200">
            {t('cycle.salaryLate', { fallback: 'Your salary has not come in yet — keep an eye on it.' })}
          </p>
        </div>
      )}

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        <Line label={t('cycle.income', { fallback: 'Income' })} value={income.total} tone="positive" formatCurrency={formatCurrency} />
        <Line label={t('cycle.expenses', { fallback: 'Expenses' })} value={-expenses.total} tone="negative" formatCurrency={formatCurrency} />
        <Line
          label={t('cycle.operatingNet', { fallback: 'Net — how you are living' })}
          hint={isDeficit ? t('cycle.deficitHint', { fallback: 'You are spending more than you earn' }) : t('cycle.surplusHint', { fallback: 'You earned more than you spent' })}
          value={operatingNet}
          tone={isDeficit ? 'negative' : 'positive'}
          formatCurrency={formatCurrency}
          bold
        />
      </div>

      {/* Borrowed money is never income — but hiding it leaves the account movement unexplainable. */}
      {financing.total > 0 && (
        <div className="mt-2 rounded-xl bg-violet-50/60 px-3 py-2 dark:bg-violet-950/20">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
              <Coins className="h-3.5 w-3.5" />
              {t('cycle.financing', { fallback: 'Borrowed this cycle' })}
            </span>
            <span className="tabular-nums text-sm font-bold text-violet-700 dark:text-violet-300">{formatCurrency(financing.total)}</span>
          </div>
          <p className="mt-0.5 text-[10px] text-violet-600/80 dark:text-violet-400/80">
            {t('cycle.financingHint', { fallback: 'It covered the gap — and you pay it back' })}
          </p>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2 dark:border-gray-800">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
          <Landmark className="h-3.5 w-3.5" />
          {t('cycle.bankMovement', { fallback: 'What the account actually did' })}
        </span>
        <span className={cn('tabular-nums text-sm font-bold', bankMovement < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
          {formatCurrency(bankMovement)}
        </span>
      </div>

      {/* Provenance: the headline is only worth trusting if you can open it. */}
      <CycleBreakdown
        cycle={cycle}
        formatCurrency={formatCurrency}
        t={t}
        language={language}
        compactRowLimit={2}
      />

      {/* An estimate, kept visually separate from the settled figures above. */}
      {projection && projection.upcoming.length > 0 && (
        <div className="mt-3 rounded-xl border border-dashed border-gray-200 px-3 py-2 dark:border-gray-700">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            {projection.projectedOperatingNet < operatingNet ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
            {t('cycle.stillExpected', { fallback: 'Still expected before your next salary' })}
          </p>
          <ul className="mt-1.5 space-y-1">
            {projection.upcoming.slice(0, 3).map((item) => (
              <li key={`${item.kind}-${item.date}-${item.label}`} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="truncate text-gray-500 dark:text-gray-400">{formatDay(item.date, language)} · {item.label}</span>
                <span className="shrink-0 tabular-nums font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(item.amount)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-gray-100 pt-1.5 dark:border-gray-800">
            <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">{t('cycle.projectedEnd', { fallback: 'Estimated end of cycle' })}</span>
            <span className={cn('tabular-nums text-sm font-black', projection.projectedOperatingNet < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
              {formatCurrency(projection.projectedOperatingNet)}
            </span>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        {totalOutstanding > 0 ? (
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {t('cycle.outstanding', { fallback: 'Open debt' })}: <span className="font-bold text-gray-600 dark:text-gray-300">{formatCurrency(totalOutstanding)}</span>
          </span>
        ) : <span />}
        <button type="button" onClick={onOpenCycle} className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
          {t('cycle.openDetails', { fallback: 'Full breakdown' })}<ArrowRight className="h-3 w-3 rtl:rotate-180" />
        </button>
      </div>
    </motion.section>
  );
}
