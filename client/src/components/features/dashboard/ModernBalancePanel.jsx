/**
 * 💰 MODERN BALANCE PANEL - Revolutionary UX/UI Design
 * Features: Stunning animations, Interactive cards, Smart period switching,
 * Real-time updates, Mobile-first responsive, Advanced micro-interactions
 * @version 4.0.0 - REVOLUTIONARY REDESIGN
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { 
  RefreshCw, TrendingUp, TrendingDown, 
  Wallet, Sparkles,
  ArrowUp, ArrowDown, Activity, PiggyBank
} from 'lucide-react';

// ✅ Import stores and components
import { useTranslation, useNotifications, useCurrency } from '../../../stores';
import { Button, Card, LoadingSpinner, Badge } from '../../ui';
import { cn } from '../../../utils/helpers';

// ✅ Import the balance hook
import { useBalance } from '../../../hooks';

// ✅ Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      staggerChildren: 0.1,
      ease: [0.23, 1, 0.32, 1]
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      ease: [0.23, 1, 0.32, 1]
    }
  }
};

const numberVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.5,
      ease: "backOut"
    }
  }
};

// ✅ Modern Balance Card Component
const BalanceCard = ({ 
  type, 
  amount, 
  icon: Icon, 
  color, 
  bgColor, 
  borderColor, 
  trend,
  isVisible,
  formatCurrency,
  t 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ 
        scale: 1.02, 
        y: -4,
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 p-3 sm:p-6 cursor-pointer min-w-0 select-none w-full',
        'transition-all duration-300 shadow-lg hover:shadow-xl',
        bgColor,
        borderColor
      )}
    >
      {/* Background gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-0 bg-gradient-to-br from-white/20 to-transparent"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Sparkle effect */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute top-4 right-4"
          >
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div
              animate={{ 
                rotate: isHovered ? [0, -10, 10, 0] : 0,
                scale: isHovered ? 1.1 : 1
              }}
              transition={{ duration: 0.5 }}
              className={cn(
                'w-8 h-8 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg',
                'bg-white/90 backdrop-blur-sm'
              )}
            >
              <Icon className={cn('w-4 h-4 sm:w-6 sm:h-6', color)} />
            </motion.div>
            <div>
              <h3 className={cn('text-[10px] sm:text-sm font-bold uppercase tracking-wide', color)}>
                {t(`balance.${type}`)}
              </h3>
              {trend !== undefined && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="hidden sm:flex items-center gap-1 mt-1"
                >
                  {trend >= 0 ? (
                    <ArrowUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={cn(
                    'text-xs font-medium',
                    trend >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {Math.abs(trend)}%
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Activity indicator (hidden on mobile for compactness) */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="hidden sm:block w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-blue-500"
          />
        </div>

        {/* Amount */}
        <div className="relative">
          {isVisible ? (
              <motion.div
              variants={numberVariants}
                className="space-y-1.5 sm:space-y-2"
            >
              {(() => {
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                const useZeroDecimals = isMobile; // tighter for mobile
                const formattedAmount = formatCurrency(amount, { precision: useZeroDecimals ? 0 : undefined });
                const isLongMobile = isMobile && formattedAmount.length > 9;
                const amountTextClass = isLongMobile ? 'text-lg' : 'text-2xl';
                return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                  className={cn(`${amountTextClass} sm:text-3xl font-bold leading-tight tracking-tight whitespace-nowrap tabular-nums`, color)}
              >
                  {formattedAmount}
              </motion.div>
                );
              })()}
              
              {/* Progress bar for visual representation */}
              <motion.div
                className="w-full h-1 sm:h-2 bg-white/30 rounded-full overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <motion.div
                  className={cn('h-full rounded-full', 
                    type === 'income' ? 'bg-green-500' : 
                    type === 'expenses' ? 'bg-red-500' : 'bg-blue-500'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: amount > 0 ? '100%' : '0%' }}
                  transition={{ delay: 0.7, duration: 1 }}
                />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              variants={numberVariants}
              className="flex items-center justify-center h-12"
            >
              <Eye className="w-8 h-8 text-gray-400" />
              <span className="ml-2 text-gray-500 text-lg">••••••</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ✅ Period Selector Component (icons removed for clarity; always show labels)
const PeriodSelector = ({ selectedPeriod, onPeriodChange, t }) => {
  const periods = [
    { key: 'daily', label: t('periods.daily') },
    { key: 'weekly', label: t('periods.weekly') },
    { key: 'monthly', label: t('periods.monthly') },
    { key: 'yearly', label: t('periods.yearly') }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex flex-wrap gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl"
    >
      {periods.map((period) => {
        const isActive = selectedPeriod === period.key;
        
        return (
          <motion.button
            key={period.key}
            onClick={() => onPeriodChange(period.key)}
            className={cn(
              'flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-300',
              'hover:shadow-md active:scale-95',
              isActive
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            layoutId={isActive ? "activePeriod" : undefined}
          >
            <span>{period.label}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
};

/**
 * 💰 Modern Balance Panel Main Component
 */
const ModernBalancePanel = ({
  className = '',
  showDetails = false,
  onToggleDetails
}) => {
  // ✅ Stores
  const { t, isRTL } = useTranslation('dashboard');
  const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();

  // ✅ Use the dedicated balance hook
  const {
    data: balanceData,
    metadata,
    loading,
    error,
    refresh,
    isReady,
    isEmpty
  } = useBalance({
    autoRefresh: true,
    refreshInterval: 30000 // 30 seconds
  });

  // ✅ State management
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ Refs for advanced animations
  const refreshButtonRef = useRef(null);

  // ✅ Handle manual refresh with enhanced UX
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    // Add haptic feedback if supported
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    
    try {
      await refresh();
      addNotification({
        type: 'success',
        title: t('balance.refreshed'),
        message: t('balance.dataUpdated'),
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('balance.refreshFailed'),
        message: error.message || t('balance.tryAgain'),
        duration: 5000
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh, addNotification, t]);

  // ✅ Get current period data with fallbacks
  const currentPeriodData = useMemo(() => {
    if (!balanceData || !balanceData[selectedPeriod]) {
      return { income: 0, expenses: 0, total: 0 };
    }
    return balanceData[selectedPeriod];
  }, [balanceData, selectedPeriod]);

  // ✅ Calculate trends (mock data for now)
  const trends = useMemo(() => ({
    income: 12.5,
    expenses: -8.3,
    total: 15.7
  }), []);

  // ✅ Enhanced loading state
  if (loading && !balanceData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn('relative', className)}
      >
        <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 border-2 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4"
              >
                <LoadingSpinner size="lg" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-lg font-medium text-gray-600 dark:text-gray-400"
              >
                {t('balance.loading')}
              </motion.p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // ✅ Enhanced error state
  if (error && !balanceData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn('relative', className)}
      >
        <Card className="p-8 border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Activity className="w-8 h-8 text-red-600" />
            </motion.div>
            <p className="text-red-600 dark:text-red-400 mb-4 text-lg font-medium">{t('balance.error')}</p>
            <Button onClick={handleRefresh} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('common.retry')}
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  // ✅ Enhanced empty state
  if (isEmpty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('relative', className)}
      >
        <Card className="p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <PiggyBank className="w-8 h-8 text-gray-400" />
          </motion.div>
          <p className="text-gray-500 text-lg">{t('balance.noData')}</p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn('relative', className)}
    >
        <Card className="overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl">
        {/* Enhanced Header */}
        <motion.div
          variants={cardVariants}
            className="mx-3 sm:mx-6 mt-4 rounded-2xl p-4 sm:p-6 pb-3 sm:pb-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
                className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
              >
                  <Wallet className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <motion.h2 
                  variants={numberVariants}
                  className="text-2xl font-bold"
                >
                  {t('balance.title')}
                </motion.h2>
                <motion.p
                  variants={numberVariants}
                    className="text-white/80 text-sm"
                >
                  {t('balance.subtitle', 'Your financial overview')}
                </motion.p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Enhanced refresh button */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  ref={refreshButtonRef}
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="text-white/90 hover:text-white hover:bg-white/20 border-white/30"
                  aria-label={t('balance.refresh')}
                >
                  <RefreshCw className={cn(
                    'w-5 h-5 transition-transform duration-500',
                    (isRefreshing || loading) && 'animate-spin'
                  )} />
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Period Selector */}
          <PeriodSelector 
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            t={t}
          />
        </motion.div>

        {/* Enhanced Balance Display */}
        <motion.div
          variants={cardVariants}
          className="p-4 sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-6"
          >
            {/* Income Card */}
            <BalanceCard
              type="income"
              amount={currentPeriodData.income}
              icon={TrendingUp}
              color="text-green-700"
              bgColor="bg-green-50 dark:bg-green-900/20"
              borderColor="border-green-200 dark:border-green-800"
              trend={trends.income}
              isVisible={true}
              formatCurrency={formatCurrency}
              t={t}
            />

            {/* Expenses Card */}
            <BalanceCard
              type="expenses"
              amount={currentPeriodData.expenses}
              icon={TrendingDown}
              color="text-red-700"
              bgColor="bg-red-50 dark:bg-red-900/20"
              borderColor="border-red-200 dark:border-red-800"
              trend={trends.expenses}
              isVisible={true}
              formatCurrency={formatCurrency}
              t={t}
            />

            {/* Net Balance Card */}
            <BalanceCard
              type="total"
              amount={currentPeriodData.total}
              icon={Activity}
              color={currentPeriodData.total >= 0 ? "text-blue-700" : "text-orange-700"}
              bgColor={currentPeriodData.total >= 0 ? "bg-blue-50 dark:bg-blue-900/20" : "bg-orange-50 dark:bg-orange-900/20"}
              borderColor={currentPeriodData.total >= 0 ? "border-blue-200 dark:border-blue-800" : "border-orange-200 dark:border-orange-800"}
              trend={trends.total}
              isVisible={true}
              formatCurrency={formatCurrency}
              t={t}
            />
          </motion.div>
        </motion.div>
      </Card>
    </motion.div>
  );
};

export default ModernBalancePanel;
