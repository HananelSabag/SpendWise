import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { formatCycleDay } from '../../../utils/cycleDate';
import { InfoHint } from '../../ui';
import SalaryCandidatePrompt from '../dashboard/SalaryCandidatePrompt';
import WatchedMerchants from './WatchedMerchants';

const STATUS_TONE = {
  scheduled: 'text-emerald-600 dark:text-emerald-400',
  due: 'text-amber-600 dark:text-amber-400',
  late: 'text-rose-600 dark:text-rose-400',
  unknown: 'text-gray-400',
};

const FILTERS = ['all', 'attention', 'salary', 'income', 'charges', 'excluded'];
const DECISIONS_PAGE_SIZE = 12;

function decisionMatchesFilter(decision, filter) {
  if (filter === 'all') return true;
  if (filter === 'attention') return decision.needsAction;
  if (filter === 'salary') return decision.classification === 'salary';
  if (filter === 'income') return ['income', 'refund', 'financing'].includes(decision.classification);
  if (filter === 'charges') return ['expense', 'card_settlement'].includes(decision.classification);
  if (filter === 'excluded') return !decision.included || ['transfer', 'exclude', 'pending'].includes(decision.classification);
  return true;
}

function availableClassifications(decision) {
  return Number(decision.amount) >= 0
    ? ['salary', 'income', 'financing', 'refund', 'transfer', 'exclude']
    : ['expense', 'transfer', 'exclude'];
}

/**
 * One transaction's decision. Its disclosure state is local and seeded once from `needsAction`:
 * because the parent refetches after an override (which flips `needsAction` to false), a
 * reactively-controlled `open` would collapse the row the instant the user acted on it. Keyed by
 * `transactionId` so it is not remounted when its classification changes.
 */
function DecisionRow({ decision, updating, onDecisionChange, onDecisionReset, formatCurrency, t, language }) {
  const [open, setOpen] = useState(Boolean(decision.needsAction));
  const impact = Number(decision.impactAmount) || 0;
  const editableClassifications = availableClassifications(decision);
  const selectedClassification = decision.override || decision.classification;

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className={cn(
        'group/decision rounded-xl border',
        decision.needsAction
          ? 'border-amber-300 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20'
          : 'border-gray-100 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900',
      )}
    >
      <summary className="flex cursor-pointer list-none items-start gap-2 p-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="max-w-full truncate text-xs font-bold text-gray-900 dark:text-white">{decision.description || '—'}</p>
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[9px] font-black',
              decision.automatic
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300'
                : 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
            )}>
              {decision.automatic
                ? t('cycle.control.automatic', { fallback: 'Automatic' })
                : t('cycle.control.manual', { fallback: 'Your override' })}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-gray-400">
            {formatCycleDay(decision.processedDate || decision.date, language)} · {String(decision.source || '').toUpperCase()}
            {decision.accountNumber ? ` ••••${String(decision.accountNumber).slice(-4)}` : ''}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1 text-[9px]">
            <span className="rounded bg-white px-1.5 py-0.5 font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {t(`cycle.control.class.${decision.classification}`, { fallback: decision.classification })}
            </span>
            <span className={cn(
              'rounded px-1.5 py-0.5 font-bold',
              decision.included
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
            )}>
              {decision.included
                ? t('cycle.control.counted', { fallback: 'Counted' })
                : t('cycle.control.notCounted', { fallback: 'Not counted' })}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <p className={cn(
            'text-sm font-black tabular-nums',
            Number(decision.amount) >= 0 ? 'text-emerald-600' : 'text-gray-950 dark:text-white',
          )}>
            {Number(decision.amount) >= 0 ? '+' : '−'}{formatCurrency(Math.abs(Number(decision.amount) || 0))}
          </p>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform group-open/decision:rotate-180" />
        </div>
      </summary>

      {impact !== 0 && (
        <div className="mx-3 flex flex-wrap items-center gap-1.5 border-t border-gray-200/70 pt-2 text-[10px] dark:border-gray-800">
          <span className="rounded-md bg-white px-2 py-1 font-bold tabular-nums text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            {impact > 0 ? '+' : '−'}{formatCurrency(Math.abs(impact))} · {t(`cycle.control.line.${decision.impactLine}`, { fallback: decision.impactLine })}
          </span>
        </div>
      )}

      <p className="mx-3 mt-2 text-[11px] leading-relaxed text-gray-600 dark:text-gray-300">
        {t(`cycle.control.reason.${decision.reason}`, { fallback: decision.reason })}
      </p>
      {decision.linkedTo && (
        <p className="mx-3 mt-1 text-[10px] text-indigo-600 dark:text-indigo-300">
          {t('cycle.control.linkedTo', { fallback: 'Linked to' })} {String(decision.linkedTo.source || '').toUpperCase()}
          {decision.linkedTo.accountNumber ? ` ••••${String(decision.linkedTo.accountNumber).slice(-4)}` : ''} · {formatCycleDay(decision.linkedTo.date, language)}
        </p>
      )}

      {decision.editable && (
        <div className="mx-3 mb-3 mt-3 flex items-center gap-2.5 border-t border-gray-200/70 pt-2 dark:border-gray-800">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{t('cycle.control.changeClass', { fallback: 'Change classification' })}</span>
            <select
              value={selectedClassification}
              disabled={updating}
              onChange={(event) => onDecisionChange?.(decision, event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-[11px] font-semibold text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              {!editableClassifications.includes(selectedClassification) && (
                <option value={selectedClassification} disabled>
                  {t(`cycle.control.class.${selectedClassification}`, { fallback: selectedClassification })}
                </option>
              )}
              {editableClassifications.map((classification) => (
                <option key={classification} value={classification}>
                  {t(`cycle.control.class.${classification}`, { fallback: classification })}
                </option>
              ))}
            </select>
          </label>
          {decision.override && (
            <button
              type="button"
              disabled={updating}
              onClick={() => onDecisionReset?.(decision)}
              className="inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-lg px-2.5 py-2 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('cycle.control.reset', { fallback: 'Automatic' })}
            </button>
          )}
        </div>
      )}
      {!decision.editable && <div className="h-3" />}
    </details>
  );
}

export default function CycleControlTab({
  cycle,
  salaryTracking,
  salaryChange,
  needsReview = [],
  signatures = [],
  formatCurrency,
  t,
  onDecisionChange,
  onDecisionReset,
  isUpdatingDecision = false,
  updatingTransactionId = null,
  onSalarySelected,
  settings = { engineMode: 'automatic', manualAnchorDay: null },
  fundingForecast = { streams: [] },
  onSettingsChange,
  isUpdatingSettings = false,
  language = 'en',
}) {
  const [filter, setFilter] = useState('all');
  const [visibleDecisionCount, setVisibleDecisionCount] = useState(DECISIONS_PAGE_SIZE);
  const decisions = useMemo(() => cycle?.decisions || [], [cycle?.decisions]);
  const filtered = useMemo(
    () => decisions.filter((decision) => decisionMatchesFilter(decision, filter)),
    [decisions, filter],
  );
  const attentionIds = useMemo(() => new Set([
    ...decisions.filter((decision) => decision.needsAction).map((decision) => decision.transactionId),
    ...needsReview.map((item) => item.transactionId),
  ]), [decisions, needsReview]);
  const { automaticCount, includedCount, excludedCount } = useMemo(() => {
    const included = decisions.filter((decision) => decision.included).length;
    return {
      automaticCount: decisions.filter((decision) => decision.automatic).length,
      includedCount: included,
      excludedCount: decisions.length - included,
    };
  }, [decisions]);
  const status = salaryTracking?.status || 'unknown';
  const visibleDecisions = filtered.slice(0, visibleDecisionCount);
  const hiddenDecisionCount = filtered.length - visibleDecisions.length;
  const setupNeedsAttention = status === 'late' || !salaryTracking?.last || salaryChange?.suspected;
  // Seed the disclosure once, then let the user control it — a settings change refetches and could
  // otherwise snap this panel shut mid-interaction.
  const [setupOpen, setSetupOpen] = useState(setupNeedsAttention);

  const changeFilter = (nextFilter) => {
    setFilter(nextFilter);
    setVisibleDecisionCount(DECISIONS_PAGE_SIZE);
  };

  return (
    <div className="space-y-4">
      <details
        open={setupOpen}
        onToggle={(event) => setSetupOpen(event.currentTarget.open)}
        className="group rounded-2xl border border-indigo-200 bg-white dark:border-indigo-900/60 dark:bg-gray-900"
      >
        <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <Clock3 className="h-4 w-4 shrink-0 text-indigo-500" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black text-gray-950 dark:text-white">
              {t('cycle.control.setupTitle', { fallback: 'Cycle setup' })}
            </h2>
            <p className="mt-0.5 truncate text-[11px] text-gray-500">
              {t(`cycle.control.engine.${settings.engineMode}`, { fallback: settings.engineMode })}
              {cycle?.window?.end ? ` · ${formatCycleDay(cycle.window.end, language)}` : ''}
            </p>
          </div>
          {setupNeedsAttention && (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              {t('cycle.control.checkSetup', { fallback: 'Check setup' })}
            </span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
        </summary>

        <div className="border-t border-gray-100 px-4 pb-4 pt-3 dark:border-gray-800">
          <p className="text-[11px] text-gray-500">
            {t('cycle.control.engineHint', { fallback: 'Automatic follows your linked income streams. Manual uses the monthly day you choose.' })}
          </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {['automatic', 'manual'].map((mode) => (
            <button
              key={mode}
              type="button"
              disabled={isUpdatingSettings}
              onClick={() => onSettingsChange?.({
                engineMode: mode,
                manualAnchorDay: mode === 'manual' ? (settings.manualAnchorDay || 10) : null,
              })}
              className={cn(
                'rounded-xl border px-3 py-2 text-start text-xs font-bold transition disabled:opacity-50',
                settings.engineMode === mode
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300'
                  : 'border-gray-200 text-gray-600 hover:border-indigo-300 dark:border-gray-700 dark:text-gray-300',
              )}
            >
              {t(`cycle.control.engine.${mode}`, { fallback: mode === 'automatic' ? 'Automatic' : 'Manual anchor' })}
            </button>
          ))}
        </div>

        {settings.engineMode === 'manual' && (
          <label className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
            <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
              {t('cycle.control.anchorDay', { fallback: 'Reset day each month' })}
            </span>
            <select
              aria-label={t('cycle.control.anchorDay', { fallback: 'Reset day each month' })}
              value={settings.manualAnchorDay || 10}
              disabled={isUpdatingSettings}
              onChange={(event) => onSettingsChange?.({ engineMode: 'manual', manualAnchorDay: Number(event.target.value) })}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-black dark:border-gray-700 dark:bg-gray-900"
            >
              {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
          </label>
        )}

        {settings.engineMode === 'automatic' && fundingForecast.streams?.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 dark:border-gray-800">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">
              {t('cycle.control.detectedStages', { fallback: 'Detected reset stages' })}
            </p>
            {fundingForecast.streams.map((stream) => (
              <div key={`${stream.signatureId}-${stream.expectedDate}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-1 rounded-lg bg-gray-50 px-2.5 py-2 dark:bg-gray-800/60 sm:flex sm:items-center">
                <span className="truncate text-[11px] font-bold text-gray-700 dark:text-gray-200 sm:min-w-0 sm:flex-1">{stream.description}</span>
                <span className="shrink-0 text-[11px] font-black tabular-nums text-emerald-600">+{formatCurrency(stream.expectedAmount)}</span>
                <span className="text-[10px] font-semibold text-gray-500">{formatCycleDay(stream.expectedDate, language)}</span>
                {!stream.primary && <span className="justify-self-end rounded bg-violet-100 px-1.5 py-0.5 text-[8px] font-black text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">{t('cycle.forward.additional', { fallback: 'Additional' })}</span>}
              </div>
            ))}
          </div>
        )}
        </div>
      </details>

      <div className="grid grid-cols-4 divide-x divide-x-reverse rounded-2xl border border-gray-200 bg-white px-1 py-3 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
        {[
          ['automatic', automaticCount],
          ['included', includedCount],
          ['excluded', excludedCount],
          ['attention', attentionIds.size],
        ].map(([key, value]) => (
          <div key={key} className="min-w-0 px-1.5 text-center sm:px-3">
            <p className="text-[9px] font-bold uppercase leading-tight tracking-wide text-gray-400 sm:text-[10px]">
              {t(`cycle.control.summary.${key}`, { fallback: key })}
            </p>
            <p className={cn(
              'mt-1 text-lg font-black tabular-nums sm:text-xl',
              key === 'attention' && value > 0 ? 'text-amber-600' : 'text-gray-950 dark:text-white',
            )}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start gap-3">
          <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-xs font-bold text-gray-900 dark:text-white">
              {t('cycle.salary', { fallback: 'Salary' })}
              <InfoHint title={t('cycle.salary', { fallback: 'Salary' })}>
                {t('cycle.salaryHint', { fallback: 'A received salary closes the prior cycle; additional linked salaries inside the window are still identified as salary.' })}
              </InfoHint>
            </p>
            {salaryTracking?.last ? (
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-xl font-black tabular-nums text-gray-950 dark:text-white">
                  {formatCurrency(salaryTracking.typicalAmount)}
                </p>
                <p className={cn('text-[11px] font-semibold', STATUS_TONE[status])}>
                  {status === 'late'
                    ? t('cycle.salaryLateShort', { fallback: 'Has not arrived' })
                    : `${t('cycle.nextExpected', { fallback: 'Next' })} ${formatCycleDay(salaryTracking.expectedNext, language)}`}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-500">{t('cycle.noSalaryLinked', { fallback: 'No salary linked yet' })}</p>
            )}
            {cycle?.window?.end && (
              <p className="mt-2 rounded-lg bg-gray-50 px-2.5 py-1.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-800/60 dark:text-gray-300">
                {t(settings.engineMode === 'manual' ? 'cycle.control.resetRuleManual' : 'cycle.control.resetRule', {
                  date: formatCycleDay(cycle.window.end, language),
                  fallback: settings.engineMode === 'manual'
                    ? `The next manual window starts around ${formatCycleDay(cycle.window.end, language)}.`
                    : `The primary salary anchors the next window around ${formatCycleDay(cycle.window.end, language)}; every household stage remains visible.`,
                })}
              </p>
            )}
          </div>
        </div>

        <SalaryCandidatePrompt
          formatCurrency={formatCurrency}
          hasSalaryIdentity
          salaryIdentityCount={signatures.length}
          onSelected={onSalarySelected}
        />

        {salaryChange?.suspected && (
          <div className="mt-3 rounded-xl bg-indigo-50 p-3 dark:bg-indigo-950/25">
            <p className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 dark:text-indigo-200">
              <Briefcase className="h-3.5 w-3.5" />
              {t('cycle.jobChange', { fallback: 'Did you change jobs?' })}
            </p>
            {salaryChange.candidates.map((candidate) => (
              <p key={`${candidate.date}-${candidate.description}`} className="mt-1 text-[11px] text-indigo-700 dark:text-indigo-300">
                {formatCycleDay(candidate.date, language)} · {candidate.description} · {formatCurrency(candidate.amount)}
              </p>
            ))}
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start gap-2 px-1 pb-3">
          <SlidersHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black text-gray-950 dark:text-white">
              {t('cycle.control.title', { fallback: 'Engine decisions' })}
            </h2>
            <p className="mt-0.5 text-[11px] text-gray-500">
              {t('cycle.control.subtitle', { fallback: 'Every transaction, its rule, and its exact effect on this cycle.' })}
            </p>
          </div>
          {attentionIds.size > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle className="h-3 w-3" />{attentionIds.size}
            </span>
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          )}
        </div>

        <div className="-mx-3 mb-3 flex snap-x gap-1 overflow-x-auto px-3 pb-1 no-scrollbar">
          {FILTERS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => changeFilter(id)}
              className={cn(
                'shrink-0 snap-start rounded-full px-3 py-2 text-[11px] font-bold transition',
                filter === id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300',
              )}
            >
              {t(`cycle.control.filter.${id}`, { fallback: id })}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {visibleDecisions.map((decision) => (
            <DecisionRow
              key={decision.transactionId}
              decision={decision}
              updating={isUpdatingDecision && Number(updatingTransactionId) === Number(decision.transactionId)}
              onDecisionChange={onDecisionChange}
              onDecisionReset={onDecisionReset}
              formatCurrency={formatCurrency}
              t={t}
              language={language}
            />
          ))}

          {!filtered.length && (
            <p className="py-8 text-center text-xs text-gray-400">
              {t('cycle.control.noDecisions', { fallback: 'No transactions in this filter' })}
            </p>
          )}

          {hiddenDecisionCount > 0 && (
            <button
              type="button"
              onClick={() => setVisibleDecisionCount((count) => count + DECISIONS_PAGE_SIZE)}
              className="w-full rounded-xl border border-dashed border-indigo-200 px-3 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/20"
            >
              {t('cycle.control.showMore', {
                count: Math.min(hiddenDecisionCount, DECISIONS_PAGE_SIZE),
                fallback: `Show ${Math.min(hiddenDecisionCount, DECISIONS_PAGE_SIZE)} more`,
              })}
            </button>
          )}
        </div>
      </section>

      <WatchedMerchants formatCurrency={formatCurrency} />
    </div>
  );
}
