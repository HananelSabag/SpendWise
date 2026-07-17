/**
 * The one number the user navigates by: how much is actually in the account, right now.
 *
 * The cycle tells you the flow — what came in and went out between salaries. This tells you the
 * level. Hananel steers by the level as much as the flow, so it sits above everything, on every
 * tab, and never leaves the picture. It is today's balance and does not change with the cycle
 * being viewed; the number is the same one the dashboard hero shows (hooks/useBankBalance).
 *
 * A bank that does not report a balance (Yahav) is shown as "not available", never a fake 0.
 * An overdraft is real money owed, so a negative balance is coloured like a deficit.
 */

import React from 'react';
import { Wallet } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { InfoHint } from '../../ui';
import { useBankBalance } from '../../../hooks/useBankBalance';
import { institutionLabel } from '../bankSync/bankSyncMeta';
import { formatCycleDay } from '../../../utils/cycleDate';
import { projectBalanceAfterNextBills } from '../../../utils/bankBalance';

const signed = (value, formatCurrency) => `${Number(value) < 0 ? '−' : '+'}${formatCurrency(Math.abs(Number(value) || 0))}`;

export default function CycleBalanceStrip({ cycle, formatCurrency, t, language = 'en', className }) {
  const {
    hasSynced, hasBankSource, hasRealBalance, totalRealBalance,
    bankAccounts, someBalancesUnavailable, isLoading,
  } = useBankBalance();

  // Nothing to anchor to until at least one bank account exists.
  if (isLoading || !hasSynced || !hasBankSource) return null;

  const accountLabel = (a, i) =>
    `${institutionLabel(a.source, language)}${a.accountNumber ? ` · ${a.accountNumber}` : ''}` || `#${i}`;
  const forecast = cycle?.nextCardForecast;
  const projectedBalance = hasRealBalance ? projectBalanceAfterNextBills(totalRealBalance, cycle) : null;
  const lastBillDate = forecast?.bills?.reduce(
    (latest, bill) => !latest || bill.chargeDate > latest ? bill.chargeDate : latest,
    null,
  );

  return (
    <section className={cn('rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900', className)}>
      <div className={cn('grid gap-3', projectedBalance !== null && 'sm:grid-cols-2')}>
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            <Wallet className="h-3.5 w-3.5" />
            {t('cycle.balance', { fallback: 'Account balance' })}
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-400 dark:bg-gray-800 dark:text-gray-500">
              {t('cycle.balanceNow', { fallback: 'now' })}
            </span>
            <InfoHint title={t('cycle.balance', { fallback: 'Account balance' })}>
              {t('cycle.balanceHint', { fallback: "What is in your checking account right now, across your connected banks. It is today's balance." })}
            </InfoHint>
          </p>

          {hasRealBalance ? (
            <p className={cn('mt-1 text-3xl font-black tabular-nums', totalRealBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white')}>
              {formatCurrency(totalRealBalance)}
            </p>
          ) : (
            <p className="mt-1 text-xl font-bold text-gray-400 dark:text-gray-500">
              {t('cycle.balanceUnavailable', { fallback: 'Not available' })}
            </p>
          )}
        </div>

        {projectedBalance !== null && (
          <div className="rounded-xl bg-indigo-50/70 px-3 py-2.5 dark:bg-indigo-950/25">
            <p className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
              {t('cycle.balanceAfterNextBills', { fallback: 'After next salary and card bills' })}
              {lastBillDate && <span className="font-medium opacity-65">· {formatCycleDay(lastBillDate, language)}</span>}
              <InfoHint title={t('cycle.balanceAfterNextBills', { fallback: 'After next salary and card bills' })}>
                {t('cycle.balanceForecastHint', { fallback: "Today's balance, plus what remains before salary, plus salary, minus the next card bills." })}
              </InfoHint>
            </p>
            <p className={cn('mt-0.5 text-2xl font-black tabular-nums', projectedBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-950 dark:text-white')}>
              ~{formatCurrency(projectedBalance)}
            </p>
            <p className="mt-1 flex flex-wrap gap-x-2 text-[10px] font-medium tabular-nums text-gray-500 dark:text-gray-400">
              <span>{t('cycle.untilSalaryShort', { fallback: 'until salary' })} {signed(cycle?.projection?.upcomingTotal || 0, formatCurrency)}</span>
              <span>{t('cycle.salaryShort', { fallback: 'salary' })} {signed(forecast.salaryAmount, formatCurrency)}</span>
              <span>{t('cycle.cardsShort', { fallback: 'cards' })} −{formatCurrency(forecast.estimatedTotal)}</span>
            </p>
          </div>
        )}
      </div>

      {/* More than one account: show each so the total is never a mystery blend. */}
      {bankAccounts.length > 1 && (
        <div className="mt-2 space-y-0.5 border-t border-gray-100 pt-2 dark:border-gray-800">
          {bankAccounts.map((a, i) => (
            <div key={`${a.source}-${a.accountNumber || i}`} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="min-w-0 truncate text-gray-500 dark:text-gray-400">{accountLabel(a, i)}</span>
              <span className={cn('shrink-0 tabular-nums font-semibold', a.balance === null ? 'text-gray-400 dark:text-gray-500' : a.balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-700 dark:text-gray-200')}>
                {a.balance === null ? t('cycle.balanceUnavailable', { fallback: 'Not available' }) : formatCurrency(a.balance)}
              </span>
            </div>
          ))}
        </div>
      )}

      {someBalancesUnavailable && bankAccounts.length <= 1 && (
        <p className="mt-1 text-[10px] text-gray-400">{t('cycle.balanceExcludesUnavailable', { fallback: "Some accounts don't report a balance." })}</p>
      )}
    </section>
  );
}
