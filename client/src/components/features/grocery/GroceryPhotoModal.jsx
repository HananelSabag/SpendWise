/**
 * GroceryPhotoModal — see the product photo properly.
 *
 * The photo used to expand into a panel wedged under its row, which shoved the
 * list around and clipped anything taller than a thumbnail. The whole reason a
 * photo is attached is "this exact yogurt, this exact package" — so it gets the
 * screen: a plain overlay, the image at its real proportions, one close button,
 * and the product link right there if the item has one.
 *
 * Closes on the X, the backdrop, or Escape.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, X } from 'lucide-react';
import { useTranslation } from '../../../stores';

const GroceryPhotoModal = ({ isOpen, onClose, src, title, link }) => {
  const { t, isRTL } = useTranslation('grocery');

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);

    // The list behind must not scroll while a full-screen image is up.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [isOpen, onClose]);

  if (!src) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label={t('sheet.cancel')}
            className="absolute end-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
            style={{ top: 'max(env(safe-area-inset-top), 1rem)' }}
          >
            <X className="h-5 w-5" />
          </button>

          <motion.img
            initial={{ scale: 0.94 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            src={src}
            alt={title}
            // Clicking the image itself must not dismiss it.
            onClick={(event) => event.stopPropagation()}
            className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />

          <div
            className="mt-4 flex w-full max-w-sm flex-col items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-center text-sm font-semibold text-white">{title}</p>

            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-bold text-white transition-colors hover:bg-white/25"
              >
                <ExternalLink className="h-4 w-4 rtl:-scale-x-100" />
                {t('item.openLink')}
              </a>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default GroceryPhotoModal;
