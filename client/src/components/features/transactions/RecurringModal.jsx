/**
 * RecurringModal Component - BEAUTIFUL GRADIENT DESIGN MATCHING TRANSACTIONS PAGE
 * 
 * ✅ ENHANCED: Beautiful gradient header with animations like Transactions page
 * ✅ INTEGRATED: Search and filters in the gorgeous purple header
 * ✅ PRESERVED: All existing functionality and responsive design
 * ✅ CONSISTENT: Same visual vibe and theme as main Transactions page
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, RefreshCw, Calendar, Clock, Search, Filter, Info, 
  AlertCircle, Package, Pause, Play, Edit2, Trash2,
  ChevronDown, ChevronUp, Settings, CalendarX, Zap, Sparkles, Activity
} from 'lucide-react';

// ✅ PRESERVED: Use centralized icon system
import { getIconComponent, getColorForCategory, getGradientForCategory } from '../../../config/categoryIcons';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { cn, dateHelpers } from '../../../utils/helpers';
import { Button, Badge, Card } from '../../ui';
import DeleteTransaction from './DeleteTransaction';
import useToast from '../../../hooks/useToast';
import { useRecurringTransactions, useTransactionTemplates } from '../../../hooks/useTransactions';

/**
 * ✅ FIXED: RecurringModal with proper sizing and responsive design
 */
const RecurringModal = ({
  onClose,
  onEdit,
  onSuccess,
  focusedTransaction = null
}) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const toastService = useToast();
  const isRTL = language === 'he';
  
  // ✅ PRESERVED: State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedTemplates, setExpandedTemplates] = useState({});
  const [showSkipModal, setShowSkipModal] = useState(null);
  const [selectedSkipDates, setSelectedSkipDates] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // ✅ FIXED: Use both hooks to get all recurring data
  const {
    templates: rawTemplates,
    isLoading: templatesLoading,
    error: templatesError,
    updateTemplate,
    skipDates,
    deleteTemplate,
    isUpdating,
    isSkipping,
    isDeleting,
    refresh: refreshTemplates
  } = useTransactionTemplates();

  const { 
    recurringTransactions: rawRecurring,
    isLoading: recurringLoading,
    error: recurringError,
    generateRecurring,
    isGenerating,
    refresh: refreshRecurring
  } = useRecurringTransactions();

  // ✅ FIXED: Combine both data sources for complete view
  const allRecurringData = useMemo(() => {
    const templates = Array.isArray(rawTemplates) ? rawTemplates : [];
    const recurring = Array.isArray(rawRecurring) ? rawRecurring : [];
    
    console.log('🔄 [RECURRING-MODAL] Raw data:', {
      templates: templates.length,
      recurring: recurring.length,
      templatesData: templates,
      recurringData: recurring
    });
    
    // Combine and deduplicate
    const combined = [...templates, ...recurring];
    const uniqueData = combined.filter((item, index, arr) => 
      arr.findIndex(t => t.id === item.id) === index
    );
    
    return uniqueData.map(item => ({
      ...item,
      displayName: item.description || item.title || item.name || t('transactions.untitledTemplate'),
      categoryIcon: getIconComponent(item.category_icon || 'tag'),
      isActive: item.is_active !== false,
      nextPayment: getNextPaymentDate(item),
      amount: parseFloat(item.amount) || 0,
      intervalType: item.interval_type || item.recurring_interval || 'monthly',
      categoryName: item.category_name || t('common.uncategorized'),
      isTemplate: Boolean(item.interval_type || item.recurring_interval)
    }));
  }, [rawTemplates, rawRecurring, t]);

  // ✅ ENHANCED: Better filtering
  const filteredTemplates = useMemo(() => {
    let filtered = allRecurringData;
    
    // Filter by type
    if (filterType === 'active') {
      filtered = filtered.filter(t => t.isActive);
    } else if (filterType === 'paused') {
      filtered = filtered.filter(t => !t.isActive);
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(template => 
        template.displayName?.toLowerCase().includes(searchLower) ||
        template.categoryName?.toLowerCase().includes(searchLower) ||
        template.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });
  }, [allRecurringData, filterType, searchTerm]);

  // ✅ ENHANCED: Template statistics
  const templateStats = useMemo(() => {
    const activeTemplates = allRecurringData.filter(t => t.isActive);
    const totalAmount = allRecurringData.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    const activeAmount = activeTemplates.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    
    return { 
      total: allRecurringData.length,
      active: activeTemplates.length,
      paused: allRecurringData.length - activeTemplates.length,
      totalAmount,
      activeAmount
    };
  }, [allRecurringData]);

  // ✅ ENHANCED: Better next payment date calculation with validation
  function getNextPaymentDate(template) {
    if (!template) return null;
    
    // Use existing next occurrence if available
    if (template.next_occurrence || template.next_recurrence_date) {
      return template.next_occurrence || template.next_recurrence_date;
    }
    
    // Calculate next date based on interval
    try {
      const today = new Date();
      const nextDate = new Date(today);
      
      switch (template.interval_type || template.recurring_interval) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
        default:
          return null;
      }
      
      return nextDate.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Error calculating next payment date:', error);
      return null;
    }
  }

  // ✅ ENHANCED: Template operation handlers with better error handling
  const handleToggleActive = async (template) => {
    if (!template?.id) {
      toastService.error('toast.error.formErrors');
      return;
    }
    
    try {
      await updateTemplate(template.id, {
        is_active: !template.isActive
      });
      
      toastService.success(template.isActive ? 'toast.success.nextPaymentSkipped' : 'toast.success.transactionGenerated');
      refreshTemplates();
      refreshRecurring();
    } catch (error) {
      console.error('Toggle active failed:', error);
      // ✅ FIX: Better error handling
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to toggle template status';
      toastService.error(errorMessage);
    }
  };

  const handleQuickSkip = async (template) => {
    if (!template?.id) {
      toastService.error('toast.error.formErrors');
      return;
    }
    
    try {
      await skipDates(template.id, [getNextPaymentDate(template)]);
      toastService.success('toast.success.skipDatesSuccess');
      refreshTemplates();
      refreshRecurring();
    } catch (error) {
      console.error('Quick skip failed:', error);
      // ✅ FIX: Better error handling
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to skip next payment';
      toastService.error(errorMessage);
    }
  };

  const handleBulkSkip = async (templateId, dates) => {
    if (!templateId || !dates?.length) {
      toastService.error('toast.error.formErrors');
      return;
    }
    
    try {
      await skipDates(templateId, dates);
      toastService.success('toast.success.skipDatesSuccess');
      setSelectedSkipDates([]);
      setShowSkipModal(null);
      refreshTemplates();
      refreshRecurring();
    } catch (error) {
      console.error('Bulk skip failed:', error);
      // ✅ FIX: Better error handling
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to skip selected dates';
      toastService.error(errorMessage);
    }
  };

  const handleGenerateRecurring = async () => {
    try {
      await generateRecurring();
      toastService.success('toast.success.transactionGenerated');
      refreshTemplates();
      refreshRecurring();
    } catch (error) {
      console.error('Generate recurring failed:', error);
      // ✅ FIX: Better error handling
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to generate recurring transactions';
      toastService.error(errorMessage);
    }
  };

  const refreshAll = () => {
    refreshTemplates();
    refreshRecurring();
  };

  const isLoading = templatesLoading || recurringLoading;
  const error = templatesError || recurringError;

  // ✅ ENHANCED: Get upcoming dates for skip functionality
  const getUpcomingDates = (template) => {
    if (!template?.intervalType) return [];
    
    const dates = [];
    const startDate = new Date();
    
    try {
      for (let i = 1; i <= 12; i++) {
        const date = new Date(startDate);
        
        switch (template.intervalType) {
          case 'daily':
            date.setDate(date.getDate() + i);
            break;
          case 'weekly':
            date.setDate(date.getDate() + (i * 7));
            break;
          case 'monthly':
            date.setMonth(date.getMonth() + i);
            break;
          case 'yearly':
            date.setFullYear(date.getFullYear() + i);
            break;
          default:
            continue;
        }
        
        dates.push(date.toISOString().split('T')[0]);
      }
    } catch (error) {
      console.warn('Error generating upcoming dates:', error);
    }
    
    return dates;
  };

  const toggleTemplateExpansion = (templateId) => {
    setExpandedTemplates(prev => ({
      ...prev,
      [templateId]: !prev[templateId]
    }));
  };

  // ✅ FIXED: Auto-focus on specific transaction
  useEffect(() => {
    if (focusedTransaction) {
      const templateId = focusedTransaction.template_id || 
        (focusedTransaction.is_template && focusedTransaction.id);
      
      if (templateId) {
        setExpandedTemplates(prev => ({
          ...prev,
          [templateId]: true
        }));
        
        setTimeout(() => {
          const element = document.getElementById(`template-${templateId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }
    }
  }, [focusedTransaction]);

  return (
    <>
      {/* ✅ ENHANCED: Beautiful modal overlay matching Transactions page */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        
        {/* ✅ ENHANCED: Modal with beautiful gradient header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          
          {/* 🎨 UNIFIED DESIGN SYSTEM: Enterprise modal header */}
          <div className="flex-none modal-header-primary">
            {/* ✨ UNIFIED: Systematic floating orb pattern */}
            <div className="floating-orb-primary floating-orb-top-right animate-float-gentle"></div>
            <div className="floating-orb-secondary floating-orb-bottom-left animate-float-gentle"></div>
            <div className="floating-orb-accent floating-orb-center animate-float-gentle"></div>
            
            {/* 💫 UNIFIED: Professional decoration pattern */}
            <div className="modal-decoration-sparkles"></div>
            
            <div className="relative z-10 p-4">
              {/* ✅ REDUCED: Compact header with title and close button */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-lg lg:text-xl font-bold flex items-center gap-2">
                      {t('nav.recurringManager') || 'Recurring Manager'}
                      <Sparkles className="w-4 h-4" />
                    </h1>
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <Clock className="w-3 h-3" />
                      <span>
                        {templateStats.total} {t('transactions.templates')} • {templateStats.active} {t('transactions.active')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* ✅ REDUCED: Smaller close button */}
                <button
                  onClick={onClose}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ✅ REDUCED: Compact search and filters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                {/* Compact Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="text"
                    placeholder={t('transactions.searchTemplates') || 'Search recurring templates...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:bg-white/30 focus:border-white/50 transition-all backdrop-blur-sm text-sm"
                  />
                </div>

                {/* Compact Filter and Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 justify-between">
                  {/* Filter Buttons */}
                  <div className="flex gap-1.5">
                    {[
                      { key: 'all', label: t('common.all') || 'All', icon: Package },
                      { key: 'active', label: t('transactions.activeOnly') || 'Active', icon: Play },
                      { key: 'paused', label: t('transactions.pausedOnly') || 'Paused', icon: Pause }
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setFilterType(key)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all backdrop-blur-sm ${
                          filterType === key
                            ? 'bg-white/30 text-white shadow-sm'
                            : 'bg-white/10 text-white/80 hover:text-white hover:bg-white/20'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1.5">
                    <Button
                      onClick={handleGenerateRecurring}
                      loading={isGenerating}
                      size="small"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm text-xs"
                    >
                      <Zap className="w-3 h-3 mr-1.5" />
                      <span className="hidden sm:inline">{t('transactions.generate')}</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={refreshAll}
                      loading={isLoading}
                      size="small"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* ✅ PRESERVED: Content area with proper scrolling */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <motion.div 
                    className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <p className="text-gray-600 dark:text-gray-400">{t('transactions.loadingTemplates') || 'Loading templates...'}</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('common.error') || 'Error Loading Templates'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm mb-4">
                  {error.message || t('common.errorDescription') || 'An error occurred while loading templates'}
                </p>
                <Button onClick={refreshAll} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t('common.retry') || 'Retry'}
                </Button>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Package className="w-12 h-12 text-gray-400 mb-4" />
                </motion.div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchTerm || filterType !== 'all' 
                    ? (t('transactions.noMatchingTemplates') || 'No Matching Templates')
                    : (t('transactions.noRecurringTemplates') || 'No Recurring Templates')
                  }
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm">
                  {t('transactions.createRecurringNote') || 'Create recurring templates to automate your transactions'}
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto h-full p-4">
                <div className="space-y-3">
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
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      {/* ✅ PRESERVED: All existing modals */}
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

      {selectedTemplate && (
        <DeleteTransaction
          transaction={selectedTemplate}
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedTemplate(null);
          }}
          onConfirm={async (template, options = {}) => {
            try {
              console.log('🗑️ [RECURRING-MODAL] Deleting template:', template.id, 'Options:', options);
              
              // ✅ FIX: Handle different deletion strategies properly
              let deleteFuture = false; // Default: keep existing transactions
              
              if (options.deleteAll && options.deleteFuture) {
                // Delete template AND all future transactions
                deleteFuture = true;
              } else if (options.deleteFuture) {
                // Stop recurring from now (delete future only)
                deleteFuture = true;
              } else {
                // Default: Just deactivate template, keep existing transactions
                deleteFuture = false;
              }
              
              console.log('🗑️ [RECURRING-MODAL] Final deleteFuture:', deleteFuture);
              await deleteTemplate(template.id, deleteFuture);
              
              toastService.success('toast.success.templateDeleted');
              
              setShowDeleteModal(false);
              setSelectedTemplate(null);
              refreshAll();
              onSuccess?.();
            } catch (error) {
              console.error('❌ [RECURRING-MODAL] Delete failed:', error);
              // ✅ FIX: Better error handling - use error message or fallback
              const errorMessage = error?.message || error?.response?.data?.message || 'Failed to delete template';
              toastService.error(errorMessage);
            }
          }}
          isTemplate={true}
        />
      )}
    </>
  );
};

// ✅ ENHANCED: Template Card with better visual consistency
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
        "bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300 shadow-sm hover:shadow-md",
        isHighlighted 
          ? "ring-2 ring-purple-500 border-purple-300 dark:border-purple-600 shadow-lg bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
        !template.isActive && "opacity-75 bg-gray-50 dark:bg-gray-700"
      )}
    >
      {/* Main template info */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Left side - Icon and details */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className={cn(
              "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
              template.amount < 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30"
            )}>
              <CategoryIcon className={cn(
                "w-5 h-5",
                template.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {template.displayName}
                </h3>
                
                {!template.isActive && (
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                    <Pause className="w-3 h-3 mr-1" />
                    {t('transactions.paused')}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                <span>{template.categoryName}</span>
                <span>•</span>
                <span>{template.intervalType}</span>
                {template.nextPayment && (
                  <>
                    <span>•</span>
                    <span>{t('transactions.next')}: {dateHelpers.format(new Date(template.nextPayment), 'MMM dd', language)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Right side - Amount and expand button */}
          <div className="flex items-center space-x-3">
            <div className={cn(
              "text-right text-sm font-semibold",
              template.amount < 0 ? 'text-red-600' : 'text-green-600'
            )}>
              {formatAmount(Math.abs(template.amount))}
            </div>
            
            <button
              onClick={onToggleExpansion}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* ✅ ENHANCED: Responsive expanded actions */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
              {/* 🚀 UNIFIED RESPONSIVE ACTION BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <Button
                  variant="outline"
                  size="small"
                  onClick={onEdit}
                  className="w-full justify-start bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">{t('transactions.editTemplate')}</div>
                    <div className="text-xs opacity-75 hidden sm:block">{t('transactions.editTemplateDesc')}</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  size="small"
                  onClick={onToggleActive}
                  loading={isUpdating}
                  className={cn(
                    "w-full justify-start",
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
                    <div className="text-xs opacity-75 hidden sm:block">
                      {template.isActive ? t('transactions.pauseDesc') : t('transactions.resumeDesc')}
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  size="small"
                  onClick={onQuickSkip}
                  loading={isSkipping}
                  disabled={!template.isActive || !template.nextPayment}
                  className="w-full justify-start bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                >
                  <CalendarX className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">{t('transactions.skipNext')}</div>
                    <div className="text-xs opacity-75 hidden sm:block">{t('transactions.skipNextDesc')}</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  size="small"
                  onClick={onShowSkipModal}
                  className="w-full justify-start bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">{t('transactions.manageDates')}</div>
                    <div className="text-xs opacity-75 hidden sm:block">{t('transactions.manageDatesDesc')}</div>
                  </div>
                </Button>
              </div>
              
              {/* Delete Button - Separate row */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
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

// ✅ ENHANCED: Skip Dates Modal Component
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

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
      >
        {/* 🎨 UNIFIED: Secondary modal header with consistent design */}
        <div className="modal-header-secondary p-4">
          <div className="floating-orb-secondary floating-orb-top-right animate-float-gentle"></div>
          <div className="modal-decoration-waves"></div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CalendarX className="w-5 h-5" />
                {t('transactions.skipDates.title') || 'Skip Dates'}
              </h3>
              <p className="text-purple-100 text-sm mt-1">
                {template.displayName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-purple-200 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('transactions.skipDates.description') || 'Select dates to skip'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-6 max-h-64 overflow-y-auto">
            {upcomingDates.map((date) => (
              <label
                key={date}
                className={cn(
                  "flex items-center p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedDates.includes(date)
                    ? "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-600 dark:text-purple-300"
                    : "bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedDates.includes(date)}
                  onChange={() => toggleDate(date)}
                  className="mr-2 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm">
                  {dateHelpers.formatDate(new Date(date), language)}
                </span>
              </label>
            ))}
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={() => onConfirm(selectedDates)}
              loading={isSkipping}
              disabled={selectedDates.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {t('transactions.skipSelected') || 'Skip Selected'} ({selectedDates.length})
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RecurringModal;