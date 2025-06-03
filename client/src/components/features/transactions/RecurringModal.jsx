// components/features/transactions/RecurringModal.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  RefreshCw,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Edit2,
  Trash2,
  Search,
  Filter,
  Info,
  ChevronDown,
  AlertCircle,
  Package,
  Pause,
  Play,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { cn, dateHelpers } from '../../../utils/helpers';
import { Modal, Input, Badge, Button, Card } from '../../ui';
import TransactionCard from './TransactionCard';
import SkipDatesModal from './SkipDatesModal';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../../utils/api';

/**
 * RecurringModal Component
 * Modal for managing recurring transactions
 * Shows overview and allows editing/deleting recurring patterns
 */
const RecurringModal = ({
  isOpen,
  onClose,
  transactions = [],
  onEdit,
  onDelete,
  onSuccess,
  refetch,
  loading = false
}) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const queryClient = useQueryClient();
  const isRTL = language === 'he';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, income, expense
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showSkipDates, setShowSkipDates] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }
    
    // Filter by search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [transactions, filterType, searchTerm]);

  // Group by frequency
  const groupedTransactions = useMemo(() => {
    const groups = {
      daily: [],
      weekly: [],
      monthly: []
    };
    
    filteredTransactions.forEach(tx => {
      if (tx.interval_type) {
        groups[tx.interval_type]?.push(tx);
      }
    });
    
    return groups;
  }, [filteredTransactions]);

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + (tx.monthly_amount || 0), 0);
    
    const expense = filteredTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + (tx.monthly_amount || 0), 0);
    
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  // Toggle group expansion
  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

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
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const groupVariants = {
    hidden: { 
      opacity: 0, 
      height: 0,
      transition: {
        opacity: { duration: 0.2 },
        height: { duration: 0.3, ease: "easeInOut" }
      }
    },
    visible: { 
      opacity: 1, 
      height: "auto",
      transition: {
        height: { duration: 0.3, ease: "easeInOut" },
        opacity: { duration: 0.2, delay: 0.1 }
      }
    }
  };

  // Add pause/resume handler
  const handleToggleActive = async (template) => {
    try {
      await api.put(`/api/v1/transactions/templates/${template.id}`, {
        is_active: !template.is_active
      });
      
      toast.success(template.is_active ? t('transactions.paused') : t('transactions.resumed'));
      // Refresh the data
      if (onSuccess) onSuccess();
      if (refetch) refetch();
      queryClient.invalidateQueries(['recurring']);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  // Manual generation handler
  const handleGenerateNow = async () => {
    try {
      setGenerating(true);
      await api.post('/transactions/generate-recurring');
      toast.success(t('transactions.recurring.generated'));
      queryClient.invalidateQueries(['dashboard']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['recurring']);
    } catch (error) {
      toast.error(t('transactions.recurring.generateError'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xxl"
      className="max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Enhanced Header with Generate Now Button */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 mb-6">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {t('transactions.recurringTransactions')}
                </h2>
                <p className="text-white/80 text-sm">
                  {t('transactions.recurringSection.management')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Generate Now Button */}
              <Button
                variant="secondary"
                size="small"
                onClick={handleGenerateNow}
                loading={generating}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/40"
                title={t('transactions.recurring.generateNow')}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                {t('transactions.recurring.generateNow')}
              </Button>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Update the modal header section */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl">
            <div className="relative">
              <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('transactions.recurringManager.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('transactions.recurringManager.subtitle')}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <motion.div variants={itemVariants}>
            <Card className="p-4 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('transactions.income')}
                  </p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatAmount(totals.income)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('transactions.expense')}
                  </p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {formatAmount(totals.expense)}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-500 opacity-20" />
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-4 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('common.balance')}
                  </p>
                  <p className={cn(
                    'text-xl font-bold',
                    totals.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
                  )}>
                    {formatAmount(totals.net)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          
          <div className="flex gap-2">
            {['all', 'income', 'expense'].map(type => (
              <Button
                key={type}
                variant={filterType === type ? 'primary' : 'outline'}
                size="default"
                onClick={() => setFilterType(type)}
              >
                {type === 'all' && t('transactions.all')}
                {type === 'income' && t('transactions.income')}
                {type === 'expense' && t('transactions.expense')}
              </Button>
            ))}
          </div>
        </div>

        {/* Transaction Groups */}
        <div className="flex-1 overflow-y-auto">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchTerm || filterType !== 'all' 
                  ? t('transactions.noMatchingTransactions')
                  : t('transactions.noRecurringTransactions')
                }
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm">
                {searchTerm || filterType !== 'all'
                  ? t('transactions.tryDifferentSearch')
                  : t('transactions.createRecurringNote')
                }
              </p>
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {Object.entries(groupedTransactions).map(([frequency, items]) => {
                if (items.length === 0) return null;
                
                const isExpanded = expandedGroups[frequency] !== false;
                
                return (
                  <motion.div key={frequency} variants={itemVariants}>
                    <Card className="overflow-hidden">
                      {/* Group Header */}
                      <button
                        onClick={() => toggleGroup(frequency)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                            <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {t(`transactions.frequencies.${frequency}`)}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {items.length} {t('transactions.items')}
                            </p>
                          </div>
                        </div>
                        
                        <ChevronDown className={cn(
                          'w-5 h-5 text-gray-400 transition-transform',
                          isExpanded && 'rotate-180'
                        )} />
                      </button>
                      
                      {/* Group Items */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            variants={groupVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="border-t border-gray-200 dark:border-gray-700"
                          >
                            <div className="p-4 space-y-3">
                              {items.map((transaction) => (
                                <div key={transaction.id} className="relative">
                                  <TransactionCard
                                    transaction={{
                                      ...transaction,
                                      transaction_type: transaction.type,
                                      recurring_interval: transaction.interval_type,
                                      // ✅ FIX: Ensure date fields use proper format for TransactionCard
                                      date: transaction.date || (() => {
                                        const today = new Date();
                                        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                      })(),
                                      next_recurrence_date: transaction.next_occurrence
                                    }}
                                    onEdit={() => {
                                      onEdit?.(transaction);
                                      onClose();
                                    }}
                                    onDelete={() => {
                                      onDelete?.(transaction);
                                    }}
                                    variant="compact"
                                  />
                                  
                                  {/* Enhanced Action Buttons */}
                                  <div className="absolute top-2 right-2 flex items-center gap-1">
                                    {/* Skip Dates Button - GAP #3 */}
                                    <Button
                                      variant="ghost"
                                      size="small"
                                      onClick={() => {
                                        setSelectedTemplate(transaction);
                                        setShowSkipDates(true);
                                      }}
                                      className="text-blue-600 hover:text-blue-700"
                                      title={t('transactions.skipDates')}
                                    >
                                      <CalendarIcon className="w-4 h-4" />
                                    </Button>
                                    
                                    {/* Pause/Resume Button - GAP #3 */}
                                    <Button
                                      variant="ghost"
                                      size="small"
                                      onClick={() => handleToggleActive(transaction)}
                                      className={transaction.is_active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                                      title={transaction.is_active ? t('transactions.pause') : t('transactions.resume')}
                                    >
                                      {transaction.is_active ? (
                                        <Pause className="w-4 h-4" />
                                      ) : (
                                        <Play className="w-4 h-4" />
                                      )}
                                    </Button>
                                    
                                    {/* Edit Button */}
                                    <Button
                                      variant="ghost"
                                      size="small"
                                      onClick={() => {
                                        onEdit?.(transaction);
                                        onClose();
                                      }}
                                      className="text-gray-600 hover:text-gray-700"
                                      title={t('common.edit')}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    
                                    {/* Delete Button */}
                                    <Button
                                      variant="ghost"
                                      size="small"
                                      onClick={() => onDelete?.(transaction)}
                                      className="text-red-600 hover:text-red-700"
                                      title={t('common.delete')}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">{t('transactions.recurringInfo.title')}</p>
              <p>{t('transactions.recurringInfo.description')}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Skip Dates Modal - GAP #3 */}
      {showSkipDates && (
        <SkipDatesModal
          isOpen={showSkipDates}
          onClose={() => {
            setShowSkipDates(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
          onSuccess={() => {
            queryClient.invalidateQueries(['recurring']);
          }}
        />
      )}
    </Modal>
  );
};

export default RecurringModal;