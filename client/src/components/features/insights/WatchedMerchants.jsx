import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Loader2, Trash2 } from 'lucide-react';

import transactionAPI from '../../../api/transactions';
import { useToast } from '../../../hooks/useToast';
import ModernTransactionCard from '../transactions/ModernTransactionCard';

function ruleLabel(rule, he, formatCurrency) {
  if (rule.condition === 'above') return he ? `מעל ${formatCurrency(rule.amount)}` : `Above ${formatCurrency(rule.amount)}`;
  if (rule.condition === 'exact') return he ? `בדיוק ${formatCurrency(rule.amount)}` : `Exactly ${formatCurrency(rule.amount)}`;
  return he ? 'כל עסקה' : 'Every transaction';
}

export default function WatchedMerchants({ language, formatCurrency }) {
  const he = language === 'he';
  const queryClient = useQueryClient();
  const toast = useToast();
  const watched = useQuery({
    queryKey: ['merchantWatches'],
    queryFn: async () => {
      const result = await transactionAPI.getMerchantWatches();
      if (!result.success) throw result.error;
      return result.data;
    },
    staleTime: 30_000,
  });
  const remove = useMutation({
    mutationFn: async (id) => {
      const result = await transactionAPI.deleteMerchantWatch(id);
      if (!result.success) throw result.error;
      return result.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchantWatches'] }),
    onError: (error) => toast.error(error?.message || (he ? 'לא הצלחנו להסיר את המעקב' : 'Could not remove watch')),
  });

  const rules = watched.data?.rules || [];
  const matches = watched.data?.matches || [];
  if (!watched.isLoading && !watched.isError && rules.length === 0) return null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-start gap-2">
        <Eye className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
        <div>
          <h2 className="font-bold text-gray-950 dark:text-white">{he ? 'בתי עסק במעקב' : 'Watched merchants'}</h2>
          <p className="text-xs text-gray-500">
            {he ? 'חוקים שבחרת מתוך עסקאות אמיתיות. הם מסמנים התאמות בלבד ולא משנים את החישובים.' : 'Rules you created from real transactions. They flag matches without changing your totals.'}
          </p>
        </div>
      </div>

      {watched.isLoading && <Loader2 className="mx-auto my-6 h-5 w-5 animate-spin text-indigo-500" />}
      {watched.isError && <p className="py-3 text-center text-sm text-red-500">{he ? 'לא הצלחנו לטעון את המעקב.' : 'Could not load watches.'}</p>}

      {rules.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rules.map((rule) => (
            <div key={rule.id} className="flex max-w-full items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2 dark:border-indigo-900/60 dark:bg-indigo-950/25">
              <div className="min-w-0">
                <p className="max-w-52 truncate text-xs font-bold text-gray-900 dark:text-white">{rule.display_merchant}</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-300">
                  {ruleLabel(rule, he, formatCurrency)} · {rule.match_count} {he ? 'התאמות' : 'matches'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove.mutate(rule.id)}
                disabled={remove.isPending}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white hover:text-red-500 disabled:opacity-40 dark:hover:bg-gray-800"
                aria-label={he ? 'הסר מעקב' : 'Remove watch'}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {matches.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{he ? 'התאמות אחרונות' : 'Recent matches'}</p>
          {matches.slice(0, 12).map((transaction) => (
            <ModernTransactionCard key={`${transaction.rule_id}-${transaction.id}`} transaction={transaction} />
          ))}
        </div>
      ) : rules.length > 0 && !watched.isLoading ? (
        <p className="mt-4 rounded-xl bg-gray-50 p-4 text-center text-xs text-gray-500 dark:bg-gray-800/50">
          {he ? 'אין עדיין עסקאות שמתאימות לחוקים האלה.' : 'No transactions match these rules yet.'}
        </p>
      ) : null}
    </section>
  );
}
