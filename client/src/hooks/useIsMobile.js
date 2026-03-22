import { useState, useEffect } from 'react';

/**
 * Returns true when the viewport is mobile-sized (< 768px).
 * Uses matchMedia for accurate, CSS-consistent breakpoint detection.
 * SSR-safe: defaults to false on server.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
