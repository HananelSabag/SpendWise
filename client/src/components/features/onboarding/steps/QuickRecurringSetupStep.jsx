/**
 * ⚡ QUICK RECURRING SETUP STEP - New Onboarding Page 3
 * Pre-made templates for common recurring transactions with easy add functionality
 * @version 3.0.0 - REDESIGNED ONBOARDING
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Check, Edit3, Trash2, Home, Briefcase, Car,
  Smartphone, Coffee, Music, Heart, DollarSign,
  Repeat, Calendar, TrendingUp, Zap, CheckCircle
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation, useCurrency, useNotifications } from '../../../../stores';

import { Button, Input, Card, Badge } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * ⚡ Quick Recurring Setup Step Component
 */
const QuickRecurringSetupStep = ({ 
  data = {}, 
  onDataUpdate, 
  onNext, 
  onBack 
}) => {
  // ✅ Zustand stores
  const { t, isRTL } = useTranslation('onboarding');
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();

  // ✅ Local state
  const [selectedTemplates, setSelectedTemplates] = useState(data.selectedTemplates || []);
  const [customAmounts, setCustomAmounts] = useState(data.customAmounts || {});
  const [customAmountInputs, setCustomAmountInputs] = useState({});
  const [activeCategory, setActiveCategory] = useState('income');

  // ✅ Pre-made recurring transaction templates
  const recurringTemplates = {
    income: [
      {
        id: 'salary',
        name: 'Monthly Salary',
        description: 'Your main job salary',
        defaultAmount: 4500,
        frequency: 'monthly',
        icon: Briefcase,
        category: 'Salary',
        color: 'emerald'
      },
      {
        id: 'freelance',
        name: 'Freelance Income',
        description: 'Regular freelance work',
        defaultAmount: 1500,
        frequency: 'monthly',
        icon: DollarSign,
        category: 'Freelance',
        color: 'blue'
      },
      {
        id: 'investment',
        name: 'Investment Returns',
        description: 'Dividends or rental income',
        defaultAmount: 500,
        frequency: 'monthly',
        icon: TrendingUp,
        category: 'Investments',
        color: 'purple'
      }
    ],
    expenses: [
      {
        id: 'rent',
        name: 'Rent/Mortgage',
        description: 'Monthly housing payment',
        defaultAmount: 1200,
        frequency: 'monthly',
        icon: Home,
        category: 'Housing',
        color: 'red'
      },
      {
        id: 'car_payment',
        name: 'Car Payment',
        description: 'Monthly car loan',
        defaultAmount: 350,
        frequency: 'monthly',
        icon: Car,
        category: 'Transportation',
        color: 'orange'
      },
      {
        id: 'phone',
        name: 'Phone Bill',
        description: 'Monthly phone service',
        defaultAmount: 75,
        frequency: 'monthly',
        icon: Smartphone,
        category: 'Utilities',
        color: 'indigo'
      },
      {
        id: 'netflix',
        name: 'Netflix',
        description: 'Streaming subscription',
        defaultAmount: 15.99,
        frequency: 'monthly',
        icon: Music,
        category: 'Entertainment',
        color: 'pink'
      },
      {
        id: 'gym',
        name: 'Gym Membership',
        description: 'Monthly gym fees',
        defaultAmount: 45,
        frequency: 'monthly',
        icon: Heart,
        category: 'Health',
        color: 'green'
      },
      {
        id: 'coffee',
        name: 'Coffee Subscription',
        description: 'Daily coffee habit',
        defaultAmount: 25,
        frequency: 'weekly',
        icon: Coffee,
        category: 'Food',
        color: 'amber'
      }
    ]
  };

  // ✅ Handle template selection
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
        type: activeCategory === 'income' ? 'income' : 'expense'
      };
      
      const newSelected = [...selectedTemplates, newTemplate];
      setSelectedTemplates(newSelected);
      
      onDataUpdate({ 
        selectedTemplates: newSelected, 
        customAmounts 
      });
    }
  }, [selectedTemplates, customAmounts, activeCategory, onDataUpdate]);

  // ✅ Handle amount change
  const handleAmountChange = useCallback((templateId, amount) => {
    setCustomAmountInputs(prev => ({ ...prev, [templateId]: amount }));
    const numAmount = parseFloat(amount) || 0;
    const newAmounts = { ...customAmounts, [templateId]: numAmount };
    setCustomAmounts(newAmounts);
    
    // Do NOT recreate selectedTemplates on each keystroke to preserve input focus
    onDataUpdate({ 
      selectedTemplates,
      customAmounts: newAmounts 
    });
  }, [customAmounts, selectedTemplates, onDataUpdate]);

  // ✅ Template Row Component (compact + responsive)
  const TemplateCard = ({ template, isSelected }) => {
    const IconComponent = template.icon;
    const currentAmount = customAmounts[template.id] ?? template.defaultAmount;
    const isIncome = activeCategory === 'income';
    
    return (
      <div className="cursor-pointer">
        <Card
          className={cn(
            "px-4 py-3 border-2 transition-all duration-200 relative",
            "flex items-center gap-3",
            isSelected
              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
          )}
          onClick={() => handleTemplateToggle(template)}
        >
          {/* Select checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            readOnly
            className="w-4 h-4 accent-purple-600"
          />

          {/* Icon */}
          <div className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border",
            isIncome
              ? "bg-green-50 dark:bg-green-900/30 text-green-600 border-green-200"
              : "bg-red-50 dark:bg-red-900/30 text-red-600 border-red-200"
          )}>
            <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                  {template.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {template.description}
                </p>
                <div className="flex items-center gap-2 text-xs mt-1">
                  <Badge variant="outline" size="sm">
                    {template.category}
                  </Badge>
                  <Badge variant="secondary" size="sm">
                    {template.frequency}
                  </Badge>
                </div>
              </div>

              {/* Amount input */}
              <div className="w-40 sm:w-48">
                <UncontrolledAmountInput
                  value={customAmountInputs[template.id] ?? String(currentAmount)}
                  onChange={(val) => handleAmountChange(template.id, val)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="mt-1 text-right text-xs">
                  <span className={cn(isIncome ? "text-green-600" : "text-red-600", "font-semibold")}>{isIncome ? '+' : '-'}{formatCurrency(currentAmount)}</span>
                  <span className="text-gray-500 ml-1">/ {template.frequency}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Uncontrolled input to prevent React re-render from stealing focus
  const UncontrolledAmountInput = ({ value, onChange, ...rest }) => {
    const ref = React.useRef(null);
    // Initialize once
    React.useEffect(() => {
      if (ref.current && ref.current.value !== value) {
        ref.current.value = value;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        defaultValue={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
        placeholder="0.00"
        className="w-full px-3 py-2 border rounded-lg text-right font-bold bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        {...rest}
      />
    );
  };

  // ✅ Summary calculations
  const totalIncome = selectedTemplates
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (customAmounts[t.id] ?? t.amount), 0);
    
  const totalExpenses = selectedTemplates
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (customAmounts[t.id] ?? t.amount), 0);
    
  const netAmount = totalIncome - totalExpenses;

  // ✅ Handle completion
  const handleComplete = useCallback(() => {
    if (selectedTemplates.length === 0) {
      addNotification({
        type: 'warning',
        message: 'Select at least one recurring transaction to continue'
      });
      return;
    }
    
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
  }, [selectedTemplates, customAmounts, totalIncome, totalExpenses, netAmount, onDataUpdate, onNext, addNotification]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-full"
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg"
        >
          <Zap className="w-8 h-8 text-white" />
        </motion.div>
        
        <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-white">
          Quick Recurring Setup ⚡
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          Set up your common recurring transactions in seconds
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Just click to add, adjust amounts as needed
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { id: 'income', label: 'Income', icon: TrendingUp, color: 'text-green-600' },
            { id: 'expenses', label: 'Expenses', icon: Calendar, color: 'text-red-600' }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveCategory(tab.id)}
                className={cn(
                  "flex items-center px-6 py-3 rounded-lg font-medium transition-all",
                  activeCategory === tab.id
                    ? "bg-white dark:bg-gray-700 text-purple-600 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
                <Badge variant="secondary" size="sm" className="ml-2">
                  {recurringTemplates[tab.id].length}
                </Badge>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Select All */}
      <div className="flex items-center justify-end gap-2 mb-3">
        <Button
          variant="outline"
          onClick={() => {
            const all = recurringTemplates[activeCategory].map(t => ({
              ...t,
              amount: customAmounts[t.id] ?? t.defaultAmount,
              type: activeCategory === 'income' ? 'income' : 'expense'
            }));
            setSelectedTemplates(all);
            onDataUpdate({ selectedTemplates: all, customAmounts });
          }}
        >
          Select All
        </Button>
        {selectedTemplates.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedTemplates([]);
              onDataUpdate({ selectedTemplates: [], customAmounts });
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Templates List */}
      <div className="space-y-3 mb-8">
        {recurringTemplates[activeCategory].map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplates.some(t => t.id === template.id)}
          />
        ))}
      </div>

      {/* Summary Panel */}
      {selectedTemplates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
            <h3 className="text-xl font-semibold text-center mb-6">
              📊 Your Monthly Recurring Summary
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  +{formatCurrency(totalIncome)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monthly Income
                </p>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-red-600 mb-1">
                  -{formatCurrency(totalExpenses)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monthly Expenses
                </p>
              </div>
              
              <div>
                <div className={cn(
                  "text-2xl font-bold mb-1",
                  netAmount >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {netAmount >= 0 ? '+' : ''}{formatCurrency(netAmount)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Net Amount
                </p>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Badge variant="secondary" size="lg" className="bg-purple-100 text-purple-800">
                <Repeat className="w-4 h-4 mr-1" />
                {selectedTemplates.length} recurring transactions selected
              </Badge>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Benefits Info */}
      <Card className="p-6 mt-8 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🎉 Great! Here's what happens next:
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Automatic Transactions</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    These will be added to your account automatically each month
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Easy Adjustments</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You can edit amounts or pause any recurring transaction anytime
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Better Budgeting</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    See your financial patterns and plan ahead with confidence
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Time Saving</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No more manually entering the same transactions every month
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation buttons are handled by the modal footer; keep a single source of controls */}
    </motion.div>
  );
};

export default QuickRecurringSetupStep;