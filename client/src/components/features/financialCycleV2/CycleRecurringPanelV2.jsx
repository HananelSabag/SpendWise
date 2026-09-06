import React, { useMemo, useState } from 'react';
import { ChevronDown, Link2, Loader2, Plus, Repeat2, Save, Search, Trash2 } from 'lucide-react';
import { useCycles } from '../../../hooks/useCycles';
import { formatCycleDay } from '../../../utils/cycleDate';
import { cardShortName, signedCurrency } from '../../../utils/cycleFormat';
import { cn } from '../../../utils/helpers';
import { CycleEmpty, CycleMoney, cycleButton, cycleSurface } from './CyclePrimitives';
import RecurringTransactionPicker from './RecurringTransactionPicker';

export function selectRecurringCandidates(decisions = []) {
  const sorted = decisions
    .filter(
      (item) =>
        item.editable !== false &&
        Number(item.amount) !== 0 &&
        !['card_settlement', 'pending'].includes(item.classification) &&
        !item.recurrenceGroupId,
    )
    .sort(
      (left, right) =>
        String(right.processedDate || right.date || '').localeCompare(
          String(left.processedDate || left.date || ''),
        ) ||
        Number(right.overrideTransactionId || right.transactionId || 0) -
          Number(left.overrideTransactionId || left.transactionId || 0),
    );
  const unique = new Map();
  sorted.forEach((item) => {
    const id = String(item.overrideTransactionId || item.transactionId || '');
    if (id && !unique.has(id)) unique.set(id, item);
  });
  return [...unique.values()];
}

function RecurringRule({ group, onUpdate, onLink, isSaving, formatCurrency, language, t }) {
  const [draft, setDraft] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const label = draft ?? group.label;
  const changed = label?.trim() && label.trim() !== group.label;
  const income = group.recurrenceKind === 'recurring_income';
  const included = group.includeInEstimate !== false;
  return (
    <article className={cn(cycleSurface, 'p-4 sm:p-5')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
            {t(
              income
                ? 'cycleV2.recurringIncome'
                : group.recurrenceKind === 'loan_repayment'
                  ? 'cycleV2.loanPayment'
                  : 'cycleV2.recurringExpense',
            )}
          </p>
          <h3 className="mt-1 break-words text-base font-semibold text-slate-950 dark:text-white">
            {group.label}
          </h3>
        </div>
        <Repeat2 className="h-5 w-5 shrink-0 text-slate-400" />
      </div>
      <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
        <span>{t(included ? 'cycleV2.ruleIncluded' : 'cycleV2.rulePaused')}</span>
        <input
          type="checkbox"
          checked={included}
          disabled={isSaving}
          onChange={(event) =>
            onUpdate({ groupId: group.id, includeInEstimate: event.target.checked })
          }
          className="h-5 w-5 shrink-0 accent-indigo-600"
        />
      </label>
      <details className="group mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400 [&::-webkit-details-marker]:hidden">
          <span>{t('cycleV2.ruleDetails', { count: group.matchers?.length || 0 })}</span>
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
        </summary>
        <div className="space-y-3 pb-1 pt-2">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('cycleV2.ruleName')}
            <span className="mt-1 flex gap-2">
              <input
                value={label || ''}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={100}
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="button"
                disabled={!changed || isSaving}
                onClick={() => onUpdate({ groupId: group.id, label: label.trim() })}
                className={`${cycleButton} bg-indigo-600 text-white`}
                aria-label={t('cycleV2.saveName')}
              >
                <Save className="h-4 w-4" />
              </button>
            </span>
          </label>
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            {t('cycleV2.linkedEvidenceHint')}
          </p>
          {(group.matchers || []).map((matcher) => (
            <div
              key={matcher.transactionId}
              className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/50"
            >
              <p className="break-words text-sm text-slate-700 dark:text-slate-200">
                {matcher.description}
              </p>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  <bdi>
                    {cardShortName(matcher.source)} · {matcher.accountLast4}
                  </bdi>
                  {matcher.date && ` · ${formatCycleDay(matcher.date, language)}`}
                </span>
                {matcher.amount != null && (
                  <CycleMoney
                    value={Number(matcher.amount)}
                    formatCurrency={formatCurrency}
                    signed
                  />
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onLink(group)}
            className={`${cycleButton} flex w-full items-center justify-center gap-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300`}
          >
            <Link2 className="h-4 w-4" />
            {t('cycleV2.linkAnother')}
          </button>
          {confirmRemove ? (
            <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-950/30">
              <p className="text-xs leading-5 text-rose-800 dark:text-rose-200">
                {t('cycleV2.removeRuleHint')}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => onUpdate({ groupId: group.id, active: false })}
                  className={`${cycleButton} bg-rose-600 text-white`}
                >
                  {t('cycleV2.removeRule')}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(false)}
                  className={`${cycleButton} text-slate-600 dark:text-slate-300`}
                >
                  {t('cycleV2.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setConfirmRemove(true)}
              className={`${cycleButton} flex items-center gap-2 text-slate-500 hover:text-rose-600 dark:text-slate-400`}
            >
              <Trash2 className="h-4 w-4" />
              {t('cycleV2.removeRule')}
            </button>
          )}
        </div>
      </details>
    </article>
  );
}

export default function CycleRecurringPanelV2({
  recurringGroups,
  onRecurringChange,
  isSavingRecurring,
  formatCurrency,
  language,
  t,
}) {
  const details = useCycles();
  const [selected, setSelected] = useState(null);
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState('recurring_bill');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState(null);
  const [saved, setSaved] = useState(false);
  const groups =
    details.status === 'loading' ? recurringGroups || [] : details.recurringGroups || [];
  const candidates = useMemo(
    () => selectRecurringCandidates(details.decisions || []),
    [details.decisions],
  );
  const busy = isSavingRecurring || details.isUpdatingDecision;
  const createRule = async (event) => {
    event.preventDefault();
    if (!selected || !label.trim() || busy) return;
    try {
      await details.classifyTransactionAsync({
        transactionId: selected.overrideTransactionId || selected.transactionId,
        classification: kind,
        reason: 'v2_recurring_create',
        recurrenceLabel: label.trim(),
        recurrenceIncludeEstimate: true,
      });
      setSelected(null);
      setLabel('');
      setSaved(true);
    } catch (_) {
      /* The hook shows the error; keep the draft available for retry. */
    }
  };
  const chooseTransaction = (item) => {
    setSaved(false);
    if (linkTarget) {
      details.classifyTransaction({
        transactionId: item.overrideTransactionId || item.transactionId,
        classification:
          linkTarget.recurrenceKind ||
          (Number(item.amount) > 0 ? 'recurring_income' : 'recurring_bill'),
        reason: 'v2_recurring_link',
        recurrenceGroupId: linkTarget.id.startsWith('legacy-') ? null : linkTarget.id,
        recurrenceLabel: linkTarget.label,
        recurrenceIncludeEstimate: linkTarget.includeInEstimate !== false,
      });
      return;
    }
    setSelected(item);
    setLabel(item.description || '');
    setKind(Number(item.amount) > 0 ? 'recurring_income' : 'recurring_bill');
  };
  const openPicker = (group = null) => {
    setLinkTarget(group);
    setPickerOpen(true);
  };
  const fieldClass =
    'mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
            {t('cycleV2.recurringTitle')}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            {t('cycleV2.recurringKnownHint')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openPicker()}
          disabled={details.isLoading || details.isError || busy}
          className={`${cycleButton} flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700`}
        >
          <Plus className="h-4 w-4" />
          {t('cycleV2.addRecurringTitle')}
        </button>
      </div>
      {details.isLoading && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('cycleV2.loadingTransactions')}
        </p>
      )}
      {details.isError && (
        <CycleEmpty title={t('cycleV2.loadTransactionsError')}>
          <button
            type="button"
            onClick={() => details.refetch()}
            className={`${cycleButton} bg-indigo-600 text-white`}
          >
            {t('cycleV2.tryAgain')}
          </button>
        </CycleEmpty>
      )}
      {selected && (
        <form
          onSubmit={createRule}
          className="rounded-3xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900 dark:bg-indigo-950/20 sm:p-5"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {t('cycleV2.newRecurring')}
          </h3>
          <button
            type="button"
            disabled={busy}
            onClick={() => openPicker()}
            className={`${cycleButton} mt-3 flex w-full items-start gap-2 bg-white text-start text-slate-700 dark:bg-slate-900 dark:text-slate-200`}
          >
            <Search className="mt-1 h-4 w-4 shrink-0 text-indigo-500" />
            <span className="min-w-0 flex-1 break-words">{selected.description}</span>
            <bdi dir="ltr" className="shrink-0 text-sm">
              {signedCurrency(Number(selected.amount), formatCurrency, { signPositive: true })}
            </bdi>
          </button>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {t('cycleV2.ruleName')}
              <input
                value={label}
                disabled={busy}
                onChange={(event) => setLabel(event.target.value)}
                maxLength={100}
                required
                className={fieldClass}
              />
            </label>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {t('cycleV2.recurringType')}
              <select
                value={kind}
                disabled={busy}
                onChange={(event) => setKind(event.target.value)}
                className={fieldClass}
              >
                {Number(selected.amount) > 0 ? (
                  <option value="recurring_income">{t('cycleV2.recurringIncome')}</option>
                ) : (
                  <>
                    <option value="recurring_bill">{t('cycleV2.recurringExpense')}</option>
                    <option value="loan_repayment">{t('cycleV2.loanPayment')}</option>
                    <option value="standing_order">{t('cycleV2.standingOrder')}</option>
                  </>
                )}
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
            {t('cycleV2.addRecurringHint')}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={!label.trim() || busy}
              className={`${cycleButton} bg-indigo-600 text-white`}
            >
              {t(busy ? 'cycleV2.saving' : 'cycleV2.saveRecurring')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setSelected(null)}
              className={`${cycleButton} text-slate-600 dark:text-slate-300`}
            >
              {t('cycleV2.cancel')}
            </button>
          </div>
        </form>
      )}
      {saved && (
        <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {t('cycleV2.recurringSaved')}
        </p>
      )}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <RecurringRule
            key={group.id}
            group={group}
            onUpdate={onRecurringChange}
            onLink={openPicker}
            isSaving={busy}
            formatCurrency={formatCurrency}
            language={language}
            t={t}
          />
        ))}
      </div>
      {!groups.length && !details.isLoading && !details.isError && (
        <CycleEmpty title={t('cycleV2.noRecurring')} hint={t('cycleV2.noRecurringHint')} />
      )}
      {pickerOpen && (
        <RecurringTransactionPicker
          isOpen
          onClose={() => {
            setPickerOpen(false);
            setLinkTarget(null);
          }}
          onSelect={chooseTransaction}
          candidates={
            linkTarget
              ? candidates.filter((item) =>
                  linkTarget.recurrenceKind === 'recurring_income'
                    ? Number(item.amount) > 0
                    : Number(item.amount) < 0,
                )
              : candidates
          }
          formatCurrency={formatCurrency}
          language={language}
          t={t}
          title={linkTarget ? t('cycleV2.linkToRule', { label: linkTarget.label }) : undefined}
          lockedDirection={
            linkTarget
              ? linkTarget.recurrenceKind === 'recurring_income'
                ? 'income'
                : 'expense'
              : null
          }
        />
      )}
    </div>
  );
}
