/**
 * RecurringModal Component - Enhanced UX & Better Organization
 * 
 * IMPROVEMENTS:
 * - Cleaner template organization with intuitive grouping
 * - Quick actions prominently displayed
 * - Simplified skip dates workflow
 * - Better visual hierarchy and information architecture
 * - Integrated with centralized icon system
 * - Mobile-optimized responsive design
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, RefreshCw, Calendar, Clock, Search, Filter, Info, 
  AlertCircle, Package, Pause, Play, Edit2, Trash2,
  ChevronDown, ChevronUp, Settings, CalendarX, Zap
} from 'lucide-react';

// ✅ NEW: Use centralized icon system
import { getIconComponent, getColorForCategory, getGradientForCategory } from '../../../config/categoryIcons';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { cn, dateHelpers } from '../../../utils/helpers';
import { Modal, Input, Badge, Button, Card } from '../../ui';
import DeleteTransaction from './DeleteTransaction';
import toast from 'react-hot-toast';
import { useRecurringTransactions, useTransactionTemplates } from '../../../hooks/useTransactions';

/**
 * RecurringModal - Production-Ready Recurring Transaction Manager
 * Provides comprehensive template management with intuitive UX
 */
const RecurringModal = ({
  isOpen,
  onClose,
  onEdit,
  onSuccess,
  focusedTransaction = null
}) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const isRTL = language === 'he';
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedTemplates, setExpandedTemplates] = useState({});
  const [showSkipModal, setShowSkipModal] = useState(null);
  const [selectedSkipDates, setSelectedSkipDates] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // ✅ FIX: Use templates hook instead of recurring transactions
  const {
    templates: rawTemplates,
    isLoading,
    error,
    updateTemplate,
    deleteTemplate,
    skipDates,
    isUpdating,
    isDeleting,
    isSkipping,
    refresh
  } = useTransactionTemplates();

  // ✅ FIX: Use recurring hook only for generation
  const { 
    generateRecurring, 
    isGenerating 
  } = useRecurringTransactions();

  // ✅ SIMPLIFIED: Clean template processing without monthly calculations
  const templates = useMemo(() => {
    if (!Array.isArray(rawTemplates)) {
      return [];
    }
    
    return rawTemplates.map(template => ({
      ...template,
      displayName: template.description || template.title || t('transactions.untitledTemplate'),
      categoryIcon: getIconComponent(template.category_icon || 'tag'),
      isActive: template.is_active !== false,
      nextPayment: getNextPaymentDate(template)
    }));
  }, [rawTemplates, t]);

  // ✅ NEW: Auto-focus functionality
  useEffect(() => {
    if (focusedTransaction && templates.length > 0) {
      const matchingTemplate = templates.find(template => 
        template.id === focusedTransaction.template_id || 
        (focusedTransaction.is_template && template.id === focusedTransaction.id)
      );
      
      if (matchingTemplate) {
        // Auto-expand focused template
        setExpandedTemplates(prev => ({
          ...prev,
          [matchingTemplate.id]: true
        }));
        
        // Clear filters to ensure visibility
        setFilterType('all');
        setSearchTerm('');
        
        // Scroll to template
        setTimeout(() => {
          const element = document.getElementById(`template-${matchingTemplate.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }
    }
  }, [focusedTransaction, templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let filtered = [...templates];
    
    if (filterType !== 'all') {
      filtered = filtered.filter(template => template.type === filterType);
    }
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(template => 
        template.displayName.toLowerCase().includes(search) ||
        template.category_name?.toLowerCase().includes(search)
      );
    }
    
    return filtered.sort((a, b) => {
      // Sort by active status first, then by creation date
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [templates, filterType, searchTerm]);

  // ✅ SIMPLIFIED: Basic template counts only
  const templateCounts = useMemo(() => {
    const activeTemplates = filteredTemplates.filter(t => t.isActive);
    
    return { 
      totalTemplates: filteredTemplates.length,
      activeTemplates: activeTemplates.length,
      pausedTemplates: filteredTemplates.length - activeTemplates.length
    };
  }, [filteredTemplates]);

  // ✅ UTILITY: Get next payment date
  function getNextPaymentDate(template) {
    if (template.next_occurrence || template.next_recurrence_date) {
      return template.next_occurrence || template.next_recurrence_date;
    }
    
    // Calculate next date
    const today = new Date();
    const nextDate = new Date(today);
    
    switch (template.interval_type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        return null;
    }
    
    return nextDate.toISOString().split('T')[0];
  }

  // ✅ HANDLERS: Template operations
  const handleToggleActive = async (template) => {
    try {
      await updateTemplate(template.id, {
        is_active: !template.isActive
      });
      
      toast.success(template.isActive ? t('transactions.paused') : t('transactions.resumed'));
      refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleQuickSkip = async (template) => {
    if (!template.nextPayment) {
      toast.error(t('transactions.noNextPayment'));
      return;
    }
    
    try {
      await skipDates(template.id, [template.nextPayment]);
      toast.success(t('transactions.nextPaymentSkipped'));
      refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleBulkSkip = async (templateId, dates) => {
    try {
      await skipDates(templateId, dates);
      toast.success(t('transactions.skipDates.success'));
      setShowSkipModal(null);
      setSelectedSkipDates([]);
      refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(t('transactions.skipDates.error'));
    }
  };

  const handleDelete = async (template, deleteFuture = false) => {
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
    
    for (let i = 1; i <= 12; i++) {
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

  const toggleTemplateExpansion = (templateId) => {
    setExpandedTemplates(prev => ({
      ...prev,
      [templateId]: !prev[templateId]
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
        
        {/* ✅ ENHANCED: Header with better info hierarchy */}
        <div className="flex items-center justify-between gap-4 mb-6 p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('transactions.recurringManager.title')}
              </h2>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-gray-600 dark:text-gray-400">
                  {t('transactions.recurringManager.subtitle')}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="small">
                    {templateCounts.activeTemplates}/{templateCounts.totalTemplates} {t('transactions.active')}
                  </Badge>
                  {templateCounts.pausedTemplates > 0 && (
                    <Badge variant="warning" size="small">
                      {templateCounts.pausedTemplates} {t('transactions.paused')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="small"
              onClick={handleGenerateRecurring}
              loading={isGenerating}
              className="bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg hover:shadow-xl"
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

        {/* ✅ IMPROVED: Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 px-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder={t('transactions.searchTemplates')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            {['all', 'income', 'expense'].map(type => (
              <Button
                key={type}
                variant={filterType === type ? "primary" : "outline"}
                size="default"
                onClick={() => setFilterType(type)}
                className="whitespace-nowrap"
              >
                {type === 'all' && (
                  <>
                    <Filter className="w-4 h-4 mr-2" />
                    {t('transactions.all')}
                  </>
                )}
                {type === 'income' && (
                  <>
                    {React.createElement(getIconComponent('trending-up'), { className: 'w-4 h-4 mr-2' })}
                    {t('transactions.income')}
                  </>
                )}
                {type === 'expense' && (
                  <>
                    {React.createElement(getIconComponent('trending-down'), { className: 'w-4 h-4 mr-2' })}
                    {t('transactions.expense')}
                  </>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* ✅ MAIN: Template list */}
        <div className="flex-1 overflow-y-auto px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('transactions.recurringManager.loadError')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm mb-4">
                {error.message || t('transactions.recurringManager.loadErrorDescription')}
              </p>
              <Button onClick={refresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('common.retry')}
              </Button>
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
            <div className="space-y-4">
              <AnimatePresence>
                {filteredTemplates.map((template, index) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    index={index}
                    isExpanded={expandedTemplates[template.id]}
                    onToggleExpansion={() => toggleTemplateExpansion(template.id)}
                    onEdit={() => {
                      onEdit?.(template);
                      onClose();
                    }}
                    onDelete={() => {
                      setSelectedTemplate(template);
                      setShowDeleteModal(true);
                    }}
                    onToggleActive={() => handleToggleActive(template)}
                    onQuickSkip={() => handleQuickSkip(template)}
                    onBulkSkip={(dates) => handleBulkSkip(template.id, dates)}
                    onShowSkipModal={() => setShowSkipModal(template.id)}
                    isHighlighted={focusedTransaction && (
                      template.id === focusedTransaction.template_id || 
                      (focusedTransaction.is_template && template.id === focusedTransaction.id)
                    )}
                    isUpdating={isUpdating}
                    isSkipping={isSkipping}
                    t={t}
                    formatAmount={formatAmount}
                    language={language}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      
      {/* ✅ ENHANCED: Skip Dates Modal */}
      <AnimatePresence>
        {showSkipModal && (
          <SkipDatesModal
            template={filteredTemplates.find(t => t.id === showSkipModal)}
            isOpen={!!showSkipModal}
            onClose={() => {
              setShowSkipModal(null);
              setSelectedSkipDates([]);
            }}
            onConfirm={(dates) => handleBulkSkip(showSkipModal, dates)}
            isSkipping={isSkipping}
            getUpcomingDates={getUpcomingDates}
            t={t}
            language={language}
          />
        )}
      </AnimatePresence>

      {/* Delete Template Modal */}
      {selectedTemplate && (
        <DeleteTransaction
          transaction={selectedTemplate}
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedTemplate(null);
          }}
          onConfirm={handleDelete}
          isTemplate={true}
        />
      )}
    </Modal>
  );
};

// ✅ COMPONENT: Individual Template Card
const TemplateCard = ({
  template,
  index,
  isExpanded,
  isHighlighted,
  onToggleExpansion,
  onEdit,
  onDelete,
  onToggleActive,
  onQuickSkip,
  onShowSkipModal,
  isUpdating,
  isSkipping,
  t,
  formatAmount,
  language
}) => {
  const CategoryIcon = template.categoryIcon;
  
  return (
    <motion.div
      id={`template-${template.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300",
        isHighlighted 
          ? "ring-2 ring-primary-400 bg-primary-50/50 dark:bg-primary-900/20 border-primary-300"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      )}
    >
      {/* Template Header */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Icon & Status */}
            <div className="relative">
              <div className={cn(
                'p-3 rounded-xl shadow-sm',
                getColorForCategory(template.type)
              )}>
                <CategoryIcon className="w-6 h-6" />
              </div>
              {!template.isActive && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                  <Pause className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
            
            {/* Template Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {template.displayName}
                </h3>
                {isHighlighted && (
                  <Badge variant="primary" size="small">
                    <Info className="w-3 h-3 mr-1" />
                    {t('transactions.focused')}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  {React.createElement(getIconComponent('tag'), { className: 'w-3 h-3' })}
                  {template.category_name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t(`actions.frequencies.${template.interval_type}`)}
                </span>
                {template.nextPayment && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {dateHelpers.format(template.nextPayment, 'MMM dd', language)}
                  </span>
                )}
              </div>
            </div>
            
            {/* ✅ SIMPLIFIED: Amount only */}
            <div className="text-right">
              <div className={cn(
                'text-xl font-bold',
                template.type === 'expense' ? 'text-red-600' : 'text-green-600'
              )}>
                {formatAmount(template.amount)}
              </div>
              <div className="text-xs text-gray-500">
                {t(`actions.frequencies.${template.interval_type}`)}
              </div>
            </div>
          </div>
          
          {/* Expand Button */}
          <Button
            variant="ghost"
            size="small"
            onClick={onToggleExpansion}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        </div>
      </div>
      
      {/* Expanded Actions */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100 dark:border-gray-700"
          >
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Edit Template */}
                <Button
                  variant="outline"
                  size="small"
                  onClick={onEdit}
                  className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 justify-start"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">{t('transactions.editTemplate')}</div>
                    <div className="text-xs opacity-75">{t('transactions.editTemplateDesc')}</div>
                  </div>
                </Button>

                {/* Toggle Active/Pause */}
                <Button
                  variant="outline"
                  size="small"
                  onClick={onToggleActive}
                  loading={isUpdating}
                  className={cn(
                    "justify-start",
                    template.isActive 
                      ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                      : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  )}
                >
                  {template.isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  <div className="text-left">
                    <div className="font-medium">
                      {template.isActive ? t('transactions.pauseTemplate') : t('transactions.resumeTemplate')}
                    </div>
                    <div className="text-xs opacity-75">
                      {template.isActive ? t('transactions.pauseDesc') : t('transactions.resumeDesc')}
                    </div>
                  </div>
                </Button>

                {/* Skip Next */}
                <Button
                  variant="outline"
                  size="small"
                  onClick={onQuickSkip}
                  loading={isSkipping}
                  disabled={!template.isActive || !template.nextPayment}
                  className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 justify-start"
                >
                  <CalendarX className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">{t('transactions.skipNext')}</div>
                    <div className="text-xs opacity-75">{t('transactions.skipNextDesc')}</div>
                  </div>
                </Button>

                {/* Manage Dates */}
                <Button
                  variant="outline"
                  size="small"
                  onClick={onShowSkipModal}
                  className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 justify-start"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">{t('transactions.manageDates')}</div>
                    <div className="text-xs opacity-75">{t('transactions.manageDatesDesc')}</div>
                  </div>
                </Button>
              </div>
              
              {/* Delete Button - Separate row */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <Button
                  variant="ghost"
                  size="small"
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('transactions.deleteTemplate')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ✅ COMPONENT: Skip Dates Modal
const SkipDatesModal = ({
  template,
  isOpen,
  onClose,
  onConfirm,
  isSkipping,
  getUpcomingDates,
  t,
  language
}) => {
  const [selectedDates, setSelectedDates] = useState([]);
  
  if (!template) return null;
  
  const upcomingDates = getUpcomingDates(template);
  
  const toggleDate = (date) => {
    setSelectedDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };
  
  const handleConfirm = () => {
    onConfirm(selectedDates);
    setSelectedDates([]);
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('transactions.skipSpecificDates')}
      size="large"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            {template.displayName}
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {t('transactions.skipDatesExplanation')}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t('transactions.selectDatesToSkip')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {upcomingDates.map(date => (
              <button
                key={date}
                onClick={() => toggleDate(date)}
                className={cn(
                  'text-left p-3 rounded-lg transition-all border-2',
                  selectedDates.includes(date)
                    ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-200 bg-white dark:bg-gray-800'
                )}
              >
                <div className="font-medium">
                  {dateHelpers.format(date, 'MMM dd', language)}
                </div>
                <div className="text-xs text-gray-500">
                  {dateHelpers.format(date, 'EEEE', language)}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={selectedDates.length === 0}
            loading={isSkipping}
            className="flex-1"
          >
            {t('transactions.skipSelected')} ({selectedDates.length})
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RecurringModal;