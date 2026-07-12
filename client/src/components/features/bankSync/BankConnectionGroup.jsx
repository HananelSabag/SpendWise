import React from 'react';
import { CreditCard, Landmark, Plus } from 'lucide-react';

import { cn } from '../../../utils/helpers';
import BankConnectionCard from './BankConnectionCard';

/**
 * Stable Accounts-tab group. Keeping this as a module-level component prevents
 * polling updates from remounting every connection card and replaying its UI.
 */
const BankConnectionGroup = React.memo(function BankConnectionGroup({
  kind,
  items,
  sources,
  t,
  he,
  currentLanguage,
  onOpenConnect,
}) {
  const isCard = kind === 'credit_card';
  const Icon = isCard ? CreditCard : Landmark;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-gray-950 dark:text-white">
            <Icon className="h-4 w-4" />
            {isCard ? (he ? 'חברות אשראי' : 'Credit companies') : (he ? 'חשבונות בנק' : 'Bank accounts')}
          </h2>
          <p className="text-xs text-gray-500">{isCard ? t('cardsProvide') : t('banksProvide')}</p>
        </div>
        <button
          type="button"
          onClick={() => onOpenConnect(null, kind)}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-white',
            isCard ? 'bg-violet-600' : 'bg-indigo-600',
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          {isCard ? t('addCard') : t('addBank')}
        </button>
      </div>

      {items.length ? items.map((conn) => (
        <BankConnectionCard
          key={conn.id}
          conn={conn}
          stat={sources.find((source) => source.source === conn.bank_source)}
          t={t}
          lang={currentLanguage}
          onUpdateCredentials={(bank) => onOpenConnect(bank, kind)}
        />
      )) : (
        <button
          type="button"
          onClick={() => onOpenConnect(null, kind)}
          className="w-full rounded-2xl border-2 border-dashed border-gray-300 p-7 text-sm text-gray-500 dark:border-gray-700"
        >
          {isCard ? t('cardSectionEmpty') : t('bankSectionEmpty')}
        </button>
      )}
    </section>
  );
});

export default BankConnectionGroup;
