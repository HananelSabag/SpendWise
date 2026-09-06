import React from 'react';
import CycleSummary from '../financialCycleV2/CycleSummary';
import { CycleEmpty, cycleButton } from '../financialCycleV2/CyclePrimitives';

export default function FinancialCycleSnapshotV2({
  cycle,
  isLoading,
  isError,
  hasNoBankData,
  needsCycleAnchor,
  t,
  onOpen,
  onRetry,
  ...props
}) {
  if (isLoading && !cycle)
    return (
      <div
        className="h-80 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800/70"
        aria-label={t('cycleV2.loadingCycle')}
      />
    );
  if (isError && !cycle)
    return (
      <CycleEmpty title={t('cycleV2.loadError')}>
        <button
          type="button"
          className={`${cycleButton} bg-indigo-600 text-white`}
          onClick={onRetry}
        >
          {t('cycleV2.tryAgain')}
        </button>
      </CycleEmpty>
    );
  if (!cycle || hasNoBankData || needsCycleAnchor)
    return (
      <CycleEmpty
        title={t(hasNoBankData ? 'cycleV2.noBankTitle' : 'cycleV2.anchorTitle')}
        hint={t(hasNoBankData ? 'cycleV2.noBankHint' : 'cycleV2.anchorHint')}
      >
        <button
          type="button"
          onClick={onOpen}
          className={`${cycleButton} bg-indigo-600 text-white`}
        >
          {t('cycleV2.openSetup')}
        </button>
      </CycleEmpty>
    );
  return <CycleSummary cycle={cycle} t={t} onOpen={onOpen} compact {...props} />;
}
