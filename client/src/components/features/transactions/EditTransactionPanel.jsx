import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, 
  Calendar,
  Check,
  Repeat,
  Tag,
  DollarSign,
  FileText,
  X,
  ChevronDown,
  Save,
  Info,
  TrendingUp,
  Home,
  ShoppingCart,
  Car,
  Zap,
  Tv,
  Coffee,
  Utensils,
  ShoppingBag,
  Heart,
  Book,
  Plane,
  Dumbbell,
  Phone,
  Fuel,
  Pill,
  Plus,
  Crown,
  // ✅ ADD: More icons from CategoryManager
  Star, Sparkles, Shield, Camera, Gift, Palette,
  Smartphone, Laptop, Baby, PawPrint, Bus, CreditCard,
  Banknote, PiggyBank, Pizza, Wine, MapPin, Music,
  Gamepad2, GraduationCap, Briefcase
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
// ✅ ADD: Import the necessary hooks
import { useTransactions } from '../../../hooks/useTransactions';
import { useCategories } from '../../../hooks/useCategory';

const EditTransactionPanel = ({ 
  transaction, 
  editingSingle = false,
  onClose, 
  onSuccess 
}) => {
  const { t, language } = useLanguage();
  // ✅ ADD: Get update function from hook
  const { updateTransaction, isUpdating } = useTransactions();
  const { categories: allCategories = [] } = useCategories();
  const isRTL = language === 'he';
  
  // ✅ ADD: Category tab state
  const [categoryTab, setCategoryTab] = useState('general');
  
  // States
  // ✅ REMOVE: Local loading state - use hook state instead
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // ✅ ADD: Date button ref for proper calendar positioning
  const dateButtonRef = useRef(null);

  // Determine if we're editing a single occurrence or the whole template
  const isEditingSingleOccurrence = editingSingle || !!transaction.template_id;
  const displayTitle = isEditingSingleOccurrence 
    ? t('transactions.editSingleOccurrence')
    : transaction.is_recurring 
      ? t('transactions.editRecurringTemplate')
      : t('transactions.editTransaction');

  // ✅ FIX: Show ALL categories (default + user-created) with better filtering
  // ✅ ENHANCED: Better category organization with tabs
  const getCategoriesForType = (type) => {
    const categories = allCategories
      .filter(cat => cat.is_active !== false)
      .map(cat => ({
        id: cat.id,
        name: cat.is_default ? t(`categories.${cat.name}`) : cat.name,
        icon: getIconForCategory(cat.name),
        color: getColorForCategory(cat.name),
        bg: getBgForCategory(cat.name),
        isDefault: cat.is_default,
        type: cat.type || 'expense'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      general: categories.filter(cat => cat.isDefault),
      customized: categories.filter(cat => !cat.isDefault)
    };
  };

  // Helper functions for category display - Enhanced with more icons
  const getIconForCategory = (name) => {
    const iconMap = {
      // Default categories
      'General': Tag,
      'Salary': DollarSign,
      'Freelance': FileText,
      'Investments': TrendingUp,
      'Rent': Home,
      'Groceries': ShoppingCart,
      'Transportation': Car,
      'Utilities': Zap,
      'Entertainment': Tv,
      
      // ✅ ENHANCED: Comprehensive icon mapping from CategoryManager
      // General icons
      'tag': Tag,
      'star': Star,
      'sparkles': Sparkles,
      'crown': Crown,
      'gift': Gift,
      'heart': Heart,
      'shield': Shield,
      
      // Shopping & Electronics
      'shopping-cart': ShoppingCart,
      'shopping-bag': ShoppingBag,
      'palette': Palette,
      'camera': Camera,
      'smartphone': Smartphone,
      'laptop': Laptop,
      
      // Home & Utilities
      'home': Home,
      'zap': Zap,
      'car': Car,
      'fuel': Fuel,
      'phone': Phone,
      'map-pin': MapPin,
      
      // Food & Drinks
      'utensils': Utensils,
      'coffee': Coffee,
      'pizza': Pizza,
      'wine': Wine,
      
      // Transport
      'bus': Bus,
      'plane': Plane,
      
      // Work & Education
      'briefcase': Briefcase,
      'book': Book,
      'graduation-cap': GraduationCap,
      
      // Health & Fitness
      'dumbbell': Dumbbell,
      'pill': Pill,
      'baby': Baby,
      'paw-print': PawPrint,
      
      // Money & Finance
      'dollar-sign': DollarSign,
      'credit-card': CreditCard,
      'banknote': Banknote,
      'piggy-bank': PiggyBank,
      'trending-up': TrendingUp,
      'trending-down': TrendingUp, // Use same icon for both trends
      
      // Entertainment
      'music': Music,
      'gamepad2': Gamepad2,
      'tv': Tv,
      
      // Legacy mappings for existing categories
      'Coffee': Coffee,
      'Food': Utensils,
      'Shopping': ShoppingBag,
      'Health': Heart,
      'Education': Book,
      'Travel': Plane,
      'Fitness': Dumbbell,
      'Bills': Phone,
      'Gas': Fuel,
      'Medical': Pill
    };
    return iconMap[name] || Tag;
  };

  // ✅ ENHANCED: Better color mapping for all categories
  const getColorForCategory = (name) => {
    const colorMap = {
      'General': 'slate',
      'Salary': 'emerald',
      'Freelance': 'blue',
      'Investments': 'purple',
      'Rent': 'red',
      'Groceries': 'orange',
      'Transportation': 'yellow',
      'Utilities': 'indigo',
      'Entertainment': 'pink',
      // User category colors
      'Coffee': 'amber',
      'Food': 'orange',
      'Shopping': 'cyan',
      'Health': 'rose',
      'Education': 'violet',
      'Travel': 'sky',
      'Fitness': 'lime',
      'Bills': 'slate',
      'Gas': 'yellow',
      'Medical': 'red'
    };
    return colorMap[name] || 'gray';
  };

  const getBgForCategory = (name) => {
    const bgMap = {
      'General': 'bg-slate-100 dark:bg-slate-800',
      'Salary': 'bg-emerald-100 dark:bg-emerald-800',
      'Freelance': 'bg-blue-100 dark:bg-blue-800',
      'Investments': 'bg-purple-100 dark:bg-purple-800',
      'Rent': 'bg-red-100 dark:bg-red-800',
      'Groceries': 'bg-orange-100 dark:bg-orange-800',
      'Transportation': 'bg-yellow-100 dark:bg-yellow-800',
      'Utilities': 'bg-indigo-100 dark:bg-indigo-800',
      'Entertainment': 'bg-pink-100 dark:bg-pink-800',
      // User category backgrounds
      'Coffee': 'bg-amber-100 dark:bg-amber-800',
      'Food': 'bg-orange-100 dark:bg-orange-800',
      'Shopping': 'bg-cyan-100 dark:bg-cyan-800',
      'Health': 'bg-rose-100 dark:bg-rose-800',
      'Education': 'bg-violet-100 dark:bg-violet-800',
      'Travel': 'bg-sky-100 dark:bg-sky-800',
      'Fitness': 'bg-lime-100 dark:bg-lime-800',
      'Bills': 'bg-slate-100 dark:bg-slate-800',
      'Gas': 'bg-yellow-100 dark:bg-yellow-800',
      'Medical': 'bg-red-100 dark:bg-red-800'
    };
    return bgMap[name] || 'bg-gray-100 dark:bg-gray-800';
  };

  // Get categories for current transaction type
  const categorizedCategories = getCategoriesForType(transaction.transaction_type);
  const currentTabCategories = categorizedCategories[categoryTab] || [];

  // Pre-populate form with transaction data
  const [formData, setFormData] = useState({
    amount: transaction.amount?.toString() || '',
    description: transaction.description || '',
    category_id: transaction.category_id || 8,
    is_recurring: isEditingSingleOccurrence ? false : (transaction.is_recurring || false),
    recurring_interval: transaction.recurring_interval || 'monthly',
    recurring_end_date: transaction.recurring_end_date || null,
    day_of_week: transaction.day_of_week || 0,
    date: (() => {
      // ✅ FIX: Improved date parsing to prevent "Invalid Date"
      try {
        let date;
        if (transaction.date) {
          // Handle different date formats
          if (transaction.date.includes('T')) {
            date = new Date(transaction.date);
          } else {
            date = new Date(transaction.date + 'T12:00:00');
          }
        } else {
          date = new Date();
          date.setHours(12, 0, 0, 0);
        }
        
        // Validate the date
        if (isNaN(date.getTime())) {
          console.warn('Invalid transaction date, using today:', transaction.date);
          date = new Date();
          date.setHours(12, 0, 0, 0);
        }
        
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      } catch (error) {
        console.error('Error parsing transaction date:', error);
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      }
    })(),
  });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      
      // ✅ FIX: Use hook's updateTransaction function directly
      const transactionType = transaction.transaction_type || transaction.type;
      
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        // Include update future flag for recurring transactions
        updateFuture: !isEditingSingleOccurrence && transaction.is_recurring
      };

      await updateTransaction(transactionType, transaction.id, submitData);
      
      setSuccess(true);
      
      // ✅ ADD: Close panel on success and call success callback
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 1500);
      
    } catch (error) {
      console.error('Update failed:', error);
      setError(error.message || t('transactions.updateFailed'));
      // Error handling is done by the hook via toast
    }
  };

  // ✅ ADD: Click outside handler for calendar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateButtonRef.current && !dateButtonRef.current.contains(event.target) && showCalendar) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col" // ✅ REMOVE: Any overflow-hidden classes
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* EDIT-SPECIFIC HEADER */}
      <div className={`flex-none text-white relative overflow-hidden ${
        isEditingSingleOccurrence 
          ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
          : 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600'
      }`}>
        <div className="relative z-10 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-white/20 rounded-xl">
                <Edit3 className="w-5 h-5" />
              </div>
              
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold truncate">
                  {displayTitle}
                </h1>
                <p className="text-white/80 text-sm sm:text-base">
                  {isEditingSingleOccurrence 
                    ? t('transactions.editSingleNote')
                    : transaction.is_recurring
                      ? t('transactions.editRecurringNote')
                      : t('transactions.editDetails')
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="default" className="bg-white/20 text-white border-white/30 text-xs hidden sm:flex">
                <Edit3 className="w-3 h-3 mr-1" />
                {isEditingSingleOccurrence ? t('transactions.singleEdit') : t('transactions.editing')}
              </Badge>
              
              {onClose && (
                <motion.button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FORM CONTENT */}
      <div className="flex-1 overflow-y-auto"> {/* ✅ KEEP: Only vertical scroll, not hidden */}
        <div className="p-4 sm:p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Amount & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card className="p-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('actions.amount')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: amountValidation.formatAmountInput(e.target.value) }))}
                    placeholder="150.00"
                    className="w-full text-lg font-bold py-2.5 px-3 pr-10 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="text-sm font-medium text-gray-400">₪</span>
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('actions.description')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Coffee with friends"
                    className="w-full py-2.5 px-3 pr-10 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                  />
                  <FileText className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </Card>
            </div>

            {/* Category & Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Category Selection */}
              {/* ✅ ENHANCED: Category Selection - Better UI with scrolling */}
              {/* ✅ ENHANCED: Category Selection with Tabs - Larger Area */}
              <Card className="p-4 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  {t('actions.category')}
                </label>
                
                {allCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-500 mb-4">No categories found</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="small"
                      onClick={() => {
                        console.log('Navigate to category management');
                      }}
                      className="text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Category
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* ✅ NEW: Category Tabs */}
                    <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setCategoryTab('general')}
                        className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all ${
                          categoryTab === 'general'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Crown className="w-4 h-4" />
                          <span>{t('categories.defaultCategories')} ({categorizedCategories.general.length})</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryTab('customized')}
                        className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all ${
                          categoryTab === 'customized'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Tag className="w-4 h-4" />
                          <span>{t('categories.userCategoriesDesc')} ({categorizedCategories.customized.length})</span>
                        </div>
                      </button>
                    </div>

                    {/* ✅ ENHANCED: Category Grid - Smaller, More Compact */}
                    {currentTabCategories.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                          {categoryTab === 'general' ? (
                            <Crown className="w-8 h-8 text-gray-400" />
                          ) : (
                            <Plus className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                          {categoryTab === 'general' ? 'No General Categories' : 'No Customized Categories'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          {categoryTab === 'general' 
                            ? 'Default categories will appear here' 
                            : 'Create your own categories in Settings'
                          }
                        </p>
                        {categoryTab === 'customized' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="small"
                            onClick={() => {
                              console.log('Navigate to category management');
                            }}
                            className="text-sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Category
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {currentTabCategories.map((cat) => {
                          const IconComponent = cat.icon;
                          const isSelected = formData.category_id === cat.id;
                          
                          return (
                            <motion.button
                              key={cat.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, category_id: cat.id }))}
                              className={`group p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 text-center min-h-[100px] relative ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg scale-105'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800 hover:scale-102 hover:shadow-md'
                              }`}
                              whileHover={{ scale: isSelected ? 1.05 : 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              title={cat.name}
                            >
                              {/* ✅ Larger icon container */}
                              <div className={`p-3 rounded-xl transition-colors ${
                                isSelected 
                                  ? 'bg-blue-100 dark:bg-blue-800' 
                                  : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20'
                              }`}>
                                <IconComponent className={`w-6 h-6 transition-colors ${
                                  isSelected 
                                    ? 'text-blue-600 dark:text-blue-400' 
                                    : 'text-gray-500 group-hover:text-blue-500'
                                }`} />
                              </div>
                              
                              {/* ✅ Readable text size */}
                              <span className={`text-sm font-medium leading-tight text-center w-full transition-colors ${
                                isSelected 
                                  ? 'text-blue-700 dark:text-blue-300' 
                                  : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                              }`}>
                                {cat.name}
                              </span>
                              
                              {/* ✅ Proportional selection indicator */}
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-lg"
                                >
                                  <Check className="w-3 h-3 text-white" />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {/* ✅ Smaller footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          {categorizedCategories.general.length} General
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {categorizedCategories.customized.length} Customized
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="small"
                        onClick={() => {
                          console.log('Navigate to category management');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </>
                )}
              </Card>

              {/* Date Selection */}
              <Card className="p-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('actions.date')}
                </label>
                <div className="relative">
                  <Button
                    ref={dateButtonRef}
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => setShowCalendar(!showCalendar)} // ✅ FIX: Simple toggle - if open, close it; if closed, open it
                    className="justify-between py-3 px-3 text-left border-2 hover:border-blue-300 h-auto text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium truncate">
                        {(() => {
                          // ✅ FIX: Safe date formatting to prevent "Invalid Date"
                          try {
                            const date = new Date(formData.date + 'T12:00:00');
                            if (isNaN(date.getTime())) {
                              return 'Select Date';
                            }
                            return date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            });
                          } catch (error) {
                            console.error('Date formatting error:', error);
                            return 'Select Date';
                          }
                        })()}
                      </span>
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
                  </Button>
                  
                  {/* ✅ FIX: Calendar with proper triggerRef */}
                  {showCalendar && (
                    <CalendarWidget
                      triggerRef={dateButtonRef}
                      selectedDate={(() => {
                        try {
                          const date = new Date(formData.date + 'T12:00:00');
                          if (isNaN(date.getTime())) {
                            return new Date();
                          }
                          return date;
                        } catch (error) {
                          console.error('Calendar date error:', error);
                          return new Date();
                        }
                      })()}
                      onDateSelect={(date) => {
                        try {
                          const normalizedDate = new Date(date);
                          normalizedDate.setHours(12, 0, 0, 0);
                          
                          if (isNaN(normalizedDate.getTime())) {
                            console.error('Invalid date selected:', date);
                            return;
                          }
                          
                          const localDateStr = `${normalizedDate.getFullYear()}-${String(normalizedDate.getMonth() + 1).padStart(2, '0')}-${String(normalizedDate.getDate()).padStart(2, '0')}`;
                          setFormData(prev => ({ 
                            ...prev, 
                            date: localDateStr
                          }));
                          setShowCalendar(false);
                        } catch (error) {
                          console.error('Date selection error:', error);
                          setShowCalendar(false);
                        }
                      }}
                      onClose={() => setShowCalendar(false)}
                    />
                  )}
                </div>
              </Card>
            </div>

            {/* Recurring Options - Only show if not editing single occurrence */}
            {!isEditingSingleOccurrence && (
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Repeat className="w-4 h-4 text-blue-600" />
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t('actions.recurring')}
                  </label>
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                    className="ml-auto"
                  />
                </div>

                {formData.is_recurring && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('actions.frequency')}
                        </label>
                        <select
                          value={formData.recurring_interval}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurring_interval: e.target.value }))}
                          className="w-full py-2 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        >
                          <option value="daily">{t('actions.frequencies.daily')}</option>
                          <option value="weekly">{t('actions.frequencies.weekly')}</option>
                          <option value="monthly">{t('actions.frequencies.monthly')}</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('actions.endDate')}
                        </label>
                        <input
                          type="date"
                          value={formData.recurring_end_date || ''}
                          onChange={(e) => {
                            const inputDate = e.target.value;
                            if (inputDate) {
                              const date = new Date(inputDate + 'T12:00:00');
                              const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                              setFormData(prev => ({ ...prev, recurring_end_date: localDateStr }));
                            } else {
                              setFormData(prev => ({ ...prev, recurring_end_date: null }));
                            }
                          }}
                          min={formData.date}
                          className="w-full py-2 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                    </div>

                    {formData.recurring_interval === 'weekly' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('actions.dayOfWeek')}
                        </label>
                        <select
                          value={formData.day_of_week || 0}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            day_of_week: parseInt(e.target.value) 
                          }))}
                          className="w-full py-2 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        >
                          <option value={0}>{t('days.sunday')}</option>
                          <option value={1}>{t('days.monday')}</option>
                          <option value={2}>{t('days.tuesday')}</option>
                          <option value={3}>{t('days.wednesday')}</option>
                          <option value={4}>{t('days.thursday')}</option>
                          <option value={5}>{t('days.friday')}</option>
                          <option value={6}>{t('days.saturday')}</option>
                        </select>
                      </div>
                    )}
                  </motion.div>
                )}
              </Card>
            )}

            {/* Info banner for single occurrence editing */}
            {isEditingSingleOccurrence && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      {t('transactions.editingSingleOccurrence')}
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                      {t('transactions.singleEditNote')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <div className="w-4 h-4 rounded-full bg-red-200 flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </div>
                      <span className="text-sm font-medium">{error}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Animation */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-4"
                >
                  <div className="inline-flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                    <motion.div
                      className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-green-800">
                        {t('transactions.updateSuccess')}
                      </h3>
                      <p className="text-xs text-green-600">
                        {t('transactions.transactionUpdated')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>

      {/* EDIT-SPECIFIC FOOTER */}
      {!success && (
        <div className="flex-none border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
              size="small"
              className="px-4"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isUpdating}
              disabled={isUpdating || !formData.amount || !formData.description}
              className={`flex-1 shadow-md hover:shadow-lg py-2.5 ${
                isEditingSingleOccurrence 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
              }`}
              onClick={handleSubmit}
            >
              {isUpdating ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  <span className="text-sm">{t('common.saving')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {isEditingSingleOccurrence ? t('transactions.saveOnce') : t('common.save')}
                  </span>
                </div>
              )}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EditTransactionPanel;
