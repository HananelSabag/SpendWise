/**
 * Small shared form pieces for the Family Hub sheets.
 *
 * Deliberately plain: this is a screen two people fill in together on a phone,
 * so every control is a big tap target with the label above it, and nothing
 * hides behind a dropdown that needs a second tap to read.
 */

import React from 'react';

/** Label + optional hint above any control. */
export function Field({ label, hint, htmlFor, children, className = '' }) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-black text-slate-700 dark:text-slate-200"
      >
        {label}
      </label>
      {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/**
 * A segmented picker. Wraps instead of scrolling — a half-visible option on a
 * 375px screen is worse than a second row.
 */
export function Segmented({ options, value, onChange, ariaLabel }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = String(option.value) === String(value);
        const Icon = option.icon;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 text-xs font-black transition ${
              active
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-300'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Money input.
 *
 * `inputMode="decimal"` gets the numeric keypad on a phone, and the currency
 * sign sits inside the field so the number itself stays the big thing on screen.
 */
export function AmountInput({ id, value, onChange, placeholder = '0', autoFocus = false }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-base font-black text-slate-400">
        ₪
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          // Digits and one separator only — a stray letter here becomes NaN in
          // a total that is supposed to be the honest number on the screen.
          const cleaned = event.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
          const parts = cleaned.split('.');
          onChange(parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned);
        }}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white ps-8 pe-3 text-lg font-black tabular-nums text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      />
    </div>
  );
}

/** A plain text/number/date input in the same visual language. */
export function TextInput({ id, value, onChange, placeholder, type = 'text', inputMode, maxLength }) {
  return (
    <input
      id={id}
      type={type}
      inputMode={inputMode}
      maxLength={maxLength}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
    />
  );
}

/**
 * One-tap starters.
 *
 * They fill in a name and a category and never an amount — this screen only
 * works if every number on it came from a person who checked it.
 */
export function SuggestionChips({ label, items, onPick }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onPick(item)}
            className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Footer actions shared by both sheets. */
export function SheetActions({ onCancel, onSave, onDelete, saveLabel, cancelLabel, deleteLabel, disabled }) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-2 flex items-center gap-2 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:-mx-5 sm:px-5">
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl px-3 py-2.5 text-xs font-black text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          {deleteLabel}
        </button>
      )}
      <div className="flex-1" />
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl px-4 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={disabled}
        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {saveLabel}
      </button>
    </div>
  );
}
