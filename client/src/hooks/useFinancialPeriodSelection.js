import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'spendwise-financial-period-offset';
const EVENT_NAME = 'financial-period-changed';

export function clampPeriodOffset(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return 0;
  return Math.max(-24, Math.min(0, parsed));
}

function readStoredOffset() {
  try {
    return clampPeriodOffset(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return 0;
  }
}

export function useFinancialPeriodSelection() {
  const [periodOffset, setPeriodOffsetState] = useState(readStoredOffset);
  const periodOffsetRef = useRef(periodOffset);

  useEffect(() => {
    const handlePeriodChange = (event) => {
      const nextOffset = clampPeriodOffset(event.detail?.offset);
      periodOffsetRef.current = nextOffset;
      setPeriodOffsetState(nextOffset);
    };
    window.addEventListener(EVENT_NAME, handlePeriodChange);
    return () => window.removeEventListener(EVENT_NAME, handlePeriodChange);
  }, []);

  const setPeriodOffset = useCallback((nextValue) => {
    const resolved = clampPeriodOffset(
      typeof nextValue === 'function' ? nextValue(periodOffsetRef.current) : nextValue,
    );
    periodOffsetRef.current = resolved;
    setPeriodOffsetState(resolved);
    try { sessionStorage.setItem(STORAGE_KEY, String(resolved)); } catch (_) {}
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { offset: resolved } }));
  }, []);

  return {
    periodOffset,
    setPeriodOffset,
    goToPreviousPeriod: useCallback(() => setPeriodOffset((current) => current - 1), [setPeriodOffset]),
    goToNextPeriod: useCallback(() => setPeriodOffset((current) => current + 1), [setPeriodOffset]),
    goToCurrentPeriod: useCallback(() => setPeriodOffset(0), [setPeriodOffset]),
  };
}

export default useFinancialPeriodSelection;
