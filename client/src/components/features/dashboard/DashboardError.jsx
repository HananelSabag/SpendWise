/** Query retries live in the shared query client. This view offers a manual retry. */
import React from 'react';
import { RefreshCw } from 'lucide-react';

const DashboardError = ({ onRetry, isRetrying = false, t }) => (
  <div className="flex min-h-[60vh] items-center justify-center px-4">
    <div role="alert" className="glass-card max-w-sm rounded-2xl p-6 text-center sm:p-8">
      <RefreshCw className="mx-auto mb-4 h-7 w-7 text-rose-500" />
      <h2 className="mb-2 text-lg font-semibold text-slate-950 dark:text-white">
        {t('dashboardError')}
      </h2>
      <p className="mb-5 text-sm leading-6 text-slate-600 dark:text-slate-400">
        {t('dashboardErrorMessage')}
      </p>
      <button
        type="button"
        disabled={isRetrying}
        onClick={onRetry}
        className="min-h-11 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
      >
        {t('reloadPage')}
      </button>
    </div>
  </div>
);
export default DashboardError;
