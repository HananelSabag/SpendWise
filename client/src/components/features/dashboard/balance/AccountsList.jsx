/**
 * 🏦 ACCOUNTS LIST - Account Management Component
 * Extracted from BalancePanel.jsx for better performance and maintainability
 * Features: Account cards, Grid layout, Individual account details, Mobile-first
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Wallet, Banknote, BarChart3, Plus,
  TrendingUp, TrendingDown, MoreVertical, Edit,
  Eye, EyeOff, Star, ChevronRight
} from 'lucide-react';

// ✅ Import Zustand stores
import {
  useTranslation,
  useCurrency,
  useTheme
} from '../../../../stores';

import { BalanceTrendSparkline } from './BalanceDisplay';
import { Button, Card, Badge, Tooltip, Dropdown } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 💳 Account Card Component
 */
const AccountCard = ({ 
  account, 
  isMain = false, 
  isSelected = false,
  showBalances = true,
  onSelect,
  onEdit,
  onToggleFavorite,
  className = ''
}) => {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation('dashboard');
  const [showActions, setShowActions] = useState(false);

  const accountIcons = {
    checking: Wallet,
    savings: Banknote,
    credit: CreditCard,
    investment: BarChart3
  };

  const AccountIcon = accountIcons[account.type] || Wallet;

  const handleCardClick = () => {
    onSelect?.(account);
  };

  const actionItems = [
    {
      id: 'edit',
      label: t('actions.editAccount'),
      icon: Edit,
      action: () => onEdit?.(account)
    },
    {
      id: 'favorite',
      label: account.isFavorite ? t('actions.removeFavorite') : t('actions.addFavorite'),
      icon: Star,
      action: () => onToggleFavorite?.(account.id)
    }
  ];

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      className={cn(
        "relative p-4 rounded-2xl cursor-pointer transition-all group",
        "bg-gradient-to-br border",
        isMain 
          ? "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700"
          : "from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600",
        isSelected && "ring-2 ring-blue-500 shadow-lg",
        "hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600",
        className
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-gradient-to-br from-transparent via-white to-transparent rounded-2xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isMain 
                ? "bg-blue-100 dark:bg-blue-900/30" 
                : "bg-gray-100 dark:bg-gray-700"
            )}>
              <AccountIcon className={cn(
                "w-5 h-5",
                isMain 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-gray-600 dark:text-gray-400"
              )} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {account.name}
                </h4>
                
                {account.isFavorite && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                )}
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t(`accounts.types.${account.type}`)}
              </p>
            </div>
          </div>

          {/* Badges and actions */}
          <div className="flex items-center space-x-2">
            {isMain && (
              <Badge variant="primary" size="xs">
                {t('balance.primary')}
              </Badge>
            )}
            
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>

              {/* Actions dropdown */}
              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20"
                  >
                    <div className="p-2">
                      {actionItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              item.action();
                              setShowActions(false);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Icon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="space-y-2">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {showBalances ? formatCurrency(account.balance) : '••••••'}
          </div>
          
          {/* Change and trend */}
          {account.trend && showBalances && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {account.change > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : account.change < 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-gray-300" />
                )}
                
                <span className={cn(
                  "text-sm font-medium",
                  account.change > 0 ? "text-green-600" : account.change < 0 ? "text-red-600" : "text-gray-500"
                )}>
                  {account.change > 0 ? '+' : ''}{formatCurrency(account.change)}
                </span>
              </div>

              <BalanceTrendSparkline data={account.trend} className="w-16" />
            </div>
          )}

          {/* Additional info */}
          {account.lastTransaction && (
            <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
              {t('account.lastTransaction')}: {account.lastTransaction}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 🏦 Accounts List Main Component
 */
const AccountsList = ({
  accounts = [],
  selectedAccount = null,
  showBalances = true,
  onAccountSelect,
  onAccountEdit,
  onToggleFavorite,
  onAddAccount,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('dashboard');

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('accounts.title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('accounts.subtitle', { count: accounts.length })}
          </p>
        </div>

        {onAddAccount && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddAccount}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t('accounts.addAccount')}</span>
          </Button>
        )}
      </div>

      {/* Accounts grid */}
      {accounts.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {accounts.map((account, index) => (
            <motion.div
              key={account.id}
              variants={itemVariants}
              transition={{ delay: index * 0.1 }}
            >
              <AccountCard
                account={account}
                isMain={account.id === 'main'}
                isSelected={selectedAccount?.id === account.id}
                showBalances={showBalances}
                onSelect={onAccountSelect}
                onEdit={onAccountEdit}
                onToggleFavorite={onToggleFavorite}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('accounts.noAccounts')}
          </h4>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('accounts.noAccountsDescription')}
          </p>
          
          {onAddAccount && (
            <Button onClick={onAddAccount}>
              <Plus className="w-4 h-4 mr-2" />
              {t('accounts.addFirstAccount')}
            </Button>
          )}
        </motion.div>
      )}

      {/* Selected account details */}
      <AnimatePresence>
        {selectedAccount && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedAccount.name} {t('account.details')}
                </h4>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAccountSelect(null)}
                >
                  {t('actions.close')}
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="font-bold text-gray-900 dark:text-white">
                    {selectedAccount.balance ? formatCurrency(selectedAccount.balance) : '••••'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {t('account.currentBalance')}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className={cn(
                    "font-bold",
                    selectedAccount.change >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {selectedAccount.change ? formatCurrency(selectedAccount.change) : '••••'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {t('account.monthlyChange')}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="font-bold text-gray-900 dark:text-white">
                    {t(`accounts.types.${selectedAccount.type}`)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {t('account.type')}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="font-bold text-gray-900 dark:text-white">
                    {selectedAccount.lastTransaction || t('account.noTransactions')}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {t('account.lastActivity')}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountsList;
export { AccountCard }; 