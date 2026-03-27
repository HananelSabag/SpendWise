/**
 * 💱 EXCHANGE CALCULATOR — Currency converter panel
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight, TrendingUp, TrendingDown, RefreshCw,
  Clock, Calculator, Zap
} from 'lucide-react';

import { useTranslation, useCurrency, useNotifications } from '../../../stores';
import { Modal, Button, Card } from '../../ui';
import { cn } from '../../../utils/helpers';

const ExchangeCalculator = ({
  isOpen     = false,
  onClose    = () => {},
  onAddToTransaction,
  showHistory = true,
  className   = ''
}) => {
  const { t, isRTL } = useTranslation('exchange');
  const {
    currency: baseCurrency,
    availableCurrencies,
    formatCurrency,
    getExchangeRate,
    updateExchangeRates,
    exchangeRatesUpdatedAt
  } = useCurrency();
  const { addNotification } = useNotifications();

  const [fromCurrency, setFromCurrency]     = useState(baseCurrency);
  const [toCurrency, setToCurrency]         = useState('EUR');
  const [amount, setAmount]                 = useState('100');
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [exchangeRate, setExchangeRate]     = useState(0);
  const [lastUpdated, setLastUpdated]       = useState(null);
  const [isLoading, setIsLoading]           = useState(false);
  const [history, setHistory]               = useState([]);

  const presetAmounts = [50, 100, 250, 500, 1000];

  const popularCurrencies = useMemo(() =>
    availableCurrencies.filter(c =>
      ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF'].includes(c.code)
    ), [availableCurrencies]);

  const calculateConversion = useCallback(async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      setConvertedAmount(0);
      setExchangeRate(0);
      return;
    }
    setIsLoading(true);
    try {
      const rate = await getExchangeRate(fromCurrency, toCurrency);
      const converted = parseFloat(amount) * rate;
      setExchangeRate(rate);
      setConvertedAmount(converted);
      setLastUpdated(new Date());
      setHistory(prev => [{
        id: Date.now(), fromCurrency, toCurrency,
        amount: parseFloat(amount), convertedAmount: converted, rate,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]);
    } catch (error) {
      addNotification({ type: 'error', message: t('errors.conversionFailed'), duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  }, [amount, fromCurrency, toCurrency, getExchangeRate, addNotification, t]);

  const onAmountChange = useCallback((value) => {
    if (typeof value !== 'string') { setAmount(''); return; }
    let s = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const parts = s.split('.');
    if (parts.length > 2) s = parts[0] + '.' + parts.slice(1).join('');
    setAmount(s);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (amount && fromCurrency && toCurrency) calculateConversion();
    }, 500);
    return () => clearTimeout(t);
  }, [amount, fromCurrency, toCurrency, calculateConversion]);

  useEffect(() => {
    const five = 5 * 60 * 1000;
    if (!exchangeRatesUpdatedAt || Date.now() - exchangeRatesUpdatedAt > five)
      updateExchangeRates().catch(() => {});
    const id = setInterval(() => updateExchangeRates().catch(() => {}), five);
    return () => clearInterval(id);
  }, [exchangeRatesUpdatedAt, updateExchangeRates]);

  const swapCurrencies = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    if (convertedAmount > 0) setAmount(convertedAmount.toFixed(2));
  }, [fromCurrency, toCurrency, convertedAmount]);

  const refreshRates = useCallback(async () => {
    setIsLoading(true);
    try {
      await updateExchangeRates();
      await calculateConversion();
      addNotification({ type: 'success', message: t('success.ratesUpdated'), duration: 3000 });
    } catch {
      addNotification({ type: 'error', message: t('errors.updateFailed'), duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  }, [updateExchangeRates, calculateConversion, addNotification, t]);

  const handleAddToTransaction = useCallback(() => {
    if (convertedAmount > 0 && onAddToTransaction) {
      onAddToTransaction({
        amount: convertedAmount,
        originalAmount: parseFloat(amount),
        fromCurrency, toCurrency, exchangeRate,
      });
      addNotification({ type: 'success', message: t('success.addedToTransaction'), duration: 3000 });
    }
  }, [convertedAmount, amount, fromCurrency, toCurrency, exchangeRate, onAddToTransaction, addNotification, t]);

  const rateTrend = useMemo(() => {
    if (history.length < 2) return null;
    const cur = history[0]?.rate || 0;
    const prev = history[1]?.rate || 0;
    return {
      direction: cur > prev ? 'up' : cur < prev ? 'down' : 'same',
      percentage: prev > 0 ? ((cur - prev) / prev) * 100 : 0
    };
  }, [history]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('exchange.title', 'Exchange Calculator')}
      sheet
      drawerWidth={520}
    >
      <div
        className={cn('p-4 sm:p-5 space-y-4', className)}
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        {/* Header row */}
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md shrink-0">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {t('exchange.title', 'Exchange Calculator')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('exchange.subtitle', 'Real-time currency conversion')}
            </p>
          </div>
        </div>

        {/* Amount input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t('exchange.amount', 'Amount')}
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === '-' || e.key === '+') e.preventDefault(); }}
            placeholder="0.00"
            className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xl font-bold text-center text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400"
          />
          {/* Preset chips */}
          <div className="flex gap-1.5 flex-wrap">
            {presetAmounts.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(p.toString())}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                  amount === p.toString()
                    ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Currency selectors + swap */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t('exchange.from', 'From')}
            </label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400"
            >
              {availableCurrencies.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={swapCurrencies}
            className="mb-0.5 w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shrink-0"
          >
            <ArrowLeftRight className="w-4 h-4 text-gray-500" />
          </button>

          <div className="flex-1 space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t('exchange.to', 'To')}
            </label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400"
            >
              {availableCurrencies.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Result card */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 text-center space-y-1.5">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin" />
              {t('exchange.calculating', 'Calculating...')}
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(convertedAmount, toCurrency)}
              </div>
              {exchangeRate > 0 && (
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}</span>
                  {rateTrend && rateTrend.direction !== 'same' && (
                    <span className={cn('flex items-center gap-0.5', rateTrend.direction === 'up' ? 'text-emerald-600' : 'text-red-500')}>
                      {rateTrend.direction === 'up'
                        ? <TrendingUp className="w-3 h-3" />
                        : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(rateTrend.percentage).toFixed(2)}%
                    </span>
                  )}
                </div>
              )}
              {lastUpdated && (
                <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {t('exchange.lastUpdated', 'Updated')} {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshRates}
            disabled={isLoading}
            className="flex-1 h-10 text-sm"
          >
            <RefreshCw className={cn('w-4 h-4 mr-1.5', isLoading && 'animate-spin')} />
            {t('exchange.refresh', 'Refresh')}
          </Button>
          {onAddToTransaction && convertedAmount > 0 && (
            <Button
              variant="primary"
              onClick={handleAddToTransaction}
              className="flex-1 h-10 text-sm bg-gradient-to-r from-blue-500 to-indigo-600"
            >
              <Zap className="w-4 h-4 mr-1.5" />
              {t('exchange.addToTransaction', 'Add to Transaction')}
            </Button>
          )}
        </div>

        {/* Popular currencies */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            {t('exchange.popularCurrencies', 'Popular Currencies')}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {popularCurrencies.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  if (fromCurrency === c.code) setToCurrency(c.code);
                  else setFromCurrency(c.code);
                }}
                className={cn(
                  'flex flex-col items-center gap-0.5 p-2 rounded-xl border text-center transition-colors',
                  (fromCurrency === c.code || toCurrency === c.code)
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                <span className="text-lg">{c.flag}</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{c.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* History */}
        {showHistory && history.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              {t('exchange.history', 'Recent')}
            </p>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
              {history.slice(0, 5).map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setFromCurrency(item.fromCurrency);
                    setToCurrency(item.toCurrency);
                    setAmount(item.amount.toString());
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
                    <span>{formatCurrency(item.amount, item.fromCurrency)}</span>
                    <ArrowLeftRight className="w-3 h-3 text-gray-400" />
                    <span>{formatCurrency(item.convertedAmount, item.toCurrency)}</span>
                  </div>
                  <span className="text-xs text-gray-400">{item.timestamp.toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ExchangeCalculator;
