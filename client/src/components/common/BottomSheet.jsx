/**
 * BottomSheet — mobile modal that slides up from the bottom.
 * Drag handle at top, dark backdrop, rounded top corners.
 * Uses Framer Motion for animation. Dismisses on backdrop click or drag down.
 */

import React, { useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/helpers';

const BottomSheet = ({
  isOpen,
  onClose,
  children,
  title,
  className = '',
  /** 'auto' (default) | 'full' (100dvh) | 'half' (50dvh) */
  height = 'auto',
}) => {
  const dragControls = useDragControls();

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const heightClass = {
    auto: 'max-h-[90dvh]',
    full: 'h-[90dvh]',
    half: 'h-[50dvh]',
  }[height] ?? 'max-h-[90dvh]';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) onClose();
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-[201]',
              'bg-white dark:bg-gray-900',
              'rounded-t-2xl shadow-2xl',
              'flex flex-col',
              heightClass,
              className
            )}
            style={{ touchAction: 'none' }}
          >
            {/* Drag handle area — captures drag */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex-shrink-0 flex flex-col items-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
            >
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            {/* Header row (title + close) */}
            {(title || true) && (
              <div className="flex-shrink-0 flex items-center justify-between px-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                {title ? (
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h2>
                ) : (
                  <div />
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
