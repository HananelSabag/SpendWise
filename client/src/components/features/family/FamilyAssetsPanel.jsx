/**
 * Savings and loans — what the household has put aside, and what it still owes.
 *
 * Balances are grouped by kind so "how much pension does each of us have" is one
 * glance rather than a hunt: the pension group lists one row per person with its
 * own subtotal.
 *
 * The loans list is read-only here on purpose. A loan is a monthly commitment
 * first, so it is created and edited in the flow tab; this tab answers the other
 * half of the question — how much is left to pay.
 */

import React, { useMemo } from 'react';
import { Landmark, Plus } from 'lucide-react';

import { BALANCE_KINDS, BALANCE_META, TONE } from './familyMeta';

const formatDate = (value, language) => {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

function BalanceRow({ balance, members, formatCurrency, t, language, onEdit }) {
  const owner = balance.owner_user_id == null
    ? t('assets.noOwner')
    : (members.find((m) => m.id === balance.owner_user_id)?.name || '—');
  const asOf = formatDate(balance.as_of, language);
  const inactive = balance.is_active === false;

  return (
    <button
      type="button"
      onClick={() => onEdit(balance)}
      className={`flex w-full items-center gap-3 py-2.5 text-start ${inactive ? 'opacity-45' : ''}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-black text-slate-900 dark:text-white">{balance.name}</span>
        <span className="mt-0.5 block truncate text-[11px] text-slate-400">
          {[
            owner,
            balance.institution,
            asOf ? t('assets.asOf', { date: asOf }) : null,
          ].filter(Boolean).join(' · ')}
        </span>
        {balance.monthly_contribution > 0 && (
          <span className="mt-0.5 block truncate text-[11px] text-slate-400">
            {t('assets.contribution')}: <span className="tabular-nums">{formatCurrency(balance.monthly_contribution)}</span>
          </span>
        )}
      </span>
      <strong className="shrink-0 text-sm font-black tabular-nums text-slate-900 dark:text-white">
        {formatCurrency(balance.amount)}
      </strong>
    </button>
  );
}

function LoanRow({ loan, formatCurrency, t, language }) {
  const monthly = Number(loan.amount) || 0;
  const outstanding = loan.outstanding_amount;
  // When they didn't enter how many payments are left, the pace itself is a fair
  // estimate — flagged as approximate so nobody reads it as a bank statement.
  const approxMonths = outstanding != null && monthly > 0
    ? Math.ceil(outstanding / monthly)
    : null;
  const endsOn = formatDate(loan.end_date, language);

  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate text-xs font-black text-slate-900 dark:text-white">{loan.name}</span>
          <span className="mt-0.5 block truncate text-[11px] text-slate-400">
            {[
              loan.lender,
              `${t('assets.monthly')} ${formatCurrency(monthly)}`,
            ].filter(Boolean).join(' · ')}
          </span>
        </span>
        <span className="shrink-0 text-end">
          {outstanding != null ? (
            <>
              <strong className={`block text-sm font-black tabular-nums ${TONE.violet.text}`}>
                {formatCurrency(outstanding)}
              </strong>
              <span className="block text-[10px] text-slate-400">{t('assets.outstanding')}</span>
            </>
          ) : (
            <span className="block text-[11px] font-bold text-amber-600 dark:text-amber-400">
              {t('assets.missingBalance')}
            </span>
          )}
        </span>
      </div>

      <p className="mt-1 text-[11px] text-slate-400">
        {loan.payments_left != null
          ? (loan.payments_left === 1 ? t('assets.payments_one') : t('assets.payments', { count: loan.payments_left }))
          : approxMonths != null
            ? t('assets.approxMonths', { count: approxMonths })
            : t('assets.missingBalanceHint')}
        {endsOn ? ` · ${t('assets.endsOn', { date: endsOn })}` : ''}
      </p>
    </div>
  );
}

export default function FamilyAssetsPanel({
  balances, loans, summary, members, formatCurrency, t, language, onAddBalance, onEditBalance,
}) {
  const grouped = useMemo(() => (
    BALANCE_KINDS
      .map((kind) => ({
        kind,
        rows: balances.filter((balance) => balance.kind === kind),
      }))
      .filter((group) => group.rows.length > 0)
  ), [balances]);

  const netWorth = summary?.netWorth ?? 0;

  return (
    <div className="space-y-4">
      {/* ── Net worth ────────────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('assets.netWorthTitle')}</p>
        <p className={`mt-1 text-3xl font-black tabular-nums ${netWorth < 0 ? TONE.rose.text : 'text-slate-950 dark:text-white'}`}>
          {formatCurrency(netWorth)}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">{t('assets.netWorthHint')}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-400">{t('assets.totalAssets')}</p>
            <p className={`text-base font-black tabular-nums ${TONE.emerald.text}`}>
              {formatCurrency(summary?.assets?.total ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-400">{t('assets.totalDebt')}</p>
            <p className={`text-base font-black tabular-nums ${TONE.violet.text}`}>
              {formatCurrency(summary?.debt?.total ?? 0)}
            </p>
          </div>
        </div>
      </section>

      {/* ── Balances ─────────────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <h2 className="flex-1 text-sm font-black text-slate-900 dark:text-white">{t('assets.balancesTitle')}</h2>
          <button
            type="button"
            onClick={() => onAddBalance()}
            className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('assets.addBalance')}
          </button>
        </div>

        {grouped.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-slate-200 p-4 text-center text-[11px] text-slate-400 dark:border-slate-800">
            {t('assets.balancesEmpty')}
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            {grouped.map(({ kind, rows }) => {
              const meta = BALANCE_META[kind];
              const Icon = meta.icon;
              const subtotal = rows
                .filter((row) => row.is_active !== false)
                .reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
              return (
                <div key={kind}>
                  <div className="flex items-center gap-2">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${TONE[meta.tone].bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${TONE[meta.tone].text}`} />
                    </span>
                    <span className="flex-1 truncate text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t(`balanceKind.${kind}`)}
                    </span>
                    <span className="shrink-0 text-xs font-black tabular-nums text-slate-600 dark:text-slate-300">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="ms-8 divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((balance) => (
                      <BalanceRow
                        key={balance.id}
                        balance={balance}
                        members={members}
                        formatCurrency={formatCurrency}
                        t={t}
                        language={language}
                        onEdit={onEditBalance}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Loans ────────────────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Landmark className={`h-4 w-4 ${TONE.violet.text}`} />
          <h2 className="flex-1 text-sm font-black text-slate-900 dark:text-white">{t('assets.loansTitle')}</h2>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-400">{t('assets.loansHint')}</p>

        {loans.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-slate-200 p-4 text-center text-[11px] text-slate-400 dark:border-slate-800">
            {t('assets.loansEmpty')}
          </p>
        ) : (
          <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
            {loans.map((loan) => (
              <LoanRow
                key={loan.id}
                loan={loan}
                formatCurrency={formatCurrency}
                t={t}
                language={language}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
