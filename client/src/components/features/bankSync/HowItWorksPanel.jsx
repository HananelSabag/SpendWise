/**
 * HowItWorksPanel — collapsible explainer of the Bank Connect flow plus a
 * short security reassurance. Purely presentational.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronDown, ShieldCheck } from 'lucide-react';
import { cn } from '../../../utils/helpers';

export default function HowItWorksPanel({ t }) {
  const [open, setOpen] = useState(false);
  const steps = [t('howItWorksStep1'), t('howItWorksStep2'), t('howItWorksStep3'), t('howItWorksStep4')];

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-300"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500" />
          {t('howItWorks')}
        </span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 space-y-3"
          >
            <div className="space-y-2.5">
              {steps.map((text, i) => (
                <div key={i} className="flex gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{t('securityTitle')}</p>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">{t('securityPoint2')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
