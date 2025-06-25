/**
 * InitialTemplatesStep Component - Enhanced template setup with more options
 * 
 * ✅ ENHANCED FEATURES:
 * - More template suggestions to fill the screen
 * - Manual transaction addition option (Plus icon -> AddTransactions)
 * - Clean header without unnecessary icons
 * - Better space utilization with no scrolling
 * - Improved template variety for different user types
 * - Modern responsive design
 * - Editable template amounts
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, DollarSign, Home, Phone, CheckCircle, Clock,
  ChevronDown, Trash2, Edit2, Car, Wifi, Coffee, Target, 
  Smartphone, Zap, Building2, Info, 
  Sparkles, Star, Heart, Crown, Activity,
  ShoppingCart, Fuel, Utensils, Book, Dumbbell, Music,
  Plane, Gift, CreditCard, Calculator, User
} from 'lucide-react';

import { useLanguage } from '../../../../context/LanguageContext';
import { useCurrency } from '../../../../context/CurrencyContext'; 
import { useTransactionActions } from '../../../../hooks/useTransactionActions';
import { useToast } from '../../../../hooks/useToast';
import { cn } from '../../../../utils/helpers';
import { Button, Input, Modal } from '../../../ui';
import AddTransactions from '../../transactions/AddTransactions';

/**
 * InitialTemplatesStep - Enhanced setup with more templates and manual option
 */
const InitialTemplatesStep = ({ onNext, onPrevious, onSkip, stepData, updateStepData, onComplete, isCompleting }) => {
  const { t, language } = useLanguage();
  const { currency, formatAmount, getCurrencySymbol } = useCurrency();
  const { createTransaction } = useTransactionActions();
  const toastService = useToast();
  const isRTL = language === 'he';
  
  const [templates, setTemplates] = useState(stepData.templates || []);
  const [isCreating, setIsCreating] = useState(false);
  const [showAddTransactions, setShowAddTransactions] = useState(false);

  // ✅ ENHANCED: Currency-appropriate default amounts
  const getDefaultAmount = (type, category) => {
    const currencyMultiplier = currency === 'ILS' ? 1 : currency === 'USD' ? 0.27 : 0.25;
    
    const baseAmounts = {
      salary: 12000,
      rent: 3500,
      phone: 120,
      car: 800,
      internet: 150,
      coffee: 80,
      groceries: 1200,
      insurance: 300,
      gym: 180,
      subscription: 50,
      gas: 400,
      utilities: 200
    };
    
    return Math.round((baseAmounts[category] || 100) * currencyMultiplier);
  };

  // ✅ EXPANDED: More template suggestions to fill the screen
  const templateSuggestions = [
    // Income Templates
    {
      id: 'salary',
      title: isRTL ? "משכורת חודשית" : "Monthly Salary",
      amount: getDefaultAmount('income', 'salary'),
      type: 'income',
      frequency: 'monthly',
      icon: Target,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20',
      categoryId: 1,
      category: 'income'
    },
    
    // Essential Expenses
    {
      id: 'rent',
      title: isRTL ? "שכר דירה" : "Rent Payment",
      amount: getDefaultAmount('expense', 'rent'),
      type: 'expense',
      frequency: 'monthly',
      icon: Home,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      categoryId: 8,
      category: 'housing'
    },
    {
      id: 'phone',
      title: isRTL ? "חשבון טלפון" : "Phone Bill",
      amount: getDefaultAmount('expense', 'phone'),
      type: 'expense',
      frequency: 'monthly',
      icon: Smartphone,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
      categoryId: 6,
      category: 'utilities'
    },
    {
      id: 'internet',
      title: isRTL ? "אינטרנט" : "Internet",
      amount: getDefaultAmount('expense', 'internet'),
      type: 'expense',
      frequency: 'monthly',
      icon: Wifi,
      color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20',
      categoryId: 6,
      category: 'utilities'
    },
    {
      id: 'groceries',
      title: isRTL ? "קניות חודשיות" : "Monthly Groceries",
      amount: getDefaultAmount('expense', 'groceries'),
      type: 'expense',
      frequency: 'monthly',
      icon: ShoppingCart,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      categoryId: 4,
      category: 'food'
    },
    {
      id: 'car',
      title: isRTL ? "ביטוח רכב" : "Car Insurance",
      amount: getDefaultAmount('expense', 'insurance'),
      type: 'expense',
      frequency: 'monthly',
      icon: Car,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
      categoryId: 7,
      category: 'transport'
    },
    
    // Lifestyle Templates
    {
      id: 'gym',
      title: isRTL ? "מנוי חדר כושר" : "Gym Membership",
      amount: getDefaultAmount('expense', 'gym'),
      type: 'expense',
      frequency: 'monthly',
      icon: Dumbbell,
      color: 'text-red-600 bg-red-100 dark:bg-red-900/20',
      categoryId: 5,
      category: 'entertainment'
    },
    {
      id: 'subscription',
      title: isRTL ? "מנוי נטפליקס" : "Netflix Subscription",
      amount: getDefaultAmount('expense', 'subscription'),
      type: 'expense',
      frequency: 'monthly',
      icon: Music,
      color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/20',
      categoryId: 5,
      category: 'entertainment'
    },
    {
      id: 'coffee',
      title: isRTL ? "קפה יומי" : "Daily Coffee",
      amount: getDefaultAmount('expense', 'coffee'),
      type: 'expense',
      frequency: 'daily',
      icon: Coffee,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
      categoryId: 4,
      category: 'food'
    }
  ];

  // Add template with editable amount
  const addFromSuggestion = (suggestion) => {
    const newTemplate = {
      id: Date.now().toString() + Math.random(),
      title: suggestion.title,
      amount: suggestion.amount,
      type: suggestion.type,
      frequency: suggestion.frequency,
      icon: suggestion.icon,
      color: suggestion.color,
      categoryId: suggestion.categoryId,
      isCustom: false
    };
    
    const newTemplates = [...templates, newTemplate];
    setTemplates(newTemplates);
    updateStepData({ templates: newTemplates });
  };

  const removeTemplate = (templateId) => {
    const newTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(newTemplates);
    updateStepData({ templates: newTemplates });
  };

  // Update template amount inline
  const updateTemplateAmount = (templateId, newAmount) => {
    const newTemplates = templates.map(t => 
      t.id === templateId ? { ...t, amount: parseFloat(newAmount) || 0 } : t
    );
    setTemplates(newTemplates);
    updateStepData({ templates: newTemplates });
  };

  // ✅ FIXED: Open AddTransactions modal
  const handleAddTransactions = () => {
    setShowAddTransactions(true);
  };

  const handleAddTransactionSuccess = (transactionData) => {
    // Optionally add the created transaction as a template
    toastService.success(isRTL ? 'עסקה נוספה בהצלחה!' : 'Transaction added successfully!');
    setShowAddTransactions(false);
  };

  const handleContinue = async () => {
    setIsCreating(true);
    
    try {
      // Create actual recurring transactions for each template
      for (const template of templates) {
        const currentDate = new Date();
        
        // ✅ FIX: Apply same start date logic - use first of current month for recurring
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        const startDate = currentMonth.toISOString().split('T')[0];
        
        const transactionData = {
          amount: Math.abs(template.amount),
          description: template.title,
          category_id: template.categoryId || 8,
          date: startDate, // ✅ FIX: Use first of month, not today
          is_recurring: true,
          recurring_interval: template.frequency || 'monthly',
          // ✅ FIX: Add day_of_month for monthly intervals
          day_of_month: template.frequency === 'monthly' ? new Date().getDate() : undefined,
          // ✅ FIX: Add day_of_week for weekly intervals  
          day_of_week: template.frequency === 'weekly' ? new Date().getDay() : undefined
        };

        await createTransaction(template.type, transactionData);
      }

      if (templates.length > 0) {
        toastService.success(`${templates.length} ${isRTL ? 'עסקאות חוזרות נוצרו בהצלחה!' : 'recurring transactions created successfully!'} 🎉`);
      }

      // Clear any saved progress to prevent going back
      localStorage.removeItem('spendwise-onboarding-progress');
      
      updateStepData({ templates, templatesCreated: true });
      
      // Call onComplete directly since this is the last step
      if (onComplete) {
        onComplete();
      } else {
        onNext();
      }
    } catch (error) {
      console.error('Failed to create templates:', error);
      toastService.error(isRTL ? 'שגיאה ביצירת התבניות' : 'Failed to create some templates. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col bg-gradient-to-br from-green-50/30 via-emerald-50/20 to-teal-50/30 dark:from-green-900/10 dark:via-emerald-900/10 dark:to-teal-900/10">
      {/* ✅ CLEAN: Simple header without unnecessary icons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-shrink-0 text-center py-4 px-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center justify-center gap-2 mb-2"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <Star className="w-6 h-6 text-yellow-500" />
          </motion.div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isRTL ? "בחר תבניות ראשונות" : "Choose Your First Templates"}
          </h2>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Heart className="w-5 h-5 text-red-500" />
          </motion.div>
        </motion.div>
        
        <p className={cn(
          "text-sm text-gray-600 dark:text-gray-300",
          isRTL && "text-right"
        )}>
          {isRTL 
            ? "בחר תבניות נפוצות או הוסף עסקה מותאמת אישית"
            : "Choose common templates or add a custom transaction"
          }
        </p>
      </motion.div>

      {/* ✅ ENHANCED: Templates grid with better organization - Made scrollable for mobile */}
      <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        
        {/* ✅ MOVED TO TOP: Selected Templates Summary */}
        {templates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800"
          >
            <div className={cn(
              "flex items-center gap-2 mb-3",
              isRTL && "flex-row-reverse"
            )}>
              <Crown className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-green-800 dark:text-green-300">
                {isRTL ? `נבחרו ${templates.length} תבניות` : `${templates.length} Templates Selected`}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <div
                    key={template.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700",
                      isRTL && "flex-row-reverse"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg", template.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                        {template.title}
                      </div>
                      {/* ✅ EDITABLE AMOUNT */}
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          value={template.amount}
                          onChange={(e) => updateTemplateAmount(template.id, e.target.value)}
                          className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          min="0"
                          step="0.01"
                        />
                        <span className="text-xs text-gray-500">{getCurrencySymbol()}</span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          template.type === 'income' 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                          {template.frequency === 'monthly' && (isRTL ? "חודשי" : "Monthly")}
                          {template.frequency === 'daily' && (isRTL ? "יומי" : "Daily")}
                          {template.frequency === 'weekly' && (isRTL ? "שבועי" : "Weekly")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeTemplate(template.id)}
                      className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Template Suggestions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {templateSuggestions.map((suggestion, index) => {
            const Icon = suggestion.icon;
            const isSelected = templates.some(t => t.id === suggestion.id);
            
            return (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                className={cn(
                  "card p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md",
                  isSelected 
                    ? "border-green-400 bg-green-50 dark:bg-green-900/20 shadow-md" 
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
                onClick={() => !isSelected && addFromSuggestion(suggestion)}
              >
                <div className={cn(
                  "flex items-start gap-3",
                  isRTL && "flex-row-reverse"
                )}>
                  
                  {/* Icon */}
                  <div className={cn(
                    "p-2.5 rounded-xl shadow-sm transition-all duration-200",
                    suggestion.color,
                    isSelected && "scale-110"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {/* Content */}
                  <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                      {suggestion.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full",
                        suggestion.type === 'income' 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {suggestion.type === 'income' 
                          ? (isRTL ? "הכנסה" : "Income")
                          : (isRTL ? "הוצאה" : "Expense")
                        }
                      </span>
                      <span>•</span>
                      <span>
                        {suggestion.frequency === 'monthly' && (isRTL ? "חודשי" : "Monthly")}
                        {suggestion.frequency === 'daily' && (isRTL ? "יומי" : "Daily")}
                        {suggestion.frequency === 'weekly' && (isRTL ? "שבועי" : "Weekly")}
                      </span>
                    </div>
                    
                    {/* Amount */}
                    <div className={cn(
                      "font-bold text-lg",
                      suggestion.type === 'income' 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {suggestion.type === 'income' ? '+' : '-'}{formatAmount(suggestion.amount)}
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="p-1 rounded-full bg-green-500 text-white"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ✅ MOVED TO BOTTOM: Manual Add Option */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="card p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200"
        >
          <button
            onClick={handleAddTransactions}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200",
              isRTL && "flex-row-reverse"
            )}
          >
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className={cn("flex-1", isRTL && "text-right")}>
              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
                {isRTL ? "הוסף עסקה מותאמת אישית" : "Add Custom Transaction"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {isRTL 
                  ? "צור עסקה חדשה עם הפרטים המדויקים שלך"
                  : "Create a new transaction with your exact details"
                }
              </p>
            </div>
            <div className="text-blue-600 dark:text-blue-400">
              <ChevronDown className="w-5 h-5" />
            </div>
          </button>
        </motion.div>
      </div>

      {/* ✅ IMPROVED: Fixed bottom buttons with proper alignment and spacing - Always visible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.5 }}
        className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700"
      >
        <Button
          onClick={onPrevious}
          variant="outline"
          size="lg"
          className={cn(
            "flex items-center gap-2 px-6 py-2",
            isRTL && "flex-row-reverse"
          )}
        >
          <ChevronDown className={cn("w-4 h-4", isRTL ? "ml-2 rotate-90" : "mr-2 -rotate-90")} />
          {isRTL ? "חזור" : "Back"}
        </Button>

        <Button
          onClick={() => {
            localStorage.removeItem('spendwise-onboarding-progress');
            onComplete?.() || onNext();
          }}
          variant="ghost"
          size="lg"
          className="px-6 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {isRTL ? "דלג ונגמר" : "Skip & Finish"}
        </Button>
        
        <Button
          onClick={handleContinue}
          disabled={isCreating}
          size="lg"
          className={cn(
            "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8 py-2 flex items-center gap-2",
            templates.length === 0 && "opacity-75",
            isRTL && "flex-row-reverse"
          )}
        >
          {isCreating ? (
            <span className={cn(
              "flex items-center gap-2",
              isRTL && "flex-row-reverse"
            )}>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{isRTL ? "יוצר..." : "Creating..."}</span>
            </span>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>{isRTL ? "נסיים!" : "Finish!"}</span>
            </>
          )}
        </Button>
      </motion.div>

      {/* ✅ AddTransactions Modal - Fixed for mobile scroll */}
      <Modal
        isOpen={showAddTransactions}
        onClose={() => setShowAddTransactions(false)}
        size="large"
        className="max-w-4xl mx-2 sm:mx-4 lg:mx-auto max-h-[85vh] lg:max-h-[90vh]"
        hideHeader={true}
      >
        <div className="h-full max-h-[80vh] lg:max-h-[85vh] overflow-hidden">
          <AddTransactions 
            onClose={() => setShowAddTransactions(false)}
            onSuccess={handleAddTransactionSuccess}
            context="onboarding"
          />
        </div>
      </Modal>
    </div>
  );
};

export default InitialTemplatesStep; 