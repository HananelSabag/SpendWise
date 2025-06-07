// components/features/transactions/RecurringModal.jsx
import React, { useState, useMemo, useEffect } from 'react';
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
  Calendar as CalendarIcon,
  Settings
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { cn, dateHelpers } from '../../../utils/helpers';
import { Modal, Input, Badge, Button, Card } from '../../ui';
import TransactionCard from './TransactionCard';
import DeleteTransaction from './DeleteTransaction';
import toast from 'react-hot-toast';
import { useRecurringTransactions, useTransactionTemplates } from '../../../hooks/useTransactions';

/**
 * RecurringModal Component - Aligned with Server Capabilities
 * Shows templates and allows template-level operations only
 */
const RecurringModal = ({
  isOpen,
  onClose,
  onEdit,
  onSuccess,
  focusedTransaction = null // ✅ ADD: Optional transaction to focus on
}) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const isRTL = language === 'he';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState({});

  // ✅ ADD: Auto-expand and focus on specific transaction
  useEffect(() => {
    if (focusedTransaction && templates?.length > 0) {
      // Find the template that matches the transaction
      const matchingTemplate = templates.find(template => 
        template.id === focusedTransaction.template_id || 
        (focusedTransaction.is_template && template.id === focusedTransaction.id)
      );
      
      if (matchingTemplate) {
        // Auto-expand the group containing this template
        const groupKey = matchingTemplate.interval_type;
        if (groupKey) {
          setExpandedGroups(prev => ({
            ...prev,
            [groupKey]: true
          }));
        }
        
        // Clear any filters to ensure the template is visible
        setFilterType('all');
        setSearchTerm('');
        
        // Scroll to the template after a short delay
        setTimeout(() => {
          const templateElement = document.getElementById(`template-${matchingTemplate.id}`);
          if (templateElement) {
            templateElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            // Add a subtle highlight effect
            templateElement.classList.add('ring-2', 'ring-primary-500', 'ring-opacity-50');
            setTimeout(() => {
              templateElement.classList.remove('ring-2', 'ring-primary-500', 'ring-opacity-50');
            }, 3000);
          }
        }, 500);
      }
    }
  }, [focusedTransaction, templates]);

  // ✅ FIX: Use recurring transactions hook for templates
  const { 
    recurringTransactions: templates, 
    isLoading, 
    error, 
    generateRecurring, 
    isGenerating, 
    refresh 
  } = useRecurringTransactions();

  // ✅ FIX: Use template operations
  const {
    updateTemplate,
    deleteTemplate,
    skipDates,
    isUpdating,
    isDeleting,
    isSkipping
  } = useTransactionTemplates();

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let filtered = [...(templates || [])];
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(template => template.type === filterType);
    }
    
    // Filter by search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(template => 
        template.description?.toLowerCase().includes(search) ||
        template.category_name?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [templates, filterType, searchTerm]);

  // Group by frequency
  const groupedTemplates = useMemo(() => {
    const groups = {
      daily: [],
      weekly: [],
      monthly: []
    };
    
    filteredTemplates.forEach(template => {
      if (template.interval_type && groups[template.interval_type]) {
        groups[template.interval_type].push(template);
      }
    });
    
    return groups;
  }, [filteredTemplates]);

  // Calculate monthly impact
  const calculateMonthlyImpact = (template) => {
    const amount = parseFloat(template.amount) || 0;
    
    switch (template.interval_type) {
      case 'daily':
        return amount * 30.44; // Average days per month
      case 'weekly':
        return amount * 4.35; // Average weeks per month
      case 'monthly':
        return amount;
      default:
        return amount;
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTemplates
      .filter(template => template.type === 'income')
      .reduce((sum, template) => sum + calculateMonthlyImpact(template), 0);
    
    const expense = filteredTemplates
      .filter(template => template.type === 'expense')
      .reduce((sum, template) => sum + calculateMonthlyImpact(template), 0);
    
    return { income, expense, net: income - expense };
  }, [filteredTemplates]);

  // ✅ FIX: Template operations aligned with server
  const handleToggleActive = async (template) => {
    try {
      await updateTemplate(template.id, {
        is_active: !template.is_active
      });
      
      toast.success(template.is_active ? t('transactions.paused') : t('transactions.resumed'));
      refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleSkipDates = async (templateId, dates) => {
    try {
      await skipDates(templateId, dates);
      toast.success(t('transactions.skipDates.success'));
      setShowSkipDates({});
      setSelectedSkipDates([]);
      refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(t('transactions.skipDates.error'));
    }
  };

  const handleDeleteTemplate = async (template, deleteFuture = false) => {
    try {
      await deleteTemplate(template.id, deleteFuture);
      setShowDeleteModal(false);
      setSelectedTemplate(null);
      refresh();
      onSuccess?.();
      toast.success(t('transactions.templateDeleted'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleGenerateRecurring = async () => {
    try {
      await generateRecurring();
      toast.success(t('transactions.recurring.generated'));
      refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(t('transactions.recurring.generateError'));
    }
  };

  // Get upcoming dates for skip functionality
  const getUpcomingDates = (template) => {
    const dates = [];
    const startDate = new Date();
    
    for (let i = 1; i <= 10; i++) {
      const date = new Date(startDate);
      
      switch (template.interval_type) {
        case 'daily':
          date.setDate(date.getDate() + i);
          break;
        case 'weekly':
          date.setDate(date.getDate() + (i * 7));
          break;
        case 'monthly':
          date.setMonth(date.getMonth() + i);
          break;
        default:
          continue;
      }
      
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xxl"
      className="max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl">
              <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
          
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="small"
              onClick={handleGenerateRecurring}
              loading={isGenerating}
              className="bg-gradient-to-r from-primary-500 to-primary-600"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              {t('transactions.generateNow')}
            </Button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 px-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Income</p>
                <p className="text-lg font-semibold text-green-600">{formatAmount(totals.income)}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Expenses</p>
                <p className="text-lg font-semibold text-red-600">{formatAmount(totals.expense)}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Net Impact</p>
                <p className={`text-lg font-semibold ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmount(totals.net)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 px-6">
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

        {/* Template Groups */}
        <div className="flex-1 overflow-y-auto px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchTerm || filterType !== 'all' 
                  ? t('transactions.noMatchingTemplates')
                  : t('transactions.noRecurringTemplates')
                }
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm">
                {t('transactions.createRecurringNote')}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTemplates).map(([frequency, items]) => {
                if (items.length === 0) return null;
                
                const isExpanded = expandedGroups[frequency] !== false;
                
                return (
                  <Card key={frequency} className="overflow-hidden">
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroup(frequency)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                          <Clock className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {t(`transactions.frequencies.${frequency}`)}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {items.length} {t('transactions.templates')}
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
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-gray-200 dark:border-gray-700"
                        >
                          <div className="p-4 space-y-4">
                            {items.map((template) => (
                              <div 
                                key={template.id} 
                                id={`template-${template.id}`} // ✅ ADD: ID for scrolling
                                className={cn(
                                  "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300",
                                  // ✅ ADD: Highlight if this is the focused transaction
                                  focusedTransaction && (
                                    template.id === focusedTransaction.template_id || 
                                    (focusedTransaction.is_template && template.id === focusedTransaction.id)
                                  ) && "ring-2 ring-primary-400 bg-primary-50/50 dark:bg-primary-900/20"
                                )}
                              >
                                {/* ✅ ADD: Focus indicator */}
                                {focusedTransaction && (
                                  template.id === focusedTransaction.template_id || 
                                  (focusedTransaction.is_template && template.id === focusedTransaction.id)
                                ) && (
                                  <div className="mb-3 p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                    <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300">
                                      <Info className="w-4 h-4" />
                                      <span className="text-sm font-medium">
                                        {t('transactions.recurringManager.focusedTemplate')}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Template Header */}
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      'p-2 rounded-lg',
                                      template.type === 'expense' 
                                        ? 'bg-red-100 dark:bg-red-900/30' 
                                        : 'bg-green-100 dark:bg-green-900/30'
                                    )}>
                                      {template.type === 'expense' ? (
                                        <TrendingDown className="w-5 h-5 text-red-600" />
                                      ) : (
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900 dark:text-white">
                                        {template.description}
                                      </h4>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {template.category_name}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                    <div className={cn(
                                      'text-xl font-bold',
                                      template.type === 'expense' ? 'text-red-600' : 'text-green-600'
                                    )}>
                                      {formatAmount(template.amount)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {formatAmount(calculateMonthlyImpact(template))}/month
                                    </div>
                                  </div>
                                </div>

                                {/* Template Status */}
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant={template.is_active ? "success" : "warning"}
                                      size="small"
                                    >
                                      {template.is_active ? (
                                        <>
                                          <Play className="w-3 h-3 mr-1" />
                                          {t('transactions.active')}
                                        </>
                                      ) : (
                                        <>
                                          <Pause className="w-3 h-3 mr-1" />
                                          {t('transactions.paused')}
                                        </>
                                      )}
                                    </Badge>
                                    
                                    <Badge variant="secondary" size="small">
                                      {template.occurrence_count || 0} {t('transactions.occurrences')}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Template Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-600">
                                  <div className="flex flex-col gap-3 flex-1">
                                    
                                    {/* Action Group: Schedule Management */}
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                      <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm">
                                        {t('transactions.scheduleManagement')}
                                      </h5>
                                      <div className="flex flex-wrap gap-2">
                                        <Button
                                          variant="ghost"
                                          size="small"
                                          onClick={() => setShowSkipDates(prev => ({
                                            ...prev,
                                            [template.id]: !prev[template.id]
                                          }))}
                                          className="text-blue-600 hover:bg-blue-100 flex items-center gap-2"
                                        >
                                          <CalendarIcon className="w-4 h-4" />
                                          <span>{t('transactions.skipSpecificDates')}</span>
                                        </Button>
                                        
                                        <Button
                                          variant="ghost"
                                          size="small"
                                          onClick={() => handleToggleActive(template)}
                                          loading={isUpdating}
                                          className={template.is_active 
                                            ? 'text-orange-600 hover:bg-orange-100' 
                                            : 'text-green-600 hover:bg-green-100'
                                          }
                                        >
                                          {template.is_active ? (
                                            <>
                                              <Pause className="w-4 h-4" />
                                              <span>{t('transactions.pauseTemplate')}</span>
                                            </>
                                          ) : (
                                            <>
                                              <Play className="w-4 h-4" />
                                              <span>{t('transactions.resumeTemplate')}</span>
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                        {template.is_active 
                                          ? t('transactions.scheduleActiveDescription')
                                          : t('transactions.schedulePausedDescription')
                                        }
                                      </p>
                                    </div>
                                    
                                    {/* Action Group: Template Management */}
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">
                                        {t('transactions.templateManagement')}
                                      </h5>
                                      <div className="flex flex-wrap gap-2">
                                        <Button
                                          variant="ghost"
                                          size="small"
                                          onClick={() => {
                                            onEdit?.(template);
                                            onClose();
                                          }}
                                          className="text-primary-600 hover:bg-primary-100 flex items-center gap-2"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                          <span>{t('transactions.editTemplate')}</span>
                                        </Button>
                                        
                                        <Button
                                          variant="ghost"
                                          size="small"
                                          onClick={() => {
                                            setSelectedTemplate(template);
                                            setShowDeleteModal(true);
                                          }}
                                          className="text-red-600 hover:bg-red-100 flex items-center gap-2"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          <span>{t('transactions.deleteTemplate')}</span>
                                        </Button>
                                      </div>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                        {t('transactions.templateManagementDescription')}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Skip Dates Interface */}
                                {showSkipDates[template.id] && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"
                                  >
                                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                                      {t('transactions.selectDatesToSkip')}
                                    </h5>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                                      {getUpcomingDates(template).map(date => (
                                        <button
                                          key={date}
                                          onClick={() => {
                                            const newDates = selectedSkipDates.includes(date)
                                              ? selectedSkipDates.filter(d => d !== date)
                                              : [...selectedSkipDates, date];
                                            setSelectedSkipDates(newDates);
                                          }}
                                          className={cn(
                                            'text-left p-2 rounded-lg transition-colors border text-sm',
                                            selectedSkipDates.includes(date)
                                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                                              : 'bg-white border-gray-200 hover:bg-gray-50'
                                          )}
                                        >
                                          {dateHelpers.format(date, 'MMM dd', language)}
                                        </button>
                                      ))}
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="small"
                                        onClick={() => {
                                          setShowSkipDates(prev => ({
                                            ...prev,
                                            [template.id]: false
                                          }));
                                          setSelectedSkipDates([]);
                                        }}
                                        className="flex-1"
                                      >
                                        {t('common.cancel')}
                                      </Button>
                                      <Button
                                        variant="primary"
                                        size="small"
                                        onClick={() => handleSkipDates(template.id, selectedSkipDates)}
                                        disabled={selectedSkipDates.length === 0}
                                        loading={isSkipping}
                                        className="flex-1"
                                      >
                                        {t('transactions.skipSelected')} ({selectedSkipDates.length})
                                      </Button>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Template Modal */}
      {selectedTemplate && (
        <DeleteTransaction
          transaction={selectedTemplate}
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedTemplate(null);
          }}
          onConfirm={handleDeleteTemplate}
          isTemplate={true}
        />
      )}
    </Modal>
  );
};

export default RecurringModal;