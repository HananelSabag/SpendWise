import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, CreditCard, Link2, Settings2, Zap } from 'lucide-react';
import { useCycles } from '../../../hooks/useCycles';
import { cn } from '../../../utils/helpers';
import { cardShortName, last4 } from '../../../utils/cycleFormat';
import { formatCycleDay } from '../../../utils/cycleDate';
import { CycleMoney, cycleButton, cycleSurface } from './CyclePrimitives';
import CycleTransactionList from './CycleTransactionList';
import RecurringTransactionPicker from './RecurringTransactionPicker';

const isCard = (item, card) =>
  item.source === card.source && String(item.accountNumber) === String(card.accountNumber);

function CardSettings({ card, day, passthrough, onChange, isSaving, formatCurrency, language, t }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  // The large control query is requested only after someone opens these settings.
  const details = useCycles({ enabled: !passthrough });
  const candidates = useMemo(
    () =>
      (details.decisions || []).filter(
        (item) =>
          Number(item.amount) < 0 &&
          !['max', 'visa_cal', 'isracard', 'amex'].includes(item.source) &&
          item.classification !== 'pending',
      ),
    [details.decisions],
  );
  const linkedId = card.setting?.linkedTransactionId;
  const linked = candidates.find((item) => Number(item.transactionId) === Number(linkedId));
  const change = (patch) =>
    onChange({ source: card.source, accountNumber: card.accountNumber, ...patch });
  return (
    <div className="border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {t('cycleV2.cardSettings')}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {t(passthrough ? 'cycleV2.directSettingsHint' : 'cycleV2.cardSettingsHint')}
      </p>
      <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
        <span>{t('cycleV2.includeCard')}</span>
        <input
          type="checkbox"
          checked={card.included !== false}
          disabled={isSaving}
          onChange={(event) => change({ included: event.target.checked })}
          className="h-5 w-5 shrink-0 accent-indigo-600"
        />
      </label>
      {!passthrough && (
        <>
          <label className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-200">
            <span>{t('cycleV2.billingDay')}</span>
            <select
              value={day || ''}
              disabled={isSaving}
              onChange={(event) => change({ statementDay: Number(event.target.value) })}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="" disabled>
                {t('cycleV2.chooseDay')}
              </option>
              {Array.from({ length: 31 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={isSaving || details.isLoading || details.isError}
            className={cn(
              cycleButton,
              'mt-4 flex w-full items-center justify-center gap-2 border border-slate-200 bg-white text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-300',
            )}
          >
            <Link2 className="h-4 w-4" />
            {t(
              details.isLoading
                ? 'cycleV2.loadingTransactions'
                : linkedId
                  ? 'cycleV2.changeLinkedCharge'
                  : 'cycleV2.chooseBankCharge',
            )}
          </button>
          {details.isError && (
            <button
              type="button"
              onClick={() => details.refetch()}
              className={`${cycleButton} mt-2 text-rose-700 dark:text-rose-300`}
            >
              {t('cycleV2.tryAgain')}
            </button>
          )}
          {linkedId && (
            <p
              role="status"
              className="mt-3 flex items-start gap-2 text-xs leading-5 text-emerald-700 dark:text-emerald-400"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {t('cycleV2.bankChargeLinked')}
                {linked && (
                  <span className="mt-1 block text-slate-500 dark:text-slate-400">
                    {linked.description} ·{' '}
                    {formatCycleDay(linked.processedDate || linked.date, language)}
                  </span>
                )}
              </span>
            </p>
          )}
          {pickerOpen && (
            <RecurringTransactionPicker
              isOpen
              onClose={() => setPickerOpen(false)}
              candidates={candidates}
              lockedDirection="expense"
              title={t('cycleV2.linkBankCharge')}
              hint={t('cycleV2.cardLinkPickerHint')}
              onSelect={(item) => change({ linkedTransactionId: item.transactionId })}
              formatCurrency={formatCurrency}
              language={language}
              t={t}
            />
          )}
        </>
      )}
    </div>
  );
}

function CardDetail({
  card,
  events,
  forecast,
  useEstimates,
  formatCurrency,
  language,
  t,
  onChange,
  isSaving,
}) {
  const [expanded, setExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedView, setSelectedView] = useState('upcoming');
  const passthrough = card.settlement?.mode === 'passthrough';
  const day =
    card.setting?.statementDay ?? (card.statementDay?.certain ? card.statementDay.day : null);
  const included = card.included !== false;
  const settled = events.filter((event) => !event.future && !event.accruing);
  const paidAmount = -settled.reduce((sum, event) => sum + Number(event.total || 0), 0);
  const known = forecast ? Number(forecast.knownAmount) : null;
  const previous = forecast?.historyCount ? Number(forecast.lastStatementAmount) : null;
  const estimated = forecast ? Number(forecast.estimatedAmount) : null;
  const view = passthrough ? 'paid' : selectedView;
  const name = `${cardShortName(card.source)} · ${last4(card.accountNumber)}`;
  const knownTransactions = forecast?.knownTxns || [];
  const count =
    view === 'paid'
      ? settled.reduce((sum, event) => sum + (event.txns?.length || 0), 0)
      : knownTransactions.length;
  return (
    <article className={cn(cycleSurface, 'overflow-hidden', !included && 'border-dashed')}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'rounded-xl p-2.5',
              passthrough
                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300',
            )}
          >
            {passthrough ? <Zap className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">
              <bdi>{name}</bdi>
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {t(passthrough ? 'cycleV2.directCardLabel' : 'cycleV2.monthlyCardLabel')}
              {!passthrough && day ? ` · ${t('cycleV2.billsOn')} ${day}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen((open) => !open)}
            aria-expanded={settingsOpen}
            aria-label={`${t('cycleV2.cardSettings')} ${name}`}
            className={cn(
              cycleButton,
              '-me-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
            )}
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
        {!included && (
          <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {t('cycleV2.cardExcluded')}
          </p>
        )}
        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <dt className="text-xs text-slate-500 dark:text-slate-400">
              {t(passthrough ? 'cycleV2.alreadyFromBalance' : 'cycleV2.knownNextCharge')}
            </dt>
            <dd className="mt-1">
              <CycleMoney
                value={passthrough ? paidAmount : known}
                formatCurrency={formatCurrency}
                className="text-xl text-slate-950 dark:text-white"
              />
            </dd>
          </div>
          <div className="min-w-0 border-s border-slate-100 ps-3 dark:border-slate-800">
            <dt className="text-xs text-slate-500 dark:text-slate-400">
              {t(passthrough ? 'cycleV2.transactionsCount' : 'cycleV2.previousBill')}
            </dt>
            <dd className="mt-1">
              {passthrough ? (
                <span className="text-xl font-semibold text-slate-950 dark:text-white">
                  {count}
                </span>
              ) : (
                <CycleMoney
                  value={previous}
                  formatCurrency={formatCurrency}
                  className="text-xl text-slate-600 dark:text-slate-300"
                />
              )}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {passthrough
            ? t('cycleV2.directSettingsHint')
            : forecast
              ? t('cycleV2.nextChargeDate', { date: formatCycleDay(forecast.chargeDate, language) })
              : t('cycleV2.noCardDueInCycle')}
        </p>
        {!passthrough && useEstimates && forecast && (
          <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 dark:bg-amber-950/20">
            <div className="flex items-center justify-between gap-3 text-sm text-amber-900 dark:text-amber-200">
              <span>{t('cycleV2.cardForecast')}</span>
              <CycleMoney value={estimated} formatCurrency={formatCurrency} />
            </div>
            <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-300">
              {t(
                forecast.historyCount >= 3
                  ? 'cycleV2.cardForecastMedian'
                  : forecast.historyCount === 2
                    ? 'cycleV2.cardForecastCapped'
                    : 'cycleV2.cardForecastKnown',
                { count: forecast.historyCount },
              )}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          className={cn(
            cycleButton,
            'mt-3 flex w-full items-center justify-between gap-2 text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/30',
          )}
        >
          <span>{t('cycleV2.openCardBreakdown')}</span>
          <ChevronDown className={cn('h-4 w-4 transition', expanded && 'rotate-180')} />
        </button>
        {expanded && (
          <div className="mt-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            {!passthrough && (
              <div
                role="group"
                aria-label={t('cycleV2.cardBreakdownLabel')}
                className="mb-2 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-950"
              >
                {['upcoming', 'paid'].map((id) => (
                  <button
                    type="button"
                    key={id}
                    aria-pressed={view === id}
                    onClick={() => setSelectedView(id)}
                    className={cn(
                      cycleButton,
                      'text-xs',
                      view === id
                        ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300'
                        : 'text-slate-500 dark:text-slate-400',
                    )}
                  >
                    {t(id === 'paid' ? 'cycleV2.paidThisCycle' : 'cycleV2.upcomingCard')}
                  </button>
                ))}
              </div>
            )}
            {view === 'upcoming' ? (
              <CycleTransactionList
                key="upcoming"
                transactions={knownTransactions}
                formatCurrency={formatCurrency}
                language={language}
                t={t}
              />
            ) : (
              <>
                <div className="my-3 flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    {t('cycleV2.paidThisCycle')}
                  </span>
                  <CycleMoney
                    value={paidAmount}
                    formatCurrency={formatCurrency}
                    className="text-slate-950 dark:text-white"
                  />
                </div>
                {settled.map((event, index) => (
                  <details
                    key={`${event.chargeDate}-${index}`}
                    className="group border-t border-slate-100 dark:border-slate-800"
                  >
                    <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 text-xs [&::-webkit-details-marker]:hidden">
                      <span className="flex-1 text-slate-600 dark:text-slate-300">
                        {formatCycleDay(event.chargeDate, language)} · {event.txns?.length || 0}{' '}
                        {t('cycleV2.transactionsShort')}
                      </span>
                      <CycleMoney
                        value={-Number(event.total)}
                        formatCurrency={formatCurrency}
                        className="text-slate-900 dark:text-white"
                      />
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </summary>
                    <CycleTransactionList
                      transactions={event.txns}
                      formatCurrency={formatCurrency}
                      language={language}
                      t={t}
                    />
                    {event.bankTransaction && (
                      <p className="mb-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {t('cycleV2.matchedBankEvidence')} · {event.bankTransaction.description}
                      </p>
                    )}
                  </details>
                ))}
                {!settled.length && (
                  <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
                    {t('cycleV2.noSettledCard')}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {settingsOpen && (
        <CardSettings
          card={card}
          day={day}
          passthrough={passthrough}
          onChange={onChange}
          isSaving={isSaving}
          formatCurrency={formatCurrency}
          language={language}
          t={t}
        />
      )}
    </article>
  );
}

export default function CycleCardsPanelV2({ cycle, useEstimates = true, ...props }) {
  const { t } = props;
  const cards = cycle?.cards || [];
  if (!cards.length) return null;
  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
        {t('cycleV2.cardsOverviewTitle')}
      </h2>
      <p className="mb-4 mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {t('cycleV2.cardsOverviewHint')}
      </p>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {cards.map((card) => (
          <CardDetail
            key={`${card.source}-${card.accountNumber}`}
            card={card}
            events={(cycle.expenses?.events || []).filter((event) => isCard(event, card))}
            forecast={(cycle.nextCardForecast?.bills || []).find((bill) => isCard(bill, card))}
            useEstimates={useEstimates}
            {...props}
          />
        ))}
      </div>
    </section>
  );
}
