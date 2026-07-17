/**
 * InfoHint — a "?" that holds an explanation until it is asked for.
 *
 * Financial screens rot when every number drags a sentence behind it: the prose crowds out the
 * figures and the user stops reading either. Keep the surface to numbers and short labels, and
 * park the "why" in here. Closes on the X, on a backdrop tap, and on Escape.
 */

import React, { useEffect, useId, useRef, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

import { cn } from '../../utils/helpers';

export default function InfoHint({ title, children, className = '', align = 'end' }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <span className={cn('relative inline-flex', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={typeof title === 'string' ? title : 'Explain'}
        className="rounded-full p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          {/* A tap anywhere outside dismisses it — the fastest way out on a phone. */}
          <span
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <span
            id={panelId}
            role="dialog"
            className={cn(
              'absolute top-6 z-50 w-64 rounded-2xl border border-gray-200 bg-white p-3 text-start shadow-xl',
              'dark:border-gray-700 dark:bg-gray-900',
              align === 'end' ? 'end-0' : 'start-0',
            )}
          >
            <span className="mb-1 flex items-start justify-between gap-2">
              {title && <span className="text-xs font-bold text-gray-900 dark:text-white">{title}</span>}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="-me-1 -mt-1 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
            <span className="block text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">{children}</span>
          </span>
        </>
      )}
    </span>
  );
}
