/**
 * 🔌 CONNECT SOURCES STEP — final onboarding step.
 *
 * Teaches the one distinction the whole app rests on: a BANK ACCOUNT is not a
 * CREDIT-CARD COMPANY. A bank has a real balance and direct debits; a credit
 * card company has itemized charges that later post as ONE summarized charge
 * in the bank account. Then it lets the user opt in to connect a source right
 * after setup (the real connect flow lives on the Bank Sync page).
 */

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Landmark, CreditCard, ArrowRight, Check, Info } from 'lucide-react';

import { useTranslation } from '../../../../stores';
import { cn } from '../../../../utils/helpers';
import { INSTITUTIONS, bankBrand } from '../../bankSync/bankSyncMeta';

const ConnectSourcesStep = ({ data = {}, onDataUpdate }) => {
  const { t, isRTL } = useTranslation('onboarding');
  const wantsToConnect = data.wantsToConnect !== false; // default: yes

  const { banks, cards } = useMemo(() => {
    const banks = [];
    const cards = [];
    for (const [source, meta] of Object.entries(INSTITUTIONS)) {
      (meta.kind === 'credit_card' ? cards : banks).push({ source, ...meta });
    }
    return { banks, cards };
  }, []);

  const setWants = useCallback((val) => {
    // ModernOnboardingManager reads this flag after completion to decide
    // whether to drop the user on the Bank Sync page.
    try { sessionStorage.setItem('sw_onboarding_connect', val ? '1' : '0'); } catch (_) {}
    onDataUpdate({ wantsToConnect: val });
  }, [onDataUpdate]);

  const KindCard = ({ icon: Icon, title, blurb, list, provides }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-snug">{blurb}</p>
      <div className="flex flex-wrap gap-1.5">
        {list.map(({ source, label }) => (
          <span
            key={source}
            className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg text-white bg-gradient-to-br', bankBrand(source).gradient)}
          >
            {label}
          </span>
        ))}
      </div>
      <p className="flex items-start gap-1 text-[11px] text-gray-400 dark:text-gray-500 mt-3 leading-snug">
        <Check className="w-3 h-3 mt-0.5 shrink-0 text-emerald-500" />
        {provides}
      </p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
          <Landmark className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('connectSources.title') || 'Connect your bank & cards'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
          {t('connectSources.subtitle') || 'SpendWise syncs your transactions automatically. First, the one thing worth knowing:'}
        </p>
      </div>

      {/* The distinction */}
      <div className="grid sm:grid-cols-2 gap-3">
        <KindCard
          icon={Landmark}
          title={t('connectSources.banksTitle') || 'Bank accounts'}
          blurb={t('connectSources.banksBlurb') || 'Where your salary lands and your direct debits leave from.'}
          list={banks}
          provides={t('connectSources.banksProvides') || 'Real account balance + full transaction history'}
        />
        <KindCard
          icon={CreditCard}
          title={t('connectSources.cardsTitle') || 'Credit companies'}
          blurb={t('connectSources.cardsBlurb') || 'Where each purchase is itemized before the monthly bill.'}
          list={cards}
          provides={t('connectSources.cardsProvides') || 'Itemized charges — they post later as one summarized charge in your bank'}
        />
      </div>

      {/* Plain-language explainer of the summarized-charge relationship */}
      <div className="flex items-start gap-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3">
        <Info className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
        <p className="text-xs text-indigo-900 dark:text-indigo-100 leading-snug">
          {t('connectSources.relationship') || 'Example: 20 card purchases this month show up individually from your credit card company, then appear as one combined charge in your bank account. Connecting both gives you the detail and the bottom line.'}
        </p>
      </div>

      {/* Connect now vs later */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setWants(true)}
          className={cn(
            'w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-start transition-all',
            wantsToConnect
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
            <ArrowRight className="w-5 h-5 text-white rtl:rotate-180" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {t('connectSources.connectNow') || 'Connect a source now'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('connectSources.connectNowHint') || "We'll take you to the Bank Sync page right after setup"}
            </p>
          </div>
          {wantsToConnect && <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => setWants(false)}
          className={cn(
            'w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-start transition-all',
            !wantsToConnect
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {t('connectSources.later') || "I'll do it later"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('connectSources.laterHint') || 'Connect anytime from the Bank Sync page'}
            </p>
          </div>
          {!wantsToConnect && <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
        </button>
      </div>
    </div>
  );
};

export default ConnectSourcesStep;
