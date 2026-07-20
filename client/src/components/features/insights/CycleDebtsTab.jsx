/**
 * Loans, derived rather than typed in.
 *
 * The provider reuses one identifier across a loan and every repayment of it, so principal,
 * amount repaid and what is still outstanding are arithmetic (FINANCIAL_CYCLE_SPEC.md §3d).
 * Where the drawdown predates our history the principal is unknowable — say so plainly instead
 * of showing a confident wrong number.
 */

import React from 'react';
import { Coins, Landmark } from 'lucide-react';

import { formatCycleDay } from '../../../utils/cycleDate';
import { signedCurrency } from '../../../utils/cycleFormat';
import { InfoHint } from '../../ui';

function Bar({ repaid, principal }) {
  const pct = principal > 0 ? Math.min(100, Math.round((repaid / principal) * 100)) : 0;
  return (
    <div className="mt-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[10px] text-gray-400">{pct}%</p>
    </div>
  );
}

export default function CycleDebtsTab({ loans = [], totalOutstanding = 0, recurring = [], formatCurrency, t, language = 'en' }) {
  const known = loans.filter((loan) => loan.principal > 0);
  /** "1 payments" / "1 loans" reads like a bug; both languages need the singular. */
  const count = (n, one, many) => `${n} ${n === 1 ? t(one.key, { fallback: one.fb }) : t(many.key, { fallback: many.fb })}`;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <Landmark className="h-3.5 w-3.5" />
          {t('cycle.totalOutstanding', { fallback: 'Open debt' })}
          <InfoHint title={t('cycle.totalOutstanding', { fallback: 'Open debt' })}>
            {t('cycle.debtHint', { fallback: 'Principal drawn minus what you have repaid, read straight from the bank. Nothing here was typed in by hand.' })}
          </InfoHint>
        </p>
        <p className="mt-1 text-2xl font-black tabular-nums text-gray-900 dark:text-white">{formatCurrency(totalOutstanding)}</p>
        <p className="mt-0.5 text-[11px] text-gray-400">{count(known.length, { key: 'cycle.loan', fb: 'loan' }, { key: 'cycle.loans', fb: 'loans' })}</p>
      </div>

      {known.map((loan) => (
        <div key={loan.identifier} className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{loan.description || t('cycle.loan', { fallback: 'Loan' })}</p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {formatCurrency(loan.principal)} · {formatCycleDay(loan.disbursedOn, language)} · {t('cycle.payDay', { fallback: 'day' })} {loan.paymentDay}
              </p>
            </div>
            <div className="shrink-0 text-end">
              <p className="text-lg font-black tabular-nums text-gray-900 dark:text-white">{formatCurrency(loan.outstanding)}</p>
              <p className="text-[10px] text-gray-400">{t('cycle.left', { fallback: 'left' })}</p>
            </div>
          </div>
          <Bar repaid={loan.repaid} principal={loan.principal} />
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            {t('cycle.repaid', { fallback: 'Repaid' })} {formatCurrency(loan.repaid)} · {count(loan.paymentCount, { key: 'cycle.payment', fb: 'payment' }, { key: 'cycle.payments', fb: 'payments' })}
          </p>
        </div>
      ))}

      {/* Series we can prove exist and can predict, but cannot name. The user labels them once. */}
      {recurring.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <p className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <Coins className="h-3.5 w-3.5" />
            {t('cycle.needsLabel', { fallback: 'Recurring — what are these?' })}
            <InfoHint title={t('cycle.needsLabel', { fallback: 'Recurring' })}>
              {t('cycle.needsLabelHint', { fallback: 'These repeat every month and we can predict them, but we cannot tell what they are. The drawdown happened before our history starts, so tell us once.' })}
            </InfoHint>
          </p>
          <div className="mt-2 space-y-1">
            {recurring.map((series) => (
              <div key={series.identifier} className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-gray-800 dark:text-gray-100">{series.description}</p>
                  <p className="text-[10px] text-gray-400">
                    {t('cycle.payDay', { fallback: 'day' })} {series.paymentDay} · {series.occurrences}×
                  </p>
                </div>
                <p className="shrink-0 text-xs font-black tabular-nums text-gray-900 dark:text-white">{signedCurrency(-series.typicalAmount, formatCurrency)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!known.length && !recurring.length && (
        <p className="py-8 text-center text-sm text-gray-500">{t('cycle.noDebts', { fallback: 'No loans found' })}</p>
      )}
    </div>
  );
}
