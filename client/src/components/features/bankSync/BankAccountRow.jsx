/**
 * BankAccountRow — one account under a synced bank: its number, balance,
 * and a sync on/off switch (uses the shared Switch component).
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Switch } from '../../ui';
import { useToast } from '../../../hooks/useToast';
import { cn } from '../../../utils/helpers';
import bankConnectionsApi from '../../../api/bankConnections';
import { formatILS } from './bankSyncMeta';

export default function BankAccountRow({ account, connectionId, t, lang }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const enabled = account.enabled !== false;
  const hasBalance = account.balance !== null && account.balance !== undefined;

  const toggle = useMutation({
    mutationFn: (next) =>
      bankConnectionsApi.setAccountEnabled(connectionId, account.account_number || '', next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankSyncStats'] });
      queryClient.invalidateQueries({ queryKey: ['bankConnections'] });
    },
    onError: (err) => toast.error(err?.message || t('loadError')),
  });

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
          {account.account_number || t('mainAccount')}
        </p>
        {!enabled && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">{t('accountDisabledHint')}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={cn(
          'text-sm font-bold tabular-nums',
          enabled ? 'text-gray-900 dark:text-white' : 'text-gray-400 line-through',
        )}>
          {hasBalance ? formatILS(account.balance, lang) : '—'}
        </span>
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
