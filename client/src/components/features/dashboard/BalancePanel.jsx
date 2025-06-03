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
import { useCurrency } from '../../../context/CurrencyContext'; // ✅ הוסף import חסר
import { useDate } from '../../../context/DateContext'; // ✅ הוסף import חסר
import { Card, Badge, Button } from '../../ui';
import CalendarWidget from '../../common/CalendarWidget';
import { numbers } from '../../../utils/helpers';

// ✅ שנה את הקומפוננט לקבל נתונים דרך props
const BalancePanel = ({ 
  balanceData = null, 
  recurringInfo = null 
}) => {
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
  
  const [period, setPeriod] = useState('daily');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [dateWarning, setDateWarning] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const calendarRef = useRef(null);
  
  const isRTL = language === 'he';

  // ✅ הוסף מידע דיבאג לקומפוננט
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎨 [BALANCE-PANEL] Component mounted, receiving data via props`);
    }
  }, []);

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
  
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden"
      data-component="BalancePanel"
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 opacity-100">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
        
        {/* Floating Orbs */}
        <motion.div 
          className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-10 left-10 w-24 h-24 bg-purple-300/20 rounded-full blur-xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/3 w-16 h-16 bg-blue-200/30 rounded-full blur-lg"
          animate={{ 
            y: [-10, 10, -10],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <Card className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
        {/* Enhanced Header with Glow Effects */}
        <div className="relative p-8 overflow-hidden">
          {/* Header Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-blue-500/10 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              {/* Enhanced Title */}
              <div className="flex items-center gap-4">
                <motion.div 
                  className="relative p-4 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl shadow-lg"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {/* Icon Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-purple-500 rounded-2xl blur-lg opacity-70"></div>
                  <Activity className="relative w-6 h-6 text-white" />
                </motion.div>
                
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-blue-900 dark:from-white dark:via-purple-200 dark:to-blue-200 bg-clip-text text-transparent">
                    {t('dashboard.balance.title')}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('dashboard.balance.subtitle')}
                  </p>
                </div>
              </div>
              
              {/* Enhanced Date Navigation */}
              <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 border border-white/20 shadow-xl">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToPreviousDay}
                  className="p-2.5 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl hover:from-primary-100 hover:to-purple-100 dark:hover:from-primary-900/50 dark:hover:to-purple-900/50 transition-all shadow-md"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </motion.button>
                
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`min-w-[160px] px-4 py-2.5 rounded-xl font-medium transition-all shadow-md ${
                      dateWarning 
                        ? 'bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300 text-amber-800 dark:from-amber-900/30 dark:to-orange-900/30 dark:border-amber-600 dark:text-amber-200' 
                        : 'bg-gradient-to-r from-white to-gray-50 border-gray-200 text-gray-700 hover:from-primary-50 hover:to-purple-50 dark:from-gray-700 dark:to-gray-600 dark:border-gray-500 dark:text-gray-200'
                    }`}
                  >
                    <Calendar className="w-4 h-4 mr-2 inline" />
                    {/* ✅ FIX: Ensure consistent local date formatting */}
                    {(() => {
                      const date = selectedDate || new Date();
                      const options = { month: 'short', day: 'numeric', year: 'numeric' };
                      return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', options);
                    })()}
                  </motion.button>
                  
                  <AnimatePresence>
                    {showCalendar && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="absolute top-full mt-3 right-0 z-50 shadow-2xl"
                      >
                        <CalendarWidget
                          selectedDate={selectedDate}
                          onDateSelect={(date) => {
                            updateSelectedDate(new Date(date));
                            setShowCalendar(false);
                          }}
                          onClose={() => setShowCalendar(false)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToNextDay}
                  disabled={!canGoNext}
                  className={`p-2.5 rounded-xl transition-all shadow-md ${
                    canGoNext 
                      ? 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-primary-100 hover:to-purple-100 dark:hover:from-primary-900/50 dark:hover:to-purple-900/50' 
                      : 'bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
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
                      className="p-2.5 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-xl hover:from-blue-200 hover:to-indigo-200 dark:hover:from-blue-800/50 dark:hover:to-indigo-800/50 transition-all shadow-md"
                      title={t('dashboard.balance.backToToday')}
                    >
                      <RotateCcw className="w-4 h-4 text-blue-700 dark:text-blue-300" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Enhanced Period Tabs */}
            <div className="mt-8">
              <div className="flex gap-2 p-2 bg-gradient-to-r from-white/60 via-gray-50/80 to-white/60 dark:from-gray-800/60 dark:via-gray-700/80 dark:to-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-inner">
                {periods.map((p, index) => (
                  <motion.button
                    key={p.id}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePeriodChange(p.id)}
                    className={`relative flex-1 px-4 py-3 rounded-xl font-medium transition-all text-sm overflow-hidden ${
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
                          className="absolute inset-0 bg-gradient-to-r from-primary-500 via-purple-500 to-blue-500 rounded-xl"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                        {/* Active Tab Glow */}
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-primary-400 via-purple-400 to-blue-400 rounded-xl blur-md opacity-60"
                          animate={{ opacity: [0.4, 0.8, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </>
                    )}
                    <span className="relative z-10">{p.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Balance Cards with Stunning Effects */}
        <div className="p-8 pt-0">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            variants={cardVariants}
          >
            {/* Glowing Income Card */}
            <motion.div
              variants={cardVariants}
              whileHover={{ 
                scale: 1.03, 
                y: -5,
                transition: { type: "spring", stiffness: 400, damping: 10 }
              }}
              className="group relative overflow-hidden bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-3xl p-6 shadow-2xl"
            >
              {/* Card Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-300 via-green-400 to-teal-500 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Floating Particles */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
              <div className="absolute top-8 right-8 w-1 h-1 bg-white/60 rounded-full animate-ping"></div>
              <div className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce"></div>
              
              <div className="relative z-10 text-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-emerald-100 font-medium text-sm tracking-wide uppercase">
                    {t('dashboard.balance.income')}
                  </span>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </motion.div>
                </div>
                <motion.div
                  variants={numberVariants}
                  initial="initial"
                  animate="animate"
                  key={`${period}-income-${isAnimating}`}
                  className="text-3xl lg:text-4xl font-bold mb-2"
                >
                  {formatValue(currentBalance.income)}
                </motion.div>
                <div className="text-emerald-100 text-sm">
                  ↗ {t('dashboard.balance.trending')}
                </div>
              </div>
            </motion.div>
            
            {/* Glowing Expenses Card */}
            <motion.div
              variants={cardVariants}
              whileHover={{ 
                scale: 1.03, 
                y: -5,
                transition: { type: "spring", stiffness: 400, damping: 10 }
              }}
              className="group relative overflow-hidden bg-gradient-to-br from-rose-400 via-red-500 to-pink-600 rounded-3xl p-6 shadow-2xl"
            >
              {/* Card Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-rose-300 via-red-400 to-pink-500 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Floating Particles */}
              <div className="absolute top-6 right-6 w-2 h-2 bg-white/40 rounded-full animate-pulse delay-300"></div>
              <div className="absolute top-4 right-12 w-1 h-1 bg-white/60 rounded-full animate-ping delay-700"></div>
              <div className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce delay-500"></div>
              
              <div className="relative z-10 text-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-rose-100 font-medium text-sm tracking-wide uppercase">
                    {t('dashboard.balance.expenses')}
                  </span>
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"
                  >
                    <ArrowDownRight className="w-5 h-5" />
                  </motion.div>
                </div>
                <motion.div
                  variants={numberVariants}
                  initial="initial"
                  animate="animate"
                  key={`${period}-expenses-${isAnimating}`}
                  className="text-3xl lg:text-4xl font-bold mb-2"
                >
                  {formatValue(currentBalance.expenses)}
                </motion.div>
                <div className="text-rose-100 text-sm">
                  ↘ {t('dashboard.balance.spent')}
                </div>
              </div>
            </motion.div>
            
            {/* Dynamic Balance Card */}
            <motion.div
              variants={cardVariants}
              whileHover={{ 
                scale: 1.03, 
                y: -5,
                transition: { type: "spring", stiffness: 400, damping: 10 }
              }}
              className={`group relative overflow-hidden rounded-3xl p-6 shadow-2xl ${
                currentBalance.balance >= 0
                  ? 'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600'
                  : 'bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-600'
              }`}
            >
              {/* Dynamic Card Glow */}
              <div className={`absolute inset-0 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500 ${
                currentBalance.balance >= 0
                  ? 'bg-gradient-to-br from-blue-300 via-indigo-400 to-purple-500'
                  : 'bg-gradient-to-br from-orange-300 via-amber-400 to-yellow-500'
              }`}></div>
              
              {/* Dynamic Floating Particles */}
              <div className="absolute top-5 right-5 w-2 h-2 bg-white/40 rounded-full animate-pulse delay-200"></div>
              <div className="absolute top-8 right-10 w-1 h-1 bg-white/60 rounded-full animate-ping delay-1000"></div>
              <div className="absolute bottom-7 left-7 w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce delay-700"></div>
              
              <div className="relative z-10 text-white">
                <div className="flex items-center justify-between mb-4">
                  <span className={`font-medium text-sm tracking-wide uppercase ${
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
                    className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"
                  >
                    {currentBalance.balance >= 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </motion.div>
                </div>
                <motion.div
                  variants={numberVariants}
                  initial="initial"
                  animate="animate"
                  key={`${period}-balance-${isAnimating}`}
                  className="text-3xl lg:text-4xl font-bold mb-2"
                >
                  {formatValue(currentBalance.balance)}
                </motion.div>
                <div className={`text-sm ${
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
    </motion.div>
  );
};

export default BalancePanel;