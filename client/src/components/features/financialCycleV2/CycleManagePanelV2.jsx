import React from 'react';
import { CalendarDays, Check, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../../utils/helpers';
import { formatCycleWindow } from '../../../utils/cycleFormat';
import OverdraftRunwayCard from '../dashboard/OverdraftRunwayCard';
import { CycleScenarioControl, cycleButton, cycleSurface } from './CyclePrimitives';

export default function CycleManagePanelV2({
  settings,
  cycle,
  onSettingsChange,
  onSaveLimit,
  isSavingSettings,
  formatCurrency,
  language,
  t,
}) {
  const manualDay = Number(settings?.manualAnchorDay || cycle?.window?.anchorDay || 10);
  const manual = settings?.engineMode === 'manual';
  return (
    <div className="space-y-4">
      <section className={`${cycleSurface} p-4 sm:p-6`}>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
          <CalendarDays className="h-5 w-5 text-indigo-500" />
          {t('cycleV2.engineTitle')}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t('cycleV2.engineHint')}
        </p>
        <div
          className="mt-5 grid gap-3 sm:grid-cols-2"
          role="group"
          aria-label={t('cycleV2.engineTitle')}
        >
          {[false, true].map((value) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={manual === value}
              disabled={isSavingSettings}
              onClick={() =>
                onSettingsChange(
                  value
                    ? { engineMode: 'manual', manualAnchorDay: manualDay }
                    : { engineMode: 'automatic' },
                )
              }
              className={cn(
                cycleButton,
                'flex items-start gap-3 border p-4 text-start',
                manual === value
                  ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30'
                  : 'border-slate-200 dark:border-slate-700',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                  manual === value
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-300 dark:border-slate-600',
                )}
              >
                {manual === value && <Check className="h-3 w-3" />}
              </span>
              <span>
                <span className="block font-semibold text-slate-900 dark:text-white">
                  {t(value ? 'cycleV2.manualEngine' : 'cycleV2.automaticEngine')}
                </span>
                <span className="mt-1 block text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">
                  {t(value ? 'cycleV2.manualEngineHint' : 'cycleV2.automaticEngineHint')}
                </span>
              </span>
            </button>
          ))}
        </div>
        {manual && (
          <label className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-950/50 dark:text-slate-200">
            <span>
              {t('cycleV2.manualDay')}
              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                {t('cycleV2.shortMonthHint')}
              </span>
            </span>
            <select
              value={manualDay}
              disabled={isSavingSettings}
              onChange={(event) =>
                onSettingsChange({
                  engineMode: 'manual',
                  manualAnchorDay: Number(event.target.value),
                })
              }
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-base dark:border-slate-700 dark:bg-slate-900"
            >
              {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>
        )}
        <p role="status" className="mt-4 text-sm text-indigo-700 dark:text-indigo-300">
          {isSavingSettings
            ? t('cycleV2.saving')
            : cycle
              ? `${t('cycleV2.currentWindow')}: ${formatCycleWindow(cycle.window, language)}`
              : t('cycleV2.anchorHint')}
        </p>
        <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
          {t('cycleV2.engineSettingsNote')}
        </p>
      </section>
      <section className={`${cycleSurface} p-4 sm:p-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-lg">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
              <SlidersHorizontal className="h-5 w-5 text-indigo-500" />
              {t('cycleV2.defaultScenario')}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t('cycleV2.scenarioHelp')}
            </p>
          </div>
          <CycleScenarioControl
            useEstimates={settings?.useEstimates !== false}
            onChange={(useEstimates) => onSettingsChange({ useEstimates })}
            isSaving={isSavingSettings}
            t={t}
          />
        </div>
      </section>
      <OverdraftRunwayCard
        cycle={cycle}
        settings={settings}
        formatCurrency={formatCurrency}
        t={t}
        onSaveLimit={onSaveLimit}
        isSaving={isSavingSettings}
      />
    </div>
  );
}
