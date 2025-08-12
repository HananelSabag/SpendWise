import React, { useState, useEffect } from 'react';
import { Accessibility as AccessibilityIcon, X } from 'lucide-react';
import AccessibilityMenu from './AccessibilityMenu';

const STORAGE_KEY = 'spendwise-accessibility-fab-hidden';

const AccessibilityFab = () => {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      const v = sessionStorage.getItem(STORAGE_KEY);
      setHidden(v === '1');
    } catch (_) {}
  }, []);

  const toggleHidden = () => {
    const next = !hidden;
    setHidden(next);
    try { sessionStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch (_) {}
  };

  if (hidden) {
    // Small reveal dot in the corner
    return (
      <button
        aria-label="Show accessibility tools"
        title="Show accessibility tools"
        onClick={toggleHidden}
        className="fixed bottom-4 right-4 z-40 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition"
      />
    );
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          aria-label="Accessibility settings"
          onClick={() => setOpen(true)}
          className="rounded-full p-3 shadow-lg bg-primary-600 hover:bg-primary-700 text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <AccessibilityIcon className="w-6 h-6" />
        </button>
        <button
          aria-label="Hide accessibility button"
          title="Hide"
          onClick={toggleHidden}
          className="rounded-full p-2 shadow bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <AccessibilityMenu isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default AccessibilityFab;

