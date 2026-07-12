import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingDown, TrendingUp, Clock3, ArrowLeft, History } from 'lucide-react';
import { useTranslation } from '../../../stores';

/**
 * RunwayCard — the salary-anchored "how am I doing since my last paycheck" view.
 * Shows the real checking balance plus what has left / come in (excluding salary)
 * since the most recent salary deposit. This is the single "current" summary on
 * the dashboard; the previous cycle/month lives in its own card below.
 */

function fmtDate(key, language) {
  if (!key) return '';
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' })
    .format(new Date(`${key}T12:00:00`));
}

function Stat({ label, value, tone, Icon, formatCurrency }) {
  const toneClass = tone === 'out' ? 'text-red-500' : tone === 'in' ? 'text-emerald-600' : 'text-amber-600';
  return (
    <div>
      <p className="flex items-center gap-1 text-[11px] text-gray-400">
        {Icon && <Icon className="h-3 w-3" />}{label}
      </p>
      <p className={`font-bold ${toneClass}`}>{formatCurrency(value)}</p>
    </div>
  );
}

export default function RunwayCard({ data, formatCurrency }) {
  const { t, currentLanguage } = useTranslation('dashboard');
  const cycle = data?.current;
  if (!cycle) return null;

  const { money, checkingBalance, salaryDate, daysElapsed, anchor, needsSalarySetup } = cycle;
  const balanceKnown = checkingBalance !== null && checkingBalance !== undefined;

  return (
    <article className="rounded-2xl border border-gray-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/70">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {t('runway.currentTitle')}
          </p>
          <h3 className="mt-0.5 flex items-center gap-1.5 text-base font-bold text-gray-900 dark:text-white">
            <Wallet className="h-4 w-4 text-indigo-500" />
            {balanceKnown ? formatCurrency(checkingBalance) : t('runway.balanceUnavailable')}
            {balanceKnown && <span className="text-[11px] font-medium text-gray-400">{t('runway.inChecking')}</span>}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/30">
          <Clock3 className="h-3 w-3" />
          {anchor === 'salary' ? t('runway.sinceSalary', { date: fmtDate(salaryDate, currentLanguage) }) : t('runway.byMonth')}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label={t('runway.spentSince')} value={money.spentCommitted} tone="out" Icon={TrendingDown} formatCurrency={formatCurrency} />
        <Stat label={t('runway.incomeExSalary')} value={money.incomeExSalary} tone="in" Icon={TrendingUp} formatCurrency={formatCurrency} />
        <Stat label={t('runway.pending')} value={money.spentPending} tone="pending" formatCurrency={formatCurrency} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-[11px] text-gray-500 dark:border-gray-800">
        <span>{t('runway.dailyAvgSpent')}: {formatCurrency(cycle.dailyAverage.spent)}</span>
        <span>{t('runway.daysInCycle', { n: daysElapsed })}</span>
        {money.salaryInWindow > 0 && <span>{t('runway.salaryReceived')}: {formatCurrency(money.salaryInWindow)}</span>}
        <Link to="/insights" className="ms-auto inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">
          <History className="h-3.5 w-3.5" />{t('runway.dailyHistory')}<ArrowLeft className="h-3.5 w-3.5 rtl:rotate-0 ltr:rotate-180" />
        </Link>
      </div>

      {anchor === 'calendar_fallback' && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700 dark:bg-amber-950/25 dark:text-amber-300">
          {needsSalarySetup ? t('runway.needsSalary') : t('runway.fallbackNote')}
        </p>
      )}
    </article>
  );
}
