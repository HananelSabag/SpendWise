import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Save, Target } from 'lucide-react';

import transactionAPI from '../../../api/transactions';
import { useTranslation } from '../../../stores';

const emptySettings = {
  enabled: false,
  expectedIncome: '',
  expectedIncomeDate: '',
  expectedCharge: '',
  expectedChargeDate: '',
  expectedChargeLabel: '',
};

function toDraft(settings = {}) {
  return {
    enabled: settings.enabled === true,
    expectedIncome: settings.expectedIncome ?? '',
    expectedIncomeDate: settings.expectedIncomeDate || '',
    expectedCharge: settings.expectedCharge ?? '',
    expectedChargeDate: settings.expectedChargeDate || '',
    expectedChargeLabel: settings.expectedChargeLabel || '',
  };
}

function Field({ label, type = 'text', value, onChange, min, step }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-gray-500">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} min={min} step={step} className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-950" />
    </label>
  );
}

export default function RunwayProjectionPlanner({ runway, formatCurrency, onSaved }) {
  const { t } = useTranslation('dashboard');
  const projection = runway?.projection;
  const current = runway?.current;
  const [draft, setDraft] = useState(emptySettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => setDraft(toDraft(projection?.settings)), [projection?.settings]);
  const planned = draft.enabled ? Number(draft.expectedCharge) || 0 : 0;
  const expectedRemaining = (current?.expected?.remainingKnown ?? current?.money?.spentPending ?? 0) + planned;
  const manualExpectedIncome = draft.enabled && draft.expectedIncome !== ''
    ? Number(draft.expectedIncome) || 0 : null;
  const expectedIncome = manualExpectedIncome ?? (Number(projection?.expectedIncome?.amount) || 0);
  const automaticSalaries = projection?.expectedIncome?.source === 'automatic_salary_history'
    ? projection.expectedIncome.entries || [] : [];
  const preview = useMemo(() => current?.checkingBalance == null ? null : current.checkingBalance + expectedIncome - expectedRemaining, [current?.checkingBalance, expectedIncome, expectedRemaining]);
  if (!current || !projection) return null;

  const update = (key, value) => setDraft((previous) => ({ ...previous, [key]: value }));
  const save = async () => {
    setSaving(true);
    setMessage('');
    const result = await transactionAPI.updateCycleProjection({
      ...draft,
      expectedIncome: draft.expectedIncome === '' ? null : Number(draft.expectedIncome),
      expectedCharge: draft.expectedCharge === '' ? null : Number(draft.expectedCharge),
    });
    setMessage(result.success ? t('projection.saved') : (result.error?.message || t('projection.saveFailed')));
    if (result.success) await onSaved?.();
    setSaving(false);
  };

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-indigo-500" />
        <div><h2 className="font-black text-gray-950 dark:text-white">{t('cycleDashboard.outlook')}</h2><p className="text-xs text-gray-500">{t('cycleDashboard.outlookSubtitle')}</p></div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-gray-50 p-3 dark:bg-gray-800"><p className="text-[10px] text-gray-500">{t('cycleDashboard.balanceNow')}</p><p className="mt-1 font-black">{formatCurrency(current.checkingBalance)}</p></div>
        <div className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/20"><p className="text-[10px] text-amber-700">{t('cycleDashboard.remaining')}</p><p className="mt-1 font-black text-amber-700">{formatCurrency(expectedRemaining)}</p></div>
        <div className="rounded-2xl bg-indigo-50 p-3 dark:bg-indigo-950/25"><p className="text-[10px] text-indigo-600">{t('cycleDashboard.expectedEnd')}</p><p className="mt-1 font-black text-indigo-700 dark:text-indigo-300">{preview == null ? '—' : formatCurrency(preview)}</p></div>
      </div>
      {automaticSalaries.length > 0 && (
        <div className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
          <p className="font-bold">{t('projection.automaticSalary', { amount: formatCurrency(expectedIncome) })}</p>
          <p className="mt-1 text-[11px] opacity-80">
            {automaticSalaries.map((entry) => `${entry.description} · ${entry.expectedDate}`).join(' · ')}
          </p>
        </div>
      )}
      <details className="group mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
        <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-gray-500">{t('cycleDashboard.adjustForecast')}<ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="col-span-full inline-flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={draft.enabled} onChange={(event) => update('enabled', event.target.checked)} className="h-4 w-4 accent-indigo-600" />{t('projection.enable')}</label>
          <Field label={t('projection.expectedIncome')} type="number" min="0" step="0.01" value={draft.expectedIncome} onChange={(value) => update('expectedIncome', value)} />
          <Field label={t('projection.date')} type="date" value={draft.expectedIncomeDate} onChange={(value) => update('expectedIncomeDate', value)} />
          <Field label={t('projection.manualCharge')} type="number" min="0" step="0.01" value={draft.expectedCharge} onChange={(value) => update('expectedCharge', value)} />
          <Field label={t('projection.date')} type="date" value={draft.expectedChargeDate} onChange={(value) => update('expectedChargeDate', value)} />
          <div className="sm:col-span-2"><Field label={t('projection.chargeLabel')} value={draft.expectedChargeLabel} onChange={(value) => update('expectedChargeLabel', value)} /></div>
          <p className="sm:col-span-2 text-[11px] leading-5 text-gray-500">{t('cycleDashboard.forecastExplanation')}</p>
          <div className="sm:col-span-2 flex items-center justify-end gap-3">{message && <span className="text-xs text-gray-500">{message}</span>}<button type="button" onClick={save} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? t('projection.saving') : t('projection.save')}</button></div>
        </div>
      </details>
    </section>
  );
}
