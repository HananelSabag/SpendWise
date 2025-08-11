import React, { useEffect, useMemo, useRef, useState } from 'react';

const MAX_WAIT_MS = 50000; // 50s

const ServerWaking = () => {
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('Starting server…');
  const startRef = useRef(Date.now());
  const timerRef = useRef(null);
  const pollRef = useRef(null);

  const progress = useMemo(() => Math.min(100, Math.round((elapsed / MAX_WAIT_MS) * 100)), [elapsed]);

  useEffect(() => {
    // Mark waking state
    if (typeof window !== 'undefined') {
      window.__SERVER_WAKING__ = true;
    }

    // Progress timer
    timerRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 200);

    // Health polling with backoff (5s, 7s, 9s, ...)
    let attempt = 0;
    const poll = async () => {
      attempt += 1;
      try {
        const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
        const baseRoot = base.endsWith('/api/v1') ? base.slice(0, -('/api/v1'.length)) : base;
        const res = await fetch(`${baseRoot}/health`, { cache: 'no-store' });
        if (res.ok) {
          // Clear flag and navigate back
          try {
            const returnTo = sessionStorage.getItem('serverWakingReturnTo') || '/';
            sessionStorage.removeItem('serverWakingReturnTo');
            window.__SERVER_WAKING__ = false;
            if (window.spendWiseNavigate) window.spendWiseNavigate(returnTo, { replace: true });
            else window.location.replace(returnTo);
          } catch (_) {}
          return;
        }
      } catch (_) {}
      const delay = Math.min(5000 + attempt * 2000, 12000);
      pollRef.current = setTimeout(poll, delay);
    };

    pollRef.current = setTimeout(poll, 5000);

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (elapsed > MAX_WAIT_MS / 2) setMessage('Server is waking up… almost there');
    if (elapsed > MAX_WAIT_MS) setMessage('Still waking… you can keep this tab open');
  }, [elapsed]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="w-full max-w-md text-center px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Preparing SpendWise</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{message}</p>
        </div>
        <div className="w-full h-3 bg-purple-100 dark:bg-purple-950/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-gray-500">Up to ~50 seconds on free Render plan</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100"
            onClick={() => {
              const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
              const baseRoot = base.endsWith('/api/v1') ? base.slice(0, -('/api/v1'.length)) : base;
              window.open(`${baseRoot}/health`, '_blank');
            }}
          >Check health</button>
          <button
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => {
              // allow user to return manually
              try {
                const returnTo = sessionStorage.getItem('serverWakingReturnTo') || '/';
                if (window.spendWiseNavigate) window.spendWiseNavigate(returnTo, { replace: true });
                else window.location.replace(returnTo);
              } catch (_) {}
            }}
          >Go back</button>
        </div>
      </div>
    </div>
  );
};

export default ServerWaking;


