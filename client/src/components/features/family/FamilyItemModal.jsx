/**
 * Add / edit one monthly row — income, fixed charge, loan, saving or variable.
 *
 * The kind picker is first because it changes what the rest of the sheet asks:
 * a loan wants a lender and what's left to pay; nothing else does. Owner is
 * always asked, because "whose account does this leave from" is the question
 * this whole screen was built to answer.
 */

import React, { useEffect, useMemo, useState } from 'react';

import { Modal } from '../../ui';
import { useTranslation } from '../../../stores';
import {
  ITEM_KINDS, KIND_META, CATEGORIES_FOR_KIND, CATEGORY_ICONS, SUGGESTIONS,
} from './familyMeta';
import {
  AmountInput, Field, Segmented, SheetActions, SuggestionChips, TextInput,
} from './FamilyFormControls';

const blank = (kind) => ({
  kind,
  name: '',
  amount: '',
  owner_user_id: null,
  category_key: KIND_META[kind]?.defaultCategory || 'other',
  charge_day: '',
  notes: '',
  is_active: true,
  lender: '',
  outstanding_amount: '',
  payments_left: '',
  end_date: '',
});

const fromRow = (row) => ({
  kind: row.kind,
  name: row.name || '',
  amount: row.amount == null ? '' : String(row.amount),
  owner_user_id: row.owner_user_id ?? null,
  category_key: row.category_key || 'other',
  charge_day: row.charge_day == null ? '' : String(row.charge_day),
  notes: row.notes || '',
  is_active: row.is_active !== false,
  lender: row.lender || '',
  outstanding_amount: row.outstanding_amount == null ? '' : String(row.outstanding_amount),
  payments_left: row.payments_left == null ? '' : String(row.payments_left),
  end_date: row.end_date || '',
});

export default function FamilyItemModal({
  isOpen, onClose, onSave, onDelete, item, preset, defaultKind = 'fixed', members = [], isSaving,
}) {
  const { t } = useTranslation('family');
  const [form, setForm] = useState(() => blank(defaultKind));

  // `preset` comes from the quick-add chips in an empty section: it fills the
  // name and the category so the only thing left to type is the amount — which
  // is always theirs to enter, never guessed for them.
  useEffect(() => {
    if (!isOpen) return;
    setForm(item ? fromRow(item) : { ...blank(defaultKind), ...(preset || {}) });
  }, [isOpen, item, preset, defaultKind]);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const kindOptions = useMemo(() => ITEM_KINDS.map((kind) => ({
    value: kind,
    label: t(`kindOne.${kind}`),
    icon: KIND_META[kind].icon,
  })), [t]);

  const ownerOptions = useMemo(() => ([
    ...members.map((member) => ({ value: member.id, label: member.name })),
    { value: 'joint', label: t('overview.joint') },
  ]), [members, t]);

  const categoryOptions = useMemo(() => {
    const keys = CATEGORIES_FOR_KIND[form.kind] || ['other'];
    return keys.map((key) => ({
      value: key,
      label: t(`category.${key}`),
      icon: CATEGORY_ICONS[key],
    }));
  }, [form.kind, t]);

  const suggestions = useMemo(() => (SUGGESTIONS[form.kind] || []).map((entry) => ({
    ...entry,
    label: t(`suggestion.${entry.key}`),
  })), [form.kind, t]);

  const isLoan = form.kind === 'loan';
  const canSave = form.name.trim().length > 0 && !isSaving;

  // Changing the kind re-homes the category, or a fixed charge keeps "housing"
  // while sitting in the income list.
  const changeKind = (kind) => {
    const allowed = CATEGORIES_FOR_KIND[kind] || ['other'];
    set({
      kind,
      category_key: allowed.includes(form.category_key)
        ? form.category_key
        : (KIND_META[kind]?.defaultCategory || allowed[0]),
    });
  };

  const submit = () => {
    if (!canSave) return;
    const toNumber = (value) => (value === '' || value == null ? null : Number(value));
    onSave({
      kind: form.kind,
      name: form.name.trim(),
      amount: Number(form.amount || 0),
      owner_user_id: form.owner_user_id === 'joint' ? null : form.owner_user_id,
      category_key: form.category_key,
      charge_day: toNumber(form.charge_day),
      notes: form.notes.trim() || null,
      is_active: form.is_active,
      // Loan fields are cleared when the row stops being a loan, so an old
      // balance can't keep counting against the household's debt.
      lender: isLoan ? (form.lender.trim() || null) : null,
      outstanding_amount: isLoan ? toNumber(form.outstanding_amount) : null,
      payments_left: isLoan ? toNumber(form.payments_left) : null,
      end_date: isLoan ? (form.end_date || null) : null,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      sheet
      title={item ? t('form.editItem') : t('form.addItem')}
    >
      <div className="space-y-4 px-4 pb-1 pt-1 sm:px-5">
        <Field label={t('form.kind')}>
          <Segmented options={kindOptions} value={form.kind} onChange={changeKind} ariaLabel={t('form.kind')} />
          <p className="mt-1.5 text-[11px] text-slate-400">{t(`kindHint.${form.kind}`)}</p>
        </Field>

        <Field label={t('form.name')} htmlFor="family-item-name">
          <TextInput
            id="family-item-name"
            value={form.name}
            onChange={(value) => set({ name: value })}
            placeholder={t('form.namePlaceholder')}
            maxLength={120}
          />
        </Field>

        {!item && (
          <SuggestionChips
            label={t('form.quickPick')}
            items={suggestions}
            onPick={(pick) => set({ name: pick.label, category_key: pick.category })}
          />
        )}

        <Field label={t('form.amount')} htmlFor="family-item-amount">
          <AmountInput
            id="family-item-amount"
            value={form.amount}
            onChange={(value) => set({ amount: value })}
          />
        </Field>

        <Field
          label={t('form.owner')}
          hint={form.kind === 'income' ? t('form.ownerIncomeHint') : t('form.ownerHint')}
        >
          <Segmented
            options={ownerOptions}
            value={form.owner_user_id ?? 'joint'}
            onChange={(value) => set({ owner_user_id: value === 'joint' ? null : value })}
            ariaLabel={t('form.owner')}
          />
        </Field>

        {categoryOptions.length > 1 && (
          <Field label={t('form.category')}>
            <Segmented
              options={categoryOptions}
              value={form.category_key}
              onChange={(value) => set({ category_key: value })}
              ariaLabel={t('form.category')}
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('form.chargeDay')} htmlFor="family-item-day">
            <TextInput
              id="family-item-day"
              value={form.charge_day}
              onChange={(value) => set({ charge_day: value.replace(/\D/g, '').slice(0, 2) })}
              placeholder={t('form.chargeDayPlaceholder')}
              inputMode="numeric"
            />
          </Field>
          <Field label={t('form.notes')} htmlFor="family-item-notes">
            <TextInput
              id="family-item-notes"
              value={form.notes}
              onChange={(value) => set({ notes: value })}
              maxLength={500}
            />
          </Field>
        </div>

        {isLoan && (
          <div className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-900 dark:bg-violet-950/20">
            <Field label={t('form.lender')} htmlFor="family-item-lender">
              <TextInput
                id="family-item-lender"
                value={form.lender}
                onChange={(value) => set({ lender: value })}
                placeholder={t('form.lenderPlaceholder')}
                maxLength={120}
              />
            </Field>
            <Field label={t('form.outstanding')} hint={t('assets.missingBalanceHint')} htmlFor="family-item-outstanding">
              <AmountInput
                id="family-item-outstanding"
                value={form.outstanding_amount}
                onChange={(value) => set({ outstanding_amount: value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('form.paymentsLeft')} htmlFor="family-item-payments">
                <TextInput
                  id="family-item-payments"
                  value={form.payments_left}
                  onChange={(value) => set({ payments_left: value.replace(/\D/g, '').slice(0, 3) })}
                  inputMode="numeric"
                />
              </Field>
              <Field label={t('form.endDate')} htmlFor="family-item-end">
                <TextInput
                  id="family-item-end"
                  type="date"
                  value={form.end_date}
                  onChange={(value) => set({ end_date: value })}
                />
              </Field>
            </div>
          </div>
        )}

        {item && (
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
          onDelete={item ? () => onDelete(item) : undefined}
          saveLabel={isSaving ? t('saving') : t('form.save')}
          cancelLabel={t('form.cancel')}
          deleteLabel={t('form.remove')}
          disabled={!canSave}
        />
      </div>
    </Modal>
  );
}
