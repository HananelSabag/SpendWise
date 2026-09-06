/**
 * GroceryListSwitcher — which of your lists you are looking at.
 *
 * Most people have exactly one list and should never see this; the page renders
 * it only when there is more than one. A second list appears when somebody
 * shares theirs with you, which used to be refused outright ("empty or close
 * your own list first") — this is the control that turns that dead end into a
 * choice.
 *
 * Lists have no user-facing name, so they are labelled by whose they are. That
 * is also how people actually refer to them: mine, and Moshe's.
 */

import React from 'react';
import { Check, ListChecks, Loader2 } from 'lucide-react';
import BottomSheet from '../../common/BottomSheet';
import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';

export const listLabel = (list, t) => (
  list.isOwn ? t('lists.mine') : t('lists.someones', { name: list.ownerName })
);

const GroceryListSwitcher = ({ isOpen, onClose, lists, activeListId, onSwitch, busyId }) => {
  const { t } = useTranslation('grocery');

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('lists.title')}>
      <ul className="space-y-1.5 px-4 pb-6 pt-1">
        {lists.map((list) => {
          const active = String(list.id) === String(activeListId);
          const busy = String(list.id) === String(busyId);

          return (
            <li key={list.id}>
              <button
                type="button"
                onClick={() => (active ? onClose() : onSwitch(list.id))}
                disabled={!!busyId}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-start transition-colors',
                  active
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700',
                  busyId && !busy && 'opacity-50'
                )}
              >
                <span className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                  active
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                )}>
                  {busy
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <ListChecks className="h-4 w-4" />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
                    {listLabel(list, t)}
                  </span>
                  <span className="block truncate text-xs text-gray-400 dark:text-gray-500">
                    {[
                      list.openItems > 0
                        ? t('lists.openItems', { count: list.openItems })
                        : t('lists.empty'),
                      list.memberCount > 1 ? t('lists.members', { count: list.memberCount }) : null,
                    ].filter(Boolean).join(' · ')}
                  </span>
                </span>

                {active && <Check className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />}
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
};

export default GroceryListSwitcher;
