/**
 * GroceryItemSheet — the full item editor.
 *
 * Everything past name + category is behind "more details" on purpose: quantity,
 * note, photo and product link are genuinely useful (a specific brand of yogurt
 * is exactly why the photo exists) but they must never slow down adding milk.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Camera, Trash2, X, Link2, Loader2 } from 'lucide-react';
import BottomSheet from '../../common/BottomSheet';
import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';
import { useToast } from '../../../hooks/useToast';
import { api } from '../../../api';
import { GROCERY_CATEGORIES, DEFAULT_CATEGORY, GROCERY_UNITS } from './groceryCategories';

const emptyDraft = {
  name: '',
  category_key: DEFAULT_CATEGORY,
  quantity: '',
  unit: '',
  note: '',
  image_url: '',
  product_url: '',
};

const GroceryItemSheet = ({ isOpen, onClose, onSave, onDelete, item, seed }) => {
  const { t } = useTranslation('grocery');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const fileRef = useRef(null);

  const [draft, setDraft] = useState(emptyDraft);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingLink, setFetchingLink] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEdit = !!item;

  useEffect(() => {
    if (!isOpen) return;
    setConfirmDelete(false);

    if (item) {
      setDraft({
        name: item.name || '',
        category_key: item.category_key || DEFAULT_CATEGORY,
        quantity: item.quantity != null ? String(Number(item.quantity)) : '',
        unit: item.unit || '',
        note: item.note || '',
        image_url: item.image_url || '',
        product_url: item.product_url || '',
      });
      // Open straight into the details when the item already uses them.
      setExpanded(!!(item.quantity || item.note || item.image_url || item.product_url));
    } else {
      setDraft({ ...emptyDraft, ...(seed || {}) });
      setExpanded(false);
    }
  }, [isOpen, item, seed]);

  const set = useCallback((key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    const name = draft.name.trim();
    if (!name) return;

    setSaving(true);
    const payload = {
      name,
      category_key: draft.category_key,
      quantity: draft.quantity === '' ? null : Number(draft.quantity),
      unit: draft.unit || null,
      note: draft.note.trim() || null,
      image_url: draft.image_url || null,
      product_url: draft.product_url.trim() || null,
    };
    const result = await onSave(payload);
    setSaving(false);
    if (result) onClose();
  }, [draft, onSave, onClose]);

  const handlePhoto = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    const result = await api.grocery.uploadItemImage(file);
    setUploading(false);

    if (!result.success) {
      toast.error(t(`errors.${result.error?.code}`, { fallback: t('errors.generic') }));
      return;
    }
    set('image_url', result.data.imageUrl);
  }, [set, t, toast]);

  /** Pull a title and picture off a product page, so a shared link fills itself in. */
  const handleFetchLink = useCallback(async () => {
    const url = draft.product_url.trim();
    if (!url) return;

    setFetchingLink(true);
    const result = await api.grocery.scrapeUrl(url);
    setFetchingLink(false);

    if (!result.success || (!result.data?.title && !result.data?.image)) {
      toast.error(t('scrape.failed'));
      return;
    }
    setDraft((current) => ({
      ...current,
      name: current.name || result.data.title || '',
      image_url: current.image_url || result.data.image || '',
    }));
    toast.success(t('scrape.success'));
  }, [draft.product_url, t, toast]);

  const inputClass = cn(
    'h-11 w-full rounded-xl border px-3 text-[15px]',
    'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400',
    'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
    'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 dark:placeholder:text-gray-500'
  );
  const labelClass = 'mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('sheet.editTitle') : t('sheet.addTitle')}
    >
      <div className="space-y-4 px-4 pb-6">
        {/* Name */}
        <div>
          <label className={labelClass} htmlFor="grocery-item-name">{t('fields.name')}</label>
          <input
            id="grocery-item-name"
            value={draft.name}
            onChange={(event) => set('name', event.target.value)}
            maxLength={200}
            autoFocus={!isEdit}
            placeholder={t('fields.namePlaceholder')}
            className={inputClass}
          />
        </div>

        {/* Category */}
        <div>
          <span className={labelClass}>{t('fields.category')}</span>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            {GROCERY_CATEGORIES.map((option) => {
              const Icon = option.icon;
              const selected = option.key === draft.category_key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => set('category_key', option.key)}
                  aria-pressed={selected}
                  className={cn(
                    'flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-1.5 text-[10px] font-medium leading-tight transition-colors',
                    selected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
                  )}
                >
                  <Icon className={cn('h-4 w-4', selected ? '' : option.tint)} />
                  <span className="line-clamp-2 text-center">{t(`categories.${option.key}`)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progressive disclosure */}
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="flex w-full items-center justify-between rounded-xl border border-dashed border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-700 dark:border-gray-700 dark:text-gray-400"
        >
          <span>{expanded ? t('sheet.hideOptional') : t('sheet.showOptional')}</span>
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 overflow-hidden"
            >
              {/* Quantity + unit */}
              <div className="flex gap-2">
                <div className="w-28">
                  <label className={labelClass} htmlFor="grocery-item-qty">{t('fields.quantity')}</label>
                  <input
                    id="grocery-item-qty"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.5"
                    value={draft.quantity}
                    onChange={(event) => set('quantity', event.target.value)}
                    placeholder={t('fields.quantityPlaceholder')}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass} htmlFor="grocery-item-unit">{t('fields.unit')}</label>
                  <select
                    id="grocery-item-unit"
                    value={draft.unit}
                    onChange={(event) => set('unit', event.target.value)}
                    className={cn(inputClass, 'appearance-none')}
                  >
                    <option value="">—</option>
                    {GROCERY_UNITS.map((unit) => (
                      <option key={unit} value={unit}>{t(`units.${unit}`)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className={labelClass} htmlFor="grocery-item-note">{t('fields.note')}</label>
                <input
                  id="grocery-item-note"
                  value={draft.note}
                  onChange={(event) => set('note', event.target.value)}
                  maxLength={500}
                  placeholder={t('fields.notePlaceholder')}
                  className={inputClass}
                />
              </div>

              {/* Photo */}
              <div>
                <span className={labelClass}>{t('fields.photo')}</span>
                <div className="flex items-center gap-3">
                  {draft.image_url ? (
                    <div className="relative">
                      <img
                        src={draft.image_url}
                        alt=""
                        className="h-16 w-16 rounded-xl border border-gray-200 object-cover dark:border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => set('image_url', '')}
                        aria-label={t('fields.photoRemove')}
                        className="absolute -end-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/80 text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300"
                  >
                    {uploading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Camera className="h-4 w-4" />}
                    {draft.image_url ? t('fields.photoReplace') : t('fields.photoAdd')}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhoto}
                    className="hidden"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                  {t('fields.photoHint')}
                </p>
              </div>

              {/* Product link */}
              <div>
                <label className={labelClass} htmlFor="grocery-item-url">{t('fields.link')}</label>
                <div className="flex gap-2">
                  <input
                    id="grocery-item-url"
                    type="url"
                    dir="ltr"
                    value={draft.product_url}
                    onChange={(event) => set('product_url', event.target.value)}
                    placeholder={t('fields.linkPlaceholder')}
                    className={cn(inputClass, 'flex-1')}
                  />
                  <button
                    type="button"
                    onClick={handleFetchLink}
                    disabled={fetchingLink || !draft.product_url.trim()}
                    aria-label={t('fields.linkFetch')}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400"
                  >
                    {fetchingLink
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Link2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {isEdit && (
            <button
              type="button"
              onClick={async () => {
                if (!confirmDelete) { setConfirmDelete(true); return; }
                await onDelete(item.id);
                onClose();
              }}
              className={cn(
                'flex h-12 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors',
                confirmDelete
                  ? 'bg-red-500 text-white'
                  : 'border border-gray-200 text-red-500 dark:border-gray-700'
              )}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete ? t('item.deleteConfirm') : ''}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300"
          >
            {tc('cancel', { fallback: t('sheet.cancel') })}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !draft.name.trim()}
            className={cn(
              'h-12 flex-[2] rounded-xl bg-blue-600 text-sm font-bold text-white transition-colors',
              'hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400',
              'dark:disabled:bg-gray-700 dark:disabled:text-gray-500'
            )}
          >
            {saving
              ? <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              : (isEdit ? t('sheet.save') : t('sheet.add'))}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default GroceryItemSheet;
