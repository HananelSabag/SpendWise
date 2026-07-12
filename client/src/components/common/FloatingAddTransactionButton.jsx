/**
 * ➕ FloatingAddTransactionButton (desktop)
 *
 * A small speed-dial FAB at bottom-start. Tapping the main button reveals the
 * one-time entry actions (Add expense / Add income) — the same two actions the
 * mobile bottom-nav sheet offers, so desktop and mobile match. Each action
 * dispatches the global 'transaction:add' event handled by
 * UnifiedTransactionActions. Desktop only (hidden on mobile, which has the
 * bottom-nav FAB).
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, MinusCircle, PlusCircle, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../stores';
import { cn } from '../../utils/helpers';

const FloatingAddTransactionButton = ({ title }) => {
  const { t, isRTL, currentLanguage } = useTranslation('transactions');
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const label = title || t('actions.addTransaction', 'Add Transaction');
  const he = currentLanguage === 'he';

  const dispatch = useCallback((type) => {
    try {
      window.dispatchEvent(new CustomEvent('transaction:add', { detail: { type } }));
    } catch (_) {}
    setOpen(false);
  }, []);

  const go = useCallback((href) => {
    setOpen(false);
    navigate(href);
  }, [navigate]);

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const actions = [
    {
      key: 'expense',
      label: t('addExpense', 'Add Expense'),
      icon: MinusCircle,
      ring: 'bg-red-500 hover:bg-red-600 shadow-red-500/30',
      onClick: () => dispatch('expense'),
    },
    {
      key: 'income',
      label: t('addIncome', 'Add Income'),
      icon: PlusCircle,
      ring: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30',
      onClick: () => dispatch('income'),
    },
    {
      key: 'insights',
      label: he ? 'חודשים ותובנות' : 'Months & insights',
      icon: BarChart3,
      ring: 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/30',
      onClick: () => go('/insights'),
    },
  ];

  return (
    <div className="hidden lg:block">
      {/* Click-away backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[9999]"
          />
        )}
      </AnimatePresence>

      <div
        className="fixed bottom-6 start-6 z-[10000] flex flex-col items-start gap-3"
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        {/* Speed-dial actions */}
        <AnimatePresence>
          {open && (
            <div className="flex flex-col items-start gap-2">
              {actions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.key}
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 500, damping: 30 }}
                    onClick={action.onClick}
                    className="group flex items-center gap-2.5 focus:outline-none"
                  >
                    <span className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg transition-colors',
                      action.ring,
                    )}>
                      <Icon className="h-5 w-5" strokeWidth={1.9} />
                    </span>
                    <span className="rounded-lg bg-gray-900 px-3 py-1 text-sm font-medium text-white shadow-md dark:bg-gray-800">
                      {action.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Main button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          aria-label={label}
          aria-expanded={open}
          title={label}
          onClick={() => setOpen((v) => !v)}
          className="group relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-indigo-600 shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-700 focus:outline-none"
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="h-6 w-6 text-white" />
              </motion.span>
            ) : (
              <motion.span key="plus" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Plus className="h-6 w-6 text-white" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
};

export default FloatingAddTransactionButton;
