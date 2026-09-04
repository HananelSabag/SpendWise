/**
 * GroceryQuickAdd — the fast path: type a name, press enter, keep typing.
 *
 * The category is guessed from the name (see `guessCategory`) and shown as a
 * chip you can override with one tap, so the common case costs a single field.
 * Focus stays in the input after a successful add — the way you actually empty
 * a list of ten things.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';
import { GROCERY_CATEGORIES, CATEGORY_BY_KEY, DEFAULT_CATEGORY } from './groceryCategories';
import { guessCategory } from './guessCategory';

const GroceryQuickAdd = ({ onAdd, onOpenDetails, disabled = false }) => {
  const { t } = useTranslation('grocery');
  const inputRef = useRef(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [categoryPinned, setCategoryPinned] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Re-guess as they type, but stop the moment they choose one themselves.
  useEffect(() => {
    if (categoryPinned) return;
    setCategory(guessCategory(name) || DEFAULT_CATEGORY);
  }, [name, categoryPinned]);

  const reset = useCallback(() => {
    setName('');
    setCategory(DEFAULT_CATEGORY);
    setCategoryPinned(false);
    setPickerOpen(false);
  }, []);

  const submit = useCallback(async (event) => {
    event?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy || disabled) return;

    setBusy(true);
    const created = await onAdd({ name: trimmed, category_key: category });
    setBusy(false);

    if (created) {
      reset();
      inputRef.current?.focus();
    }
  }, [name, category, busy, disabled, onAdd, reset]);

  const active = CATEGORY_BY_KEY[category] || CATEGORY_BY_KEY[DEFAULT_CATEGORY];
  const ActiveIcon = active.icon;

  return (
    <div className="w-full">
      <AnimatePresence initial={false}>
        {pickerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-4 gap-1.5 pb-2 sm:grid-cols-6">
              {GROCERY_CATEGORIES.map((option) => {
                const Icon = option.icon;
                const selected = option.key === category;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setCategory(option.key);
                      setCategoryPinned(true);
                      setPickerOpen(false);
                      inputRef.current?.focus();
                    }}
                    className={cn(
                      'flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-1.5 text-[10px] font-medium leading-tight transition-colors',
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
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={submit} className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPickerOpen((open) => !open)}
          disabled={disabled}
          aria-expanded={pickerOpen}
          aria-label={t('quickAdd.categoryHint')}
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors',
            'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
            pickerOpen && 'border-blue-400 dark:border-blue-500',
            disabled && 'opacity-50'
          )}
        >
          <ActiveIcon className={cn('h-5 w-5', active.tint)} />
        </button>

        <input
          ref={inputRef}
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={disabled}
          maxLength={200}
          enterKeyHint="done"
          placeholder={t('quickAdd.placeholder')}
          aria-label={t('quickAdd.aria')}
          className={cn(
            'h-11 min-w-0 flex-1 rounded-xl border px-3 text-[15px]',
            'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400',
            'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
            'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 dark:placeholder:text-gray-500',
            disabled && 'opacity-50'
          )}
        />

        <button
          type="button"
          onClick={() => onOpenDetails({ name: name.trim(), category_key: category })}
          disabled={disabled}
          aria-label={t('quickAdd.details')}
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors',
            'border-gray-200 text-gray-500 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400',
            disabled && 'opacity-50'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        <button
          type="submit"
          disabled={disabled || busy || !name.trim()}
          aria-label={t('quickAdd.add')}
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-all',
            'bg-blue-600 hover:bg-blue-700 active:scale-95',
            'disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500'
          )}
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
};

export default GroceryQuickAdd;
