import React from 'react';
import { AlertCircle, CheckCircle2, Clock3, CreditCard, Landmark, Loader2 } from 'lucide-react';

import { useTranslation } from '../../../stores';
import { useIsMobile } from '../../../hooks/useIsMobile';
import BottomSheet from '../../common/BottomSheet';
import Modal from '../../ui/Modal';
import { cn } from '../../../utils/helpers';

const sourceName = (source) => ({ max: 'MAX', visa_cal: 'CAL', leumi: 'Leumi' }[source] || source || 'Bank');

function localDate(value, language) {
  if (!value) return '';
  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-GB', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${value}T12:00:00`));
}

function DetailBody({ details, isLoading, isError, onRetry, formatCurrency }) {
  const { t, currentLanguage } = useTranslation('dashboard');

  if (isLoading) {
    return <div className="flex min-h-56 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>;
  }
  if (isError || !details) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-7 w-7 text-rose-500" />
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('calendarActivity.detailsLoadError')}</p>
        <button type="button" onClick={onRetry} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">
          {t('calendarActivity.retry')}
        </button>
      </div>
    );
  }

  const isIncome = details.kind === 'bank_income' || details.kind === 'refunds_and_installment_proceeds';
  const totalTone = isIncome ? 'text-emerald-600' : 'text-gray-950 dark:text-white';
  const activeAdjustments = (details.adjustments || []).filter((item) => item.adjustment > 0);

  return (
    <div className="space-y-3 p-4 sm:p-0">
      <div className="flex items-end justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/70">
        <div>
          <p className="text-[11px] font-semibold text-gray-500">{t('calendarActivity.detailsTotal')}</p>
          <p className={cn('mt-1 text-2xl font-black tabular-nums', totalTone)}>{formatCurrency(details.total || 0)}</p>
        </div>
        <span className="text-xs font-semibold text-gray-500">{t('calendarActivity.transactionCount', { count: details.count || 0 })}</span>
      </div>

      {details.kind === 'bank_expenses' && details.adjustment > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-indigo-50 px-3 py-2 text-xs text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
          <span>{t('calendarActivity.rawLessOverlap', { raw: formatCurrency(details.rawTotal), adjustment: formatCurrency(details.adjustment) })}</span>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
        </div>
      )}

      {details.kind === 'card_debit_adjustments' ? (
        <div className="space-y-2">
          {activeAdjustments.map((item) => (
            <div key={`${item.cardSource}:${item.accountNumber}:${item.billingDate}`} className="rounded-2xl border border-gray-100 p-3 dark:border-gray-800">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                  <CreditCard className="h-4 w-4 text-violet-500" />
                  {sourceName(item.cardSource)} ••••{String(item.accountNumber || '').slice(-4)}
                </span>
                <span className="text-xs text-gray-500">{localDate(item.billingDate, currentLanguage)}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div><p className="text-gray-400">{t('calendarActivity.fullBankDebit')}</p><b>{formatCurrency(item.bankDebit)}</b></div>
                <div><p className="text-gray-400">{t('calendarActivity.alreadyRepresented')}</p><b>−{formatCurrency(item.adjustment)}</b></div>
                <div><p className="text-gray-400">{t('calendarActivity.remainingBankDebit')}</p><b>{formatCurrency(item.remainingBankDebit)}</b></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
          {(details.transactions || []).map((transaction) => {
            const income = transaction.type === 'income';
            const adjusted = transaction.adjustment > 0;
            const Icon = transaction.bankSource === 'max' || transaction.bankSource === 'visa_cal' ? CreditCard : Landmark;
            return (
              <div key={transaction.id} className="flex items-center gap-3 bg-white px-3 py-3 dark:bg-gray-900">
                <span className="rounded-xl bg-gray-100 p-2 text-gray-500 dark:bg-gray-800"><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{transaction.description || t('calendarActivity.unknownTransaction')}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                    <span>{localDate(transaction.date, currentLanguage)}</span>
                    <span>·</span>
                    <span>{sourceName(transaction.bankSource)}{transaction.accountNumber ? ` ••••${String(transaction.accountNumber).slice(-4)}` : ''}</span>
                    {transaction.status === 'pending' && <span className="inline-flex items-center gap-1 text-amber-600"><Clock3 className="h-3 w-3" />{t('calendarActivity.pending')}</span>}
                  </p>
                  {adjusted && <p className="mt-1 text-[10px] text-indigo-600 dark:text-indigo-300">{t('calendarActivity.rowAdjusted', { raw: formatCurrency(transaction.amount), adjustment: formatCurrency(transaction.adjustment) })}</p>}
                </div>
                <div className="shrink-0 text-end">
                  <p className={cn('whitespace-nowrap text-sm font-black tabular-nums', income ? 'text-emerald-600' : 'text-gray-950 dark:text-white')}>
                    {income ? '+' : '−'}{formatCurrency(transaction.countedAmount)}
                  </p>
                  {adjusted && <p className="text-[10px] tabular-nums text-gray-400 line-through">{formatCurrency(transaction.amount)}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CalendarActivityDetailsSheet({ isOpen, onClose, title, details, isLoading, isError, onRetry, formatCurrency }) {
  const isMobile = useIsMobile();
  const body = <DetailBody details={details} isLoading={isLoading} isError={isError} onRetry={onRetry} formatCurrency={formatCurrency} />;

  if (isMobile) {
    return <BottomSheet isOpen={isOpen} onClose={onClose} title={title} height="full">{body}</BottomSheet>;
  }
  return <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg" role="dialog" aria-modal="true" aria-label={title}>{body}</Modal>;
}
