/**
 * ShoppingBottomSheet — Add / Edit shopping wishlist item
 * Supports URL auto-scraping: paste a product link → image + title filled automatically
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Link2, StickyNote, Tag, DollarSign, Check, Image, X, Loader2 } from 'lucide-react';
import BottomSheet from '../../common/BottomSheet';
import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';
import { api } from '../../../api';

export const CATEGORIES = [
  { value: 'ריהוט',       key: 'furniture',    emoji: '🛋️',  color: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-500'  },
  { value: 'מטבח',        key: 'kitchen',      emoji: '🍳',  color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  { value: 'חדר שינה',    key: 'bedroom',      emoji: '🛏️',  color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  { value: 'אלקטרוניקה',  key: 'electronics',  emoji: '📱',  color: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-500'   },
  { value: 'ביגוד',       key: 'clothing',     emoji: '👕',  color: 'bg-pink-100 text-pink-700 border-pink-200',       dot: 'bg-pink-500'   },
  { value: 'אחר',         key: 'other',        emoji: '📦',  color: 'bg-gray-100 text-gray-600 border-gray-200',       dot: 'bg-gray-400'   },
];

const EMPTY = { name: '', category: 'אחר', price_ils: '', buy_url: '', notes: '', image_url: '' };

const FieldLabel = ({ icon: Icon, label, required }) => (
  <div className="flex items-center gap-1.5 mb-1.5">
    <Icon className="w-3.5 h-3.5 text-blue-500" strokeWidth={2} />
    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-400 mr-0.5">*</span>}
    </span>
  </div>
);

const inputBase = cn(
  'w-full rounded-2xl border bg-white/80 px-4 py-3.5 text-sm font-medium text-gray-800',
  'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400',
  'transition-all duration-200 text-right',
  'shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.07)]',
  'dark:bg-gray-800/80 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500'
);

const ErrorMsg = ({ msg }) => (
  <AnimatePresence>
    {msg && (
      <motion.p
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
        className="mt-1 text-xs text-red-500 font-medium"
      >{msg}</motion.p>
    )}
  </AnimatePresence>
);

const ShoppingBottomSheet = ({ isOpen, onClose, onSave, editItem = null, isSaving = false }) => {
  const { t, isRTL } = useTranslation('shopping');
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [scrapeState, setScrapeState] = useState('idle'); // idle | loading | success | failed
  const nameRef = useRef(null);
  const scrapeTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setForm(editItem ? {
        name:      editItem.name       ?? '',
        category:  editItem.category   ?? 'אחר',
        price_ils: editItem.price_ils != null ? String(editItem.price_ils) : '',
        buy_url:   editItem.buy_url    ?? '',
        notes:     editItem.notes      ?? '',
        image_url: editItem.image_url  ?? '',
      } : EMPTY);
      setErrors({});
      setScrapeState('idle');
      setTimeout(() => nameRef.current?.focus(), 300);
    }
  }, [isOpen, editItem]);

  const set = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // Trigger scrape when URL looks valid
  const handleUrlChange = useCallback((value) => {
    set('buy_url', value);
    clearTimeout(scrapeTimerRef.current);

    if (!value.trim() || !/^https?:\/\/.{4}/i.test(value.trim())) {
      setScrapeState('idle');
      return;
    }

    setScrapeState('loading');
    scrapeTimerRef.current = setTimeout(async () => {
      try {
        const result = await api.shopping.scrapeUrl(value.trim());
        const data = result?.data;

        if (data?.success && (data.image_url || data.title)) {
          setForm((prev) => ({
            ...prev,
            image_url: data.image_url || prev.image_url || '',
            // Only fill name if it's still empty
            name: prev.name.trim() ? prev.name : (data.title || prev.name),
          }));
          setScrapeState('success');
        } else {
          setScrapeState('failed');
        }
      } catch {
        setScrapeState('failed');
      }
    }, 900); // debounce 900ms
  }, [set]);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(scrapeTimerRef.current), []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('validation.nameRequired');
    if (form.buy_url && !/^https?:\/\//i.test(form.buy_url.trim())) {
      e.buy_url = t('validation.urlInvalid');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || isSaving) return;
    await onSave({
      name:      form.name.trim(),
      category:  form.category,
      price_ils: form.price_ils !== '' ? parseFloat(form.price_ils) : 0,
      buy_url:   form.buy_url.trim()   || null,
      notes:     form.notes.trim()     || null,
      image_url: form.image_url.trim() || null,
    });
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editItem ? t('sheet.editTitle') : t('sheet.addTitle')}
      height="auto"
    >
      <div className="flex flex-col gap-5 pb-6">

        {/* URL field — FIRST so scrape happens before user types name */}
        <div>
          <FieldLabel icon={Link2} label={t('fields.url.label')} />
          <div className="relative">
            <input
              type="url"
              value={form.buy_url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onBlur={() => {
                if (form.buy_url && !/^https?:\/\//i.test(form.buy_url.trim())) {
                  setErrors((p) => ({ ...p, buy_url: t('validation.urlInvalid') }));
                }
              }}
              placeholder="https://..."
              autoComplete="url"
              className={cn(inputBase, 'text-left pr-10', errors.buy_url && 'border-red-400 focus:ring-red-400/40')}
              dir="ltr"
            />
            {/* Scrape status icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {scrapeState === 'loading' && (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" strokeWidth={2.5} />
              )}
              {scrapeState === 'success' && (
                <Check className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
              )}
            </div>
          </div>
          <ErrorMsg msg={errors.buy_url} />

          {/* Scrape status message */}
          <AnimatePresence>
            {scrapeState === 'loading' && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="mt-1.5 text-xs text-blue-500 font-medium flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t('scrape.fetching')}
              </motion.p>
            )}
            {scrapeState === 'failed' && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="mt-1.5 text-xs text-gray-400 font-medium">
                {t('scrape.failed')}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Image preview — shown when scraped or when editing existing item with image */}
        <AnimatePresence>
          {form.image_url && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <img
                  src={form.image_url}
                  alt="product preview"
                  className="w-full h-44 object-cover"
                  onError={() => set('image_url', '')}
                />
                {scrapeState === 'success' && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    <Check className="w-3 h-3" strokeWidth={3} />
                    {t('scrape.imageFound')}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => set('image_url', '')}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name */}
        <div>
          <FieldLabel icon={ShoppingCart} label={t('fields.name.label')} required />
          <input
            ref={nameRef}
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            onBlur={() => !form.name.trim() && setErrors((p) => ({ ...p, name: t('validation.nameRequired') }))}
            placeholder={t('fields.name.placeholder')}
            autoComplete="off"
            className={cn(inputBase, errors.name && 'border-red-400 focus:ring-red-400/40')}
          />
          <ErrorMsg msg={errors.name} />
        </div>

        {/* Category picker */}
        <div>
          <FieldLabel icon={Tag} label={t('fields.category.label')} />
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => {
              const active = form.category === cat.value;
              return (
                <motion.button
                  key={cat.value}
                  type="button"
                  whileTap={{ scale: 0.93 }}
                  onClick={() => set('category', cat.value)}
                  className={cn(
                    'relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl border',
                    'transition-all duration-150 min-h-[64px] justify-center',
                    active
                      ? cn(cat.color, 'shadow-lg scale-[1.04] border-current')
                      : 'bg-white/70 border-gray-200 text-gray-400 hover:border-gray-300 dark:bg-gray-800/70 dark:border-gray-700'
                  )}
                >
                  {active && (
                    <span className="absolute top-1.5 left-1.5 w-3.5 h-3.5 rounded-full bg-current/20 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    </span>
                  )}
                  <span className={cn('text-xl leading-none', !active && 'grayscale opacity-60')}>{cat.emoji}</span>
                  <span className="text-[11px] font-bold leading-tight text-center">{t(`categories.${cat.key}`)}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Price */}
        <div>
          <FieldLabel icon={DollarSign} label={t('fields.price.label')} />
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price_ils}
              onChange={(e) => set('price_ils', e.target.value)}
              placeholder="0"
              autoComplete="off"
              inputMode="decimal"
              className={cn(inputBase, 'pl-10')}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none select-none">
              ₪
            </span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <FieldLabel icon={StickyNote} label={t('fields.notes.label')} />
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder={t('fields.notes.placeholder')}
            className={cn(inputBase, 'resize-none')}
          />
        </div>

        {/* Submit */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={isSaving}
          className={cn(
            'w-full min-h-[52px] rounded-2xl font-bold text-white text-base',
            'bg-gradient-to-l from-blue-600 to-indigo-600',
            'shadow-lg shadow-blue-500/30',
            'flex items-center justify-center gap-2',
            'transition-opacity duration-200',
            isSaving && 'opacity-60 cursor-not-allowed'
          )}
        >
          {isSaving ? (
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-5 h-5" strokeWidth={2.5} />
              {editItem ? t('sheet.saveChanges') : t('sheet.addToList')}
            </>
          )}
        </motion.button>

      </div>
    </BottomSheet>
  );
};

export default ShoppingBottomSheet;
