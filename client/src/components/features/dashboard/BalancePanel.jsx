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
  Clock as ClockIcon // נשנה את השם כדי למנוע התנגשות
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useTransactions } from '../../../context/TransactionContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useDate } from '../../../context/DateContext';
import { Card, Badge, Button } from '../../ui';
import CalendarWidget from '../../common/CalendarWidget';
import { numbers } from '../../../utils/helpers';

const BalancePanel = () => {
  const { t, language } = useLanguage();
  const { balances, loading, error, refreshData } = useTransactions();
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
  
  // הגדרת מערך התקופות החסר
  const periods = [
    { id: 'daily', label: t('home.balance.periods.daily') },
    { id: 'weekly', label: t('home.balance.periods.weekly') },
    { id: 'monthly', label: t('home.balance.periods.monthly') },
    { id: 'yearly', label: t('home.balance.periods.yearly') }
  ];
  
  const [period, setPeriod] = useState('daily');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [dateWarning, setDateWarning] = useState(false);
  const calendarRef = useRef(null);
  
  const isRTL = language === 'he';

  // בדיקה אם התאריך הנוכחי מסונכרן
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const selectedDay = getDateForServer(selectedDate);
    setDateWarning(selectedDay !== today);
  }, [selectedDate, getDateForServer]);

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
    // גם רענן את הנתונים כשמחליפים תאריך
    setTimeout(() => refreshData(), 100);
  };

  // Add safety check for balances format
  const ensureBalanceFormat = (balanceData, periodKey) => {
    if (!balanceData) {
      console.warn(`[WARN] Missing balance data for ${periodKey}`);
      return { income: 0, expenses: 0, balance: 0 };
    }
    
    // Make sure each property exists and is a number
    return {
      income: typeof balanceData.income === 'number' ? balanceData.income : parseFloat(balanceData.income || 0),
      expenses: typeof balanceData.expenses === 'number' ? balanceData.expenses : parseFloat(balanceData.expenses || 0),
      balance: typeof balanceData.balance === 'number' ? balanceData.balance : 
               (parseFloat(balanceData.income || 0) - parseFloat(balanceData.expenses || 0))
    };
  };

  // Get current balance with safety check
  const currentBalance = ensureBalanceFormat(balances?.[period], period);

  // Debug log
  useEffect(() => {
    console.log('[DEBUG] BalancePanel selectedDate:', selectedDate);
    console.log('[DEBUG] BalancePanel formatted date for API:', getDateForServer(selectedDate));
    console.log('[DEBUG] BalancePanel balances:', balances);
  }, [selectedDate, balances, getDateForServer]);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    }
  };

  const numberVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  };

  const formatValue = (value) => {
    return numbers.formatAmount(value || 0);
  };
  
  return (
    <Card className="p-0 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            {t('home.balance.title')}
          </h2>
          
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="small"
              onClick={goToPreviousDay}
              className="p-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="relative">
              <Button
                variant="outline"
                size="small"
                onClick={() => setShowCalendar(!showCalendar)}
                className={`min-w-[140px] ${dateWarning ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30' : ''}`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {formatDate(selectedDate, 'PP')}
              </Button>
              
              {showCalendar && (
                <div className="absolute top-full mt-2 right-0 z-50">
                  <CalendarWidget
                    selectedDate={selectedDate}
                    onDateSelect={(date) => {
                      updateSelectedDate(new Date(date)); // ודא שזה אובייקט חדש
                      setShowCalendar(false);
                      refreshData(); // הכרח רענון
                    }}
                    onClose={() => setShowCalendar(false)}
                  />
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="small"
              onClick={goToNextDay}
              disabled={!canGoNext}
              className="p-1.5"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            {!isToday() && (
              <Button
                variant="ghost"
                size="small"
                onClick={handleResetToday}
                className="p-1.5"
                title={t('home.balance.backToToday')}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            
            <div className="relative">
              <Button
                variant="ghost"
                size="small"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="p-1.5"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
              
              {showTooltip && (
                <div className="absolute top-full mt-2 right-0 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50">
                  {t('home.balance.tooltip')}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* הודעת התראה אם לא מציגים את היום הנוכחי */}
        {dateWarning && (
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded-md text-center animate-pulse">
            {t('home.balance.viewingPastDate')}
            <button 
              className="underline ml-1 font-medium"
              onClick={handleResetToday}
            >
              {t('home.balance.backToToday')}
            </button>
          </div>
        )}
        
        {/* Period Tabs */}
        <div className="flex gap-1 mt-4 p-1 bg-white/50 dark:bg-gray-800/50 rounded-lg">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`flex-1 px-3 py-2 rounded-md font-medium transition-all text-sm
                ${period === p.id 
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Balance Cards */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            {t('home.balance.error')}
            <p className="text-sm mt-2">{error.message || 'Unknown error'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Income Card */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {t('home.balance.income')}
                </span>
                <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <motion.div
                variants={numberVariants}
                initial="initial"
                animate="animate"
                key={`${period}-income`}
                className="text-2xl font-bold text-green-700 dark:text-green-300"
              >
                {formatValue(currentBalance.income)}
              </motion.div>
            </motion.div>
            
            {/* Expenses Card */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                  {t('home.balance.expenses')}
                </span>
                <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <motion.div
                variants={numberVariants}
                initial="initial"
                animate="animate"
                key={`${period}-expenses`}
                className="text-2xl font-bold text-red-700 dark:text-red-300"
              >
                {formatValue(currentBalance.expenses)}
              </motion.div>
            </motion.div>
            
            {/* Balance Card */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className={`rounded-xl p-4 border ${
                currentBalance.balance >= 0
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${
                  currentBalance.balance >= 0
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-orange-700 dark:text-orange-300'
                }`}>
                  {t('home.balance.total')}
                </span>
                {currentBalance.balance >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                )}
              </div>
              <motion.div
                variants={numberVariants}
                initial="initial"
                animate="animate"
                key={`${period}-balance`}
                className={`text-2xl font-bold ${
                  currentBalance.balance >= 0
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-orange-700 dark:text-orange-300'
                }`}
              >
                {formatValue(currentBalance.balance)}
              </motion.div>
            </motion.div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BalancePanel;