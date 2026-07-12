import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, CalendarClock, Save, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';

import transactionAPI from '../../../api/transactions';

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

export default function RunwayProjectionPlanner({ runway, formatCurrency, language = 'he', onSaved }) {
  const he = language === 'he';
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
      setMessage(he ? 'התכנון נשמר.' : 'Plan saved.');
      await onSaved?.();
    } else {
      setMessage(result.error?.message || (he ? 'לא הצלחנו לשמור.' : 'Could not save.'));
    }
    setSaving(false);
  };

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-violet-500">
            <Calculator className="h-4 w-4" />{he ? 'תכנון אופציונלי' : 'Optional planning'}
          </p>
          <h2 className="mt-1 text-lg font-black text-gray-950 dark:text-white">{he ? 'מה יישאר אחרי מה שצפוי' : 'What remains after expected events'}</h2>
          <p className="mt-1 max-w-2xl text-xs text-gray-500">{he ? 'השכבה הזאת לא משנה עסקאות ולא נכנסת לחישובים האמיתיים. היא רק מאפשרת לך לבדוק תרחיש.' : 'This layer never changes transactions or factual totals. It only lets you test a scenario.'}</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gray-100 px-3 py-2 dark:bg-gray-800">
          <input type="checkbox" checked={draft.enabled} onChange={(event) => update('enabled', event.target.checked)} className="h-4 w-4 accent-indigo-600" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{he ? 'הפעל תכנון' : 'Enable planning'}</span>
        </label>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-300">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        {he ? 'המאזן הנוכחי נשאר עובדה מהבנק; המספר המתוכנן מסומן תמיד בנפרד.' : 'The current balance remains a bank fact; the planned number is always labelled separately.'}
      </div>

      {draft.enabled && (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50/60 p-4 dark:bg-emerald-950/20">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300"><TrendingUp className="h-4 w-4" />{he ? 'משכורת צפויה' : 'Expected salary'}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={he ? 'סכום' : 'Amount'} type="number" min="0" step="0.01" value={draft.expectedSalary} onChange={(value) => update('expectedSalary', value)} placeholder={projection.suggestedSalary?.amount ? String(projection.suggestedSalary.amount) : '0'} />
                <Field label={he ? 'תאריך' : 'Date'} type="date" value={draft.expectedSalaryDate} onChange={(value) => update('expectedSalaryDate', value)} />
              </div>
              {projection.suggestedSalary && !draft.expectedSalary && <p className="mt-2 text-[11px] text-emerald-700/75">{he ? 'אם תשאיר ריק, נשתמש רק לתכנון במשכורת האחרונה' : 'Leave blank to use the last salary for planning'}: {formatCurrency(projection.suggestedSalary.amount)}</p>}
            </div>

            <div className="rounded-2xl bg-rose-50/60 p-4 dark:bg-rose-950/20">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-rose-700 dark:text-rose-300"><TrendingDown className="h-4 w-4" />{he ? 'חיוב צפוי ידני' : 'Manual expected charge'}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={he ? 'סכום' : 'Amount'} type="number" min="0" step="0.01" value={draft.expectedCharge} onChange={(value) => update('expectedCharge', value)} placeholder="0" />
                <Field label={he ? 'תאריך' : 'Date'} type="date" value={draft.expectedChargeDate} onChange={(value) => update('expectedChargeDate', value)} />
              </div>
              <div className="mt-3"><Field label={he ? 'שם החיוב' : 'Charge label'} value={draft.expectedChargeLabel} onChange={(value) => update('expectedChargeLabel', value)} placeholder={he ? 'למשל: כרטיס לא מחובר' : 'e.g. unconnected card'} /></div>
            </div>
          </div>

          <div className="mt-5 grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <div className="rounded-2xl bg-gray-50 p-3 text-center dark:bg-gray-800"><p className="text-[11px] text-gray-500">{he ? 'מאזן אמיתי עכשיו' : 'Real balance now'}</p><p className="mt-1 font-black text-gray-900 dark:text-white">{current.checkingBalance == null ? '—' : formatCurrency(current.checkingBalance)}</p></div>
            <TrendingUp className="m-auto h-5 w-5 text-emerald-500" />
            <div className="rounded-2xl bg-gray-50 p-3 text-center dark:bg-gray-800"><p className="text-[11px] text-gray-500">{he ? 'צפוי להיכנס פחות לצאת' : 'Expected in minus out'}</p><p className="mt-1 font-black text-gray-900 dark:text-white">{formatCurrency((Number(draft.expectedSalary) || projection.suggestedSalary?.amount || 0) - (Number(draft.expectedCharge) || 0))}</p></div>
            <CalendarClock className="m-auto h-5 w-5 text-violet-500" />
            <div className="rounded-2xl bg-violet-50 p-3 text-center dark:bg-violet-950/25"><p className="text-[11px] text-violet-600">{he ? 'מאזן מתוכנן' : 'Planned balance'}</p><p className="mt-1 text-lg font-black text-violet-700 dark:text-violet-300">{preview == null ? '—' : formatCurrency(preview)}</p></div>
          </div>
        </>
      )}

      <div className="mt-5 flex items-center justify-end gap-3">
        {message && <p className="text-xs text-gray-500">{message}</p>}
        <button type="button" onClick={save} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50">
          <Save className="h-4 w-4" />{saving ? (he ? 'שומר…' : 'Saving…') : (he ? 'שמור תכנון' : 'Save plan')}
        </button>
      </div>
    </section>
  );
}
