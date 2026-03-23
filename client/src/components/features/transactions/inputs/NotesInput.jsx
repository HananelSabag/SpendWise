/**
 * 📝 NOTES INPUT — Simple auto-resize textarea
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '../../../../stores';
import { cn } from '../../../../utils/helpers';

const NotesInput = ({
  value = '',
  onChange,
  maxLength = 500,
  disabled = false,
  placeholder,
  className = '',
}) => {
  const { t } = useTranslation('transactions');
  const textareaRef = useRef(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => { resize(); }, [value, resize]);

  const handleChange = useCallback((e) => {
    if (e.target.value.length <= maxLength) onChange?.(e.target.value);
  }, [onChange, maxLength]);

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {t('fields.notes.label', 'Notes')}
      </label>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onInput={resize}
        disabled={disabled}
        placeholder={placeholder || t('fields.notes.placeholder', 'Optional notes...')}
        rows={2}
        className={cn(
          'w-full px-3 py-2.5 rounded-xl border text-sm resize-none transition-all outline-none',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
          'placeholder-gray-400 dark:placeholder-gray-500',
          'border-gray-200 dark:border-gray-700',
          'focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 dark:focus:border-blue-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{ minHeight: '72px', maxHeight: '160px' }}
      />

      {value.length > 0 && (
        <p className={cn(
          'text-xs text-right',
          value.length >= maxLength * 0.9 ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'
        )}>
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
};

export default NotesInput;
