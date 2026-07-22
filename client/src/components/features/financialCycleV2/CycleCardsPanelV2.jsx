import React from 'react';
import { Check, CreditCard, SlidersHorizontal } from 'lucide-react';

import { cardShortName, last4, signedCurrency } from '../../../utils/cycleFormat';
import { formatCycleDay } from '../../../utils/cycleDate';

function amountForCard(events, card) {
  return (events || [])
    .filter((event) => event.source === card.source && String(event.accountNumber) === String(card.accountNumber))
    .reduce((sum, event) => sum + Number(event.total || 0), 0);
}

export default function CycleCardsPanelV2({
  cycle,
  formatCurrency,
  language,
  t,
  onChange,
  isSaving,
}) {
  const cards = cycle?.cards || [];
  const events = cycle?.expenses?.events || [];
  const bills = cycle?.nextCardForecast?.bills || [];

  if (!cards.length) {
    return <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">{t('cycleV2.noCards')}</div>;
  }

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">{t('cycleV2.cardsEyebrow')}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{t('cycleV2.cardsTitle')}</h2>
        </div>
        {isSaving && <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{t('cycleV2.saving')}</span>}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {cards.map((card) => {
          const forecast = bills.find((bill) => bill.source === card.source && String(bill.accountNumber) === String(card.accountNumber));
          const currentSpend = Math.abs(amountForCard(events, card));
          const statementDay = card.setting?.statementDay ?? (card.statementDay?.certain ? card.statementDay.day : null);
          const passthrough = card.settlement?.mode === 'passthrough';
          const included = card.included !== false;
          const observedCharges = events.filter((event) => event.source === card.source
            && String(event.accountNumber) === String(card.accountNumber)
            && event.txns?.[0]?.id);

          return (
            <article key={`${card.source}-${card.accountNumber}`} className={`rounded-3xl border bg-white p-4 transition dark:bg-slate-900 ${included ? 'border-slate-200 dark:border-slate-800' : 'border-dashed border-slate-300 opacity-60 dark:border-slate-700'}`}>
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-violet-100 p-2.5 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"><CreditCard className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-slate-950 dark:text-white">{cardShortName(card.source)} ••••{last4(card.accountNumber)}</h3>
                      <p className="mt-0.5 text-[11px] text-slate-400">{passthrough ? t('cycleV2.directCard') : statementDay ? `${t('cycleV2.billsOn')} ${statementDay}` : t('cycleV2.dayUnknown')}</p>
                    </div>
                    <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-bold text-slate-500">
                      <input
                        type="checkbox"
                        checked={included}
                        onChange={(event) => onChange({ source: card.source, accountNumber: card.accountNumber, included: event.target.checked, statementDay })}
                        className="h-4 w-4 accent-indigo-600"
                      />
                      {t('cycleV2.include')}
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70"><p className="text-[10px] font-bold text-slate-400">{t('cycleV2.thisCycle')}</p><p className="mt-1 whitespace-nowrap text-sm font-black tabular-nums text-slate-900 dark:text-white">{signedCurrency(-currentSpend, formatCurrency)}</p></div>
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70"><p className="text-[10px] font-bold text-slate-400">{t('cycleV2.accumulated')}</p><p className="mt-1 whitespace-nowrap text-sm font-black tabular-nums text-slate-900 dark:text-white">{formatCurrency(Number(forecast?.knownAmount) || 0)}</p></div>
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70"><p className="text-[10px] font-bold text-slate-400">{t('cycleV2.previousBill')}</p><p className="mt-1 whitespace-nowrap text-sm font-black tabular-nums text-slate-900 dark:text-white">{formatCurrency(Number(forecast?.lastStatementAmount) || 0)}</p></div>
                <div className="rounded-2xl bg-indigo-50 p-3 dark:bg-indigo-950/30"><p className="text-[10px] font-bold text-indigo-500">{t('cycleV2.cardForecast')}</p><p className="mt-1 whitespace-nowrap text-sm font-black tabular-nums text-indigo-800 dark:text-indigo-200">{formatCurrency(Number(forecast?.estimatedAmount) || Number(forecast?.knownAmount) || 0)}</p></div>
              </div>

              <details className="mt-3 rounded-2xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200">
                  <SlidersHorizontal className="h-4 w-4 text-indigo-500" />{t('cycleV2.cardSettings')}
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {!passthrough && (
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {t('cycleV2.billingDay')}
                      <select
                        value={statementDay || ''}
                        onChange={(event) => onChange({ source: card.source, accountNumber: card.accountNumber, included, statementDay: Number(event.target.value) })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                      >
                        <option value="" disabled>—</option>
                        {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}</option>)}
                      </select>
                    </label>
                  )}
                  {!passthrough && observedCharges.length > 0 && (
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {t('cycleV2.linkCharge')}
                      <select
                        value=""
                        onChange={(event) => event.target.value && onChange({ source: card.source, accountNumber: card.accountNumber, included, statementDay, linkedTransactionId: Number(event.target.value) })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                      >
                        <option value="">{t('cycleV2.chooseCharge')}</option>
                        {observedCharges.map((event) => <option key={`${event.chargeDate}-${event.txns[0].id}`} value={event.txns[0].id}>{formatCycleDay(event.chargeDate, language)} · {formatCurrency(Math.abs(event.total))}</option>)}
                      </select>
                    </label>
                  )}
                  {card.setting?.linkedTransactionId && <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600"><Check className="h-3.5 w-3.5" />{t('cycleV2.chargeLinked')}</p>}
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
