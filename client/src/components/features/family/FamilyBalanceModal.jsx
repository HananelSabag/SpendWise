/**
 * Add / edit one balance — a savings account, a pension, a study fund.
 *
 * `monthly_contribution` is asked for because it is genuinely useful to see, and
 * the hint under it says plainly that it is not subtracted from anything: a
 * pension deposit comes out of gross pay, and charging it against a net salary
 * would invent an expense that never happens.
 */

import React, { useEffect, useMemo, useState } from 'react';

import { Modal } from '../../ui';
import { useTranslation } from '../../../stores';
import { BALANCE_KINDS, BALANCE_META } from './familyMeta';
import {
  AmountInput, Field, Segmented, SheetActions, TextInput,
} from './FamilyFormControls';

const blank = () => ({
  kind: 'savings',
  name: '',
  institution: '',
  owner_user_id: null,
  amount: '',
  monthly_contribution: '',
  as_of: '',
  notes: '',
  is_active: true,
});

const fromRow = (row) => ({
  kind: row.kind,
  name: row.name || '',
  institution: row.institution || '',
  owner_user_id: row.owner_user_id ?? null,
  amount: row.amount == null ? '' : String(row.amount),
  monthly_contribution: row.monthly_contribution == null ? '' : String(row.monthly_contribution),
  as_of: row.as_of || '',
  notes: row.notes || '',
  is_active: row.is_active !== false,
});

export default function FamilyBalanceModal({
  isOpen, onClose, onSave, onDelete, balance, members = [], isSaving,
}) {
  const { t } = useTranslation('family');
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (!isOpen) return;
    setForm(balance ? fromRow(balance) : blank());
  }, [isOpen, balance]);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const kindOptions = useMemo(() => BALANCE_KINDS.map((kind) => ({
    value: kind,
    label: t(`balanceKind.${kind}`),
    icon: BALANCE_META[kind].icon,
  })), [t]);

  const ownerOptions = useMemo(() => ([
    ...members.map((member) => ({ value: member.id, label: member.name })),
    { value: 'joint', label: t('overview.joint') },
  ]), [members, t]);

  const canSave = form.name.trim().length > 0 && !isSaving;

  const submit = () => {
    if (!canSave) return;
    onSave({
      kind: form.kind,
      name: form.name.trim(),
      institution: form.institution.trim() || null,
      owner_user_id: form.owner_user_id === 'joint' ? null : form.owner_user_id,
      amount: Number(form.amount || 0),
      monthly_contribution: form.monthly_contribution === '' ? null : Number(form.monthly_contribution),
      as_of: form.as_of || null,
      notes: form.notes.trim() || null,
      is_active: form.is_active,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      sheet
      title={balance ? t('form.editBalance') : t('form.addBalance')}
    >
      <div className="space-y-4 px-4 pb-1 pt-1 sm:px-5">
        <Field label={t('form.kind')}>
          <Segmented
            options={kindOptions}
            value={form.kind}
            onChange={(value) => set({ kind: value })}
            ariaLabel={t('form.kind')}
          />
        </Field>

        <Field label={t('form.name')} htmlFor="family-balance-name">
          <TextInput
            id="family-balance-name"
            value={form.name}
            onChange={(value) => set({ name: value })}
            maxLength={120}
          />
        </Field>

        <Field label={t('form.balanceAmount')} htmlFor="family-balance-amount">
          <AmountInput
            id="family-balance-amount"
            value={form.amount}
            onChange={(value) => set({ amount: value })}
          />
        </Field>

        <Field label={t('form.owner')}>
          <Segmented
            options={ownerOptions}
            value={form.owner_user_id ?? 'joint'}
            onChange={(value) => set({ owner_user_id: value === 'joint' ? null : value })}
            ariaLabel={t('form.owner')}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('form.institution')} htmlFor="family-balance-institution">
            <TextInput
              id="family-balance-institution"
              value={form.institution}
              onChange={(value) => set({ institution: value })}
              placeholder={t('form.institutionPlaceholder')}
              maxLength={120}
            />
          </Field>
          <Field label={t('form.asOf')} htmlFor="family-balance-asof">
            <TextInput
              id="family-balance-asof"
              type="date"
              value={form.as_of}
              onChange={(value) => set({ as_of: value })}
            />
          </Field>
        </div>

        <Field label={t('form.contribution')} hint={t('assets.contributionHint')} htmlFor="family-balance-contribution">
          <AmountInput
            id="family-balance-contribution"
            value={form.monthly_contribution}
            onChange={(value) => set({ monthly_contribution: value })}
          />
        </Field>

        <Field label={t('form.notes')} htmlFor="family-balance-notes">
          <TextInput
            id="family-balance-notes"
            value={form.notes}
            onChange={(value) => set({ notes: value })}
            maxLength={500}
          />
        </Field>

        {balance && (
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
            <span className="min-w-0">
              <span className="block text-xs font-black text-slate-800 dark:text-slate-100">{t('form.active')}</span>
              <span className="block text-[11px] text-slate-400">{t('form.activeHint')}</span>
            </span>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => set({ is_active: event.target.checked })}
              className="h-5 w-5 shrink-0 accent-indigo-600"
            />
          </label>
        )}

        <SheetActions
          onCancel={onClose}
          onSave={submit}
          onDelete={balance ? () => onDelete(balance) : undefined}
          saveLabel={isSaving ? t('saving') : t('form.save')}
          cancelLabel={t('form.cancel')}
          deleteLabel={t('form.remove')}
          disabled={!canSave}
        />
      </div>
    </Modal>
  );
}
