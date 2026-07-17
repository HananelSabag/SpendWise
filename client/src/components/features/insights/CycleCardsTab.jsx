/**
 * One row per card, showing how it actually reaches the bank.
 *
 * A credit card lumps a month of purchases into a single debit on its statement day; a debit
 * card sends every purchase through on its own. We detect which from the bank's own lines
 * rather than assuming (FINANCIAL_CYCLE_SPEC.md §2a), and this tab makes that visible — a user
 * comparing us against their statement should see exactly the same shape.
 */

import React from 'react';
import { AlertTriangle, CreditCard } from 'lucide-react';

import { InfoHint } from '../../ui';

const SOURCE_NAME = { max: 'MAX', visa_cal: 'CAL', isracard: 'Isracard', amex: 'Amex' };

export default function CycleCardsTab({ cycle, formatCurrency, t }) {
  const cards = cycle?.cards || [];
  const events = cycle?.expenses?.events || [];
  const unreconciled = cycle?.unreconciledCardEvents || [];

  const totalFor = (card) => events
    .filter((e) => e.source === card.source && e.accountNumber === card.accountNumber)
    .reduce((sum, e) => sum + Number(e.total || 0), 0);

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
        return (
          <div key={`${card.source}-${card.accountNumber}`} className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="rounded-xl bg-violet-50 p-2 text-violet-500 dark:bg-violet-950/25"><CreditCard className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                    {SOURCE_NAME[card.source] || card.source} ••••{String(card.accountNumber || '').slice(-4)}
                  </p>
                  <p className="flex items-center gap-1 text-[11px] text-gray-400">
                    {passthrough
                      ? t('cycle.modeDebit', { fallback: 'Debit — each purchase goes through on its own' })
                      : day
                        ? `${t('cycle.billedOn', { fallback: 'Billed on the' })} ${day}`
                        : t('cycle.modeUnknown', { fallback: 'No billing day detected yet' })}
                    <InfoHint title={t('cycle.howItSettles', { fallback: 'How it settles' })}>
                      {passthrough
                        ? t('cycle.modeDebitHint', { fallback: 'Every purchase hits your account separately, so there is no monthly bill to wait for.' })
                        : t('cycle.modeCreditHint', { fallback: 'Purchases pile up and leave your account as one charge on this day. Foreign purchases often go through immediately instead.' })}
                    </InfoHint>
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-lg font-black tabular-nums text-gray-900 dark:text-white">
                {formatCurrency(totalFor(card))}
              </p>
            </div>
          </div>
        );
      })}

      {!cards.length && (
        <p className="py-8 text-center text-sm text-gray-500">{t('cycle.noCards', { fallback: 'No cards connected' })}</p>
      )}
    </div>
  );
}
