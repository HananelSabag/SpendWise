import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowUpRight, ArrowDownRight, Plus, Info, TrendingUp, TrendingDown, 
  Activity, CalendarIcon, RotateCcw, HelpCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { useTransactions } from '../../context/TransactionContext';
import { useDate } from '../../context/DateContext';
import CalendarWidget from './Transactions/CalendarWidget';

/**
 * BalancePanel Component
 * Displays financial balance information with date selection and period filtering
 */
const BalancePanel = () => {
  // Core hooks
  const { balances, metadata, loading, error, refreshData } = useTransactions();
  const { formatAmount } = useCurrency();
  const { t, language } = useLanguage();
  const { 
    selectedDate, 
    updateSelectedDate,
    formatDate,
    isCustomDate 
  } = useDate();
  
  // UI refs and state
  const dateButtonRef = useRef(null);
  const isHebrew = language === 'he';
  const [period, setPeriod] = useState('daily');
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Responsive handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation functions
  const isToday = () => {
    const today = new Date();
    return today.toDateString() === selectedDate.toDateString();
  };

  const goToPreviousDay = async () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    newDate.setHours(12, 0, 0, 0);
    updateSelectedDate(newDate);
    await refreshData(newDate);
  };

  const goToNextDay = async () => {
    const newDate = new Date(selectedDate);
    if (newDate.toDateString() !== new Date().toDateString()) {
      newDate.setDate(newDate.getDate() + 1);
      newDate.setHours(12, 0, 0, 0);
      updateSelectedDate(newDate);
      await refreshData(newDate);
    }
  };

  // Date selection handler
  const handleDateSelect = async (date) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(12, 0, 0, 0);
    setShowCalendar(false);
    updateSelectedDate(normalizedDate);
    await refreshData(normalizedDate);
  };

  // Reset to today handler
  const resetToToday = async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    updateSelectedDate(today);
    await refreshData(today);
  };

  // Format day names and dates for week view
  const formatWeekDay = (date) => {
    return new Date(date).toLocaleDateString(
      language === 'he' ? 'he-IL' : 'en-US',
      { weekday: 'long' }
    );
  };

  // Get period information with formatted dates
  const getPeriodInfo = (period) => {
    if (!metadata.timePeriods || !metadata.timePeriods[period]) return '';

    const formatDateString = (date) => new Date(date).toLocaleDateString(
      language === 'he' ? 'he-IL' : 'en-US',
      {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      }
    );

    const date = new Date(selectedDate);

    switch (period) {
      case 'daily':
        return t('home.balance.period.asOf', {
          date: formatDateString(date)
        });

      case 'weekly': {
        const start = new Date(metadata.timePeriods.weekly.start);
        const end = new Date(metadata.timePeriods.weekly.end);
        return `${formatWeekDay(start)} - ${formatWeekDay(end)}`;
      }

      case 'monthly':
        const monthName = date.toLocaleString(
          language === 'he' ? 'he-IL' : 'en-US',
          { month: 'long' }
        );
        return t('home.balance.period.monthYear', {
          month: monthName,
          year: date.getFullYear()
        });

      case 'yearly':
        return t('home.balance.period.yearOnly', {
          year: date.getFullYear().toString()
        });

      default:
        return '';
    }
  };

  // Update countdown timer for daily reset
  useEffect(() => {
    if (!metadata.nextReset) return;

    const updateTimer = () => {
      const now = new Date();
      const reset = new Date(metadata.nextReset);
      const diff = reset - now;

      if (diff <= 0) {
        setTimeUntilReset('');
        return;
      }

      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeUntilReset(`${hours}:${minutes.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 60000);
    return () => clearInterval(timer);
  }, [metadata.nextReset]);

  // Tooltip click outside handlers
  useEffect(() => {
    const handleClickOutside = () => {
      setShowTooltip(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isTouchDevice = 'ontouchstart' in window;
      if (isTouchDevice && showTooltip) {
        setShowTooltip(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showTooltip]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-primary-400 to-primary-500 rounded-2xl shadow-lg animate-pulse overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="h-10 bg-white/20 rounded-xl"></div>
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white/20 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-light text-error p-4 rounded-2xl">
        <p>{t('home.balance.error')}</p>
      </div>
    );
  }

  const currentBalance = balances[period] || { income: 0, expenses: 0, balance: 0 };

  return (
    <div className="overflow-hidden" dir={isHebrew ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-br from-primary-400 to-primary-500 rounded-t-2xl shadow-lg">
        <div className="p-6">
          {/* Period and Date Selection */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex-1 w-full">
              <div className="flex bg-white/60 backdrop-blur-sm rounded-xl p-1 shadow-inner">
                {['daily', 'weekly', 'monthly', 'yearly'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPeriod(tab)}
                    className={`flex-1 px-2 sm:px-4 py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${period === tab
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'hover:bg-white/20 text-primary-900'
                      }`}
                  >
                    {t(`home.balance.${tab}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selection Controls */}
            <div className="flex items-center gap-2 " dir='ltr'>
              {/* Previous day */}
              <button
                onClick={goToPreviousDay}
                className="p-2 rounded-xl bg-white/90 hover:bg-white/95 transition-colors shadow-sm "

              >
                <ChevronLeft className="w-5 h-5 text-primary-600" />
              </button>

              {/* Date selector */}
              <button
              ref={dateButtonRef} 
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-2 bg-white/90 text-primary-600 px-4 py-2 rounded-xl hover:bg-white/95 transition-all shadow-sm"
              >
                <CalendarIcon className="w-5 h-5" />
                <span>{new Date(selectedDate).toLocaleDateString(
                  language === 'he' ? 'he-IL' : 'en-US',
                  { year: 'numeric', month: 'long', day: 'numeric' }
                )}</span>
              </button>

              {/* Next day */}
              <button
                onClick={goToNextDay}
                disabled={isToday()}
                className={`p-2 rounded-xl transition-colors shadow-sm ${isToday() ? 'bg-white/50 cursor-not-allowed' : 'bg-white/90 hover:bg-white/95'
                  }`}
              >
                <ChevronRight className={`w-5 h-5 ${isToday() ? 'text-primary-400' : 'text-primary-600'
                  }`} />
              </button>

              {/* Reset to today */}
              {!isToday() && (
                <button
                  onClick={resetToToday}
                  className="p-2 rounded-xl bg-white/90 hover:bg-white/95 transition-colors shadow-sm"
                  title={t('home.balance.backToToday')}
                >
                  <RotateCcw className="w-5 h-5 text-primary-600" />
                </button>
              )}

              {/* Help tooltip */}
              <div className="relative" >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTooltip(!showTooltip);
                  }}
                  onMouseEnter={() => {

                    if (window.matchMedia('(hover: hover)').matches) {
                      setShowTooltip(true);
                    }
                  }}
                  onMouseLeave={() => {

                    if (window.matchMedia('(hover: hover)').matches) {
                      setShowTooltip(false);
                    }
                  }}
                  className="p-2 rounded-xl bg-white/90 hover:bg-white/95 transition-colors shadow-sm"
                >
                  <HelpCircle className="w-5 h-5 text-primary-600" />
                </button>

                {showTooltip && (
                  <div
                    className="absolute p-3 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-xl 
                    shadow-xl w-72 max-w-[90vw]"
                    style={{
                      ...(isMobile ? {
                        left: 'auto',
                        right: '50%',



                      } : {
                        left: isHebrew ? '100%' : 'auto',
                        right: isHebrew ? 'auto' : '100%'
                      }),
                      zIndex: 50,
                    }}
                  >
                    {t('home.balance.tooltip')}
                  </div>
                )}
              </div>

              {/* Calendar popup */}
              {showCalendar && (
                <div className="absolute z-10 mt-80 shadow-lg rounded-lg">
                  <CalendarWidget
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    onClose={() => setShowCalendar(false)}
                    toggleRef={dateButtonRef}
                  />
                </div>
              )}



            </div>

          </div>

          {/* Period info */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="flex items-center justify-center gap-2 text-sm text-white">
              <Info className="w-4 h-4" />
              <span>{getPeriodInfo(period)}</span>
            </div>
          </div>



          {/* Balance cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {/* Income Card */}
            <div className="card bg-white/95 backdrop-blur-sm hover:scale-105 transition-transform shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-500 text-sm font-medium">
                  {t('home.balance.income')}
                </span>
                <ArrowUpRight className="h-5 w-5 text-success" />
              </div>
              <div className="text-2xl font-bold text-green-500">
                {formatAmount(currentBalance.income)}
              </div>
            </div>

            {/* Expenses Card */}
            <div className="card bg-white/95 backdrop-blur-sm hover:scale-105 transition-transform shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-500 text-sm font-medium">
                  {t('home.balance.expenses')}
                </span>
                <ArrowDownRight className="h-5 w-5 text-error" />
              </div>
              <div className="text-2xl font-bold text-red-500">
                {formatAmount(currentBalance.expenses)}
              </div>
            </div>

            {/* Balance Card */}
            <div className="card bg-white/95 backdrop-blur-sm hover:scale-105 transition-transform shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium text-primary-600`}>
                  {t('home.balance.total')}
                </span>
                <div>
                  {currentBalance.balance > 0 ? (
                    <TrendingUp className="text-success text-2xl" />
                  ) : currentBalance.balance < 0 ? (
                    <TrendingDown className="text-error text-2xl" />
                  ) : (
                    <Activity className="text-gray-600 text-2xl" />
                  )}
                </div>
              </div>
              <div
                className={`text-2xl font-bold ${currentBalance.balance > 0
                  ? 'text-success'
                  : currentBalance.balance < 0
                    ? 'text-error'
                    : 'text-gray-600'
                  }`}
              >
                {formatAmount(currentBalance.balance)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalancePanel;