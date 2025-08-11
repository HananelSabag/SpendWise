import React, { useEffect, useState } from 'react';

/**
 * TopProgressBar
 * A subtle, non-blocking, indeterminate progress bar fixed to the top.
 * - visible: boolean to toggle visibility
 * - minVisibleMs: ensures the bar stays visible for at least this duration to prevent flicker
 */
const TopProgressBar = ({ visible = false, minVisibleMs = 350 }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [mountedAt, setMountedAt] = useState(0);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setMountedAt(Date.now());
    } else if (shouldRender) {
      const elapsed = Date.now() - mountedAt;
      const remaining = Math.max(0, minVisibleMs - elapsed);
      const timer = setTimeout(() => setShouldRender(false), remaining);
      return () => clearTimeout(timer);
    }
  }, [visible, shouldRender, mountedAt, minVisibleMs]);

  if (!shouldRender) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none transition-opacity duration-200">
      <div className="h-1 bg-gradient-to-r from-primary-500 via-indigo-500 to-primary-500 relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1/3 bg-white/50 sw-indeterminate" />
      </div>
    </div>
  );
};

export default TopProgressBar;


