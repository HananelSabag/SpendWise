/**
 * PWAInstallPrompt — non-intrusive "install SpendWise" banner.
 *
 * The Vite PWA plugin already generates the manifest + service worker.
 * Browsers fire `beforeinstallprompt` on supported devices when they
 * decide the app is install-eligible. We capture that event and show a
 * dismissable banner. After the user installs OR dismisses, we don't ask
 * again for 30 days (stored in localStorage).
 *
 * Why bother on a Render-free-tier app: once installed as a PWA, the app
 * shell is cached locally. The 30–60s cold-start of Render only matters
 * for the API call, not for the app launching. So users get a much
 * snappier "open the app" experience even when the backend is asleep.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Download, X } from 'lucide-react';

const DISMISS_KEY = 'spendwise-pwa-dismissed-at';
const DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const wasRecentlyDismissed = () => {
  try {
    const ts = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
    return ts && Date.now() - ts < DISMISS_COOLDOWN_MS;
  } catch (_) {
    return false;
  }
};

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already installed (running in standalone/PWA mode)? Never show.
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      // iOS Safari sets navigator.standalone when added to home screen
      window.navigator?.standalone === true;
    if (isStandalone) return;

    if (wasRecentlyDismissed()) return;

    const onBeforeInstall = (e) => {
      e.preventDefault();        // stop Chrome's default mini-infobar
      setDeferredPrompt(e);
      setVisible(true);
    };

    const onAppInstalled = () => {
      // User installed via browser UI — clean up the prompt.
      setDeferredPrompt(null);
      setVisible(false);
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (_) {}
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      const result = await deferredPrompt.prompt();
      // Either way (accepted or dismissed), drop the deferred prompt — Chrome
      // requires a fresh user gesture for each call.
      setDeferredPrompt(null);
      setVisible(false);
      if (result?.outcome !== 'accepted') {
        try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (_) {}
      }
    } catch (_) {
      setVisible(false);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (_) {}
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 inset-x-4 lg:inset-x-auto lg:right-4 z-[9990] max-w-sm mx-auto lg:mx-0 pointer-events-auto">
      <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 shadow-2xl p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <Download className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Install SpendWise
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Add to your home screen for faster access — works offline too.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors"
            >
              Not now
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
