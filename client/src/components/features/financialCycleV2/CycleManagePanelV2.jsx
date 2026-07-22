import React from 'react';
import { Loader2, Settings2 } from 'lucide-react';

export default function CycleManagePanelV2({ settings, cycle, onSettingsChange, isSavingSettings, t }) {
  const manualDay = Number(settings?.manualAnchorDay || cycle?.window?.anchorDay || 10);
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-indigo-500" /><h2 className="text-lg font-black text-slate-950 dark:text-white">{t('cycleV2.engineTitle')}</h2>{isSavingSettings && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}</div>
      <p className="mt-1 text-xs text-slate-500">{t('cycleV2.engineHint')}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
        <button type="button" onClick={() => onSettingsChange({ engineMode: 'automatic' })} className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${settings?.engineMode !== 'manual' ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-300' : 'text-slate-500'}`}>{t('cycleV2.automaticEngine')}</button>
        <button type="button" onClick={() => onSettingsChange({ engineMode: 'manual', manualAnchorDay: manualDay })} className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${settings?.engineMode === 'manual' ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-300' : 'text-slate-500'}`}>{t('cycleV2.manualEngine')}</button>
      </div>
      {settings?.engineMode === 'manual' && <label className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold dark:border-slate-800 dark:bg-slate-950">{t('cycleV2.manualDay')}<select value={manualDay} onChange={(event) => onSettingsChange({ engineMode: 'manual', manualAnchorDay: Number(event.target.value) })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">{Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}</option>)}</select></label>}
      <p className="mt-4 rounded-2xl bg-indigo-50 p-3 text-xs text-indigo-800 dark:bg-indigo-950/25 dark:text-indigo-200">{t('cycleV2.engineSettingsNote')}</p>
    </section>
  );
}
