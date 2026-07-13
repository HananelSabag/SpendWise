import React from 'react';
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useTranslation } from '../../../stores';

function formatDate(key, language, options = {}) {
  if (!key) return '';
  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    ...options,
  }).format(new Date(`${key}T12:00:00`));
}

function compactMoney(value, language) {
  return new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-GB', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value) || 0);
}

function Metric({ icon: Icon, label, value, tone, formatCurrency }) {
  const tones = {
    red: 'bg-rose-50 text-rose-700 dark:bg-rose-950/25 dark:text-rose-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-300',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/25 dark:text-indigo-300',
  };
  const numericValue = Number(value) || 0;
  const displayValue = `${numericValue < 0 ? '−' : ''}${formatCurrency(Math.abs(numericValue))}`;
  return (
    <div className={`rounded-2xl p-3 ${tones[tone]}`}>
      <p className="flex items-center gap-1 text-[11px] font-medium opacity-75"><Icon className="h-3.5 w-3.5" />{label}</p>
      <p className="mt-1 text-base font-black tabular-nums">{displayValue}</p>
    </div>
  );
}

function FlowTooltip({ active, payload, label, language, formatCurrency, t }) {
  if (!active || !payload?.length) return null;
  const values = Object.fromEntries(payload.map((item) => [item.dataKey, item.value]));
  return (
    <div className="rounded-xl border border-gray-200 bg-white/95 p-3 text-xs shadow-xl backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
      <p className="mb-2 font-bold text-gray-900 dark:text-white">{formatDate(label, language)}</p>
      <p className="text-rose-600">{t('dailyFlow.outToday')}: {formatCurrency(values.spentCommitted || 0)}</p>
      <p className="text-emerald-600">{t('dailyFlow.inToday')}: {formatCurrency(values.totalIncome || 0)}</p>
      <p className="mt-1 text-indigo-600">{t('dailyFlow.cumulativeNet')}: {formatCurrency(values.cumulativeNetIncludingSalary || 0)}</p>
    </div>
  );
}

export default function DailyFlowHistory({ runway, selectedCycle = 'current', formatCurrency, language = 'he' }) {
  const { t } = useTranslation('dashboard');
  const he = language === 'he';
  const cycle = runway?.[selectedCycle];
  const history = cycle?.dailyHistory || [];
  const activeDays = history
    .filter((day) => day.transactionCount || day.salaryIncome || day.needsReviewCount)
    .slice()
    .reverse();

  if (!runway?.current) return null;

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-100 p-4 dark:border-gray-800 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-indigo-500">
              <Clock3 className="h-4 w-4" />{t('dailyFlow.eyebrow')}
            </p>
            <h2 className="mt-1 text-lg font-black text-gray-950 dark:text-white">{t('dailyFlow.title')}</h2>
            <p className="mt-1 text-xs text-gray-500">{t('dailyFlow.subtitle')}</p>
          </div>

        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <CalendarDays className="h-4 w-4" />
          <span>{formatDate(cycle?.cycleStart, language)} — {formatDate(cycle?.lastDay, language)}</span>
          <span>·</span>
          <span>{t('dailyFlow.days', { count: cycle?.daysElapsed || 0 })}</span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Metric icon={TrendingDown} label={t('dailyFlow.out')} value={cycle?.money?.spentCommitted} tone="red" formatCurrency={formatCurrency} />
          <Metric icon={TrendingUp} label={t('cycleDashboard.totalIncome')} value={cycle?.money?.totalIncome} tone="green" formatCurrency={formatCurrency} />
          <Metric icon={Wallet} label={t('dailyFlow.cycleNet')} value={cycle?.money?.netIncludingSalaryCommitted} tone="indigo" formatCurrency={formatCurrency} />
        </div>

        <div className="mt-5 h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={history} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.65} />
              <XAxis dataKey="date" tickFormatter={(value) => formatDate(value, language, { day: 'numeric', month: 'numeric' })} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} minTickGap={18} />
              <YAxis tickFormatter={(value) => compactMoney(value, language)} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={42} />
              <Tooltip content={<FlowTooltip language={language} formatCurrency={formatCurrency} t={t} />} />
              <Bar dataKey="spentCommitted" name="spentCommitted" fill="#fb7185" radius={[5, 5, 0, 0]} maxBarSize={22} />
              <Bar dataKey="totalIncome" name="totalIncome" fill="#34d399" radius={[5, 5, 0, 0]} maxBarSize={22} />
              <Area dataKey="cumulativeNetIncludingSalary" name="cumulativeNetIncludingSalary" type="monotone" stroke="#6366f1" fill="#6366f1" fillOpacity={0.08} strokeWidth={2.5} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-rose-400" />{t('dailyFlow.dailyOut')}</span>
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />{t('cycleDashboard.totalIncome')}</span>
          <span className="flex items-center gap-1"><i className="h-0.5 w-3 bg-indigo-500" />{t('dailyFlow.cumulativeNet')}</span>
        </div>

        <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
          <h3 className="mb-2 text-sm font-bold text-gray-900 dark:text-white">{t('dailyFlow.ledger')}</h3>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {activeDays.map((day) => (
              <div key={day.date} className="flex items-center gap-3 py-3">
                <div className="w-16 shrink-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatDate(day.date, language, { day: 'numeric' })}</p>
                  <p className="text-[10px] text-gray-400">{t('dailyFlow.items', { count: day.transactionCount })}</p>
                </div>
                <div className="min-w-0 flex-1">
                  {day.salaryIncome > 0 && <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/30">{t('dailyFlow.salaryReceived')} · {formatCurrency(day.salaryIncome)}</span>}
                  {day.spentPending > 0 && <p className="mt-1 text-[10px] text-amber-600">{t('dailyFlow.stillPending', { amount: formatCurrency(day.spentPending) })}</p>}
                  {day.needsReviewCount > 0 && <p className="mt-1 text-[10px] text-amber-600">{t('dailyFlow.needsReview', { count: day.needsReviewCount })}</p>}
                </div>
                <div className="text-end text-xs tabular-nums">
                  {day.incomeExSalary > 0 && <p className="font-bold text-emerald-600">+{formatCurrency(day.incomeExSalary)}</p>}
                  {day.spentCommitted > 0 && <p className="font-bold text-rose-600">−{formatCurrency(day.spentCommitted)}</p>}
                  {day.spentCommitted < 0 && <p className="font-bold text-emerald-600">+{formatCurrency(Math.abs(day.spentCommitted))} {t('dailyFlow.refund')}</p>}
                </div>
                {he ? <ChevronLeft className="h-4 w-4 text-gray-300" /> : <ChevronRight className="h-4 w-4 text-gray-300" />}
              </div>
            ))}
            {!activeDays.length && <p className="py-6 text-center text-sm text-gray-500">{t('dailyFlow.noActivity')}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
