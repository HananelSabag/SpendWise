/**
 * One card at a time — money first, brand last.
 *
 * The only question a user asks here is "how much did this card cost me this cycle, and on
 * what?". So each card leads with its total, then splits into the monthly bill versus charges
 * that hit the account directly (FINANCIAL_CYCLE_SPEC.md §2) — and every split opens into the
 * exact purchases behind it. Brand names (MAX/CAL) are deliberately quiet: the number is the
 * information, not the logo. How the card settles is detected from the bank's own lines, never
 * assumed (§2a), so a user comparing us to their statement sees the same shape.
 */

import React, { useState } from 'react';
import { AlertTriangle, ChevronRight, Clock3, CreditCard } from 'lucide-react';

import { InfoHint } from '../../ui';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { formatCycleDay } from '../../../utils/cycleDate';
import { cn } from '../../../utils/helpers';
import BottomSheet from '../../common/BottomSheet';
import Modal from '../../ui/Modal';

const SOURCE_NAME = { max: 'MAX', visa_cal: 'CAL', isracard: 'Isracard', amex: 'Amex' };
const cardName = (s) => SOURCE_NAME[s] || String(s || '').toUpperCase();
const last4 = (n) => String(n || '').slice(-4);

const signed = (value, formatCurrency) => {
  const amount = Number(value) || 0;
  if (amount === 0) return formatCurrency(0);
  return `${amount < 0 ? '−' : '+'}${formatCurrency(Math.abs(amount))}`;
};

/** The purchases behind one tapped split, newest first. */
function ChargeList({ group, formatCurrency, t, language }) {
  if (!group) return null;
  const total = (group.txns || []).reduce((sum, txn) => sum + Number(txn.amount || 0), 0);
  return (
    <div className="space-y-3 p-4 sm:p-0">
      <div className="flex items-end justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/70">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{group.meta}</p>
          <p className="mt-0.5 text-[11px] text-gray-400">{t('cycle.rowsCounted', { fallback: 'transactions counted' })}: {(group.txns || []).length}</p>
        </div>
        <p className="shrink-0 text-lg font-black tabular-nums text-gray-950 dark:text-white">{signed(total, formatCurrency)}</p>
      </div>
      <div className="max-h-[60vh] space-y-1 overflow-y-auto sm:max-h-96">
        {(group.txns || []).map((txn) => {
          const income = Number(txn.amount) > 0;
          return (
            <div key={txn.id} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{txn.description || '—'}</p>
                <p className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                  <span>{formatCycleDay(txn.date, language)}</span>
                  {txn.installments && (
                    <span className="text-indigo-500">{t('cycle.installment', { fallback: 'payment' })} {txn.installments.number}/{txn.installments.total}</span>
                  )}
                  {txn.currency && <span className="text-violet-500">{txn.currency}</span>}
                  {txn.pending && (
                    <span className="inline-flex items-center gap-1 text-amber-600"><Clock3 className="h-3 w-3" />{t('cycle.pending', { fallback: 'pending' })}</span>
                  )}
                </p>
              </div>
              <p className={`shrink-0 whitespace-nowrap text-sm font-black tabular-nums ${income ? 'text-emerald-600' : 'text-gray-950 dark:text-white'}`}>
                {signed(txn.amount, formatCurrency)}
              </p>
            </div>
          );
        })}
        {!(group.txns || []).length && <p className="py-8 text-center text-sm text-gray-500">{t('cycle.noRows', { fallback: 'Nothing here' })}</p>}
      </div>
    </div>
  );
}

function ChargeRow({ label, meta, amount, formatCurrency, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 text-start transition hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-800"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-gray-800 dark:text-gray-100">{label}</span>
        {meta && <span className="mt-0.5 block truncate text-[10px] text-gray-400">{meta}</span>}
      </span>
      <span className="shrink-0 whitespace-nowrap text-sm font-black tabular-nums text-gray-900 dark:text-white">{signed(amount, formatCurrency)}</span>
      <ChevronRight className="h-4 w-4 shrink-0 opacity-35 transition group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
    </button>
  );
}

export default function CycleCardsTab({ cycle, formatCurrency, t, language = 'en', useCardEstimate = true }) {
  const isMobile = useIsMobile();
  const [group, setGroup] = useState(null);
  const cards = cycle?.cards || [];
  const events = cycle?.expenses?.events || [];
  const unreconciled = cycle?.unreconciledCardEvents || [];

  const countLabel = (n) => `${n} ${n === 1 ? t('cycle.txn', { fallback: 'transaction' }) : t('cycle.txns', { fallback: 'transactions' })}`;

  /** Everything charged to this card this cycle, split into the monthly bill vs direct charges. */
  const splitFor = (card) => {
    const mine = events.filter((e) => e.source === card.source && e.accountNumber === card.accountNumber);
    const bucket = (klass) => {
      const evs = mine.filter((e) => e.class === klass);
      return {
        has: evs.length > 0,
        total: evs.reduce((sum, e) => sum + Number(e.total || 0), 0),
        count: evs.reduce((sum, e) => sum + Number(e.count || 0), 0),
        chargeDate: evs.length === 1 ? evs[0].chargeDate : null,
        txns: evs.flatMap((e) => e.txns || []),
      };
    };
    return {
      total: mine.reduce((sum, e) => sum + Number(e.total || 0), 0),
      statement: bucket('statement'),
      immediate: bucket('immediate'),
    };
  };

  const detail = <ChargeList group={group} formatCurrency={formatCurrency} t={t} language={language} />;

  return (
    <div className="space-y-3">
      {unreconciled.length > 0 && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-xs font-bold">{t('cycle.unreconciledCardTitle', { fallback: 'Waiting for bank confirmation' })}</p>
            <p className="mt-0.5 text-[11px] opacity-80">
              {t('cycle.unreconciledCardHint', { count: unreconciled.length, fallback: `${unreconciled.length} card charge(s) are visible but not counted until a matching bank movement arrives.` })}
            </p>
          </div>
        </div>
      )}

      {cards.map((card) => {
        const passthrough = card.settlement?.mode === 'passthrough';
        const day = card.statementDay?.certain ? card.statementDay.day : null;
        const split = splitFor(card);
        const nextBill = cycle?.nextCardForecast?.bills?.find(
          (bill) => bill.source === card.source && bill.accountNumber === card.accountNumber,
        );
        const title = `${cardName(card.source)} ••••${last4(card.accountNumber)}`;
        const modeLabel = passthrough
          ? t('cycle.modeDebit', { fallback: 'Debit — each purchase goes through on its own' })
          : day
            ? `${t('cycle.billedOn', { fallback: 'Billed on the' })} ${day}`
            : t('cycle.modeUnknown', { fallback: 'No billing day detected yet' });

        return (
          <div key={`${card.source}-${card.accountNumber}`} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            {/* Brand is quiet; the money is loud. */}
            <div className="flex min-w-0 items-start gap-2">
              <span className="shrink-0 rounded-xl bg-violet-50 p-2 text-violet-500 dark:bg-violet-950/25"><CreditCard className="h-4 w-4" /></span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</p>
                <p className="mt-0.5 flex items-start gap-1 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                  <span>{modeLabel}</span>
                  <InfoHint title={t('cycle.howItSettles', { fallback: 'How it settles' })}>
                    {passthrough
                      ? t('cycle.modeDebitHint', { fallback: 'Every purchase hits your account separately, so there is no monthly bill to wait for.' })
                      : t('cycle.modeCreditHint', { fallback: 'Purchases pile up and leave your account as one charge on this day. Foreign purchases often go through immediately instead.' })}
                  </InfoHint>
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-800/45">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{t('cycle.cardSpend', { fallback: 'Charged this cycle' })}</p>
              <p className="shrink-0 text-2xl font-black tabular-nums text-gray-900 dark:text-white">{signed(split.total, formatCurrency)}</p>
            </div>

            {split.statement.has || split.immediate.has ? (
              <div className="mt-3 space-y-1.5">
                {split.statement.has && (
                  <ChargeRow
                    label={t('cycle.statementLine', { fallback: 'Monthly bill' })}
                    meta={`${split.statement.chargeDate ? `${formatCycleDay(split.statement.chargeDate, language)} · ` : ''}${countLabel(split.statement.count)}`}
                    amount={split.statement.total}
                    formatCurrency={formatCurrency}
                    onClick={() => setGroup({ title, meta: t('cycle.statementLine', { fallback: 'Monthly bill' }), txns: split.statement.txns })}
                  />
                )}
                {split.immediate.has && (
                  <ChargeRow
                    label={t('cycle.immediateLine', { fallback: 'Charged directly' })}
                    meta={countLabel(split.immediate.count)}
                    amount={split.immediate.total}
                    formatCurrency={formatCurrency}
                    onClick={() => setGroup({ title, meta: t('cycle.immediateLine', { fallback: 'Charged directly' }), txns: split.immediate.txns })}
                  />
                )}
              </div>
            ) : (
              <p className="mt-3 text-center text-[11px] text-gray-400">{t('cycle.noCardCharges', { fallback: 'Nothing charged this cycle' })}</p>
            )}

            {nextBill && (
              <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2.5 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                  {t('cycle.nextBill', { fallback: 'Next bill' })} · {formatCycleDay(nextBill.chargeDate, language)}
                </p>
                <div className={cn('mt-1.5 grid gap-2', useCardEstimate && 'grid-cols-2')}>
                  <button
                    type="button"
                    disabled={!nextBill.knownTxns?.length}
                    onClick={() => setGroup({
                      title,
                      meta: `${t('cycle.nextBill', { fallback: 'Next bill' })} · ${formatCycleDay(nextBill.chargeDate, language)}`,
                      txns: nextBill.knownTxns || [],
                    })}
                    className="group min-w-0 rounded-lg bg-white/75 px-2.5 py-2 text-start transition enabled:hover:bg-white disabled:cursor-default dark:bg-gray-900/60 dark:enabled:hover:bg-gray-900"
                  >
                    <span className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{t('cycle.knownCardSpend', { fallback: 'Actually accumulated' })}</span>
                      {nextBill.knownTxns?.length > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40 rtl:rotate-180" />}
                    </span>
                    <span className="block text-base font-black tabular-nums text-gray-950 dark:text-white">{formatCurrency(nextBill.knownAmount)}</span>
                    {nextBill.knownCount > 0 && (
                      <span className="mt-0.5 block text-[9px] text-gray-400">{countLabel(nextBill.knownCount)}</span>
                    )}
                  </button>
                  {useCardEstimate && (
                    <div className="min-w-0 rounded-lg bg-indigo-100/70 px-2.5 py-2 dark:bg-indigo-950/50">
                      <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-300">{t('cycle.expectedCardBill', { fallback: 'Estimate only' })}</p>
                      <p className="text-base font-black tabular-nums text-indigo-950 dark:text-white">~{formatCurrency(nextBill.estimatedAmount)}</p>
                      {nextBill.historyCount > 0 && (
                        <p className="text-[9px] text-gray-500 dark:text-gray-400">{t('cycle.historyAverage', { count: nextBill.historyCount, fallback: `average of ${nextBill.historyCount} recent bills` })}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {!cards.length && <p className="py-8 text-center text-sm text-gray-500">{t('cycle.noCards', { fallback: 'No cards connected' })}</p>}

      {isMobile ? (
        <BottomSheet isOpen={Boolean(group)} onClose={() => setGroup(null)} title={group?.title || ''} height="full">{detail}</BottomSheet>
      ) : (
        <Modal isOpen={Boolean(group)} onClose={() => setGroup(null)} title={group?.title || ''} size="lg">{detail}</Modal>
      )}
    </div>
  );
}
