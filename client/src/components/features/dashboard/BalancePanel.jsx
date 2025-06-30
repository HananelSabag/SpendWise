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
import { Card, Badge, Button, BalancePanelSkeleton } from '../../ui';
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
  
  // ✅ ENHANCED: Reset to today with manual refresh
  const handleResetToday = () => {
    console.log('[BalancePanel] Reset to today triggered');
    resetToToday();
    if (refresh) refresh();
  };

  // ✅ ENHANCED: Date navigation with manual refresh
  const handleDateChange = (newDate) => {
    console.log('[BalancePanel] Date change triggered:', newDate);
    updateSelectedDate(newDate);
    if (refresh) refresh();
  };

  // ✅ ENHANCED: Previous/Next day navigation with refresh
  const handlePreviousDay = () => {
    goToPreviousDay();
    if (refresh) refresh();
  };

  const handleNextDay = () => {
    goToNextDay();
    if (refresh) refresh();
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
    return formatAmount(value || 0);
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

  // 🚀 PHASE 16: Enhanced loading state with sophisticated skeleton
  if (isLoading) {
    return (
      <Card variant="clean" padding="adaptive" className="relative overflow-hidden card-polish-interactive">
        {/* Floating Orb Decorations - Even in loading */}
        <div className="floating-orb-primary absolute -top-10 -right-10 w-32 h-32 opacity-30" />
        <div className="floating-orb-secondary absolute -bottom-8 -left-8 w-24 h-24 opacity-30" />
        
        <div className="spacing-section-relaxed relative z-10">
          <BalancePanelSkeleton />
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
      className="relative w-full"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Blue Glow Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 opacity-100 rounded-2xl pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 rounded-2xl"></div>
        {/* Floating Orbs */}
        <motion.div 
          className="absolute top-2 right-2 w-8 h-8 bg-white/10 rounded-full blur-xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute bottom-2 left-2 w-6 h-6 bg-purple-300/20 rounded-full blur-lg"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </div>
      {/* Main Card */}
      <Card variant="kpi" className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl overflow-hidden">
        <div className="relative z-10 p-3">
          {/* Unified Header Section */}
          <div className="relative p-0 pb-1">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 blur-xl"></div>
            <div className={`relative z-10 flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}> 
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}> 
                <motion.div 
                  className="relative p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg"
                  whileHover={{ scale: 1.05, rotate: isRTL ? -5 : 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl blur-lg opacity-70"></div>
                  <Activity className="relative w-5 h-5 text-white" />
                </motion.div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h2 className="text-base font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                    {t('dashboard.balance.title')}
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('dashboard.balance.subtitle')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Date Navigation */}
          <div className={`flex items-center gap-1 bg-white/20 rounded-lg p-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePreviousDay}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </motion.button>
            
            <div className="relative">
              <motion.button
                ref={calendarRef}
                whileHover={{ scale: 1.02 }}
                onClick={() => setShowCalendar(!showCalendar)}
                className="min-w-[120px] sm:min-w-[140px] px-3 py-2 rounded-lg font-medium bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <Calendar className={`w-4 h-4 inline ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
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
                    handleDateChange(new Date(date));
                    setShowCalendar(false);
                  }}
                  onClose={() => setShowCalendar(false)}
                />
              )}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextDay}
              disabled={!canGoNext}
              className={`p-2 rounded-lg transition-colors ${
                canGoNext
                  ? 'hover:bg-white/20' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </motion.button>
            
            <AnimatePresence>
              {!isToday() && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleResetToday}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  title={t('dashboard.balance.backToToday')}
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          
          {/* Period Tabs */}
          <div className="flex bg-white/20 rounded-lg p-1 overflow-x-auto mb-3">
            {periods.map((p) => (
              <motion.button
                key={p.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePeriodChange(p.id)}
                className={`relative flex-shrink-0 min-w-[48px] sm:flex-1 px-2 py-1 rounded-lg font-medium transition-colors text-xs text-center ${
                  period === p.id 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="relative z-10">{p.label}</span>
              </motion.button>
            ))}
          </div>
          
          {/* Unified Balance grid with transparent/white backgrounds */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Income Card */}
            <div className="bg-white/60 dark:bg-white/10 p-2 rounded-lg text-center shadow-md hover:shadow-lg transition-all duration-300 border border-white/30 dark:border-white/10">
              <ArrowUpRight className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <div className="text-xs text-green-600 font-medium mb-0.5">
                {t('dashboard.balance.income')}
              </div>
              <motion.div
                variants={numberVariants}
                initial="initial"
                animate="animate"
                key={`${period}-income-${isAnimating}`}
                className="text-xl font-bold text-green-600"
              >
                {formatValue(currentBalance.income)}
              </motion.div>
            </div>
            
            {/* Expenses Card */}
            <div className="bg-white/60 dark:bg-white/10 p-2 rounded-lg text-center shadow-md hover:shadow-lg transition-all duration-300 border border-white/30 dark:border-white/10">
              <ArrowDownRight className="w-5 h-5 text-red-600 mx-auto mb-1" />
              <div className="text-xs text-red-600 font-medium mb-0.5">
                {t('dashboard.balance.expenses')}
              </div>
              <motion.div
                variants={numberVariants}
                initial="initial"
                animate="animate"
                key={`${period}-expenses-${isAnimating}`}
                className="text-xl font-bold text-red-600"
              >
                {formatValue(currentBalance.expenses)}
              </motion.div>
            </div>
            
            {/* Balance Card */}
            <div className="bg-white/60 dark:bg-white/10 p-2 rounded-lg text-center shadow-md hover:shadow-lg transition-all duration-300 border border-white/30 dark:border-white/10">
              {currentBalance.balance >= 0 ? (
                <TrendingUp className="w-5 h-5 text-gray-700 dark:text-gray-300 mx-auto mb-1" />
              ) : (
                <TrendingDown className="w-5 h-5 text-gray-700 dark:text-gray-300 mx-auto mb-1" />
              )}
              <div className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-0.5">
                {t('dashboard.balance.total')}
              </div>
              <motion.div
                variants={numberVariants}
                initial="initial"
                animate="animate"
                key={`${period}-balance-${isAnimating}`}
                className="text-xl font-bold text-gray-900 dark:text-white"
              >
                {formatValue(currentBalance.balance)}
              </motion.div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default BalancePanel;