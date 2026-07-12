/**
 * BankAccountRow - one account/card under a synced source, with an on/off
 * switch. Real bank accounts show balance; credit-card accounts show what
 * that specific card charged instead (they have no bank balance). Either
 * way, a second line always says how many transactions and as-of when, so
 * the number the toggle sits next to is never a mystery.
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Switch } from '../../ui';
import { useToast } from '../../../hooks/useToast';
import { cn } from '../../../utils/helpers';
import bankConnectionsApi from '../../../api/bankConnections';
import { formatILS, formatDateTime } from './bankSyncMeta';

export default function BankAccountRow({ account, connectionId, t, lang, hideBalance = false }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const enabled = account.enabled !== false;
  const hasBalance = account.balance !== null && account.balance !== undefined;
  const txCount = account.transaction_count || 0;

  const toggle = useMutation({
    mutationFn: (next) =>
      bankConnectionsApi.setAccountEnabled(connectionId, account.account_number || '', next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankSyncStats'] });
      queryClient.invalidateQueries({ queryKey: ['bankConnections'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactionMonths'] });
      queryClient.invalidateQueries({ queryKey: ['salaryReview'] });
    },
    onError: (err) => toast.error(err?.message || t('loadError')),
  });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-lg py-2.5">
      <div className="min-w-0 pe-1">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
          {account.account_number || t('mainAccount')}
        </p>
        {!enabled && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">{t('accountDisabledHint')}</p>
        )}
        {enabled && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
            {account.last_transaction_at
              ? t('accountAsOf', { count: txCount, date: formatDateTime(account.last_transaction_at, lang), fallback: `${txCount} transactions · as of ${formatDateTime(account.last_transaction_at, lang)}` })
              : t('accountNoActivity', { fallback: 'No transactions synced yet' })}
          </p>
        )}
      </div>
      <div className="flex min-w-[104px] items-center justify-end gap-2.5 shrink-0">
        {hideBalance ? (
          <div className="text-end">
            <span className={cn(
              'text-sm font-bold tabular-nums block leading-tight',
              enabled ? 'text-gray-900 dark:text-white' : 'text-gray-400 line-through',
            )}>
              {txCount > 0 ? formatILS(account.expense, lang) : '-'}
            </span>
            {txCount > 0 && (
              <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                {t('chargedLabel', { fallback: 'charged' })}
              </span>
            )}
          </div>
        ) : (
          <span className={cn(
            'text-sm font-bold tabular-nums',
            enabled ? 'text-gray-900 dark:text-white' : 'text-gray-400 line-through',
          )}>
            {hasBalance ? formatILS(account.balance, lang) : '-'}
          </span>
        )}
        {connectionId && (
          <Switch
            checked={enabled}
            disabled={toggle.isPending}
            variant="success"
            size="sm"
            onCheckedChange={(next) => toggle.mutate(next)}
            aria-label={enabled ? t('accountSyncOn') : t('accountSyncOff')}
          />
        )}
      </div>
    </div>
  );
}
