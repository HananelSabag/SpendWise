import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Briefcase, CircleDollarSign, HelpCircle, Loader2 } from 'lucide-react';

import { api } from '../../../api';
import { useTranslation } from '../../../stores';

const choices = [
  { id: 'salary', he: 'משכורת', en: 'Salary', Icon: Briefcase },
  { id: 'bonus', he: 'בונוס / תוספת', en: 'Bonus / extra', Icon: CircleDollarSign },
  { id: 'other', he: 'הכנסה אחרת', en: 'Other income', Icon: HelpCircle },
];

function monthLabel(month, language) {
  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-GB', { month: 'long', year: 'numeric' })
    .format(new Date(`${month}-15T12:00:00`));
}

export default function SalaryReviewPrompt({ formatCurrency }) {
  const { currentLanguage } = useTranslation();
  const he = currentLanguage === 'he';
  const queryClient = useQueryClient();
  const [decisions, setDecisions] = useState({});

  const review = useQuery({
    queryKey: ['salaryReview'],
    queryFn: async () => {
      const result = await api.transactions.getSalaryReview();
      if (!result.success) throw new Error(result.error?.message || 'Failed to load salary review');
      return result.data;
    },
    staleTime: 60_000,
  });
  const conflict = review.data?.conflicts?.[0];

  useEffect(() => {
    if (!conflict) return;
    setDecisions(Object.fromEntries(conflict.transactions.map((transaction) => [transaction.id, transaction.classification || 'salary'])));
  }, [conflict]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = conflict.transactions.map((transaction) => ({
        transactionId: transaction.id,
        classification: decisions[transaction.id] || 'salary',
      }));
      const result = await api.transactions.updateSalaryReview(payload);
      if (!result.success) throw new Error(result.error?.message || 'Failed to save salary review');
      return result.data;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(['salaryReview'], data);
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  if (review.isLoading || !conflict) return null;

  return (
    <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm dark:border-violet-900/70 dark:from-violet-950/25 dark:to-gray-900">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300"><BadgeCheck className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-gray-950 dark:text-white">{he ? 'קיבלנו שתי הכנסות שנראות כמו משכורת' : 'Two deposits look like salary'}</h3>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            {he
              ? `שתיהן משויכות ל${monthLabel(conflict.economicMonth, currentLanguage)} מאותו מעסיק. סמן מה כל אחת כדי שבונוס לא יפתח בטעות מחזור משכורת חדש.`
              : `Both map to ${monthLabel(conflict.economicMonth, currentLanguage)} from the same employer. Classify each so a bonus does not create a false salary cycle.`}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {conflict.transactions.map((transaction) => (
          <article key={transaction.id} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{transaction.description}</p>
                <p className="text-[11px] text-gray-500">{new Intl.DateTimeFormat(he ? 'he-IL' : 'en-GB').format(new Date(`${transaction.date}T12:00:00`))}</p>
              </div>
              <p className="text-base font-black text-emerald-600">+{formatCurrency(transaction.amount)}</p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {choices.map(({ id, he: heLabel, en, Icon }) => {
                const selected = decisions[transaction.id] === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setDecisions((previous) => ({ ...previous, [transaction.id]: id }))}
                    className={`flex min-h-10 items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-bold transition ${selected ? 'bg-violet-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}
                  >
                    <Icon className="h-3.5 w-3.5" />{he ? heLabel : en}
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[11px] text-gray-500">{review.data.conflicts.length > 1 ? `${review.data.conflicts.length - 1} ${he ? 'בדיקות נוספות אחר כך' : 'more reviews after this'}` : (he ? 'הבחירה נשמרת עם העסקה וניתנת לשינוי בעתיד.' : 'The choice is stored with the transaction and can be changed later.')}</p>
        <button type="button" disabled={save.isPending} onClick={() => save.mutate()} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50">
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}{he ? 'שמור סיווג' : 'Save classification'}
        </button>
      </div>
      {save.isError && <p className="mt-2 text-xs text-red-600">{save.error?.message || (he ? 'השמירה נכשלה.' : 'Save failed.')}</p>}
    </section>
  );
}
