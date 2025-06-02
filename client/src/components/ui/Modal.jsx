// components/ui/Modal.jsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/helpers';

const sizes = {
  small: "max-w-md",
  medium: "max-w-lg", 
  large: "max-w-2xl",
  xl: "max-w-4xl",
  xxl: "max-w-6xl w-[90vw] h-[90vh]",
  full: "max-w-full mx-4"
};

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  size = "medium", 
  className = "",
  showCloseButton = true,
  preventBackdropClose = false,
  // החלק החשוב: אופציה לביטול הצגת כותרת וכפתור סגירה מובנים
  hideHeader = false
}) => {
  // נהל את לחיצת ESC כדי לסגור את המודל
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // מנע גלילה בגוף המסמך כשהמודל פתוח
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // וריאנטים להנפשה
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { type: "spring", duration: 0.4 }
    },
    exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2 } }
  };

  // סגור רק כשלוחצים על המשטח האפור, לא על המודל עצמו
  const handleBackdropClick = (e) => {
    if (!preventBackdropClose && e.target === e.currentTarget) {
      onClose();
    }
  };

  // אם המודל לא פתוח, אל תחזיר כלום
  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 backdrop-blur-sm"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
          onClick={handleBackdropClick}
          data-testid="modal-backdrop"
        >
          <motion.div
            className={cn(
              "relative bg-white dark:bg-gray-800 w-full rounded-xl shadow-xl overflow-hidden",
              sizes[size],
              className
            )}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            data-testid="modal-content"
          >
            {/* כותרת רק אם לא מוסתרת */}
            {!hideHeader && title && (
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
                {showCloseButton && (
                  <button
                    className="p-1 text-gray-500 rounded-lg hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                    onClick={onClose}
                    aria-label="Close"
                    data-testid="modal-close-button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            <div className={cn(
              "p-4 overflow-y-auto",
              size === 'xxl' ? "max-h-[85vh]" : "max-h-[90vh]"
            )}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.getElementById('portal-root') || document.body);
};

export default Modal;