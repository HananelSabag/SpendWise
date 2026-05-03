/**
 * 💱 EXCHANGE CALCULATOR — Currency converter panel
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpDown, TrendingUp, TrendingDown, RefreshCw,
  Clock, Copy, Check, Zap, ChevronDown
} from 'lucide-react';

import { useTranslation, useCurrency, useNotifications } from '../../../stores';
import { Modal, Button } from '../../ui';
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

  const [fromCurrency, setFromCurrency]       = useState(baseCurrency);
  const [toCurrency, setToCurrency]           = useState('EUR');
  const [amount, setAmount]                   = useState('100');
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [exchangeRate, setExchangeRate]       = useState(0);
  const [lastUpdated, setLastUpdated]         = useState(null);
  const [isLoading, setIsLoading]             = useState(false);
  const [history, setHistory]                 = useState([]);
  const [swapRotation, setSwapRotation]       = useState(0);
  const [copied, setCopied]                   = useState(false);

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
    } catch {
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
    const timer = setTimeout(() => {
      if (amount && fromCurrency && toCurrency) calculateConversion();
    }, 500);
    return () => clearTimeout(timer);
  }, [amount, fromCurrency, toCurrency, calculateConversion]);

  useEffect(() => {
    const five = 5 * 60 * 1000;
    if (!exchangeRatesUpdatedAt || Date.now() - exchangeRatesUpdatedAt > five)
      updateExchangeRates().catch(() => {});
    const id = setInterval(() => updateExchangeRates().catch(() => {}), five);
    return () => clearInterval(id);
  }, [exchangeRatesUpdatedAt, updateExchangeRates]);

  const swapCurrencies = useCallback(() => {
    setSwapRotation(r => r + 180);
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
      onAddToTransaction({ amount: convertedAmount, originalAmount: parseFloat(amount), fromCurrency, toCurrency, exchangeRate });
      addNotification({ type: 'success', message: t('success.addedToTransaction'), duration: 3000 });
    }
  }, [convertedAmount, amount, fromCurrency, toCurrency, exchangeRate, onAddToTransaction, addNotification, t]);

  const handleCopy = useCallback(async () => {
    if (convertedAmount <= 0) return;
    try {
      await navigator.clipboard.writeText(convertedAmount.toFixed(2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [convertedAmount]);

  const rateTrend = useMemo(() => {
    if (history.length < 2) return null;
    const cur  = history[0]?.rate || 0;
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
        className={cn('flex flex-col gap-4 p-4 sm:p-5', className)}
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >

        {/* ── HERO RESULT CARD ─────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-5 shadow-xl shadow-indigo-500/20">
          {/* subtle grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}
          />

          <div className="relative flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-1">
                {amount || '0'} {fromCurrency} =
              </p>

              {isLoading ? (
                <div className="h-10 w-40 rounded-lg bg-white/20 animate-pulse mt-1" />
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={convertedAmount}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="text-3xl sm:text-4xl font-bold text-white leading-tight truncate"
                  >
                    {formatCurrency(convertedAmount, toCurrency)}
                  </motion.div>
                </AnimatePresence>
              )}

              {/* rate + trend */}
              {exchangeRate > 0 && !isLoading && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-white/70 text-xs">
                    1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
                  </span>
                  {rateTrend && rateTrend.direction !== 'same' && (
                    <span className={cn(
                      'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold',
                      rateTrend.direction === 'up'
                        ? 'bg-emerald-400/20 text-emerald-300'
                        : 'bg-red-400/20 text-red-300'
                    )}>
                      {rateTrend.direction === 'up'
                        ? <TrendingUp className="w-3 h-3" />
                        : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(rateTrend.percentage).toFixed(2)}%
                    </span>
                  )}
                </div>
              )}

              {lastUpdated && (
                <div className="flex items-center gap-1 mt-1 text-white/40 text-xs">
                  <Clock className="w-3 h-3" />
                  {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* copy button */}
            <button
              type="button"
              onClick={handleCopy}
              disabled={convertedAmount <= 0}
              aria-label="Copy result"
              className="shrink-0 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied
                ? <Check className="w-4 h-4 text-emerald-300" />
                : <Copy className="w-4 h-4 text-white/70" />}
            </button>
          </div>
        </div>

        {/* ── AMOUNT INPUT ─────────────────────────────────────── */}
        <div className="space-y-2">
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
            className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xl font-bold text-center text-gray-900 dark:text-white outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors duration-150"
          />
          {/* preset chips */}
          <div className="flex gap-1.5 flex-wrap">
            {presetAmounts.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(p.toString())}
                className={cn(
                  'h-9 px-3 rounded-lg text-sm font-semibold border-2 transition-all duration-150 cursor-pointer',
                  amount === p.toString()
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/30'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-600'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* ── CURRENCY SELECTORS + SWAP ────────────────────────── */}
        <div className="relative flex flex-col gap-2">
          {/* FROM */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t('exchange.from', 'From')}
            </label>
            <div className="relative">
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full h-12 pl-4 pr-10 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors duration-150 cursor-pointer appearance-none"
              >
                {availableCurrencies.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* SWAP BUTTON — centered */}
          <div className="flex justify-center">
            <motion.button
              type="button"
              onClick={swapCurrencies}
              aria-label="Swap currencies"
              animate={{ rotate: swapRotation }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="w-11 h-11 rounded-full border-2 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-800/40 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors duration-150 cursor-pointer shadow-sm"
            >
              <ArrowUpDown className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </motion.button>
          </div>

          {/* TO */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t('exchange.to', 'To')}
            </label>
            <div className="relative">
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full h-12 pl-4 pr-10 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors duration-150 cursor-pointer appearance-none"
              >
                {availableCurrencies.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── ACTION BUTTONS ───────────────────────────────────── */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refreshRates}
            disabled={isLoading}
            className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            {t('exchange.refresh', 'Refresh')}
          </button>

          {onAddToTransaction && convertedAmount > 0 && (
            <button
              type="button"
              onClick={handleAddToTransaction}
              className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition-all duration-150 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              {t('exchange.addToTransaction', 'Add to Transaction')}
            </button>
          )}
        </div>

        {/* ── POPULAR CURRENCIES ──────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            {t('exchange.popularCurrencies', 'Popular Currencies')}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {popularCurrencies.map(c => {
              const isActive = fromCurrency === c.code || toCurrency === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    if (fromCurrency === c.code) setToCurrency(c.code);
                    else setFromCurrency(c.code);
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-center transition-all duration-150 cursor-pointer min-h-[56px]',
                    isActive
                      ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  <span className="text-lg leading-none">{c.flag}</span>
                  <span className={cn(
                    'text-xs font-bold',
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'
                  )}>
                    {c.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── HISTORY ─────────────────────────────────────────── */}
        {showHistory && history.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              {t('exchange.history', 'Recent')}
            </p>
            <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
              {history.slice(0, 5).map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setFromCurrency(item.fromCurrency);
                    setToCurrency(item.toCurrency);
                    setAmount(item.amount.toString());
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors duration-150 cursor-pointer',
                    idx < history.slice(0, 5).length - 1 && 'border-b border-gray-100 dark:border-gray-700'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-white truncate">
                      <span>{formatCurrency(item.amount, item.fromCurrency)}</span>
                      <ArrowUpDown className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(item.convertedAmount, item.toCurrency)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
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
