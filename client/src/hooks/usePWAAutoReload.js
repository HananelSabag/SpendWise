import { useEffect } from 'react';

// PWA update handler. Two halves of "users get new deploys fast":
//  1. controllerchange → reload when a new service worker takes control.
//  2. ACTIVELY CHECK for a new build — the missing piece. autoUpdate only
//     checks on hard navigations, so a long-lived tab / installed PWA never
//     discovered new deploys. Now we call registration.update() when the tab
//     regains focus (throttled to 5 min) and every 60 min as a fallback.
export const usePWAAutoReload = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const reload = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', reload);

    let lastCheck = 0;
    const checkForUpdate = () => {
      const now = Date.now();
      if (now - lastCheck < 5 * 60 * 1000) return;
      lastCheck = now;
      navigator.serviceWorker.getRegistration()
        .then((reg) => reg?.update())
        .catch(() => {});
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    };
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(checkForUpdate, 60 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', reload);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, []);
};

export default usePWAAutoReload;
