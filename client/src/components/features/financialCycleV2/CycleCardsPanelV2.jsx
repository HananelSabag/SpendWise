import React, { useState } from 'react';
import { Check, ChevronDown, CreditCard, Settings2, Zap } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { cardShortName, last4, signedCurrency } from '../../../utils/cycleFormat';
import { formatCycleDay } from '../../../utils/cycleDate';

function amountForCard(events, card) {
  return (events || [])
    .filter((event) => event.source === card.source && String(event.accountNumber) === String(card.accountNumber))
    .reduce((sum, event) => sum + Number(event.total || 0), 0);
}

function TransactionList({ transactions, formatCurrency, language, t }) {
  if (!transactions?.length) return <p className="py-4 text-center text-xs text-slate-500">{t('cycleV2.noCardTransactions')}</p>;
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center gap-3 py-2.5">
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{transaction.description || '—'}</p><p className="mt-0.5 text-[10px] text-slate-400">{formatCycleDay(transaction.processedDate || transaction.date, language)}</p></div>
          <strong className="shrink-0 whitespace-nowrap text-xs tabular-nums text-slate-900 dark:text-white">{signedCurrency(Number(transaction.amount), formatCurrency)}</strong>
        </div>
      ))}
    </div>
  );
}

export default function CycleCardsPanelV2({
  cycle,
  useEstimates = true,
  formatCurrency,
  language,
  t,
  onChange,
  isSaving,
}) {
  const [openCard, setOpenCard] = useState(null);
  const [settingsCard, setSettingsCard] = useState(null);
  const cards = cycle?.cards || [];
  const events = cycle?.expenses?.events || [];
  const bills = cycle?.nextCardForecast?.bills || [];

  if (!cards.length) return null;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">{t('cycleV2.cardsEyebrow')}</p><h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{t('cycleV2.cardsOverviewTitle')}</h2></div>
        {isSaving && <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{t('cycleV2.saving')}</span>}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {cards.map((card) => {
          const key = `${card.source}-${card.accountNumber}`;
          const forecast = bills.find((bill) => bill.source === card.source && String(bill.accountNumber) === String(card.accountNumber));
          const cardEvents = events.filter((event) => event.source === card.source && String(event.accountNumber) === String(card.accountNumber));
          const currentSpend = Math.abs(amountForCard(events, card));
          const statementDay = card.setting?.statementDay ?? (card.statementDay?.certain ? card.statementDay.day : null);
          const passthrough = card.settlement?.mode === 'passthrough';
          const included = card.included !== false;
          const observedCharges = cardEvents.filter((event) => event.bankTransaction?.id);
          const linkedId = Number(card.setting?.linkedTransactionId) || '';
          const knownTransactions = passthrough
            ? cardEvents.flatMap((event) => event.txns || [])
            : (forecast?.knownTxns || []);
          const knownAmount = passthrough ? currentSpend : (Number(forecast?.knownAmount) || 0);
          const estimatedAmount = passthrough ? knownAmount : (Number(forecast?.estimatedAmount) || knownAmount);
          const extraEstimate = Math.max(0, estimatedAmount - knownAmount);

          return (
            <article key={key} className={cn('overflow-hidden rounded-3xl border bg-white transition dark:bg-slate-900', included ? 'border-slate-200 dark:border-slate-800' : 'border-dashed border-slate-300 opacity-60 dark:border-slate-700')}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span className={cn('rounded-2xl p-2.5', passthrough ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300')}>{passthrough ? <Zap className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-slate-950 dark:text-white">{cardShortName(card.source)} ••••{last4(card.accountNumber)}</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">{passthrough ? t('cycleV2.directCardClear') : statementDay ? t('cycleV2.monthlyCardClear', { day: statementDay }) : t('cycleV2.dayUnknown')}</p>
                  </div>
                  <button type="button" onClick={() => setSettingsCard((value) => value === key ? null : key)} aria-expanded={settingsCard === key} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={t('cycleV2.cardSettings')}><Settings2 className="h-4 w-4" /></button>
                </div>

                <button type="button" onClick={() => setOpenCard((value) => value === key ? null : key)} aria-expanded={openCard === key} className={cn('mt-4 grid w-full grid-cols-2 gap-2 text-start', !passthrough && useEstimates && 'sm:grid-cols-3')}>
                  <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/25"><p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">{passthrough ? t('cycleV2.alreadyFromBalance') : t('cycleV2.knownNextCharge')}</p><p className="mt-1 text-sm font-black tabular-nums text-slate-950 dark:text-white">{formatCurrency(knownAmount)}</p></div>
                  {!passthrough && useEstimates && <div className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/25"><p className="text-[10px] font-bold text-amber-700 dark:text-amber-300">{t('cycleV2.forecastExtra')}</p><p className="mt-1 text-sm font-black tabular-nums text-slate-950 dark:text-white">{formatCurrency(extraEstimate)}</p></div>}
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70"><div><p className="text-[10px] font-bold text-slate-400">{t('cycleV2.transactionsCount')}</p><p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{knownTransactions.length}</p></div><ChevronDown className={cn('h-4 w-4 text-slate-400 transition', openCard === key && 'rotate-180')} /></div>
                </button>

                {openCard === key && <div className="mt-3 rounded-2xl border border-slate-200 px-3 dark:border-slate-800"><TransactionList transactions={knownTransactions} formatCurrency={formatCurrency} language={language} t={t} /></div>}
              </div>

              {settingsCard === key && (
                <div className="border-t border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/35">
                  <p className="text-xs font-black text-slate-900 dark:text-white">{t('cycleV2.cardSettings')}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{passthrough ? t('cycleV2.directSettingsHint') : t('cycleV2.cardSettingsHint')}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-900">{t('cycleV2.include')}<input type="checkbox" checked={included} onChange={(event) => onChange({ source: card.source, accountNumber: card.accountNumber, included: event.target.checked, statementDay })} className="h-4 w-4 accent-indigo-600" /></label>
                    {!passthrough && <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('cycleV2.billingDay')}<select value={statementDay || ''} onChange={(event) => onChange({ source: card.source, accountNumber: card.accountNumber, included, statementDay: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"><option value="" disabled>—</option>{Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}</option>)}</select></label>}
                    {!passthrough && (observedCharges.length > 0 || linkedId) && <label className="text-xs font-bold text-slate-600 dark:text-slate-300 sm:col-span-2">{t('cycleV2.linkBankCharge')}<select value={linkedId} onChange={(event) => event.target.value && onChange({ source: card.source, accountNumber: card.accountNumber, included, statementDay, linkedTransactionId: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"><option value="">{t('cycleV2.chooseBankCharge')}</option>{linkedId && !observedCharges.some((event) => Number(event.bankTransaction.id) === Number(linkedId)) && <option value={linkedId}>{t('cycleV2.previouslyLinkedCharge')}</option>}{observedCharges.map((event) => <option key={event.bankTransaction.id} value={event.bankTransaction.id}>{formatCycleDay(event.bankTransaction.processedDate || event.chargeDate, language)} · {event.bankTransaction.description || t('cycleV2.bankCharge')} · {formatCurrency(Math.abs(event.bankTransaction.amount))}</option>)}</select></label>}
                    {!passthrough && !observedCharges.length && !linkedId && <p className="rounded-xl bg-white p-3 text-[11px] text-slate-500 dark:bg-slate-900 sm:col-span-2">{t('cycleV2.noBankChargeToLink')}</p>}
                  </div>
                  {linkedId && <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600"><Check className="h-3.5 w-3.5" />{t('cycleV2.bankChargeLinked')}</p>}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
