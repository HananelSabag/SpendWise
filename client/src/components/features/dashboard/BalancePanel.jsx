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
  
  // ✅ הגדרת period לפני השימוש בו
  const [period, setPeriod] = useState('daily');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [dateWarning, setDateWarning] = useState(false);
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
  };

  // Debug log - הפחתת דיבאגים מיותרים
  useEffect(() => {
    // מעקב דיבאג רק בפעם הראשונה ולא בכל רינדור
    const shouldLog = localStorage.getItem('debug_balances') === 'true';
    
    if (shouldLog) {
      console.log('[INFO] BalancePanel using date:', getDateForServer(selectedDate));
    }
  }, [selectedDate, getDateForServer]);

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
    <Card className="p-0 overflow-hidden" data-component="BalancePanel">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            {t('dashboard.balance.title')}
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
                      updateSelectedDate(new Date(date));
                      setShowCalendar(false);
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
                onClick={resetToToday}
                className="p-1.5"
                title={t('dashboard.balance.backToToday')}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
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
                {t('dashboard.balance.income')}
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
                {t('dashboard.balance.expenses')}
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
                {t('dashboard.balance.total')}
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
      </div>
    </Card>
  );
};

export default BalancePanel;