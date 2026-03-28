/**
 * 📚 MODERN EDUCATION STEP - Enhanced Step 2
 * Visual education about transactions and balance panel with interactive examples
 * Features: Transaction types, Balance panel explanation, Interactive demos
 * @version 4.0.0 - MODERN REDESIGN
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Repeat, Calendar, DollarSign, Coffee, Car, Home,
  Briefcase, TrendingUp, CheckCircle, AlertCircle,
  Clock, BarChart3, Eye, EyeOff, RefreshCw,
  ArrowUpRight, ArrowDownRight, Lightbulb, Target
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation, useCurrency } from '../../../../stores';

import { Button, Card, Badge } from '../../../ui';
import { cn } from '../../../../utils/helpers';

// ── Module-level sub-components (stable references) ──────────────────────────

const DemoTransactionCard = ({ transaction, isRecurring = false, className = '', isSelected = false, onClick }) => {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation('onboarding');
  const isIncome = transaction.type === 'income';
  const IconComponent = transaction.icon;

  return (
    <div
      className={cn("cursor-pointer", className)}
      onClick={onClick}
    >
      <Card className={cn(
        "p-3 transition-all duration-300 rounded-xl relative overflow-hidden",
        isSelected ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : "",
        isRecurring ? [
          "bg-gradient-to-r from-purple-50 via-purple-25 to-indigo-50 dark:from-purple-900/30 dark:via-purple-800/20 dark:to-indigo-900/30",
          "border-l-[3px] border-l-purple-500 dark:border-l-purple-400",
          "border-2 border-purple-200 dark:border-purple-600",
          "shadow-md shadow-purple-100/50 dark:shadow-purple-900/30"
        ] : [
          "border-2 border-gray-200 dark:border-gray-700",
          "bg-white dark:bg-gray-800",
          "hover:shadow-md"
        ]
      )}>
        {isRecurring && (
          <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 transform rotate-45 translate-x-8 -translate-y-8" />
          </div>
        )}
        {isRecurring && (
          <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800">
            <Repeat className="w-4 h-4 text-white" />
          </div>
        )}
        <div className="flex items-start gap-3 w-full relative z-10">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shadow border-2 flex-shrink-0",
            isRecurring ? [
              isIncome
                ? "bg-gradient-to-br from-green-400 via-green-500 to-purple-500 text-white border-purple-300"
                : "bg-gradient-to-br from-red-400 via-red-500 to-purple-500 text-white border-purple-300"
            ] : [
              isIncome
                ? "bg-gradient-to-br from-green-50 to-green-100 text-green-600 border-green-200"
                : "bg-gradient-to-br from-red-50 to-red-100 text-red-600 border-red-200"
            ]
          )}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className={cn(
                    "font-semibold text-sm leading-tight",
                    isRecurring ? "text-purple-900 dark:text-purple-100" : "text-gray-900 dark:text-white"
                  )}>
                    {transaction.description}
                  </h4>
                  {isRecurring && (
                    <Badge variant="secondary" size="sm" className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300 font-medium shadow-sm">
                      <Repeat className="w-3 h-3 mr-1" />{t('education.demo.autoLabel') || 'Auto'}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{transaction.category}</span>
                    {isRecurring ? (
                      <span className="text-purple-600 dark:text-purple-400">• {transaction.frequency}</span>
                    ) : (
                      <span>• {transaction.date}</span>
                    )}
                  </div>
                  {isRecurring && (
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                      {t('education.demo.next') || 'Next:'} {transaction.nextDate}
                    </div>
                  )}
                  {!isRecurring && transaction.location && (
                    <div className="text-xs text-gray-500">📍 {transaction.location}</div>
                  )}
                </div>
              </div>
              <div className="text-right ml-2">
                <div className={cn(
                  "font-bold text-sm mb-0.5",
                  isIncome
                    ? isRecurring ? "text-green-700" : "text-green-600"
                    : isRecurring ? "text-red-700" : "text-red-600"
                )}>
                  {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                </div>
                {isRecurring && <div className="text-xs text-purple-600 font-medium">{t('education.demo.monthly') || 'Monthly'}</div>}
                {isSelected && <div className="text-xs text-blue-600 font-medium mt-1">{t('education.demo.selected') || '✓ Selected'}</div>}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const BalancePanelDemo = ({ balanceVisible, onToggleVisible, currentBalance, balanceChange }) => {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation('onboarding');
  const isPositiveChange = balanceChange > 0;
  const changePercentage = (Math.abs(balanceChange) / currentBalance) * 100;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 dark:from-gray-800 dark:via-blue-900/10 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl p-4">
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('education.demo.totalBalance') || 'Total Balance'}</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggleVisible} className="p-1.5 hover:bg-white/20 dark:hover:bg-gray-700/50">
            {balanceVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </Button>
        </div>
        <div className="mb-3">
          <div className="flex items-baseline gap-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {balanceVisible ? formatCurrency(currentBalance) : '••••••'}
            </div>
            {balanceVisible && (
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                isPositiveChange
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              )}>
                {isPositiveChange ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{isPositiveChange ? '+' : ''}{formatCurrency(balanceChange)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/20 dark:border-gray-700/50">
          <div className="text-center">
            <div className="text-xs font-medium text-gray-900 dark:text-white">{formatCurrency(3247.92)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('education.demo.income') || 'Income'}</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-gray-900 dark:text-white">{formatCurrency(2905.42)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('education.demo.expenses') || 'Expenses'}</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-gray-900 dark:text-white">{formatCurrency(342.50)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('education.demo.savings') || 'Savings'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * 📚 Modern Education Step Component
 */
const ModernEducationStep = ({
  data = {}, 
  onDataUpdate, 
  onNext, 
  onBack 
}) => {
  // ✅ Zustand stores
  const { t, isRTL } = useTranslation('onboarding');
  const { t: tc } = useTranslation('common');
  const { formatCurrency } = useCurrency();

  // ✅ Local state - ENHANCED
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedExamples, setSelectedExamples] = useState(data.selectedExamples || []);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [currentBalance] = useState(5247.83);
  const [balanceChange] = useState(342.50);
  const [interactiveDemo, setInteractiveDemo] = useState('transactions');

  // ✅ Enhanced example transactions
  const exampleTransactions = {
    oneTime: [
      {
        id: 'coffee',
        description: 'Morning Coffee at Café Luna',
        amount: 4.75,
        type: 'expense',
        icon: Coffee,
        category: 'Food & Dining',
        date: 'Today, 8:15 AM',
        location: 'Downtown'
      },
      {
        id: 'gas',
        description: 'Shell Gas Station',
        amount: 52.30,
        type: 'expense',
        icon: Car,
        category: 'Transportation',
        date: 'Yesterday, 6:45 PM',
        location: 'Highway 101'
      },
      {
        id: 'freelance',
        description: 'Web Design Project Payment',
        amount: 850.00,
        type: 'income',
        icon: Briefcase,
        category: 'Freelance Work',
        date: '3 days ago',
        location: 'Remote'
      }
    ],
    recurring: [
      {
        id: 'salary',
        description: 'Monthly Salary - TechCorp',
        amount: 4500.00,
        type: 'income',
        icon: Briefcase,
        category: 'Primary Income',
        frequency: 'Monthly (1st)',
        nextDate: 'Dec 1, 2024',
        template_id: 'sal_001'
      },
      {
        id: 'rent',
        description: 'Apartment Rent Payment',
        amount: 1350.00,
        type: 'expense',
        icon: Home,
        category: 'Housing',
        frequency: 'Monthly (5th)',
        nextDate: 'Dec 5, 2024',
        template_id: 'rent_001'
      },
      {
        id: 'subscription',
        description: 'Netflix Premium',
        amount: 17.99,
        type: 'expense',
        icon: TrendingUp,
        category: 'Entertainment',
        frequency: 'Monthly (15th)',
        nextDate: 'Dec 15, 2024',
        template_id: 'sub_001'
      }
    ]
  };

  // ✅ Handle example selection
  const handleExampleSelect = useCallback((exampleId) => {
    const newSelected = selectedExamples.includes(exampleId)
      ? selectedExamples.filter(id => id !== exampleId)
      : [...selectedExamples, exampleId];
    
    setSelectedExamples(newSelected);
    onDataUpdate({ 
      ...data, 
      selectedExamples: newSelected,
      understoodTransactionTypes: true,
      understoodBalancePanel: interactiveDemo === 'balance'
    });
  }, [selectedExamples, data, onDataUpdate, interactiveDemo]);

  // ✅ Handle next step
  const handleNext = () => {
    onDataUpdate({ 
      ...data, 
      selectedExamples,
      understoodTransactionTypes: true, 
      understoodBalancePanel: true 
    });
    onNext();
  };

  // ✅ Education sections
  const sections = [
    { id: 'overview', label: t('education.sections.overview') || 'Overview', icon: BarChart3 },
    { id: 'transactions', label: t('education.sections.transactions') || 'Transactions', icon: Calendar },
    { id: 'balance', label: t('education.sections.balance') || 'Balance Panel', icon: DollarSign },
    { id: 'benefits', label: t('education.sections.benefits') || 'Benefits', icon: Target }
  ];

  return (
    <div className="min-h-full" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Section Navigation */}
      <div className="flex justify-center mb-8 overflow-x-auto">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 min-w-max">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg font-medium transition-all text-sm whitespace-nowrap",
                  activeSection === section.id
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <Icon className="w-4 h-4 mr-2" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        {activeSection === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-6xl mx-auto"
          >
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Transaction Types Overview */}
              <Card className="p-6">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mr-4">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {t('education.overview.twoTypesTitle') || 'Two Types of Transactions'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {t('education.overview.twoTypesSubtitle') || 'Understanding the difference is key'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* One-time transactions */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">{t('education.overview.oneTimeTitle') || 'One-Time'}</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {t('education.overview.oneTimeDesc') || 'Individual purchases you enter manually'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" size="sm">{tc('transactions.coffee')}</Badge>
                      <Badge variant="outline" size="sm">{tc('transactions.gas')}</Badge>
                      <Badge variant="outline" size="sm">{tc('transactions.shopping')}</Badge>
                    </div>
                  </div>

                  {/* Recurring transactions */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center mb-2">
                      <Repeat className="w-5 h-5 text-purple-600 mr-2" />
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100">{t('education.overview.recurringTitle') || 'Recurring'}</h4>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                      {t('education.overview.recurringDesc') || 'Automatic transactions that repeat on schedule'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" size="sm" className="bg-purple-100 text-purple-800">{tc('transactions.salary')}</Badge>
                      <Badge variant="secondary" size="sm" className="bg-purple-100 text-purple-800">{tc('transactions.rent')}</Badge>
                      <Badge variant="secondary" size="sm" className="bg-purple-100 text-purple-800">{tc('transactions.subscriptions')}</Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Balance Panel Overview */}
              <Card className="p-6">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mr-4">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {t('education.overview.balanceDashTitle') || 'Your Balance Dashboard'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {t('education.overview.balanceDashSubtitle') || 'See your money at a glance'}
                    </p>
                  </div>
                </div>

                <BalancePanelDemo balanceVisible={balanceVisible} onToggleVisible={() => setBalanceVisible(v => !v)} currentBalance={currentBalance} balanceChange={balanceChange} />

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>{t('education.overview.hideShowPrivacy') || 'Hide/show balances for privacy'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>{t('education.overview.trackChanges') || 'Track changes over time'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>{t('education.overview.incomeVsExpense') || 'Quick income vs expense overview'}</span>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {activeSection === 'transactions' && (
          <motion.div
            key="transactions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-6xl mx-auto"
          >
            <Card className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('education.transactions.interactiveDemoTitle') || 'Interactive Transaction Demo'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('education.transactions.interactiveDemoDesc') || 'Click on transactions to see how they work. Notice the visual differences!'}
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* One-Time Transactions */}
                <div>
                  <div className="flex items-center mb-4">
                    <Calendar className="w-6 h-6 text-blue-600 mr-2" />
                    <h3 className="text-xl font-semibold">{t('education.transactions.oneTimeTitle') || 'One-Time Transactions'}</h3>
                  </div>
                  <div className="space-y-3">
                    {exampleTransactions.oneTime.map((transaction) => (
                      <DemoTransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        isRecurring={false}
                        isSelected={selectedExamples.includes(transaction.id)}
                        onClick={() => handleExampleSelect(transaction.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Recurring Transactions */}
                <div>
                  <div className="flex items-center mb-4">
                    <Repeat className="w-6 h-6 text-purple-600 mr-2" />
                    <h3 className="text-xl font-semibold">{t('education.transactions.recurringTitle') || 'Recurring Transactions'}</h3>
                  </div>
                  <div className="space-y-3">
                    {exampleTransactions.recurring.map((transaction) => (
                      <DemoTransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        isRecurring={true}
                        isSelected={selectedExamples.includes(transaction.id)}
                        onClick={() => handleExampleSelect(transaction.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {selectedExamples.length > 0 && (
                <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                      {t('education.transactions.selectedFeedback', { count: selectedExamples.length }) || `Great! You selected ${selectedExamples.length} examples`}
                    </h4>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {t('education.transactions.selectedFeedbackDesc') || 'Notice how recurring transactions have purple styling, special badges, and show their next occurrence. This makes it easy to spot automated transactions in your list!'}
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {activeSection === 'balance' && (
          <motion.div
            key="balance"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('education.balanceSection.title') || 'Your Balance Dashboard'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('education.balanceSection.subtitle') || 'Try clicking the eye icon to hide/show your balance'}
                </p>
              </div>

              <div className="mb-8">
                <BalancePanelDemo balanceVisible={balanceVisible} onToggleVisible={() => setBalanceVisible(v => !v)} currentBalance={currentBalance} balanceChange={balanceChange} />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('education.balanceSection.privacyTitle') || 'Privacy Control'}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('education.balanceSection.privacyDesc') || 'Hide balances when others might see your screen'}
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('education.balanceSection.trackTitle') || 'Track Progress'}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('education.balanceSection.trackDesc') || 'See if your balance is growing or shrinking'}
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('education.balanceSection.overviewTitle') || 'Quick Overview'}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('education.balanceSection.overviewDesc') || 'Income, expenses, and savings at a glance'}
                  </p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      {t('education.balanceSection.understoodTitle') || 'Balance Panel Understanding ✓'}
                    </h4>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      {t('education.balanceSection.understoodDesc') || 'Perfect! You now understand how the balance panel works. This will be your financial command center in SpendWise.'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {activeSection === 'benefits' && (
          <motion.div
            key="benefits"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-6xl mx-auto"
          >
            <Card className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('education.benefitsSection.title') || 'Why This Knowledge Matters'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('education.benefitsSection.subtitle') || 'Understanding these concepts will transform your financial management'}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Financial Benefits */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {t('education.benefitsSection.financialTitle') || 'Financial Benefits'}
                  </h3>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t('education.benefitsSection.budgetingTitle') || 'Better Budgeting'}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('education.benefitsSection.budgetingDesc') || 'Recurring transactions help you predict future cash flow and plan ahead'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t('education.benefitsSection.patternsTitle') || 'Spot Patterns'}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('education.benefitsSection.patternsDesc') || 'Easily identify spending patterns and subscription costs'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t('education.benefitsSection.trackTitle') || 'Track Progress'}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('education.benefitsSection.trackDesc') || 'Monitor your financial health with clear balance insights'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Practical Benefits */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {t('education.benefitsSection.practicalTitle') || 'Practical Benefits'}
                  </h3>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t('education.benefitsSection.saveTimeTitle') || 'Save Time'}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('education.benefitsSection.saveTimeDesc') || 'No need to manually enter salary, rent, or subscriptions every month'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t('education.benefitsSection.neverMissTitle') || 'Never Miss'}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('education.benefitsSection.neverMissDesc') || 'Get notified about upcoming recurring transactions before they happen'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Eye className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t('education.benefitsSection.privacyTitle') || 'Privacy Control'}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('education.benefitsSection.privacyDesc') || 'Hide balances when sharing your screen or using in public'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('education.benefitsSection.readyTitle') || "🎉 You're Ready to Take Control!"}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('education.benefitsSection.readyDesc') || "With this knowledge, you'll be able to effectively use SpendWise to improve your financial health and save time managing your money."}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ModernEducationStep;

