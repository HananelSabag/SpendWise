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
import { Button, Input } from '../../../ui';

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
  const [showManualAdd, setShowManualAdd] = useState(false);

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

  // ✅ ENHANCED: Manual add functionality
  const handleManualAdd = () => {
    setShowManualAdd(true);
    // Here you would typically open the AddTransactions modal
    toastService.info(isRTL ? 'פתיחת מסך הוספת עסקה...' : 'Opening Add Transaction...');
  };

  const handleContinue = async () => {
    setIsCreating(true);
    
    try {
      // Create actual recurring transactions for each template
      for (const template of templates) {
        const transactionData = {
          amount: Math.abs(template.amount),
          description: template.title,
          category_id: template.categoryId || 8,
          date: new Date().toISOString().split('T')[0],
          is_recurring: true,
          recurring_interval: template.frequency || 'monthly'
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
    <div className="max-w-6xl mx-auto h-full flex flex-col justify-between py-4 bg-gradient-to-br from-green-50/30 via-emerald-50/20 to-teal-50/30 dark:from-green-900/10 dark:via-emerald-900/10 dark:to-teal-900/10">
      {/* ✅ CLEAN: Simple header without unnecessary icons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-3"
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
            ? "בחר תבניות נפוצות או דלג לצעד הבא - תמיד ניתן להוסיף מאוחר יותר"
            : "Choose common templates or skip to the next step - you can always add more later"
          }
        </p>
      </motion.div>

      {/* ✅ ENHANCED: Templates grid with better organization */}
      <div className="flex-1 space-y-3">
        
        {/* Manual Add Option at the Top */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="card p-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200"
        >
          <button
            onClick={handleManualAdd}
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200",
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
                transition={{ delay: 0.5 + index * 0.05, duration: 0.3 }}
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

        {/* Selected Templates Summary */}
        {templates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800"
          >
            <div className={cn(
              "flex items-center gap-2 mb-2",
              isRTL && "flex-row-reverse"
            )}>
              <Crown className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-green-800 dark:text-green-300">
                {isRTL ? `נבחרו ${templates.length} תבניות` : `${templates.length} Templates Selected`}
              </h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <div
                    key={template.id}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700",
                      isRTL && "flex-row-reverse"
                    )}
                  >
                    <Icon className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {template.title}
                    </span>
                    <button
                      onClick={() => removeTemplate(template.id)}
                      className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* ✅ IMPROVED: Fixed bottom buttons with proper alignment and spacing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="flex items-center justify-between mt-4 px-6"
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
    </div>
  );
};

export default InitialTemplatesStep; 