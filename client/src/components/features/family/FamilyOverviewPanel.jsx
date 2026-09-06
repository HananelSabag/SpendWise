/**
 * The overview — the reason this screen exists.
 *
 * One number dominates everything else: what is actually left to live on after
 * the certain stuff is gone. Everything below it exists to explain that number,
 * in this order: where the income went, what the plan spends, and whose account
 * each piece leaves from.
 */

import React from 'react';
import { ArrowRight, Banknote, Landmark, PiggyBank, Repeat, ShoppingCart, Users } from 'lucide-react';

import { TONE } from './familyMeta';

const SEGMENTS = [
  { key: 'fixed', tone: 'rose' },
  { key: 'loans', tone: 'violet' },
  { key: 'savings', tone: 'sky' },
];

const KIND_ICONS = {
  income: Banknote,
  fixed: Repeat,
  loans: Landmark,
  savings: PiggyBank,
  variable: ShoppingCart,
};

function Figure({ icon: Icon, tone, label, value, formatCurrency }) {
  const palette = TONE[tone] || TONE.slate;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${palette.text}`} />
        <span className="truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className="mt-1 text-base font-black tabular-nums text-slate-900 dark:text-white">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

export default function FamilyOverviewPanel({
  summary, members, formatCurrency, t, onGoToFlow, onGoToAssets, onAddFirst, hasRows,
}) {
  if (!summary) return null;
  const { monthly, people, assets, debt, netWorth } = summary;

  if (!hasRows) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40">
          <Users className="h-6 w-6 text-indigo-500" />
        </div>
        <h2 className="mt-3 text-lg font-black text-slate-900 dark:text-white">{t('overview.emptyTitle')}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{t('overview.emptyBody')}</p>
        <button
          type="button"
          onClick={onAddFirst}
          className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white shadow-sm hover:bg-indigo-700"
        >
          {t('overview.emptyCta')}
        </button>
      </div>
    );
  }

  // The bar is a share of income. With no income entered yet there is nothing to
  // divide, so the committed part fills it and the honest reading is "all of it".
  const base = monthly.income > 0 ? monthly.income : monthly.committed;
  const share = (value) => (base > 0 ? Math.max(0, Math.min(100, (value / base) * 100)) : 0);
  const leftShare = Math.max(0, share(monthly.available));
  const negative = monthly.available < 0;

  return (
    <div className="space-y-4">
      {/* ── The number ───────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-5 text-white shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-white/80">
          {negative ? t('overview.deficit') : t('overview.headline')}
        </p>
        <p className="mt-1 text-4xl font-black tabular-nums leading-none sm:text-5xl">
          {formatCurrency(Math.abs(monthly.available))}
        </p>
        <p className="mt-2 text-xs text-white/80">
          {negative ? t('overview.deficitHint') : t('overview.headlineHint')}
        </p>

        {/* Where the income goes */}
        <div className="mt-5">
          <p className="text-[11px] font-bold text-white/70">{t('overview.allocation')}</p>
          <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-white/20">
            {SEGMENTS.map(({ key, tone }) => (
              monthly[key] > 0 ? (
                <div
                  key={key}
                  className={TONE[tone].bar}
                  style={{ width: `${share(monthly[key])}%` }}
                  title={`${t(`kind.${key === 'loans' ? 'loan' : key}`)} ${formatCurrency(monthly[key])}`}
                />
              ) : null
            ))}
            {leftShare > 0 && <div className="bg-white/90" style={{ width: `${leftShare}%` }} />}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {SEGMENTS.map(({ key, tone }) => (
              monthly[key] > 0 ? (
                <span key={key} className="flex items-center gap-1.5 text-[11px] font-semibold text-white/90">
                  <span className={`h-2 w-2 rounded-full ${TONE[tone].bar}`} />
                  {t(`kind.${key === 'loans' ? 'loan' : key}`)}
                  <span className="tabular-nums text-white/70">{formatCurrency(monthly[key])}</span>
                </span>
              ) : null
            ))}
            {leftShare > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/90">
                <span className="h-2 w-2 rounded-full bg-white/90" />
                {t('overview.left')}
                <span className="tabular-nums text-white/70">{formatCurrency(monthly.available)}</span>
              </span>
            )}
          </div>

          {monthly.committedRatio != null && (
            <p className="mt-3 text-[11px] text-white/70">
              {t('overview.committedShare', { percent: Math.round(monthly.committedRatio * 100) })}
            </p>
          )}
        </div>
      </section>

      {/* ── The four figures behind it ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure icon={KIND_ICONS.income}  tone="emerald" label={t('kind.income')}  value={monthly.income}  formatCurrency={formatCurrency} />
        <Figure icon={KIND_ICONS.fixed}   tone="rose"    label={t('kind.fixed')}   value={monthly.fixed}   formatCurrency={formatCurrency} />
        <Figure icon={KIND_ICONS.loans}   tone="violet"  label={t('kind.loan')}    value={monthly.loans}   formatCurrency={formatCurrency} />
        <Figure icon={KIND_ICONS.savings} tone="sky"     label={t('kind.savings')} value={monthly.savings} formatCurrency={formatCurrency} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── What the plan spends ───────────────────────────────────────── */}
        <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <ShoppingCart className={`h-4 w-4 ${TONE.amber.text}`} />
            <h2 className="text-sm font-black text-slate-900 dark:text-white">{t('overview.plannedTitle')}</h2>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">{t('overview.plannedHint')}</p>

          <div className="mt-3 flex items-baseline justify-between gap-3">
            <span className="text-xs font-bold text-slate-500">{t('kind.variable')}</span>
            <strong className="text-lg font-black tabular-nums text-slate-900 dark:text-white">
              {formatCurrency(monthly.variablePlanned)}
            </strong>
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-bold text-slate-500">{t('overview.projected')}</span>
              <strong className={`text-xl font-black tabular-nums ${monthly.projected < 0 ? TONE.rose.text : TONE.emerald.text}`}>
                {formatCurrency(monthly.projected)}
              </strong>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {monthly.projected < 0 ? t('overview.projectedNegative') : t('overview.projectedPositive')}
            </p>
          </div>
        </section>

        {/* ── Whose account ──────────────────────────────────────────────── */}
        <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-black text-slate-900 dark:text-white">{t('overview.perPerson')}</h2>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">{t('overview.perPersonHint')}</p>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {people
              .filter((person) => person.income || person.committed || person.variable)
              .map((person) => (
                <div key={person.key} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-xs font-black text-slate-800 dark:text-slate-100">
                      {person.userId == null
                        ? t('overview.joint')
                        : (person.name || members.find((m) => m.id === person.userId)?.name || '—')}
                    </span>
                    {/* Red means "this person cannot cover their own commitments".
                        A shared bucket has no income by definition, so its
                        negative is expected and must not read as an alarm. */}
                    <strong className={`shrink-0 text-sm font-black tabular-nums ${
                      person.available < 0 && person.income > 0
                        ? TONE.rose.text
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {formatCurrency(person.available)}
                    </strong>
                  </div>
                  <div className="mt-1 flex gap-3 text-[11px] text-slate-400">
                    <span>{t('overview.personIncome')} <span className="tabular-nums">{formatCurrency(person.income)}</span></span>
                    <span>{t('overview.personCommitted')} <span className="tabular-nums">{formatCurrency(person.committed)}</span></span>
                  </div>
                </div>
              ))}
          </div>

          <button
            type="button"
            onClick={onGoToFlow}
            className="mt-3 flex items-center gap-1 text-[11px] font-black text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {t('tabs.flow')}
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </button>
        </section>
      </div>

      {/* ── What they have ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onGoToAssets}
        className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-start transition hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">{t('overview.assetsStrip')}</h2>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 rtl:rotate-180" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <p className="text-[11px] font-bold text-slate-400">{t('overview.assets')}</p>
            <p className={`text-sm font-black tabular-nums ${TONE.emerald.text}`}>{formatCurrency(assets.total)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400">{t('overview.debt')}</p>
            <p className={`text-sm font-black tabular-nums ${TONE.violet.text}`}>{formatCurrency(debt.total)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400">{t('overview.netWorth')}</p>
            <p className={`text-sm font-black tabular-nums ${netWorth < 0 ? TONE.rose.text : 'text-slate-900 dark:text-white'}`}>
              {formatCurrency(netWorth)}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
