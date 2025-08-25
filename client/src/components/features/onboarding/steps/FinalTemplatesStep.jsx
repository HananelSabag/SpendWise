/**
 * 🎯 FINAL TEMPLATES STEP - Clean & Intuitive UX
 * Smart recurring templates with auto-selection on amount entry
 * Features: Ready templates, quick custom creation, mobile-optimized
 * @version 5.0.0 - Complete UX redesign
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Briefcase, Home, Smartphone, Heart, Music, Car,
  DollarSign, CreditCard, Utensils, Zap, Wifi, Shield, 
  ShoppingCart, Coffee, Fuel, Book, Dumbbell, Baby,
  Plus, TrendingUp, TrendingDown, Sparkles, Info
} from 'lucide-react';
import { useCurrency, useTranslation } from '../../../../stores';
import { Button, Input } from '../../../ui';
import { cn } from '../../../../utils/helpers';

const FinalTemplatesStep = ({ 
  data = {}, 
  onDataUpdate, 
  onNext, 
  onBack 
}) => {
  const { formatCurrency } = useCurrency();
  const { t, isRTL } = useTranslation('onboarding');
  
  // State
  const [selectedTemplates, setSelectedTemplates] = useState(data.selectedTemplates || []);
  const [activeCategory, setActiveCategory] = useState('income');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTemplate, setCustomTemplate] = useState({ name: '', amount: '', icon: DollarSign });

  // Smart template suggestions - focused on common recurring items
  const templates = {
    income: [
      { id: 'salary', name: 'Monthly Salary', icon: Briefcase, commonAmount: null },
      { id: 'freelance', name: 'Freelance Work', icon: DollarSign, commonAmount: null },
      { id: 'side-business', name: 'Side Business', icon: Briefcase, commonAmount: null },
    ],
    expenses: [
      { id: 'rent', name: 'Rent/Mortgage', icon: Home, commonAmount: null },
      { id: 'utilities', name: 'Utilities (Electric, Water)', icon: Zap, commonAmount: null },
      { id: 'phone', name: 'Phone & Internet', icon: Smartphone, commonAmount: null },
      { id: 'groceries', name: 'Weekly Groceries', icon: ShoppingCart, commonAmount: null },
      { id: 'insurance', name: 'Insurance', icon: Shield, commonAmount: null },
      { id: 'gym', name: 'Gym Membership', icon: Dumbbell, commonAmount: null },
      { id: 'subscriptions', name: 'Streaming Services', icon: Music, commonAmount: null },
      { id: 'coffee', name: 'Coffee/Daily Treats', icon: Coffee, commonAmount: null },
    ]
  };

  const currentTemplates = templates[activeCategory] || [];

  // Add or update template
  const handleTemplateAmountChange = useCallback((template, amount) => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0) {
      const newTemplate = {
        ...template,
        amount: numAmount,
        type: activeCategory === 'income' ? 'income' : 'expense',
        id: template.id || `custom-${Date.now()}`
      };

      const newSelected = [
        ...selectedTemplates.filter(t => t.id !== template.id), 
        newTemplate
      ];
      setSelectedTemplates(newSelected);
      console.log('🎯 FinalTemplatesStep: Updating templates data:', { selectedTemplates: newSelected });
      onDataUpdate({ selectedTemplates: newSelected });
    } else {
      // Remove if amount is cleared or invalid
      const newSelected = selectedTemplates.filter(t => t.id !== template.id);
      setSelectedTemplates(newSelected);
      onDataUpdate({ selectedTemplates: newSelected });
    }
  }, [selectedTemplates, activeCategory, onDataUpdate]);

  // Remove template
  const removeTemplate = useCallback((templateId) => {
    const newSelected = selectedTemplates.filter(t => t.id !== templateId);
    setSelectedTemplates(newSelected);
    onDataUpdate({ selectedTemplates: newSelected });
  }, [selectedTemplates, onDataUpdate]);

  // Add custom template
  const addCustomTemplate = useCallback(() => {
    if (customTemplate.name.trim() && customTemplate.amount && parseFloat(customTemplate.amount) > 0) {
      const newTemplate = {
        id: `custom-${Date.now()}`,
        name: customTemplate.name.trim(),
        icon: customTemplate.icon,
        amount: parseFloat(customTemplate.amount),
        type: activeCategory === 'income' ? 'income' : 'expense',
        isCustom: true
      };

      const newSelected = [...selectedTemplates, newTemplate];
      setSelectedTemplates(newSelected);
      console.log('🎯 FinalTemplatesStep: Adding custom template:', newTemplate);
      console.log('🎯 FinalTemplatesStep: New selected templates:', newSelected);
      onDataUpdate({ selectedTemplates: newSelected });
      
      // Reset form
      setCustomTemplate({ name: '', amount: '', icon: DollarSign });
      setShowCustomForm(false);
    }
  }, [customTemplate, activeCategory, selectedTemplates, onDataUpdate]);

  // Quick template card component
  const TemplateCard = ({ template }) => {
    const [amount, setAmount] = useState('');
    const isSelected = selectedTemplates.some(t => t.id === template.id);
    const selectedTemplate = selectedTemplates.find(t => t.id === template.id);
    const Icon = template.icon;
    const isIncome = activeCategory === 'income';
    const inputRef = useRef(null);

    // Auto-focus on amount input when card becomes active
    const handleCardClick = () => {
      if (!isSelected && inputRef.current) {
        inputRef.current.focus();
      }
    };

    const handleAmountChange = (value) => {
      setAmount(value);
      // Don't auto-select while typing - let user finish entering amount
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && amount && parseFloat(amount) > 0) {
        handleTemplateAmountChange(template, amount);
        e.target.blur(); // Remove focus to show completed state
      }
    };

    const handleBlur = () => {
      // Auto-select when user finishes typing (loses focus) and amount is valid
      if (amount && parseFloat(amount) > 0) {
        handleTemplateAmountChange(template, amount);
      }
    };

    return (
      <motion.div
        layout
        onClick={handleCardClick}
        className={cn(
          "relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
          "hover:shadow-md active:scale-[0.98] touch-manipulation",
          isSelected
            ? cn(
                "border-green-500 shadow-green-100 dark:shadow-green-900/20",
                isIncome 
                  ? "bg-green-50 dark:bg-green-900/10" 
                  : "bg-red-50 dark:bg-red-900/10"
              )
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
      >
        {/* Template Header */}
        <div className="flex items-center space-x-3 mb-3">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
            isSelected
              ? cn(
                  isIncome 
                    ? "bg-green-500 text-white" 
                    : "bg-red-500 text-white"
                )
              : cn(
                  isIncome 
                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                    : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                )
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {template.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isIncome ? t('templates.categories.income') : t('templates.categories.essential')}
            </p>
          </div>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center space-x-2"
            >
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Amount Input or Display */}
        <AnimatePresence mode="wait">
          {isSelected ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="text-center">
                <span className={cn(
                  "text-2xl font-bold",
                  isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  {isIncome ? '+' : '-'}{formatCurrency(selectedTemplate.amount)}
                </span>
              </div>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTemplate(template.id);
                }}
                size="sm"
                variant="outline"
                className="w-full text-xs"
              >
                {t('templates.remove', 'Remove')}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Input
                ref={inputRef}
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder={t('templates.enterAmount', 'Enter amount')}
                className="text-center text-lg font-medium"
                min="0"
                step="0.01"
                onClick={(e) => e.stopPropagation()}
              />
              <p className="text-xs text-gray-400 text-center mt-2">
                {t('templates.autoSelect', 'Press Enter or click away to select')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Custom template form
  const CustomTemplateForm = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700"
    >
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
          {t('templates.createCustom', 'Create Custom Template')}
        </h3>
      </div>
      
      <div className="space-y-4">
        <Input
          value={customTemplate.name}
          onChange={(e) => setCustomTemplate(prev => ({ ...prev, name: e.target.value }))}
          placeholder={t('templates.customName', 'Template name (e.g., "Farm Cleaning")')}
          className="text-sm"
        />
        <Input
          type="number"
          value={customTemplate.amount}
          onChange={(e) => setCustomTemplate(prev => ({ ...prev, amount: e.target.value }))}
          placeholder={t('templates.customAmount', 'Amount')}
          min="0"
          step="0.01"
          className="text-sm"
        />
        
        <div className="flex space-x-2">
          <Button
            onClick={addCustomTemplate}
            disabled={!customTemplate.name.trim() || !customTemplate.amount || parseFloat(customTemplate.amount) <= 0}
            size="sm"
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('templates.addCustom', 'Add Custom')}
          </Button>
          <Button
            onClick={() => setShowCustomForm(false)}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            {t('common.cancel', 'Cancel')}
          </Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          📋 {t('templates.title', 'Set Up Your Templates')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {t('templates.subtitle', 'Create recurring transactions to automate your expense tracking')}
        </p>
        
        {/* Info callout */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 max-w-lg mx-auto">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {t('templates.info', 'These are quick setups. You can create advanced recurring transactions with full control using the + button in the main app.')}
            </p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-sm" style={{ direction: 'ltr' }}>
          <button
            onClick={() => setActiveCategory('income')}
            className={cn(
              "flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200",
              activeCategory === 'income'
                ? "bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t('templates.categories.income', 'Income')}</span>
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
              {templates.income.length}
            </span>
          </button>
          <button
            onClick={() => setActiveCategory('expenses')}
            className={cn(
              "flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200",
              activeCategory === 'expenses'
                ? "bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            <TrendingDown className="w-4 h-4" />
            <span>{t('templates.categories.essential', 'Expenses')}</span>
            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
              {templates.expenses.length}
            </span>
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {currentTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </AnimatePresence>
      </div>

      {/* Quick Custom Template */}
      <div className="max-w-md mx-auto">
        <AnimatePresence>
          {!showCustomForm ? (
            <motion.div
              key="add-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                onClick={() => setShowCustomForm(true)}
                variant="outline"
                className="w-full border-dashed border-2 py-8 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex flex-col items-center space-y-2">
                  <Plus className="w-6 h-6" />
                  <span className="font-medium">{t('templates.addCustom', 'Add Custom Template')}</span>
                  <span className="text-xs opacity-75">
                    {t('templates.customHint', 'Create your own recurring transaction')}
                  </span>
                </div>
              </Button>
            </motion.div>
          ) : (
            <CustomTemplateForm />
          )}
        </AnimatePresence>
      </div>

      {/* Summary */}
      <AnimatePresence>
        {selectedTemplates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center"
          >
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('templates.selected', '{{count}} template(s) selected', { count: selectedTemplates.length })}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('templates.readyToCreate', 'These will be saved as recurring transaction templates')}
            </p>
            
            {/* Quick preview */}
            <div className="flex flex-wrap justify-center gap-2">
              {selectedTemplates.slice(0, 3).map((template) => (
                <span
                  key={template.id}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    template.type === 'income'
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  )}
                >
                  {template.name}: {formatCurrency(template.amount)}
                </span>
              ))}
              {selectedTemplates.length > 3 && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  +{selectedTemplates.length - 3} more
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinalTemplatesStep;