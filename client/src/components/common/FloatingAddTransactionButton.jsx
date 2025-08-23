/**
 * ➕ FloatingAddTransactionButton
 * Beautiful FAB placed at bottom-left to trigger Add Transaction modal
 * Production-ready: accessible, keyboard-focusable, mobile-friendly, high z-index
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from '../../stores';

const FloatingAddTransactionButton = ({ onClick, title }) => {
  const { t, isRTL } = useTranslation('transactions');
  const label = title || t('actions.addTransaction', 'Add Transaction');

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        if (onClick) {
          onClick(e);
        } else {
          try {
            window.dispatchEvent(new CustomEvent('transaction:add'));
          } catch (_) {}
        }
      }}
      className="fixed bottom-6 left-6 z-[10000] group focus:outline-none"
    >
      {/* Glow */}
      <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500/30 to-indigo-500/30 blur-xl opacity-60 group-hover:opacity-90 transition-opacity" />

      {/* Main Circle */}
      <span
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl shadow-blue-600/30 hover:from-blue-700 hover:to-indigo-700 transition-transform transform group-active:scale-95"
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        <Plus className="h-6 w-6 text-white" />
      </span>

      {/* Label on hover (desktop) */}
      <span className="pointer-events-none absolute left-20 bottom-2 rounded-lg bg-gray-900 text-white px-3 py-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity hidden md:inline-block">
        {label}
      </span>
    </button>
  );
};

export default FloatingAddTransactionButton;


