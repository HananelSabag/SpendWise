/**
 * GroceryQuickAdd — adding an item is one line.
 *
 * The floating "+" used to be a door: tap it, wait for a sheet, fill a form of
 * seven fields, save, close, tap "+" again for the next item. Adding "milk"
 * cost two taps and a modal. But the button was already reserving the space at
 * the bottom of the screen (and 144px of page padding to clear it), so a docked
 * composer costs the same room and spends it far better — the "+" stops being a
 * door and becomes the submit key of the line.
 *
 * Type, press enter, type the next one. The field keeps focus between adds,
 * because items arrive in bursts ("milk, bread, tomatoes") and re-tapping an
 * input between each is the whole friction this replaces.
 *
 * The category is guessed live from the name and shown as the leading icon —
 * visible while you type, correctable in one tap, never a step you must take.
 *
 * Photo and link appear only once there is something to attach them to, and
 * they open the full editor rather than reimplementing a file picker inside a
 * one-line bar. They are rare by nature: a picture matters for the one specific
 * yoghurt, not for bread.
 */

import React, {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from 'react';
import { Camera, Link2, Plus } from 'lucide-react';
import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';
import { CATEGORY_BY_KEY, DEFAULT_CATEGORY, GROCERY_CATEGORIES } from './groceryCategories';
import { guessCategory } from './guessCategory';

const GroceryQuickAdd = forwardRef(({ onAdd, onExpand, className, style }, ref) => {
  const { t } = useTranslation('grocery');

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [pinned, setPinned] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const inputRef = useRef(null);
  const rootRef = useRef(null);

  // So the empty list's own call to action can put the cursor here rather
  // than opening a second, different way to add an item.
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }), []);

  // Guessing follows the name until the user overrides it, and starts following
  // again after a successful add.
  useEffect(() => {
    if (pinned) return;
    setCategory(guessCategory(name) || DEFAULT_CATEGORY);
  }, [name, pinned]);

  useEffect(() => {
    if (!pickerOpen) return undefined;
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setPickerOpen(false);
    };
    const closeOnEscape = (event) => { if (event.key === 'Escape') setPickerOpen(false); };
    document.addEventListener('pointerdown', closeOutside, true);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside, true);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [pickerOpen]);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !busy;

  const draft = useMemo(() => ({
    name: trimmed,
    category_key: category,
    quantity: quantity.trim(),
  }), [trimmed, category, quantity]);

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setBusy(true);
    const added = await onAdd({
      name: trimmed,
      category_key: category,
      quantity: quantity.trim() ? Number(quantity) : undefined,
    });
    setBusy(false);
    if (!added) return;

    setName('');
    setQuantity('');
    setPinned(false);
    // Straight into the next item; a burst of items is the normal case.
    inputRef.current?.focus();
  }, [canSubmit, onAdd, trimmed, category, quantity]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  }, [submit]);

  const openFull = useCallback((focusField) => {
    onExpand({ ...draft, focusField });
    setName('');
    setQuantity('');
    setPinned(false);
  }, [onExpand, draft]);

  const active = CATEGORY_BY_KEY[category] || CATEGORY_BY_KEY[DEFAULT_CATEGORY];
  const ActiveIcon = active.icon;

  const iconButton = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 '
    + 'transition-colors hover:text-blue-600 focus-visible:outline focus-visible:outline-2 '
    + 'focus-visible:outline-blue-500 dark:text-gray-500';

  return (
    <div ref={rootRef} className={cn('relative', className)} style={style}>
      {pickerOpen && (
        <div
          role="listbox"
          aria-label={t('quickAdd.categoryHint')}
          className="absolute bottom-full end-0 start-0 mb-2 max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        >
          <ul className="grid grid-cols-2 gap-1">
            {GROCERY_CATEGORIES.map((entry) => {
              const Icon = entry.icon;
              const selected = entry.key === category;
              return (
                <li key={entry.key}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setCategory(entry.key);
                      setPinned(true);
                      setPickerOpen(false);
                      inputRef.current?.focus();
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-xl px-2 py-2 text-start text-xs font-semibold',
                      selected
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/60'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', entry.tint)} />
                    <span className="truncate">{t(`categories.${entry.key}`)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-white ps-1 pe-1 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {/* The guess, made visible. Tap to correct it. */}
        <button
          type="button"
          onClick={() => setPickerOpen((open) => !open)}
          aria-label={`${t('quickAdd.categoryHint')}: ${t(`categories.${category}`)}`}
          aria-expanded={pickerOpen}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500',
            active.chip
          )}
        >
          <ActiveIcon className={cn('h-4 w-4', active.tint)} />
        </button>

        <input
          ref={inputRef}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('quickAdd.placeholder')}
          aria-label={t('quickAdd.aria')}
          enterKeyHint="done"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-50"
        />

        {/* Only meaningful once there is an item to attach them to. */}
        {trimmed.length > 0 && (
          <>
            <input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value.replace(/[^\d.]/g, ''))}
              onKeyDown={handleKeyDown}
              inputMode="decimal"
              placeholder="1"
              aria-label={t('quickAdd.quantity')}
              className="w-9 shrink-0 rounded-lg bg-gray-100 py-1.5 text-center text-sm tabular-nums text-gray-700 outline-none placeholder:text-gray-400 dark:bg-gray-700 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={() => openFull('image')}
              aria-label={t('quickAdd.addPhoto')}
              className={iconButton}
            >
              <Camera className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => openFull('link')}
              aria-label={t('quickAdd.addLink')}
              className={iconButton}
            >
              <Link2 className="h-4 w-4" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          aria-label={t('quickAdd.add')}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500',
            canSubmit
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-300 dark:bg-gray-700 dark:text-gray-600'
          )}
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
});

GroceryQuickAdd.displayName = 'GroceryQuickAdd';

export default GroceryQuickAdd;
