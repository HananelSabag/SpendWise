import React, { useState } from 'react';
import { Check, Link2, Loader2, Plus, Repeat2, Save } from 'lucide-react';

import { useCycles } from '../../../hooks/useCycles';
import { formatCycleDay } from '../../../utils/cycleDate';
import { signedCurrency } from '../../../utils/cycleFormat';

export function selectRecurringCandidates(decisions = []) {
  return decisions
    .filter((item) => (
      item.editable !== false && Number(item.amount) < 0 && item.classification !== 'card_settlement'
        && !item.recurrenceGroupId
    ))
    .sort((left, right) => {
      const leftDate = String(left.processedDate || left.date || '');
      const rightDate = String(right.processedDate || right.date || '');
      return rightDate.localeCompare(leftDate)
        || Number(right.overrideTransactionId || right.transactionId || 0)
          - Number(left.overrideTransactionId || left.transactionId || 0);
    })
    .slice(0, 80);
}

function RecurringRule({ group, onUpdate, formatCurrency, t }) {
  const [label, setLabel] = useState(group.label || '');
  const changed = label.trim() && label.trim() !== group.label;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Repeat2 className="h-4 w-4 shrink-0 text-indigo-500" />
        <input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={100} className="min-w-0 flex-1 rounded-xl border border-transparent bg-slate-50 px-3 py-2 text-sm font-black text-slate-900 outline-none focus:border-indigo-300 dark:bg-slate-800 dark:text-white" aria-label={t('cycleV2.ruleName')} />
        <button type="button" disabled={!changed} onClick={() => onUpdate({ groupId: group.id, label: label.trim() })} className="rounded-xl bg-indigo-600 p-2 text-white disabled:opacity-25" aria-label={t('cycleV2.saveName')}><Save className="h-4 w-4" /></button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div><p className="text-[11px] text-slate-400">{t('cycleV2.matches', { count: group.matchers?.length || 0 })}</p>{Number.isFinite(Number(group.amount)) && <p className="mt-1 text-xs font-black tabular-nums">{signedCurrency(Number(group.amount), formatCurrency)}</p>}</div>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">{t('cycleV2.includeKnown')}<input type="checkbox" checked={group.includeInEstimate !== false} onChange={(event) => onUpdate({ groupId: group.id, includeInEstimate: event.target.checked })} className="h-4 w-4 accent-indigo-600" /></label>
      </div>
    </article>
  );
}

export default function CycleRecurringPanelV2({ recurringGroups, onRecurringChange, isSavingRecurring, formatCurrency, language, t }) {
  const details = useCycles();
  const [transactionId, setTransactionId] = useState('');
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState('recurring_bill');
  const groups = details.recurringGroups?.length ? details.recurringGroups : recurringGroups;
  const candidates = selectRecurringCandidates(details.current?.decisions);
  const selected = candidates.find((item) => String(item.overrideTransactionId || item.transactionId) === transactionId);

  const createRule = () => {
    if (!selected || !label.trim()) return;
    details.classifyTransaction({
      transactionId: selected.overrideTransactionId || selected.transactionId,
      classification: kind,
      reason: 'v2_recurring_create',
      recurrenceLabel: label.trim(),
      recurrenceIncludeEstimate: true,
    });
    setTransactionId('');
    setLabel('');
  };

  const linkRule = (item, groupId) => {
    const group = groups.find((candidate) => candidate.id === groupId);
    if (!group) return;
    details.classifyTransaction({
      transactionId: item.overrideTransactionId || item.transactionId,
      classification: 'recurring_bill',
      reason: 'v2_recurring_link',
      recurrenceGroupId: group.id.startsWith('legacy-') ? null : group.id,
      recurrenceLabel: group.label,
      recurrenceIncludeEstimate: group.includeInEstimate !== false,
    });
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900 dark:bg-indigo-950/20 sm:p-5">
        <div className="flex items-center gap-2"><Plus className="h-5 w-5 text-indigo-600" /><h2 className="text-lg font-black text-slate-950 dark:text-white">{t('cycleV2.addRecurringTitle')}</h2></div>
        <p className="mt-1 text-xs text-slate-500">{t('cycleV2.addRecurringHint')}</p>
        {details.isLoading ? <div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />{t('cycleV2.loadingTransactions')}</div> : (
          <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <select value={transactionId} onChange={(event) => { setTransactionId(event.target.value); const item = candidates.find((candidate) => String(candidate.overrideTransactionId || candidate.transactionId) === event.target.value); if (item && !label) setLabel(item.description || ''); }} className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"><option value="">{t('cycleV2.chooseRecurringTransaction')}</option>{candidates.map((item) => <option key={item.overrideTransactionId || item.transactionId} value={item.overrideTransactionId || item.transactionId}>{formatCycleDay(item.processedDate || item.date, language)} · {item.description} · {formatCurrency(Math.abs(Number(item.amount)))}</option>)}</select>
            <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder={t('cycleV2.recurringNamePlaceholder')} maxLength={100} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" />
            <select value={kind} onChange={(event) => setKind(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"><option value="recurring_bill">{t('cycleV2.recurringExpense')}</option><option value="loan_repayment">{t('cycleV2.loanPayment')}</option><option value="standing_order">{t('cycleV2.standingOrder')}</option></select>
            <button type="button" onClick={createRule} disabled={!selected || !label.trim() || details.isUpdatingDecision} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40">{t('cycleV2.add')}</button>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2"><Repeat2 className="h-5 w-5 text-indigo-500" /><h2 className="text-lg font-black text-slate-950 dark:text-white">{t('cycleV2.recurringTitle')}</h2>{(isSavingRecurring || details.isUpdatingDecision) && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}</div>
        <p className="mt-1 text-xs text-slate-500">{t('cycleV2.recurringKnownHint')}</p>
        <div className="mt-3 grid gap-2 lg:grid-cols-2">{(groups || []).map((group) => <RecurringRule key={group.id} group={group} onUpdate={onRecurringChange} formatCurrency={formatCurrency} t={t} />)}{!groups?.length && <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500 dark:border-slate-700">{t('cycleV2.noRecurring')}</p>}</div>
      </section>

      {groups?.length > 0 && candidates.length > 0 && (
        <section>
          <h2 className="text-base font-black text-slate-950 dark:text-white">{t('cycleV2.linkMoreTitle')}</h2><p className="mt-1 text-xs text-slate-500">{t('cycleV2.linkMoreHint')}</p>
          <div className="mt-3 space-y-2">{candidates.slice(0, 20).map((item) => <div key={item.overrideTransactionId || item.transactionId} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-slate-900 dark:text-white">{item.description}</p><p className="mt-0.5 text-[10px] text-slate-400">{formatCycleDay(item.processedDate || item.date, language)} · {signedCurrency(Number(item.amount), formatCurrency)}</p></div><label className="relative"><Link2 className="pointer-events-none absolute start-3 top-2.5 h-3.5 w-3.5 text-slate-400" /><select value="" disabled={details.isUpdatingDecision} onChange={(event) => linkRule(item, event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pe-3 ps-8 text-xs font-bold dark:border-slate-700 dark:bg-slate-800"><option value="">{t('cycleV2.linkRecurring')}</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}</select></label></div>)}</div>
        </section>
      )}
      {!details.isLoading && !candidates.length && <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 p-6 text-sm font-bold text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-300"><Check className="h-4 w-4" />{t('cycleV2.noRecurringCandidates')}</div>}
    </div>
  );
}
