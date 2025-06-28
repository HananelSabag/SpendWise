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

  // ✅ CRITICAL FIX: Add effect to handle date changes with manual refresh
  useEffect(() => {
    console.log('[BalancePanel] Date changed, forcing refresh if needed');
    
    // Force dashboard refresh when date changes
    if (refresh && selectedDate) {
      const timeoutId = setTimeout(() => {
        refresh();
      }, 100); // Small delay to ensure date context is updated

      return () => clearTimeout(timeoutId);
    }
  }, [selectedDate, refresh]);

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
    
    // Force refresh after reset
    if (refresh) {
      setTimeout(() => {
        refresh();
      }, 200);
    }
  };

  // ✅ ENHANCED: Date navigation with manual refresh
  const handleDateChange = (newDate) => {
    console.log('[BalancePanel] Date change triggered:', newDate);
    updateSelectedDate(newDate);
    
    // Force dashboard refresh if React Query doesn't auto-refresh
    if (refresh) {
      setTimeout(() => {
        refresh();
      }, 100);
    }
  };

  // ✅ ENHANCED: Previous/Next day navigation with refresh
  const handlePreviousDay = () => {
    goToPreviousDay();
    if (refresh) {
      setTimeout(() => refresh(), 100);
    }
  };

  const handleNextDay = () => {
    goToNextDay();
    if (refresh) {
      setTimeout(() => refresh(), 100);
    }
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
      className="w-full"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ✅ UNIFIED: Clean Card with kpi variant for hero section */}
      <Card variant="kpi" className="relative">
        <div className="relative z-10 p-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
            {/* Title with Icon */}
            <div className={`flex items-center gap-3 mb-4 lg:mb-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-3 bg-white/20 rounded-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <h2 className="text-2xl font-bold text-white">
                  {t('dashboard.balance.title')}
                </h2>
                <p className="text-white/80">
                  {t('dashboard.balance.subtitle')}
                </p>
              </div>
            </div>
            
            {/* Date Navigation */}
            <div className={`flex items-center gap-2 bg-white/20 rounded-lg p-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
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
          </div>
          
          {/* Period Tabs */}
          <div className="flex bg-white/20 rounded-lg p-1 overflow-x-auto mb-6">
            {periods.map((p) => (
              <motion.button
                key={p.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePeriodChange(p.id)}
                className={`relative flex-shrink-0 min-w-[60px] sm:flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm text-center ${
                  period === p.id 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="relative z-10">{p.label}</span>
              </motion.button>
            ))}
          </div>
          
          {/* ✅ ENHANCED: Balance grid with shadows and subtle gradients */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Income Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30 p-4 rounded-lg text-center shadow-md hover:shadow-lg transition-all duration-300 border border-green-200/50 dark:border-green-700/50">
              <ArrowUpRight className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-sm text-green-600 font-medium mb-1">
                {t('dashboard.balance.income')}
              </div>
              <motion.div
                variants={numberVariants}
                initial="initial"
                animate="animate"
                key={`${period}-income-${isAnimating}`}
                className="text-2xl font-bold text-green-600"
              >
                {formatValue(currentBalance.income)}
              </motion.div>
            </div>
            
            {/* Expenses Card */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/30 p-4 rounded-lg text-center shadow-md hover:shadow-lg transition-all duration-300 border border-red-200/50 dark:border-red-700/50">
              <ArrowDownRight className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <div className="text-sm text-red-600 font-medium mb-1">
                {t('dashboard.balance.expenses')}
              </div>
              <motion.div
                variants={numberVariants}
                initial="initial"
                animate="animate"
                key={`${period}-expenses-${isAnimating}`}
                className="text-2xl font-bold text-red-600"
              >
                {formatValue(currentBalance.expenses)}
              </motion.div>
            </div>
            
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg text-center shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50">
              {currentBalance.balance >= 0 ? (
                <TrendingUp className="w-6 h-6 text-gray-700 dark:text-gray-300 mx-auto mb-2" />
              ) : (
                <TrendingDown className="w-6 h-6 text-gray-700 dark:text-gray-300 mx-auto mb-2" />
              )}
              <div className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
                {t('dashboard.balance.total')}
              </div>
              <motion.div
                variants={numberVariants}
                initial="initial"
                animate="animate"
                key={`${period}-balance-${isAnimating}`}
                className="text-2xl font-bold text-gray-900 dark:text-white"
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