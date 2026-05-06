/**
 * ShoppingBottomSheet — Add / Edit shopping wishlist item
 * Full claymorphism design, RTL Hebrew, inline blur validation
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Link2, StickyNote, Tag, DollarSign, X, Check } from 'lucide-react';
import BottomSheet from '../../common/BottomSheet';
import { cn } from '../../../utils/helpers';

// ──────────────────────────────────────────
// Category config
// ──────────────────────────────────────────
export const CATEGORIES = [
  { value: 'ריהוט',       label: 'ריהוט',        color: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-500'  },
  { value: 'מטבח',        label: 'מטבח',         color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  { value: 'חדר שינה',    label: 'חדר שינה',     color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  { value: 'אלקטרוניקה', label: 'אלקטרוניקה',   color: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-500'   },
  { value: 'ביגוד',       label: 'ביגוד',        color: 'bg-pink-100 text-pink-700 border-pink-200',       dot: 'bg-pink-500'   },
  { value: 'אחר',         label: 'אחר',          color: 'bg-gray-100 text-gray-600 border-gray-200',       dot: 'bg-gray-400'   },
];

const EMPTY = { name: '', category: 'אחר', price_ils: '', buy_url: '', notes: '' };

// ──────────────────────────────────────────
// Field components
// ──────────────────────────────────────────
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

// ──────────────────────────────────────────
// Main component
// ──────────────────────────────────────────
const ShoppingBottomSheet = ({ isOpen, onClose, onSave, editItem = null, isSaving = false }) => {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const nameRef = useRef(null);

  // Populate form when editing
  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setForm({
          name:      editItem.name       ?? '',
          category:  editItem.category   ?? 'אחר',
          price_ils: editItem.price_ils != null ? String(editItem.price_ils) : '',
          buy_url:   editItem.buy_url    ?? '',
          notes:     editItem.notes      ?? '',
        });
      } else {
        setForm(EMPTY);
      }
      setErrors({});
      setTimeout(() => nameRef.current?.focus(), 300);
    }
  }, [isOpen, editItem]);

  const set = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }, [errors]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'שם המוצר הוא שדה חובה';
    if (form.buy_url && !/^https?:\/\//i.test(form.buy_url.trim())) {
      e.buy_url = 'הקישור חייב להתחיל ב־https://';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || isSaving) return;
    const payload = {
      name:      form.name.trim(),
      category:  form.category,
      price_ils: form.price_ils !== '' ? parseFloat(form.price_ils) : 0,
      buy_url:   form.buy_url.trim() || null,
      notes:     form.notes.trim()   || null,
    };
    await onSave(payload);
  };

  const selectedCat = CATEGORIES.find((c) => c.value === form.category) || CATEGORIES[5];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editItem ? 'עריכת פריט' : 'הוספת פריט לרשימה'}
      height="auto"
    >
      <div className="flex flex-col gap-5 pb-6" dir="rtl">

        {/* ── Name ── */}
        <div>
          <FieldLabel icon={ShoppingCart} label="שם המוצר" required />
          <input
            ref={nameRef}
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            onBlur={() => !form.name.trim() && setErrors((p) => ({ ...p, name: 'שם המוצר הוא שדה חובה' }))}
            placeholder="למשל: כסא גיימינג, מיקסר..."
            autoComplete="off"
            className={cn(inputBase, errors.name && 'border-red-400 focus:ring-red-400/40')}
          />
          <AnimatePresence>
            {errors.name && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="mt-1 text-xs text-red-500 font-medium"
              >{errors.name}</motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ── Category segmented picker ── */}
        <div>
          <FieldLabel icon={Tag} label="קטגוריה" />
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => {
              const active = form.category === cat.value;
              return (
                <motion.button
                  key={cat.value}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => set('category', cat.value)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold',
                    'transition-all duration-150 min-h-[44px] justify-center',
                    active
                      ? cn(cat.color, 'shadow-md scale-[1.02]')
                      : 'bg-white/70 border-gray-200 text-gray-500 hover:border-gray-300 dark:bg-gray-800/70 dark:border-gray-700 dark:text-gray-400'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0', active ? cat.dot : 'bg-gray-300 dark:bg-gray-600')} />
                  {cat.label}
                  {active && <Check className="w-3 h-3 mr-auto" strokeWidth={2.5} />}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Price ── */}
        <div>
          <FieldLabel icon={DollarSign} label="מחיר משוער ₪" />
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

        {/* ── URL ── */}
        <div>
          <FieldLabel icon={Link2} label="קישור לקנייה (אופציונלי)" />
          <input
            type="url"
            value={form.buy_url}
            onChange={(e) => set('buy_url', e.target.value)}
            onBlur={() => {
              if (form.buy_url && !/^https?:\/\//i.test(form.buy_url.trim())) {
                setErrors((p) => ({ ...p, buy_url: 'הקישור חייב להתחיל ב־https://' }));
              }
            }}
            placeholder="https://..."
            autoComplete="url"
            className={cn(inputBase, 'direction-ltr text-left', errors.buy_url && 'border-red-400 focus:ring-red-400/40')}
            dir="ltr"
          />
          <AnimatePresence>
            {errors.buy_url && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="mt-1 text-xs text-red-500 font-medium"
              >{errors.buy_url}</motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ── Notes ── */}
        <div>
          <FieldLabel icon={StickyNote} label="הערות (אופציונלי)" />
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="צבע, גודל, מפרט..."
            className={cn(inputBase, 'resize-none')}
          />
        </div>

        {/* ── Submit ── */}
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
              {editItem ? 'שמור שינויים' : 'הוסף לרשימה'}
            </>
          )}
        </motion.button>

      </div>
    </BottomSheet>
  );
};

export default ShoppingBottomSheet;
