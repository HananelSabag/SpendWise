/**
 * GroceryItemSheet — the one place an item is created or edited.
 *
 * Everything is on screen at once. An earlier version hid quantity, note, photo
 * and link behind a "more details" accordion, which meant the common case of
 * "milk, 2 bottles" cost an extra tap and a reflow. The fields are small enough
 * that showing them is cheaper than hiding them.
 *
 * Only the name is required. The category guesses itself from what you type and
 * stops guessing the moment you pick one, so most items are literally: type,
 * press Add.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Link2, Loader2, Trash2, X } from 'lucide-react';
import BottomSheet from '../../common/BottomSheet';
import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';
import { useToast } from '../../../hooks/useToast';
import { api } from '../../../api';
import { GROCERY_CATEGORIES, DEFAULT_CATEGORY, GROCERY_UNITS } from './groceryCategories';
import { guessCategory } from './guessCategory';
import { compressImage, isUploadableImage, ITEM_PHOTO_PRESET } from '../../../utils/imageCompression';

const emptyDraft = {
  name: '',
  category_key: DEFAULT_CATEGORY,
  quantity: '',
  unit: '',
  note: '',
  image_url: '',
  product_url: '',
};

const GroceryItemSheet = ({ isOpen, onClose, onSave, onDelete, item }) => {
  const { t } = useTranslation('grocery');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const fileRef = useRef(null);
  const chipsRef = useRef(null);

  const [draft, setDraft] = useState(emptyDraft);
  const [categoryPinned, setCategoryPinned] = useState(false);
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
      // An existing item already has its category decided.
      setCategoryPinned(true);
    } else {
      setDraft(emptyDraft);
      setCategoryPinned(false);
    }
  }, [isOpen, item]);

  const set = useCallback((key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  /** Re-guess while typing, until the user makes the call themselves. */
  const handleName = useCallback((value) => {
    setDraft((current) => ({
      ...current,
      name: value,
      category_key: categoryPinned
        ? current.category_key
        : (guessCategory(value) || DEFAULT_CATEGORY),
    }));
  }, [categoryPinned]);

  const pickCategory = useCallback((key) => {
    setCategoryPinned(true);
    set('category_key', key);
  }, [set]);

  // Keep the selected chip visible in the horizontal strip when it changes on
  // its own, otherwise the guess happens off-screen and looks like nothing.
  useEffect(() => {
    const active = chipsRef.current?.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [draft.category_key]);

  const handleSave = useCallback(async () => {
    const name = draft.name.trim();
    if (!name) return;

    setSaving(true);
    const saved = await onSave({
      name,
      category_key: draft.category_key,
      quantity: draft.quantity === '' ? null : Number(draft.quantity),
      unit: draft.unit || null,
      note: draft.note.trim() || null,
      image_url: draft.image_url || null,
      product_url: draft.product_url.trim() || null,
    });
    setSaving(false);
    if (saved) onClose();
  }, [draft, onSave, onClose]);

  const handlePhoto = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    // A phone camera file is 10-20MB and none of it survives a 40px thumbnail.
    const compressed = await compressImage(file, ITEM_PHOTO_PRESET);
    if (!isUploadableImage(compressed)) {
      setUploading(false);
      toast.error(t('errors.GROCERY_IMAGE_FORMAT'));
      return;
    }

    const result = await api.grocery.uploadItemImage(compressed);
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

  const field = cn(
    'h-11 w-full rounded-xl border px-3 text-[15px]',
    'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400',
    'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
    'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 dark:placeholder:text-gray-500'
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('sheet.editTitle') : t('sheet.addTitle')}
    >
      <div className="space-y-3 px-4 pb-6">

        {/* Name — the only required field, and the one that drives the guess. */}
        <input
          value={draft.name}
          onChange={(event) => handleName(event.target.value)}
          maxLength={200}
          autoFocus={!isEdit}
          enterKeyHint="done"
          onKeyDown={(event) => { if (event.key === 'Enter') handleSave(); }}
          placeholder={t('fields.namePlaceholder')}
          aria-label={t('fields.name')}
          className={cn(field, 'h-12 text-base font-medium')}
        />

        {/* Category — a single scrolling row rather than a 12-cell grid that
            pushed everything else below the fold. */}
        <div
          ref={chipsRef}
          className="-mx-4 overflow-x-auto px-4 pb-1"
          role="radiogroup"
          aria-label={t('fields.category')}
        >
          <div className="flex gap-1.5">
            {GROCERY_CATEGORIES.map((option) => {
              const Icon = option.icon;
              const selected = option.key === draft.category_key;
              return (
                <button
                  key={option.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-active={selected}
                  onClick={() => pickCategory(option.key)}
                  className={cn(
                    'flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition-colors',
                    selected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                      : 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', selected ? '' : option.tint)} />
                  {t(`categories.${option.key}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity + unit */}
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            value={draft.quantity}
            onChange={(event) => set('quantity', event.target.value)}
            placeholder={t('fields.quantity')}
            aria-label={t('fields.quantity')}
            className={cn(field, 'w-24')}
          />
          <select
            value={draft.unit}
            onChange={(event) => set('unit', event.target.value)}
            aria-label={t('fields.unit')}
            className={cn(field, 'flex-1 appearance-none')}
          >
            <option value="">{t('fields.unit')}</option>
            {GROCERY_UNITS.map((unit) => (
              <option key={unit} value={unit}>{t(`units.${unit}`)}</option>
            ))}
          </select>
        </div>

        {/* Note */}
        <input
          value={draft.note}
          onChange={(event) => set('note', event.target.value)}
          maxLength={500}
          placeholder={t('fields.notePlaceholder')}
          aria-label={t('fields.note')}
          className={field}
        />

        {/* Product link */}
        <div className="flex gap-2">
          <input
            type="url"
            dir="ltr"
            value={draft.product_url}
            onChange={(event) => set('product_url', event.target.value)}
            placeholder={t('fields.linkPlaceholder')}
            aria-label={t('fields.link')}
            className={cn(field, 'flex-1')}
          />
          <button
            type="button"
            onClick={handleFetchLink}
            disabled={fetchingLink || !draft.product_url.trim()}
            aria-label={t('fields.linkFetch')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400"
          >
            {fetchingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Photo */}
        <div className="flex items-center gap-3">
          {draft.image_url && (
            <div className="relative shrink-0">
              <img
                src={draft.image_url}
                alt=""
                className="h-11 w-11 rounded-xl border border-gray-200 object-cover dark:border-gray-700"
              />
              <button
                type="button"
                onClick={() => set('image_url', '')}
                aria-label={t('fields.photoRemove')}
                className="absolute -end-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900/80 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 text-xs font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-400"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {draft.image_url ? t('fields.photoReplace') : t('fields.photoAdd')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            className="hidden"
          />
        </div>

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
              aria-label={t('item.delete')}
              className={cn(
                'flex h-12 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors',
                confirmDelete
                  ? 'bg-red-500 text-white'
                  : 'border border-gray-200 text-red-500 dark:border-gray-700'
              )}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete && t('item.deleteConfirm')}
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
