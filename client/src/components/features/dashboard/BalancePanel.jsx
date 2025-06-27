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
      className="relative"
      data-component="BalancePanel"
    >
      {/* 🚀 COMPLETELY UNIFIED BALANCE PANEL - NO MOBILE/DESKTOP SPLIT */}
      <Card variant="clean" padding="adaptive" className="relative overflow-hidden card-polish-interactive">
        {/* Floating Orb Decorations */}
        <div className="floating-orb-primary absolute -top-10 -right-10 w-32 h-32" />
        <div className="floating-orb-secondary absolute -bottom-8 -left-8 w-24 h-24" />
        
        <div className="spacing-section-relaxed relative z-10">
          {/* Header Section - Responsive */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center spacing-element">
            {/* Title with Icon */}
            <div className={`flex items-center spacing-element ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="spacing-form radius-moderate bg-primary-500 shadow-soft">
                <Activity className="icon-adaptive-base text-white" />
              </div>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <h2 className="typo-title-large text-primary-hierarchy">
                  {t('dashboard.balance.title')}
                </h2>
                <p className="typo-caption text-tertiary-hierarchy">
                  {t('dashboard.balance.subtitle')}
                </p>
              </div>
            </div>
            
            {/* Date Navigation - Responsive */}
            <div className={`flex items-center spacing-element-tight surface-elevated p-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToPreviousDay}
                className="button-polish spacing-form-tight hover:bg-gray-200 dark:hover:bg-gray-700 radius-soft"
              >
                <ChevronLeft className="icon-adaptive-sm text-gray-700 dark:text-gray-300" />
              </motion.button>
              
              <div className="relative">
                <motion.button
                  ref={calendarRef}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="min-w-[120px] sm:min-w-[140px] spacing-form radius-soft font-medium transition-polish bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-subtle"
                >
                  <Calendar className={`icon-adaptive-sm inline ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
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
                className={`button-polish spacing-form-tight radius-soft transition-polish ${
                  canGoNext
                    ? 'hover:bg-gray-200 dark:hover:bg-gray-700' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="icon-adaptive-sm text-gray-700 dark:text-gray-300" />
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
                    className="p-2 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-lg transition-colors"
                    title={t('dashboard.balance.backToToday')}
                  >
                    <RotateCcw className="icon-adaptive-sm text-blue-700 dark:text-blue-300" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Period Tabs - Responsive */}
          <div className="flex spacing-element-tight surface-elevated p-1 overflow-x-auto">
            {periods.map((p) => (
              <motion.button
                key={p.id}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePeriodChange(p.id)}
                className={`relative flex-shrink-0 min-w-[60px] sm:flex-1 spacing-form-tight radius-soft font-medium transition-polish text-xs sm:text-sm text-center ${
                  period === p.id 
                    ? 'text-white shadow-moderate' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/50'
                }`}
              >
                {period === p.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary-500 radius-soft shadow-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{p.label}</span>
              </motion.button>
            ))}
          </div>
          
          {/* Balance Cards Grid - Responsive */}
          <div className="smart-grid-balance">
            {/* Income Card */}
            <Card variant="kpiSuccess" padding="compact" className="text-center">
              <ArrowUpRight className="icon-adaptive-base mx-auto mb-2" />
              <div className="typo-field-label text-tertiary-hierarchy opacity-90 mb-1">
                {t('dashboard.balance.income')}
              </div>
              <motion.div
                variants={numberVariants}
                initial="initial"
                animate="animate"
                key={`${period}-income-${isAnimating}`}
                className="typo-kpi"
              >
                {formatValue(currentBalance.income)}
              </motion.div>
            </Card>
            
            {/* Expenses Card */}
            <Card variant="kpiError" padding="compact" className="text-center">
              <ArrowDownRight className="icon-adaptive-base mx-auto mb-2" />
              <div className="typo-field-label text-tertiary-hierarchy opacity-90 mb-1">
                {t('dashboard.balance.expenses')}
              </div>
              <motion.div
                variants={numberVariants}
                initial="initial"
                animate="animate"
                key={`${period}-expenses-${isAnimating}`}
                className="typo-kpi"
              >
                {formatValue(currentBalance.expenses)}
              </motion.div>
            </Card>
            
            {/* Balance Card */}
            <Card variant="kpi" padding="compact" className="text-center">
              {currentBalance.balance >= 0 ? (
                <TrendingUp className="icon-adaptive-base mx-auto mb-2" />
              ) : (
                <TrendingDown className="icon-adaptive-base mx-auto mb-2" />
              )}
              <div className="typo-field-label text-tertiary-hierarchy opacity-90 mb-1">
                {t('dashboard.balance.total')}
              </div>
              <motion.div
                variants={numberVariants}
                initial="initial"
                animate="animate"
                key={`${period}-balance-${isAnimating}`}
                className="typo-kpi"
              >
                {formatValue(currentBalance.balance)}
              </motion.div>
            </Card>
          </div>
        </div>
             </Card>
    </motion.div>
  );
};

export default BalancePanel;