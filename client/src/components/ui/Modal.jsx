/**
 * 🪟 MODAL COMPONENT - Mobile-First Responsive Modal
 * Features: Zustand stores, RTL support, Touch-optimized, Mobile slide-up
 * @version 2.0.0
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { useTranslation } from '../../stores';

import { cn } from '../../utils/helpers';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeable = true,
  closeOnOverlayClick = true,
  className = '',
  overlayClassName = '',
  mobileFullScreen = false,
  ...props
}) => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { t, isRTL } = useTranslation();

  const modalRef = useRef(null);

  // ✅ Mobile-first size configurations
  const sizes = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full'
  };

  // ✅ Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closeable && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeable, onClose]);

  // ✅ Handle overlay click
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && closeable && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  // ✅ Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Focus first focusable element
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      if (firstElement) {
        firstElement.focus();
      }
    }
  }, [isOpen]);

  // ✅ Don't render if not open
  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center p-4',
            'sm:p-6 lg:p-8',
            overlayClassName
          )}
          onClick={handleOverlayClick}
        >
          {/* ✅ Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* ✅ Modal content */}
          <motion.div
            ref={modalRef}
            initial={{
              opacity: 0,
              scale: 0.95,
              y: mobileFullScreen ? '100%' : 20
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: mobileFullScreen ? '100%' : 20
            }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300
            }}
            className={cn(
              'relative w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl',
              'max-h-[90vh] overflow-hidden flex flex-col',
              // Mobile-first responsive design
              mobileFullScreen 
                ? 'h-full sm:h-auto sm:max-h-[90vh] sm:rounded-lg' 
                : 'max-h-[90vh]',
              // Size configuration
              !mobileFullScreen && sizes[size],
              // RTL support
              isRTL && 'text-right',
              className
            )}
            {...props}
          >
            {/* ✅ Header */}
            {(title || closeable) && (
              <div className={cn(
                'flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700',
                'shrink-0',
                isRTL && 'flex-row-reverse'
              )}>
                {/* Title */}
                <h2 className={cn(
                  'text-lg font-semibold text-gray-900 dark:text-white',
                  'truncate pr-4',
                  isRTL && 'text-right pl-4 pr-0'
                )}>
                  {title}
                </h2>

                {/* Close button */}
                {closeable && (
                  <button
                    onClick={onClose}
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full',
                      'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                      'hover:bg-gray-100 dark:hover:bg-gray-800',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500',
                      'transition-colors duration-200',
                      // Enhanced touch target for mobile
                      'touch-manipulation'
                    )}
                    aria-label={t('common.close', { fallback: 'Close' })}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* ✅ Content */}
            <div className={cn(
              'flex-1 overflow-y-auto',
              'p-4 sm:p-6',
              // Custom scrollbar for better mobile experience
              'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
              'scrollbar-track-transparent'
            )}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // ✅ Render in portal
  return createPortal(modalContent, document.getElementById('portal-root') || document.body);
};

// ✅ Modal variants for different use cases
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  ...props
}) => {
  const { t } = useTranslation();

  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || t('common.confirm', { fallback: 'Confirm' })}
      size="sm"
      {...props}
    >
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          {message}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            {cancelText || t('common.cancel', { fallback: 'Cancel' })}
          </button>
          
          <button
            onClick={() => {
              onConfirm?.();
              onClose?.();
            }}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              variantStyles[variant]
            )}
          >
            {confirmText || t('common.confirm', { fallback: 'Confirm' })}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Modal;