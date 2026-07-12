import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, CalendarClock, Save, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';

import transactionAPI from '../../../api/transactions';
import { useTranslation } from '../../../stores';

const emptySettings = {
  enabled: false,
  expectedSalary: '',
  expectedSalaryDate: '',
  expectedCharge: '',
  expectedChargeDate: '',
  expectedChargeLabel: '',
};

function toDraft(settings = {}) {
  return {
    enabled: settings.enabled === true,
    expectedSalary: settings.expectedSalary ?? '',
    expectedSalaryDate: settings.expectedSalaryDate || '',
    expectedCharge: settings.expectedCharge ?? '',
    expectedChargeDate: settings.expectedChargeDate || '',
    expectedChargeLabel: settings.expectedChargeLabel || '',
  };
}

function Field({ label, type = 'text', value, onChange, placeholder, min, step }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        step={step}
        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-indigo-950"
      />
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

  useEffect(() => {
    setDraft(toDraft(projection?.settings));
  }, [projection?.settings]);

  const preview = useMemo(() => {
    if (!draft.enabled || current?.checkingBalance == null) return null;
    const salary = Number(draft.expectedSalary) || Number(projection?.suggestedSalary?.amount) || 0;
    const charge = Number(draft.expectedCharge) || 0;
    return current.checkingBalance + salary - charge;
  }, [current?.checkingBalance, draft.enabled, draft.expectedCharge, draft.expectedSalary, projection?.suggestedSalary?.amount]);

  if (!current || !projection) return null;

  const update = (key, value) => setDraft((previous) => ({ ...previous, [key]: value }));
  const save = async () => {
    setSaving(true);
    setMessage('');
    const result = await transactionAPI.updateCycleProjection({
      ...draft,
      expectedSalary: draft.expectedSalary === '' ? null : Number(draft.expectedSalary),
      expectedCharge: draft.expectedCharge === '' ? null : Number(draft.expectedCharge),
    });
    if (result.success) {
      setMessage(t('projection.saved'));
      await onSaved?.();
    } else {
      setMessage(result.error?.message || t('projection.saveFailed'));
    }
    setSaving(false);
  };

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-violet-500">
            <Calculator className="h-4 w-4" />{t('projection.eyebrow')}
          </p>
          <h2 className="mt-1 text-lg font-black text-gray-950 dark:text-white">{t('projection.title')}</h2>
          <p className="mt-1 max-w-2xl text-xs text-gray-500">{t('projection.subtitle')}</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gray-100 px-3 py-2 dark:bg-gray-800">
          <input type="checkbox" checked={draft.enabled} onChange={(event) => update('enabled', event.target.checked)} className="h-4 w-4 accent-indigo-600" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{t('projection.enable')}</span>
        </label>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-300">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        {t('projection.factualHint')}
      </div>

      {draft.enabled && (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50/60 p-4 dark:bg-emerald-950/20">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300"><TrendingUp className="h-4 w-4" />{t('projection.expectedSalary')}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('projection.amount')} type="number" min="0" step="0.01" value={draft.expectedSalary} onChange={(value) => update('expectedSalary', value)} placeholder={projection.suggestedSalary?.amount ? String(projection.suggestedSalary.amount) : '0'} />
                <Field label={t('projection.date')} type="date" value={draft.expectedSalaryDate} onChange={(value) => update('expectedSalaryDate', value)} />
              </div>
              {projection.suggestedSalary && !draft.expectedSalary && <p className="mt-2 text-[11px] text-emerald-700/75">{t('projection.salarySuggestion', { amount: formatCurrency(projection.suggestedSalary.amount) })}</p>}
            </div>

            <div className="rounded-2xl bg-rose-50/60 p-4 dark:bg-rose-950/20">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-rose-700 dark:text-rose-300"><TrendingDown className="h-4 w-4" />{t('projection.manualCharge')}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('projection.amount')} type="number" min="0" step="0.01" value={draft.expectedCharge} onChange={(value) => update('expectedCharge', value)} placeholder="0" />
                <Field label={t('projection.date')} type="date" value={draft.expectedChargeDate} onChange={(value) => update('expectedChargeDate', value)} />
              </div>
              <div className="mt-3"><Field label={t('projection.chargeLabel')} value={draft.expectedChargeLabel} onChange={(value) => update('expectedChargeLabel', value)} placeholder={t('projection.chargePlaceholder')} /></div>
            </div>
          </div>

          <div className="mt-5 grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <div className="rounded-2xl bg-gray-50 p-3 text-center dark:bg-gray-800"><p className="text-[11px] text-gray-500">{t('projection.realBalance')}</p><p className="mt-1 font-black text-gray-900 dark:text-white">{current.checkingBalance == null ? '—' : formatCurrency(current.checkingBalance)}</p></div>
            <TrendingUp className="m-auto h-5 w-5 text-emerald-500" />
            <div className="rounded-2xl bg-gray-50 p-3 text-center dark:bg-gray-800"><p className="text-[11px] text-gray-500">{t('projection.expectedNet')}</p><p className="mt-1 font-black text-gray-900 dark:text-white">{formatCurrency((Number(draft.expectedSalary) || projection.suggestedSalary?.amount || 0) - (Number(draft.expectedCharge) || 0))}</p></div>
            <CalendarClock className="m-auto h-5 w-5 text-violet-500" />
            <div className="rounded-2xl bg-violet-50 p-3 text-center dark:bg-violet-950/25"><p className="text-[11px] text-violet-600">{t('projection.plannedBalance')}</p><p className="mt-1 text-lg font-black text-violet-700 dark:text-violet-300">{preview == null ? '—' : formatCurrency(preview)}</p></div>
          </div>
        </>
      )}

      <div className="mt-5 flex items-center justify-end gap-3">
        {message && <p className="text-xs text-gray-500">{message}</p>}
        <button type="button" onClick={save} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50">
          <Save className="h-4 w-4" />{saving ? t('projection.saving') : t('projection.save')}
        </button>
      </div>
    </section>
  );
}
