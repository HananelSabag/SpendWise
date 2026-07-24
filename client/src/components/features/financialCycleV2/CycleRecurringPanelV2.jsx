import React, { useMemo, useState } from 'react';
import { Link2, Loader2, Plus, Repeat2, Save, Search } from 'lucide-react';

import { useCycles } from '../../../hooks/useCycles';
import { signedCurrency } from '../../../utils/cycleFormat';
import RecurringTransactionPicker from './RecurringTransactionPicker';

export function selectRecurringCandidates(decisions = []) {
  const sorted = decisions
    .filter((item) => (
      item.editable !== false && Number(item.amount) !== 0
        && !['card_settlement', 'pending'].includes(item.classification)
        && !item.recurrenceGroupId
    ))
    .sort((left, right) => {
      const leftDate = String(left.processedDate || left.date || '');
      const rightDate = String(right.processedDate || right.date || '');
      return rightDate.localeCompare(leftDate)
        || Number(right.overrideTransactionId || right.transactionId || 0)
          - Number(left.overrideTransactionId || left.transactionId || 0);
    });
  const unique = new Map();
  sorted.forEach((item) => {
    const id = String(item.overrideTransactionId || item.transactionId || '');
    if (id && !unique.has(id)) unique.set(id, item);
  });
  return [...unique.values()];
}

function RecurringRule({ group, onUpdate, onLink, formatCurrency, t }) {
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
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={() => onLink(group)} className="flex min-h-9 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200"><Link2 className="h-3.5 w-3.5" />{t('cycleV2.linkAnother')}</button>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">{t('cycleV2.includeForecast')}<input type="checkbox" checked={group.includeInEstimate !== false} onChange={(event) => onUpdate({ groupId: group.id, includeInEstimate: event.target.checked })} className="h-4 w-4 accent-indigo-600" /></label>
        </div>
      </div>
    </article>
  );
}

export default function CycleRecurringPanelV2({ recurringGroups, onRecurringChange, isSavingRecurring, formatCurrency, language, t }) {
  const details = useCycles();
  const [transactionId, setTransactionId] = useState('');
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState('recurring_bill');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState(null);
  const groups = details.recurringGroups?.length ? details.recurringGroups : recurringGroups;
  const candidates = useMemo(() => selectRecurringCandidates(
    details.decisions || [],
  ), [details.decisions]);
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

  const linkRule = (item, group) => {
    if (!group) return;
    details.classifyTransaction({
      transactionId: item.overrideTransactionId || item.transactionId,
      classification: group.recurrenceKind || (Number(item.amount) > 0 ? 'recurring_income' : 'recurring_bill'),
      reason: 'v2_recurring_link',
      recurrenceGroupId: group.id.startsWith('legacy-') ? null : group.id,
      recurrenceLabel: group.label,
      recurrenceIncludeEstimate: group.includeInEstimate !== false,
    });
  };

  const chooseTransaction = (item) => {
    if (linkTarget) {
      linkRule(item, linkTarget);
      setLinkTarget(null);
      return;
    }
    setTransactionId(String(item.overrideTransactionId || item.transactionId));
    setLabel(item.description || '');
    setKind(Number(item.amount) > 0 ? 'recurring_income' : 'recurring_bill');
  };

  const openCreatePicker = () => {
    setLinkTarget(null);
    setPickerOpen(true);
  };

  const openLinkPicker = (group) => {
    setLinkTarget(group);
    setPickerOpen(true);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900 dark:bg-indigo-950/20 sm:p-5">
        <div className="flex items-center gap-2"><Plus className="h-5 w-5 text-indigo-600" /><h2 className="text-lg font-black text-slate-950 dark:text-white">{t('cycleV2.addRecurringTitle')}</h2></div>
        <p className="mt-1 text-xs text-slate-500">{t('cycleV2.addRecurringHint')}</p>
        {details.isLoading ? <div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />{t('cycleV2.loadingTransactions')}</div> : (
          <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <button type="button" onClick={openCreatePicker} className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-start text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Search className="h-4 w-4 shrink-0 text-indigo-500" />
              <span className="min-w-0 flex-1 truncate">{selected ? `${selected.description} · ${signedCurrency(Number(selected.amount), formatCurrency, { signPositive: true })}` : t('cycleV2.chooseRecurringTransaction')}</span>
            </button>
            <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder={t('cycleV2.recurringNamePlaceholder')} maxLength={100} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" />
            <select value={kind} onChange={(event) => setKind(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900">
              {Number(selected?.amount) > 0
                ? <option value="recurring_income">{t('cycleV2.recurringIncome')}</option>
                : <><option value="recurring_bill">{t('cycleV2.recurringExpense')}</option><option value="loan_repayment">{t('cycleV2.loanPayment')}</option><option value="standing_order">{t('cycleV2.standingOrder')}</option></>}
            </select>
            <button type="button" onClick={createRule} disabled={!selected || !label.trim() || details.isUpdatingDecision} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40">{t('cycleV2.add')}</button>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2"><Repeat2 className="h-5 w-5 text-indigo-500" /><h2 className="text-lg font-black text-slate-950 dark:text-white">{t('cycleV2.recurringTitle')}</h2>{(isSavingRecurring || details.isUpdatingDecision) && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}</div>
        <p className="mt-1 text-xs text-slate-500">{t('cycleV2.recurringKnownHint')}</p>
        <div className="mt-3 grid gap-2 lg:grid-cols-2">{(groups || []).map((group) => <RecurringRule key={group.id} group={group} onUpdate={onRecurringChange} onLink={openLinkPicker} formatCurrency={formatCurrency} t={t} />)}{!groups?.length && <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500 dark:border-slate-700">{t('cycleV2.noRecurring')}</p>}</div>
      </section>

      <RecurringTransactionPicker
        isOpen={pickerOpen}
        onClose={() => { setPickerOpen(false); setLinkTarget(null); }}
        onSelect={chooseTransaction}
        candidates={linkTarget
          ? candidates.filter((item) => (
            linkTarget.recurrenceKind === 'recurring_income' ? Number(item.amount) > 0 : Number(item.amount) < 0
          ))
          : candidates}
        formatCurrency={formatCurrency}
        language={language}
        t={t}
        title={linkTarget ? t('cycleV2.linkToRule', { label: linkTarget.label }) : undefined}
        lockedDirection={linkTarget ? (linkTarget.recurrenceKind === 'recurring_income' ? 'income' : 'expense') : null}
      />
    </div>
  );
}
