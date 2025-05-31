// components/features/dashboard/ActionsPanel.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  Clock,
  Loader,
  Calendar,
  ChevronDown,
  AlertCircle,
  DollarSign,
  Tag,
  FileText,
  Check
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useTransactions } from '../../../context/TransactionContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useDate } from '../../../context/DateContext';
import { Card, Button, Input, Select, Modal, Alert, Badge } from '../../ui';
import CalendarWidget from '../../common/CalendarWidget';
import { validateTransactionAmount, formatAmountInput } from '../../../utils/validation';

const ActionsPanel = () => {
  const { t, language } = useLanguage();
  const { createTransaction, loading: globalLoading } = useTransactions();
  const { formatAmount, currency } = useCurrency();
  const { selectedDate } = useDate();
  const isRTL = language === 'he';
  
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [activeType, setActiveType] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const dateButtonRef = useRef(null);
  const formRef = useRef(null);

  // Form data
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: null,
    is_recurring: false,
    recurring_interval: 'monthly',
    recurring_end_date: null,
    date: selectedDate.toISOString().split('T')[0],
  });

  // Categories (should come from API/context eventually)
  const categories = {
    income: [
      { id: 1, name: 'Salary', icon: DollarSign, color: 'green' },
      { id: 2, name: 'Freelance', icon: FileText, color: 'blue' },
      { id: 3, name: 'Investments', icon: TrendingUp, color: 'purple' },
    ],
    expense: [
      { id: 4, name: 'Rent', icon: Home, color: 'red' },
      { id: 5, name: 'Groceries', icon: ShoppingCart, color: 'orange' },
      { id: 6, name: 'Transportation', icon: Car, color: 'yellow' },
      { id: 7, name: 'Utilities', icon: Zap, color: 'gray' },
      { id: 8, name: 'Entertainment', icon: Tv, color: 'pink' },
    ],
  };

  // Transaction types
  const transactionTypes = [
    {
      id: 'expense',
      type: 'expense',
      isRecurring: false,
      icon: ArrowDownRight,
      title: t('actions.oneTimeExpense'),
      description: t('actions.oneTimeExpenseDesc'),
      color: 'red',
      gradient: 'from-red-500 to-red-600',
    },
    {
      id: 'recurring-expense',
      type: 'expense',
      isRecurring: true,
      icon: Repeat,
      title: t('actions.recurringExpense'),
      description: t('actions.recurringExpenseDesc'),
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
    },
    {
      id: 'income',
      type: 'income',
      isRecurring: false,
      icon: ArrowUpRight,
      title: t('actions.oneTimeIncome'),
      description: t('actions.oneTimeIncomeDesc'),
      color: 'green',
      gradient: 'from-green-500 to-green-600',
    },
    {
      id: 'recurring-income',
      type: 'income',
      isRecurring: true,
      icon: Clock,
      title: t('actions.recurringIncome'),
      description: t('actions.recurringIncomeDesc'),
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
    },
  ];

  // Handle type selection
  const handleTypeSelect = (type) => {
    setActiveType(type);
    setFormData(prev => ({
      ...prev,
      is_recurring: type.isRecurring,
      category_id: categories[type.type][0].id,
    }));
    setError('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate amount
    const amountError = validateTransactionAmount(formData.amount, language);
    if (amountError) {
      setError(amountError);
      return;
    }

    if (!formData.description.trim()) {
      setError(t('actions.errors.descriptionRequired'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await createTransaction(activeType.type, {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      
      // Success animation
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setActiveType(null);
        setFormData({
          amount: '',
          description: '',
          category_id: null,
          is_recurring: false,
          recurring_interval: 'monthly',
          recurring_end_date: null,
          date: selectedDate.toISOString().split('T')[0],
        });
        setSuccess(false);
      }, 1500);
      
    } catch (err) {
      setError(err.message || t('actions.errors.addingTransaction'));
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  const typeCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    }),
    hover: {
      scale: 1.03,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('actions.quickActions')}
          </h3>
          <Badge variant="primary" className="text-xs">
            {t('actions.new')}
          </Badge>
        </div>
        
        <Button
          variant="primary"
          size="large"
          fullWidth
          onClick={() => setIsOpen(true)}
          className="group"
        >
          <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
          {t('actions.buttontitle')}
        </Button>
      </Card>

      {/* Transaction Modal */}
      <AnimatePresence>
        {isOpen && (
          <Modal
            isOpen={isOpen}
            onClose={() => !loading && setIsOpen(false)}
            size="large"
            className="max-w-4xl"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 -m-6 mb-6 rounded-t-xl">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">
                      {activeType ? activeType.title : t('actions.title')}
                    </h2>
                    <p className="text-white/80">
                      {activeType ? t('actions.fillDetails') : t('actions.selectType')}
                    </p>
                  </div>
                  <button
                    onClick={() => !loading && setIsOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Type Selection */}
              {!activeType && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {transactionTypes.map((type, index) => (
                    <motion.div
                      key={type.id}
                      custom={index}
                      variants={typeCardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                    >
                      <Card
                        clickable
                        onClick={() => handleTypeSelect(type)}
                        className="p-6 cursor-pointer border-2 border-transparent hover:border-primary-300 transition-all"
                      >
                        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${type.gradient} mb-4`}>
                          <type.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                          {type.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {type.description}
                        </p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Transaction Form */}
              {activeType && (
                <motion.form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="space-y-6"
                >
                  {/* Amount & Category Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Amount */}
                    <Input
                      label={t('actions.amount')}
                      type="text"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        amount: formatAmountInput(e.target.value) 
                      }))}
                      placeholder="0.00"
                      icon={DollarSign}
                      required
                      className="text-2xl font-bold"
                    />

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('actions.category')}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {categories[activeType.type].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, category_id: cat.id }))}
                            className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2
                              ${formData.category_id === cat.id
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                              }`}
                          >
                            <cat.icon className="w-4 h-4" />
                            {t(`categories.${cat.name}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <Input
                    label={t('actions.description')}
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('actions.descriptionPlaceholder')}
                    icon={FileText}
                    required
                  />

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('actions.date')}
                    </label>
                    <div className="relative">
                      <Button
                        ref={dateButtonRef}
                        type="button"
                        variant="outline"
                        fullWidth
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(formData.date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      
                      {showCalendar && (
                        <div className="absolute top-full mt-2 z-50">
                          <CalendarWidget
                            selectedDate={new Date(formData.date)}
                            onDateSelect={(date) => {
                              setFormData(prev => ({ 
                                ...prev, 
                                date: date.toISOString().split('T')[0] 
                              }));
                              setShowCalendar(false);
                            }}
                            onClose={() => setShowCalendar(false)}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recurring Options */}
                  {activeType.isRecurring && (
                    <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Repeat className="w-4 h-4" />
                        {t('actions.recurringOptions')}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          label={t('actions.frequency')}
                          value={formData.recurring_interval}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            recurring_interval: e.target.value 
                          }))}
                          options={[
                            { value: 'daily', label: t('actions.frequencies.daily') },
                            { value: 'weekly', label: t('actions.frequencies.weekly') },
                            { value: 'monthly', label: t('actions.frequencies.monthly') },
                          ]}
                        />
                        
                        <Input
                          label={t('actions.endDate')}
                          type="date"
                          value={formData.recurring_end_date || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            recurring_end_date: e.target.value 
                          }))}
                          min={formData.date}
                        />
                      </div>
                    </Card>
                  )}

                  {/* Error/Success Messages */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Alert type="error" dismissible onDismiss={() => setError('')}>
                          {error}
                        </Alert>
                      </motion.div>
                    )}
                    
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                      >
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                          <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {t('actions.success')}
                        </h3>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons */}
                  {!success && (
                    <div className="flex gap-3 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveType(null)}
                        disabled={loading}
                      >
                        {t('common.back')}
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        loading={loading}
                        disabled={loading || !formData.amount || !formData.description}
                      >
                        {loading ? t('common.loading') : t('actions.add')}
                      </Button>
                    </div>
                  )}
                </motion.form>
              )}
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
};

export default ActionsPanel;