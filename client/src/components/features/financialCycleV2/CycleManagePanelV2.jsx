import React, { useState } from 'react';
import { AlertCircle, Check, Link2, Loader2, Repeat2, Save, Settings2 } from 'lucide-react';

import { useCycles } from '../../../hooks/useCycles';
import { formatCycleDay } from '../../../utils/cycleDate';
import { signedCurrency } from '../../../utils/cycleFormat';

function RecurringRule({ group, onUpdate, formatCurrency, t }) {
  const [label, setLabel] = useState(group.label || '');
  const changed = label.trim() && label.trim() !== group.label;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Repeat2 className="h-4 w-4 shrink-0 text-indigo-500" />
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          maxLength={100}
          className="min-w-0 flex-1 rounded-xl border border-transparent bg-slate-50 px-3 py-2 text-sm font-black text-slate-900 outline-none focus:border-indigo-300 dark:bg-slate-800 dark:text-white"
          aria-label={t('cycleV2.ruleName')}
        />
        <button
          type="button"
          disabled={!changed}
          onClick={() => onUpdate({ groupId: group.id, label: label.trim() })}
          className="rounded-xl bg-indigo-600 p-2 text-white disabled:opacity-25"
          aria-label={t('cycleV2.saveName')}
        ><Save className="h-4 w-4" /></button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] text-slate-400">{t('cycleV2.matches', { count: group.matchers?.length || 0 })}</p>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
          {t('cycleV2.includeForecast')}
          <input
            type="checkbox"
            checked={group.includeInEstimate !== false}
            onChange={(event) => onUpdate({ groupId: group.id, includeInEstimate: event.target.checked })}
            className="h-4 w-4 accent-indigo-600"
          />
        </label>
      </div>
      {Number.isFinite(Number(group.amount)) && <p className="mt-2 text-xs font-black tabular-nums">{signedCurrency(Number(group.amount), formatCurrency)}</p>}
    </div>
  );
}

function DecisionRow({ item, groups, onClassify, onReset, busy, formatCurrency, language, t }) {
  const transactionId = item.overrideTransactionId || item.transactionId;
  const positive = Number(item.amount) > 0;
  const value = item.override ? item.classification : 'automatic';

  const changeClass = (next) => {
    if (next === 'automatic') return onReset({ transactionId });
    onClassify({ transactionId, classification: next, reason: `v2_control:${item.reason || 'user'}` });
  };

  const linkGroup = (groupId) => {
    if (!groupId) return;
    const group = groups.find((candidate) => candidate.id === groupId);
    if (!group) return;
    onClassify({
      transactionId,
      classification: positive ? 'recurring_income' : 'recurring_bill',
      reason: 'v2_recurring_link',
      recurrenceGroupId: group.id.startsWith('legacy-') ? null : group.id,
      recurrenceLabel: group.label,
      recurrenceIncludeEstimate: group.includeInEstimate !== false,
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {item.needsAction && <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />}
            <p className="truncate text-sm font-black text-slate-900 dark:text-white">{item.description || '—'}</p>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{formatCycleDay(item.processedDate || item.date, language)} · {item.source?.toUpperCase()} {item.accountNumber ? `••••${item.accountNumber}` : ''}</p>
        </div>
        <p className={`shrink-0 whitespace-nowrap text-sm font-black tabular-nums ${positive ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>{signedCurrency(Number(item.amount), formatCurrency, { signPositive: true })}</p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select value={value} disabled={busy || item.editable === false} onChange={(event) => changeClass(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-800">
          <option value="automatic">{t('cycleV2.automaticDecision')}</option>
          {positive ? (
            <><option value="salary">{t('cycleV2.salary')}</option><option value="income">{t('cycleV2.otherIncome')}</option><option value="financing">{t('cycleV2.financing')}</option><option value="refund">{t('cycleV2.refund')}</option></>
          ) : (
            <><option value="expense">{t('cycleV2.expense')}</option><option value="recurring_bill">{t('cycleV2.recurringExpense')}</option></>
          )}
          <option value="transfer">{t('cycleV2.transfer')}</option>
          <option value="exclude">{t('cycleV2.exclude')}</option>
        </select>
        {groups.length > 0 && (
          <label className="relative">
            <Link2 className="pointer-events-none absolute start-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <select value="" disabled={busy} onChange={(event) => linkGroup(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pe-3 ps-8 text-xs font-bold dark:border-slate-700 dark:bg-slate-800">
              <option value="">{t('cycleV2.linkRecurring')}</option>
              {groups.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}

export default function CycleManagePanelV2({
  settings,
  cycle,
  recurringGroups,
  onSettingsChange,
  onRecurringChange,
  isSavingSettings,
  isSavingRecurring,
  formatCurrency,
  language,
  t,
}) {
  const details = useCycles();
  const [filter, setFilter] = useState('action');
  const manualDay = Number(settings?.manualAnchorDay || cycle?.window?.anchorDay || 10);

  const rows = details.current?.decisions || [];
  const decisions = (filter === 'action' ? rows.filter((item) => item.needsAction) : rows).slice(0, 40);
  const groups = details.recurringGroups?.length ? details.recurringGroups : recurringGroups;

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-indigo-500" /><h2 className="text-lg font-black text-slate-950 dark:text-white">{t('cycleV2.engineTitle')}</h2>{isSavingSettings && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}</div>
        <p className="mt-1 text-xs text-slate-500">{t('cycleV2.engineHint')}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
          <button type="button" onClick={() => onSettingsChange({ engineMode: 'automatic' })} className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${settings?.engineMode !== 'manual' ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-300' : 'text-slate-500'}`}>{t('cycleV2.automaticEngine')}</button>
          <button type="button" onClick={() => onSettingsChange({ engineMode: 'manual', manualAnchorDay: manualDay })} className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${settings?.engineMode === 'manual' ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-300' : 'text-slate-500'}`}>{t('cycleV2.manualEngine')}</button>
        </div>
        {settings?.engineMode === 'manual' && (
          <label className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold dark:border-slate-800 dark:bg-slate-900">
            {t('cycleV2.manualDay')}
            <select value={manualDay} onChange={(event) => onSettingsChange({ engineMode: 'manual', manualAnchorDay: Number(event.target.value) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
              {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
          </label>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2"><Repeat2 className="h-5 w-5 text-indigo-500" /><h2 className="text-lg font-black text-slate-950 dark:text-white">{t('cycleV2.recurringTitle')}</h2>{isSavingRecurring && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}</div>
        <p className="mt-1 text-xs text-slate-500">{t('cycleV2.recurringHint')}</p>
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {(groups || []).map((group) => <RecurringRule key={group.id} group={group} onUpdate={onRecurringChange} formatCurrency={formatCurrency} t={t} />)}
          {!groups?.length && <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500 dark:border-slate-700">{t('cycleV2.noRecurring')}</p>}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-lg font-black text-slate-950 dark:text-white">{t('cycleV2.decisionsTitle')}</h2><p className="mt-1 text-xs text-slate-500">{t('cycleV2.decisionsHint')}</p></div>
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800"><button type="button" onClick={() => setFilter('action')} className={`rounded-lg px-3 py-1.5 text-[11px] font-black ${filter === 'action' ? 'bg-white shadow-sm dark:bg-slate-950' : 'text-slate-500'}`}>{t('cycleV2.needsAction')}</button><button type="button" onClick={() => setFilter('all')} className={`rounded-lg px-3 py-1.5 text-[11px] font-black ${filter === 'all' ? 'bg-white shadow-sm dark:bg-slate-950' : 'text-slate-500'}`}>{t('cycleV2.allTransactions')}</button></div>
        </div>
        {details.isLoading ? <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-slate-50 p-8 text-sm text-slate-500 dark:bg-slate-900"><Loader2 className="h-4 w-4 animate-spin" />{t('cycleV2.loadingControl')}</div> : (
          <div className="mt-3 space-y-2">
            {decisions.map((item) => <DecisionRow key={item.transactionId} item={item} groups={groups || []} onClassify={details.classifyTransaction} onReset={details.resetTransactionClassification} busy={details.isUpdatingDecision && details.updatingTransactionId === (item.overrideTransactionId || item.transactionId)} formatCurrency={formatCurrency} language={language} t={t} />)}
            {!decisions.length && <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 p-6 text-sm font-bold text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-300"><Check className="h-4 w-4" />{filter === 'action' ? t('cycleV2.noAction') : t('cycleV2.noDecisions')}</div>}
          </div>
        )}
      </section>
    </div>
  );
}
