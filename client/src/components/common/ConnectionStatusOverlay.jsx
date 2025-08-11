import React, { useEffect, useMemo, useState } from 'react';

const ConnectionStatusOverlay = () => {
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [serverWaking, setServerWaking] = useState(typeof window !== 'undefined' ? !!window.__SERVER_WAKING__ : false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const interval = setInterval(() => setServerWaking(!!window.__SERVER_WAKING__), 500);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const visible = useMemo(() => isOffline || serverWaking, [isOffline, serverWaking]);
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {isOffline && (
        <div className="absolute top-0 left-0 right-0 mx-auto mt-4 w-fit px-4 py-2 rounded-xl bg-orange-100 text-orange-900 shadow-md pointer-events-auto">
          <span>You're offline. We will retry when connection is back.</span>
        </div>
      )}
      {serverWaking && (
        <div className="absolute top-14 left-0 right-0 mx-auto w-fit px-4 py-2 rounded-xl bg-purple-100 text-purple-900 shadow-md pointer-events-auto">
          <span>Waking server… Please wait.</span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatusOverlay;


