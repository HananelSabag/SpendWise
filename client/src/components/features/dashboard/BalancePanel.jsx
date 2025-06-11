// components/features/dashboard/BalancePanel.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  RotateCcw,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock as ClockIcon
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useDate } from '../../../context/DateContext';
import { useDashboard } from '../../../hooks/useDashboard';
import { Card, Badge, Button } from '../../ui';
import CalendarWidget from '../../common/CalendarWidget';
import { numbers } from '../../../utils/helpers';

const BalancePanel = () => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const { 
    selectedDate, 
    updateSelectedDate, 
    formatDate, 
    isToday, 
    canGoNext, 
    goToPreviousDay, 
    goToNextDay, 
    resetToToday, 
    getDateForServer 
  } = useDate();
  
  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refresh 
  } = useDashboard();
  
  const [period, setPeriod] = useState('daily');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [dateWarning, setDateWarning] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const calendarRef = useRef(null);
  
  const isRTL = language === 'he';

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎨 [BALANCE-PANEL] Using useDashboard hook, loading: ${isLoading}`);
    }
  }, [isLoading]);

  const balanceData = dashboardData?.balances || {
    daily: { income: 0, expenses: 0, balance: 0 },
    weekly: { income: 0, expenses: 0, balance: 0 },
    monthly: { income: 0, expenses: 0, balance: 0 },
    yearly: { income: 0, expenses: 0, balance: 0 }
  };

  const recurringInfo = dashboardData?.recurringInfo || {
    income_count: 0,
    expense_count: 0,
    recurring_income: 0,
    recurring_expense: 0
  };

  // הגדרת מערך התקופות
  const periods = [
    { id: 'daily', label: t('dashboard.balance.periods.daily') },
    { id: 'weekly', label: t('dashboard.balance.periods.weekly') },
    { id: 'monthly', label: t('dashboard.balance.periods.monthly') },
    { id: 'yearly', label: t('dashboard.balance.periods.yearly') }
  ];
  
  // ✅ הוספת פונקציה לוודא פורמט תקין
  const ensureBalanceFormat = (balanceData, periodKey) => {
    if (!balanceData) {
      console.warn(`[WARN] Missing balance data for ${periodKey}`);
      return { income: 0, expenses: 0, balance: 0 };
    }
    
    return {
      income: typeof balanceData.income === 'number' ? balanceData.income : parseFloat(balanceData.income || 0),
      expenses: typeof balanceData.expenses === 'number' ? balanceData.expenses : parseFloat(balanceData.expenses || 0),
      balance: typeof balanceData.balance === 'number' ? balanceData.balance : 
               (parseFloat(balanceData.income || 0) - parseFloat(balanceData.expenses || 0))
    };
  };

  // ✅ עכשיו period מוגדר וניתן לשימוש - עם memoization
  const currentBalance = React.useMemo(() => {
    return ensureBalanceFormat(balanceData?.[period], period);
  }, [balanceData, period]);
  
  // ✅ הסר לוג מיותר - רק אם יש debug מפורש
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && localStorage.getItem('debug_balance') === 'true') {
      console.log(`[BALANCE-PANEL] Current balance for ${period}:`, currentBalance);
    }
  }, [period, currentBalance]);
  
  // בדיקה אם התאריך הנוכחי מסונכרן
  useEffect(() => {
    // Get today in local timezone format (matching server expectations)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Get selected date in same format
    const selected = selectedDate || new Date();
    const selectedStr = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`;
    
    setDateWarning(selectedStr !== todayStr);
  }, [selectedDate]);

  // ניקוי להתראה אחרי זמן קצר
  useEffect(() => {
    if (dateWarning) {
      const timer = setTimeout(() => {
        setDateWarning(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [dateWarning]);
  
  // חיזוק פונקציית איפוס התאריך
  const handleResetToday = () => {
    resetToToday();
    console.log('[BalancePanel] Reset to today triggered');
  };

  // Debug log - הפחתת דיבאגים מיותרים
  useEffect(() => {
    // מעקב דיבאג רק בפעם הראשונה ולא בכל רינדור
    const shouldLog = localStorage.getItem('debug_balances') === 'true';
    
    if (shouldLog) {
      console.log('[INFO] BalancePanel using date:', getDateForServer(selectedDate));
    }
  }, [selectedDate, getDateForServer]);

  // Enhanced Animation variants with glow effects
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        staggerChildren: 0.1
      }
    }
  };

  const numberVariants = {
    initial: { opacity: 0, y: 20, scale: 0.8 },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  const glowVariants = {
    initial: { opacity: 0.3 },
    animate: { 
      opacity: [0.3, 0.8, 0.3],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setIsAnimating(true);
    setPeriod(newPeriod);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const formatValue = (value) => {
    return numbers.formatAmount(value || 0);
  };
  
  // ✅ ADD: Click outside handler for calendar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target) && showCalendar) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  // ✅ NEW: Handle loading state
  if (isLoading) {
    return (
      <Card className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-3xl"></div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // ✅ NEW: Handle error state
  if (error) {
    return (
      <Card className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
        <div className="p-8 text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            {t('dashboard.balance.error')}
          </div>
          <Button
            onClick={refresh}
            variant="outline"
            size="small"
          >
            {t('common.retry')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="relative"
      data-component="BalancePanel"
    >
      {/* 📱 MOBILE VERSION - Compact with period tabs */}
      <div className="lg:hidden">
        <div className="space-y-3 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.balance.title')}</span>
            </div>
            
            {/* Mobile Period Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              {periods.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePeriodChange(p.id)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                    period === p.id
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {/* Income Box */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-2xl p-3 shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-1 right-1 w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
              <div className="relative z-10 text-white text-center">
                <div className="flex items-center justify-center mb-1">
                  <ArrowUpRight className="w-3 h-3" />
                </div>
                <div className="text-xs text-emerald-100 mb-1 uppercase tracking-wide">
                  {t('dashboard.balance.income')}
                </div>
                <div className="text-lg font-bold">
                  {formatValue(currentBalance.income)}
                </div>
              </div>
            </motion.div>

            {/* Expenses Box */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-rose-400 via-red-500 to-pink-600 rounded-2xl p-3 shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-1 right-1 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-300"></div>
              <div className="relative z-10 text-white text-center">
                <div className="flex items-center justify-center mb-1">
                  <ArrowDownRight className="w-3 h-3" />
                </div>
                <div className="text-xs text-rose-100 mb-1 uppercase tracking-wide">
                  {t('dashboard.balance.expenses')}
                </div>
                <div className="text-lg font-bold">
                  {formatValue(currentBalance.expenses)}
                </div>
              </div>
            </motion.div>

            {/* Balance Box */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`rounded-2xl p-3 shadow-lg relative overflow-hidden ${
                currentBalance.balance >= 0
                  ? 'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600'
                  : 'bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-600'
              }`}
            >
              <div className="absolute top-1 right-1 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-500"></div>
              <div className="relative z-10 text-white text-center">
                <div className="flex items-center justify-center mb-1">
                  {currentBalance.balance >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                </div>
                <div className={`text-xs mb-1 uppercase tracking-wide ${
                  currentBalance.balance >= 0 ? 'text-blue-100' : 'text-orange-100'
                }`}>
                  {t('dashboard.balance.total')}
                </div>
                <div className="text-lg font-bold">
                  {formatValue(currentBalance.balance)}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 💻 DESKTOP VERSION - Existing full version */}
      <div className="hidden lg:block">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 opacity-100">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
          
          {/* Floating Orbs - smaller */}
          <motion.div 
            className="absolute top-6 right-6 w-20 h-20 bg-white/10 rounded-full blur-2xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-6 left-6 w-16 h-16 bg-purple-300/20 rounded-full blur-xl"
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/3 w-12 h-12 bg-blue-200/30 rounded-full blur-lg"
            animate={{ 
              y: [-10, 10, -10],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </div>

        <Card className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
          {/* Compact Header with Glow Effects */}
          <div className="relative p-4 overflow-hidden">
            {/* Header Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-blue-500/10 blur-xl"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                {/* Compact Title */}
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="relative p-3 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl shadow-lg"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {/* Icon Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-purple-500 rounded-xl blur-lg opacity-70"></div>
                    <Activity className="relative w-5 h-5 text-white" />
                  </motion.div>
                  
                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-blue-900 dark:from-white dark:via-purple-200 dark:to-blue-200 bg-clip-text text-transparent">
                      {t('dashboard.balance.title')}
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {t('dashboard.balance.subtitle')}
                    </p>
                  </div>
                </div>
                
                {/* Compact Date Navigation */}
                <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1.5 border border-white/20 shadow-xl">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goToPreviousDay}
                    className="p-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg hover:from-primary-100 hover:to-purple-100 dark:hover:from-primary-900/50 dark:hover:to-purple-900/50 transition-all shadow-md"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                  </motion.button>
                  
                  <div className="relative">
                    <motion.button
                      ref={calendarRef}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowCalendar(!showCalendar)}
                      className={`min-w-[140px] px-3 py-2 rounded-lg font-medium transition-all shadow-md text-sm ${
                        dateWarning 
                          ? 'bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300 text-amber-800 dark:from-amber-900/30 dark:to-orange-900/30 dark:border-amber-600 dark:text-amber-200' 
                          : 'bg-gradient-to-r from-white to-gray-50 border-gray-200 text-gray-700 hover:from-primary-50 hover:to-purple-50 dark:from-gray-700 dark:to-gray-600 dark:border-gray-500 dark:text-gray-200'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 mr-1.5 inline" />
                      {(() => {
                        const date = selectedDate || new Date();
                        const options = { month: 'short', day: 'numeric', year: 'numeric' };
                        return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', options);
                      })()}
                    </motion.button>
                    
                    {showCalendar && (
                      <CalendarWidget
                        triggerRef={calendarRef}
                        selectedDate={selectedDate}
                        onDateSelect={(date) => {
                          updateSelectedDate(new Date(date));
                          setShowCalendar(false);
                        }}
                        onClose={() => setShowCalendar(false)}
                      />
                    )}
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goToNextDay}
                    disabled={!canGoNext}
                    className={`p-2 rounded-lg transition-all shadow-md ${
                      canGoNext 
                        ? 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-primary-100 hover:to-purple-100 dark:hover:from-primary-900/50 dark:hover:to-purple-900/50' 
                        : 'bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                  </motion.button>
                  
                  <AnimatePresence>
                    {!isToday() && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.1, rotate: 180 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={resetToToday}
                        className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-lg hover:from-blue-200 hover:to-indigo-200 dark:hover:from-blue-800/50 dark:hover:to-indigo-800/50 transition-all shadow-md"
                        title={t('dashboard.balance.backToToday')}
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-700 dark:text-blue-300" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Responsive Period Tabs - Mobile & Desktop Optimized */}
              <div className="mt-4">
                <div className="flex gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-gradient-to-r from-white/60 via-gray-50/80 to-white/60 dark:from-gray-800/60 dark:via-gray-700/80 dark:to-gray-800/60 backdrop-blur-sm rounded-xl border border-white/30 shadow-inner overflow-x-auto">
                  {periods.map((p, index) => (
                    <motion.button
                      key={p.id}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePeriodChange(p.id)}
                      className={`relative flex-shrink-0 min-w-[70px] sm:min-w-0 sm:flex-1 px-2 sm:px-3 py-2 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-xs overflow-hidden text-center ${
                        period === p.id 
                          ? 'text-white shadow-lg' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/50'
                      }`}
                    >
                      {period === p.id && (
                        <>
                          {/* Active Tab Background with Gradient */}
                          <motion.div 
                            layoutId="activeTab"
                            className="absolute inset-0 bg-gradient-to-r from-primary-500 via-purple-500 to-blue-500 rounded-lg"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                          {/* Active Tab Glow */}
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-primary-400 via-purple-400 to-blue-400 rounded-lg blur-md opacity-60"
                            animate={{ opacity: [0.4, 0.8, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          />
                        </>
                      )}
                      <span className="relative z-10 whitespace-nowrap">{p.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Compact Balance Cards with Stunning Effects */}
          <div className="p-4 pt-0">
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-3 gap-4"
              variants={cardVariants}
            >
              {/* Compact Glowing Income Card */}
              <motion.div
                variants={cardVariants}
                whileHover={{ 
                  scale: 1.03, 
                  y: -5,
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                className="group relative overflow-hidden bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-2xl p-4 shadow-2xl"
              >
                {/* Card Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-300 via-green-400 to-teal-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Floating Particles */}
                <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse"></div>
                <div className="absolute top-5 right-5 w-1 h-1 bg-white/60 rounded-full animate-ping"></div>
                <div className="absolute bottom-4 left-4 w-1 h-1 bg-white/30 rounded-full animate-bounce"></div>
                
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-emerald-100 font-medium text-xs tracking-wide uppercase">
                      {t('dashboard.balance.income')}
                    </span>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </motion.div>
                  </div>
                  <motion.div
                    variants={numberVariants}
                    initial="initial"
                    animate="animate"
                    key={`${period}-income-${isAnimating}`}
                    className="text-2xl lg:text-3xl font-bold mb-1.5"
                  >
                    {formatValue(currentBalance.income)}
                  </motion.div>
                  <div className="text-emerald-100 text-xs">
                    ↗ {t('dashboard.balance.trending')}
                  </div>
                </div>
              </motion.div>
              
              {/* Compact Glowing Expenses Card */}
              <motion.div
                variants={cardVariants}
                whileHover={{ 
                  scale: 1.03, 
                  y: -5,
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                className="group relative overflow-hidden bg-gradient-to-br from-rose-400 via-red-500 to-pink-600 rounded-2xl p-4 shadow-2xl"
              >
                {/* Card Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-rose-300 via-red-400 to-pink-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Floating Particles */}
                <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse delay-300"></div>
                <div className="absolute top-3 right-7 w-1 h-1 bg-white/60 rounded-full animate-ping delay-700"></div>
                <div className="absolute bottom-5 left-5 w-1 h-1 bg-white/30 rounded-full animate-bounce delay-500"></div>
                
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-rose-100 font-medium text-xs tracking-wide uppercase">
                      {t('dashboard.balance.expenses')}
                    </span>
                    <motion.div
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm"
                    >
                      <ArrowDownRight className="w-4 h-4" />
                    </motion.div>
                  </div>
                  <motion.div
                    variants={numberVariants}
                    initial="initial"
                    animate="animate"
                    key={`${period}-expenses-${isAnimating}`}
                    className="text-2xl lg:text-3xl font-bold mb-1.5"
                  >
                    {formatValue(currentBalance.expenses)}
                  </motion.div>
                  <div className="text-rose-100 text-xs">
                    ↘ {t('dashboard.balance.spent')}
                  </div>
                </div>
              </motion.div>
              
              {/* Compact Dynamic Balance Card */}
              <motion.div
                variants={cardVariants}
                whileHover={{ 
                  scale: 1.03, 
                  y: -5,
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                className={`group relative overflow-hidden rounded-2xl p-4 shadow-2xl ${
                  currentBalance.balance >= 0
                    ? 'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600'
                    : 'bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-600'
                }`}
              >
                {/* Dynamic Card Glow */}
                <div className={`absolute inset-0 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500 ${
                  currentBalance.balance >= 0
                    ? 'bg-gradient-to-br from-blue-300 via-indigo-400 to-purple-500'
                    : 'bg-gradient-to-br from-orange-300 via-amber-400 to-yellow-500'
                }`}></div>
                
                {/* Dynamic Floating Particles */}
                <div className="absolute top-3.5 right-3.5 w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse delay-200"></div>
                <div className="absolute top-5 right-6 w-1 h-1 bg-white/60 rounded-full animate-ping delay-1000"></div>
                <div className="absolute bottom-4.5 left-4.5 w-1 h-1 bg-white/30 rounded-full animate-bounce delay-700"></div>
                
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-medium text-xs tracking-wide uppercase ${
                      currentBalance.balance >= 0 ? 'text-blue-100' : 'text-orange-100'
                    }`}>
                      {t('dashboard.balance.total')}
                    </span>
                    <motion.div
                      animate={{ 
                        scale: currentBalance.balance >= 0 ? [1, 1.1, 1] : [1, 0.9, 1],
                        rotate: currentBalance.balance >= 0 ? [0, 5, -5, 0] : [0, -5, 5, 0]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm"
                    >
                      {currentBalance.balance >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </motion.div>
                  </div>
                  <motion.div
                    variants={numberVariants}
                    initial="initial"
                    animate="animate"
                    key={`${period}-balance-${isAnimating}`}
                    className="text-2xl lg:text-3xl font-bold mb-1.5"
                  >
                    {formatValue(currentBalance.balance)}
                  </motion.div>
                  <div className={`text-xs ${
                    currentBalance.balance >= 0 ? 'text-blue-100' : 'text-orange-100'
                  }`}>
                    {currentBalance.balance >= 0 ? '📈 ' : '📉 '}
                    {currentBalance.balance >= 0 
                      ? t('dashboard.balance.positive') 
                      : t('dashboard.balance.negative')
                    }
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default BalancePanel;