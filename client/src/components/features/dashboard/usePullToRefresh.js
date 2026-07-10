/**
 * usePullToRefresh — mobile pull-down-to-refresh gesture for the dashboard.
 * Returns { pull, refreshing } for rendering the pull indicator.
 */

import { useState, useEffect, useRef } from "react";

export const usePullToRefresh = (onRefresh, enabled) => {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (e) => {
      if (window.scrollY > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (e) => {
      if (!pulling.current || refreshing) return;
      const delta = (e.touches[0].clientY - startY.current) * 0.5;
      if (delta > 0 && window.scrollY === 0) {
        setPull(Math.min(delta, 110));
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pull >= 70 && !refreshing) {
        setRefreshing(true);
        setPull(54);
        try {
          await onRefresh();
        } catch (_) {}
        setRefreshing(false);
      }
      setPull(0);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled, pull, refreshing, onRefresh]);

  return { pull, refreshing };
};

export default usePullToRefresh;
