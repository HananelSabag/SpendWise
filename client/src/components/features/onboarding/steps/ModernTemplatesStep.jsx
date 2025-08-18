/**
 * ⚡ MODERN TEMPLATES STEP - Enhanced Step 3
 * Streamlined recurring transaction templates with better UX
 * Features: Quick setup, Smart defaults, Visual summaries, Mobile-first
 * @version 4.0.0 - MODERN REDESIGN
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Check, Edit3, Trash2, Home, Briefcase, Car,
  Smartphone, Coffee, Music, Heart, DollarSign,
  Repeat, Calendar, TrendingUp, Zap, CheckCircle,
  Target, BarChart3, Clock, ArrowRight
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation, useCurrency, useNotifications } from '../../../../stores';

import { Button, Input, Card, Badge } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * ⚡ Modern Templates Step Component
 */
const ModernTemplatesStep = ({ 
  data = {}, 
  onDataUpdate, 
  onNext, 
  onBack 
}) => {
  // ✅ Zustand stores
  const { t, isRTL } = useTranslation('onboarding');
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();

  // ✅ Local state - ENHANCED
  const [selectedTemplates, setSelectedTemplates] = useState(data.selectedTemplates || []);
  const [customAmounts, setCustomAmounts] = useState(data.customAmounts || {});
  const [customAmountInputs, setCustomAmountInputs] = useState({});
  const [activeCategory, setActiveCategory] = useState('essentials');
  const [currentStep, setCurrentStep] = useState('select'); // select, customize, review

  // ✅ Enhanced recurring transaction templates - MORE ORGANIZED
  const recurringTemplates = {
    essentials: [
      {
        id: 'salary',
        name: 'Monthly Salary',
        description: 'Your primary job income',
        defaultAmount: 4500,
        frequency: 'monthly',
        icon: Briefcase,
        category: 'Primary Income',
        color: 'emerald',
        priority: 'high',
        recommended: true
      },
      {
        id: 'rent',
        name: 'Rent/Mortgage',
        description: 'Monthly housing payment',
        defaultAmount: 1350,
        frequency: 'monthly',
        icon: Home,
        category: 'Housing',
        color: 'red',
        priority: 'high',
        recommended: true
      },
      {
        id: 'phone',
        name: 'Phone Bill',
        description: 'Monthly mobile service',
        defaultAmount: 85,
        frequency: 'monthly',
        icon: Smartphone,
        category: 'Utilities',
        color: 'indigo',
        priority: 'high',
        recommended: true
      }
    ],
    lifestyle: [
      {
        id: 'gym',
        name: 'Gym Membership',
        description: 'Monthly fitness subscription',
        defaultAmount: 45,
        frequency: 'monthly',
        icon: Heart,
        category: 'Health & Fitness',
        color: 'green',
        priority: 'medium',
        recommended: false
      },
      {
        id: 'netflix',
        name: 'Streaming Services',
        description: 'Netflix, Spotify, etc.',
        defaultAmount: 25.99,
        frequency: 'monthly',
        icon: Music,
        category: 'Entertainment',
        color: 'pink',
        priority: 'low',
        recommended: false
      },
      {
        id: 'coffee',
        name: 'Coffee Budget',
        description: 'Weekly coffee allowance',
        defaultAmount: 35,
        frequency: 'weekly',
        icon: Coffee,
        category: 'Food & Dining',
        color: 'amber',
        priority: 'low',
        recommended: false
      }
    ],
    income: [
      {
        id: 'freelance',
        name: 'Freelance Income',
        description: 'Side project earnings',
        defaultAmount: 800,
        frequency: 'monthly',
        icon: DollarSign,
        category: 'Secondary Income',
        color: 'blue',
        priority: 'medium',
        recommended: false
      },
      {
        id: 'investment',
        name: 'Investment Returns',
        description: 'Dividends or rental income',
        defaultAmount: 300,
        frequency: 'monthly',
        icon: TrendingUp,
        category: 'Investment Income',
        color: 'purple',
        priority: 'low',
        recommended: false
      }
    ],
    transportation: [
      {
        id: 'car_payment',
        name: 'Car Payment',
        description: 'Monthly auto loan',
        defaultAmount: 420,
        frequency: 'monthly',
        icon: Car,
        category: 'Transportation',
        color: 'orange',
        priority: 'medium',
        recommended: false
      },
      {
        id: 'insurance',
        name: 'Car Insurance',
        description: 'Monthly auto insurance',
        defaultAmount: 125,
        frequency: 'monthly',
        icon: Car,
        category: 'Insurance',
        color: 'gray',
        priority: 'medium',
        recommended: false
      }
    ]
  };

  // ✅ Handle template selection - ENHANCED
  const handleTemplateToggle = useCallback((template) => {
    const isSelected = selectedTemplates.some(t => t.id === template.id);
    
    if (isSelected) {
      // Remove template
      const newSelected = selectedTemplates.filter(t => t.id !== template.id);
      setSelectedTemplates(newSelected);
      
      // Remove custom amount
      const newAmounts = { ...customAmounts };
      delete newAmounts[template.id];
      setCustomAmounts(newAmounts);
      
      onDataUpdate({ 
        selectedTemplates: newSelected, 
        customAmounts: newAmounts 
      });
    } else {
      // Add template
      const newTemplate = {
        ...template,
        amount: customAmounts[template.id] || template.defaultAmount,
        type: activeCategory === 'income' ? 'income' : getTemplateType(template)
      };
      
      const newSelected = [...selectedTemplates, newTemplate];
      setSelectedTemplates(newSelected);
      
      onDataUpdate({ 
        selectedTemplates: newSelected, 
        customAmounts 
      });

      // Show feedback
      addNotification({
        type: 'success',
        message: `Added ${template.name} to your setup`,
        duration: 2000
      });
    }
  }, [selectedTemplates, customAmounts, activeCategory, onDataUpdate, addNotification]);

  // ✅ Get template type based on category
  const getTemplateType = (template) => {
    return activeCategory === 'income' || template.category.includes('Income') ? 'income' : 'expense';
  };

  // ✅ Handle amount change - ENHANCED
  const handleAmountChange = useCallback((templateId, amount) => {
    setCustomAmountInputs(prev => ({ ...prev, [templateId]: amount }));
    const numAmount = parseFloat(amount) || 0;
    const newAmounts = { ...customAmounts, [templateId]: numAmount };
    setCustomAmounts(newAmounts);
    
    // Update selected templates with new amount
    const updatedTemplates = selectedTemplates.map(template => 
      template.id === templateId ? { ...template, amount: numAmount } : template
    );
    setSelectedTemplates(updatedTemplates);
    
    onDataUpdate({ 
      selectedTemplates: updatedTemplates,
      customAmounts: newAmounts 
    });
  }, [customAmounts, selectedTemplates, onDataUpdate]);

  // ✅ Enhanced Template Card Component
  const ModernTemplateCard = ({ template, isSelected, category }) => {
    const IconComponent = template.icon;
    const currentAmount = customAmounts[template.id] ?? template.defaultAmount;
    const isIncome = category === 'income' || template.category.includes('Income');
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -2 }}
        className="cursor-pointer"
      >
        <Card
          className={cn(
            "p-5 border-2 transition-all duration-300 relative overflow-hidden",
            "hover:shadow-lg",
            isSelected
              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
          )}
          onClick={() => handleTemplateToggle(template)}
        >
          {/* Background pattern */}
          {isSelected && (
            <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 transform rotate-45 translate-x-6 -translate-y-6" />
            </div>
          )}

          {/* Priority indicator */}
          {template.priority === 'high' && (
            <div className="absolute top-2 right-2">
              <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm" />
            </div>
          )}

          {/* Recommended badge */}
          {template.recommended && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              ⭐ Recommended
            </div>
          )}

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {/* Icon */}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shadow-md border-2",
                  isSelected ? [
                    isIncome 
                      ? "bg-gradient-to-br from-green-400 to-green-500 text-white border-green-300"
                      : "bg-gradient-to-br from-red-400 to-red-500 text-white border-red-300"
                  ] : [
                    isIncome 
                      ? "bg-gradient-to-br from-green-50 to-green-100 text-green-600 border-green-200"
                      : "bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 border-gray-200"
                  ]
                )}>
                  <IconComponent className="w-6 h-6" />
                </div>

                {/* Title and description */}
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
                    {template.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {template.description}
                  </p>
                </div>
              </div>

              {/* Selection indicator */}
              <div className="flex-shrink-0">
                {isSelected ? (
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" size="sm">
                {template.category}
              </Badge>
              <Badge variant="secondary" size="sm">
                {template.frequency}
              </Badge>
              {template.priority === 'high' && (
                <Badge variant="destructive" size="sm">
                  Essential
                </Badge>
              )}
            </div>

            {/* Amount */}
            <div className="flex items-center justify-between">
              <div className="text-right">
                <div className={cn(
                  "text-xl font-bold",
                  isIncome ? "text-green-600" : "text-red-600"
                )}>
                  {isIncome ? '+' : '-'}{formatCurrency(currentAmount)}
                </div>
                <div className="text-xs text-gray-500">
                  per {template.frequency}
                </div>
              </div>

              {/* Quick amount adjustment (if selected) */}
              {isSelected && (
                <div className="w-32" onClick={(e) => e.stopPropagation()}>
                  <UncontrolledAmountInput
                    value={customAmountInputs[template.id] ?? String(currentAmount)}
                    onChange={(val) => handleAmountChange(template.id, val)}
                    placeholder="Amount"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  // ✅ Uncontrolled input to prevent React re-render from stealing focus
  const UncontrolledAmountInput = ({ value, onChange, ...rest }) => {
    const ref = React.useRef(null);
    React.useEffect(() => {
      if (ref.current && ref.current.value !== value) {
        ref.current.value = value;
      }
    }, []);
    
    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        defaultValue={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
        className="w-full px-3 py-2 border rounded-lg text-right font-bold bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        {...rest}
      />
    );
  };

  // ✅ Summary calculations - ENHANCED
  const totalIncome = selectedTemplates
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (customAmounts[t.id] ?? t.amount), 0);
    
  const totalExpenses = selectedTemplates
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (customAmounts[t.id] ?? t.amount), 0);
    
  const netAmount = totalIncome - totalExpenses;

  // ✅ Category options - ENHANCED
  const categories = [
    { 
      id: 'essentials', 
      label: 'Essentials', 
      icon: Target, 
      description: 'Must-have recurring transactions',
      color: 'red',
      count: recurringTemplates.essentials.length
    },
    { 
      id: 'income', 
      label: 'Income', 
      icon: TrendingUp, 
      description: 'Regular income sources',
      color: 'green',
      count: recurringTemplates.income.length
    },
    { 
      id: 'lifestyle', 
      label: 'Lifestyle', 
      icon: Heart, 
      description: 'Entertainment and personal',
      color: 'pink',
      count: recurringTemplates.lifestyle.length
    },
    { 
      id: 'transportation', 
      label: 'Transport', 
      icon: Car, 
      description: 'Car payments and transport',
      color: 'blue',
      count: recurringTemplates.transportation.length
    }
  ];

  // ✅ Quick setup presets
  const quickPresets = [
    {
      id: 'basic',
      name: 'Basic Setup',
      description: 'Salary + Rent + Phone',
      templates: ['salary', 'rent', 'phone']
    },
    {
      id: 'complete',
      name: 'Complete Setup',
      description: 'All essentials + some lifestyle',
      templates: ['salary', 'rent', 'phone', 'gym', 'netflix']
    },
    {
      id: 'minimal',
      name: 'Minimal Setup',
      description: 'Just salary for now',
      templates: ['salary']
    }
  ];

  // ✅ Handle quick preset selection
  const applyPreset = (preset) => {
    const templatesToAdd = [];
    
    preset.templates.forEach(templateId => {
      // Find template across all categories
      Object.values(recurringTemplates).forEach(categoryTemplates => {
        const template = categoryTemplates.find(t => t.id === templateId);
        if (template) {
          templatesToAdd.push({
            ...template,
            amount: template.defaultAmount,
            type: getTemplateType(template)
          });
        }
      });
    });

    setSelectedTemplates(templatesToAdd);
    onDataUpdate({ 
      selectedTemplates: templatesToAdd, 
      customAmounts: {} 
    });

    addNotification({
      type: 'success',
      message: `Applied ${preset.name} preset`,
      duration: 3000
    });
  };

  // ✅ Handle completion
  const handleComplete = useCallback(() => {
    onDataUpdate({ 
      selectedTemplates, 
      customAmounts,
      summary: {
        totalIncome,
        totalExpenses,
        netAmount,
        count: selectedTemplates.length
      }
    });
    
    onNext();
  }, [selectedTemplates, customAmounts, totalIncome, totalExpenses, netAmount, onDataUpdate, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-full"
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Enhanced Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg"
        >
          <Zap className="w-10 h-10 text-white" />
        </motion.div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">
          Quick Templates Setup ⚡
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
          Set up your recurring transactions in seconds
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose templates that match your lifestyle - you can always add more later
        </p>
      </div>

      {/* Quick Presets */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">🚀 Quick Start Presets</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {quickPresets.map((preset) => (
              <motion.button
                key={preset.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => applyPreset(preset)}
                className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-left hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {preset.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {preset.description}
                </p>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {preset.templates.length} templates
                </div>
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Category Navigation */}
      <div className="flex justify-center mb-6 overflow-x-auto">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 min-w-max">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg font-medium transition-all text-sm whitespace-nowrap",
                  activeCategory === category.id
                    ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.label}
                <Badge variant="secondary" size="sm" className="ml-2">
                  {category.count}
                </Badge>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Templates Grid */}
      <motion.div 
        key={activeCategory}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
      >
        {recurringTemplates[activeCategory]?.map((template) => (
          <ModernTemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplates.some(t => t.id === template.id)}
            category={activeCategory}
          />
        ))}
      </motion.div>

      {/* Selected Templates Summary */}
      {selectedTemplates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                📊 Your Monthly Summary
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Based on {selectedTemplates.length} selected template{selectedTemplates.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  +{formatCurrency(totalIncome)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monthly Income
                </p>
                <div className="text-xs text-green-600 mt-1">
                  {selectedTemplates.filter(t => t.type === 'income').length} source{selectedTemplates.filter(t => t.type === 'income').length !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  -{formatCurrency(totalExpenses)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monthly Expenses
                </p>
                <div className="text-xs text-red-600 mt-1">
                  {selectedTemplates.filter(t => t.type === 'expense').length} recurring
                </div>
              </div>
              
              <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                <div className={cn(
                  "text-3xl font-bold mb-2",
                  netAmount >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {netAmount >= 0 ? '+' : ''}{formatCurrency(netAmount)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Net Monthly
                </p>
                <div className={cn(
                  "text-xs mt-1",
                  netAmount >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {netAmount >= 0 ? "Positive cash flow" : "Budget deficit"}
                </div>
              </div>
            </div>

            {/* Selected templates list */}
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Selected Templates:
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedTemplates.map((template) => (
                  <Badge 
                    key={template.id}
                    variant="secondary" 
                    className="bg-purple-100 text-purple-800 border-purple-300"
                  >
                    <Repeat className="w-3 h-3 mr-1" />
                    {template.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button
                onClick={handleComplete}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Complete Setup with {selectedTemplates.length} Template{selectedTemplates.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Benefits Section */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
        <div className="text-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            🎉 What Happens Next?
          </h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Automatic Transactions</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  These will be added to your account automatically based on their schedule
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Edit3 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Easy Adjustments</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Change amounts, pause, or modify any template anytime
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Better Budgeting</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  See your financial patterns and plan ahead with confidence
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Time Saving</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No more manually entering the same transactions every month
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation buttons handled by modal footer */}
    </motion.div>
  );
};

export default ModernTemplatesStep;
