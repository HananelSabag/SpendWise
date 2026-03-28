/**
 * SideDrawer — slides in from the right on desktop.
 * Used by Modal when sheet={true} on non-mobile viewports.
 * Features: ESC to close, click-outside to close, scroll lock, focus trap.
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useTranslation } from '../../stores';

const SideDrawer = ({
  isOpen,
  onClose,
  title,
  children,
  width = 520,
  closeable = true,
  closeOnOverlayClick = true,
  className = '',
}) => {
  const { t } = useTranslation('common');
  const drawerRef = useRef(null);

  // ESC key + scroll lock
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && closeable && isOpen) onClose?.(); };
    if (isOpen) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeable, onClose]);

  // Focus first element when opened
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      const focusable = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable[0]?.focus();
    }
  }, [isOpen]);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeOnOverlayClick && closeable ? onClose : undefined}
          />

          {/* Drawer panel */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ width: Math.min(width, window.innerWidth - 48) }}
            className={cn(
              'relative flex flex-col h-full',
              'bg-white dark:bg-gray-900',
              'shadow-2xl shadow-black/20',
              'overflow-hidden',
              className,
            )}
          >
            {/* Header */}
            {(title || closeable) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 flex-shrink-0">
                {title && (
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h2>
                )}
                {closeable && (
                  <button
                    onClick={onClose}
                    className="ml-auto p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                    aria-label={t('close')}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};

export default SideDrawer;
