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
  Briefcase, TrendingUp, ArrowRight, CheckCircle,
  Clock, Zap, BarChart3, Eye, EyeOff, RefreshCw,
  ArrowUpRight, ArrowDownRight, Lightbulb, Target,
  GraduationCap
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation, useCurrency } from '../../../../stores';

import { Button, Card, Badge } from '../../../ui';
import { cn } from '../../../../utils/helpers';

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

  // ✅ Enhanced demo transaction card
  const DemoTransactionCard = ({ transaction, isRecurring = false, className = '', isSelected = false, onClick }) => {
    const isIncome = transaction.type === 'income';
    const IconComponent = transaction.icon;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn("cursor-pointer", className)}
        onClick={onClick}
      >
        <Card className={cn(
          "p-5 transition-all duration-300 rounded-xl relative overflow-hidden",
          isSelected ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : "",
          isRecurring ? [
            "bg-gradient-to-r from-purple-50 via-purple-25 to-indigo-50 dark:from-purple-900/30 dark:via-purple-800/20 dark:to-indigo-900/30",
            "border-l-4 border-l-purple-500 dark:border-l-purple-400",
            "border-2 border-purple-200 dark:border-purple-600",
            "shadow-lg shadow-purple-100/50 dark:shadow-purple-900/30"
          ] : [
            "border-2 border-gray-200 dark:border-gray-700",
            "bg-white dark:bg-gray-800",
            "hover:shadow-lg"
          ]
        )}>
          {/* Background pattern for recurring */}
          {isRecurring && (
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 transform rotate-45 translate-x-8 -translate-y-8" />
            </div>
          )}

          {/* Recurring indicator badge */}
          {isRecurring && (
            <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800">
              <Repeat className="w-4 h-4 text-white" />
            </div>
          )}
          
          {/* Main content */}
          <div className="flex items-start gap-4 w-full relative z-10">
            {/* Enhanced icon */}
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg border-2 flex-shrink-0",
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
              <IconComponent className="w-7 h-7" />
            </div>
            
            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className={cn(
                      "font-semibold text-lg leading-tight",
                      isRecurring 
                        ? "text-purple-900 dark:text-purple-100" 
                        : "text-gray-900 dark:text-white"
                    )}>
                      {transaction.description}
                    </h4>
                    
                    {isRecurring && (
                      <Badge 
                        variant="secondary" 
                        size="sm" 
                        className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300 font-medium shadow-sm"
                      >
                        <Repeat className="w-3 h-3 mr-1" />
                        Auto
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{transaction.category}</span>
                      {isRecurring ? (
                        <span className="text-purple-600 dark:text-purple-400">
                          • {transaction.frequency}
                        </span>
                      ) : (
                        <span>• {transaction.date}</span>
                      )}
                    </div>
                    
                    {isRecurring && (
                      <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        Next: {transaction.nextDate}
                      </div>
                    )}
                    
                    {!isRecurring && transaction.location && (
                      <div className="text-xs text-gray-500">
                        📍 {transaction.location}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Amount */}
                <div className="text-right ml-4">
                  <div className={cn(
                    "font-bold text-xl mb-1",
                    isIncome 
                      ? isRecurring ? "text-green-700" : "text-green-600"
                      : isRecurring ? "text-red-700" : "text-red-600"
                  )}>
                    {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                  {isRecurring && (
                    <div className="text-xs text-purple-600 font-medium">
                      Monthly
                    </div>
                  )}
                  {isSelected && (
                    <div className="text-xs text-blue-600 font-medium mt-1">
                      ✓ Selected
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  // ✅ Balance panel demo component
  const BalancePanelDemo = () => {
    const isPositiveChange = balanceChange > 0;
    const changePercentage = (Math.abs(balanceChange) / currentBalance) * 100;

    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 dark:from-gray-800 dark:via-blue-900/10 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-2xl p-6">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-10">
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500"
            style={{ backgroundSize: '200% 200%' }}
          />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total Balance
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Across all accounts
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="p-2 hover:bg-white/20 dark:hover:bg-gray-700/50"
              >
                {balanceVisible ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-white/20 dark:hover:bg-gray-700/50"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main balance */}
          <div className="mb-6">
            <div className="flex items-baseline space-x-4">
              <motion.div
                key={balanceVisible ? currentBalance : 'hidden'}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white"
              >
                {balanceVisible ? formatCurrency(currentBalance) : '••••••'}
              </motion.div>

              {/* Change indicator */}
              {balanceVisible && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium",
                    isPositiveChange 
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  )}
                >
                  {isPositiveChange ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span>
                    {isPositiveChange ? '+' : ''}{formatCurrency(balanceChange)}
                  </span>
                  <span className="text-xs opacity-75">
                    ({changePercentage.toFixed(1)}%)
                  </span>
                </motion.div>
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Compared to last month
            </p>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20 dark:border-gray-700/50">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(3247.92)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Income
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(2905.42)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Expenses
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(342.50)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Savings
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'transactions', label: 'Transactions', icon: Calendar },
    { id: 'balance', label: 'Balance Panel', icon: DollarSign },
    { id: 'benefits', label: 'Benefits', icon: Target }
  ];

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
          className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg"
        >
          <GraduationCap className="w-10 h-10 text-white" />
        </motion.div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">
          Learn Your Financial Dashboard 📊
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
          Understanding how SpendWise tracks and displays your money
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This foundation will help you make better financial decisions
        </p>
      </div>

      {/* Section Navigation */}
      <div className="flex justify-center mb-8 overflow-x-auto">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 min-w-max">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <motion.button
                key={section.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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
              </motion.button>
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
                      Two Types of Transactions
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Understanding the difference is key
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* One-time transactions */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">One-Time</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Individual purchases you enter manually
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" size="sm">Coffee</Badge>
                      <Badge variant="outline" size="sm">Gas</Badge>
                      <Badge variant="outline" size="sm">Shopping</Badge>
                    </div>
                  </div>

                  {/* Recurring transactions */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center mb-2">
                      <Repeat className="w-5 h-5 text-purple-600 mr-2" />
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100">Recurring</h4>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                      Automatic transactions that repeat on schedule
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" size="sm" className="bg-purple-100 text-purple-800">Salary</Badge>
                      <Badge variant="secondary" size="sm" className="bg-purple-100 text-purple-800">Rent</Badge>
                      <Badge variant="secondary" size="sm" className="bg-purple-100 text-purple-800">Subscriptions</Badge>
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
                      Your Balance Dashboard
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      See your money at a glance
                    </p>
                  </div>
                </div>

                <BalancePanelDemo />

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Hide/show balances for privacy</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Track changes over time</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Quick income vs expense overview</span>
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
                  Interactive Transaction Demo
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Click on transactions to see how they work. Notice the visual differences!
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* One-Time Transactions */}
                <div>
                  <div className="flex items-center mb-4">
                    <Calendar className="w-6 h-6 text-blue-600 mr-2" />
                    <h3 className="text-xl font-semibold">One-Time Transactions</h3>
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
                    <h3 className="text-xl font-semibold">Recurring Transactions</h3>
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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                >
                  <div className="flex items-center mb-2">
                    <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                      Great! You selected {selectedExamples.length} example{selectedExamples.length !== 1 ? 's' : ''}
                    </h4>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Notice how recurring transactions have purple styling, special badges, and show their next occurrence. 
                    This makes it easy to spot automated transactions in your list!
                  </p>
                </motion.div>
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
                  Your Balance Dashboard
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Try clicking the eye icon to hide/show your balance
                </p>
              </div>

              <div className="mb-8">
                <BalancePanelDemo />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Privacy Control</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hide balances when others might see your screen
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Track Progress</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    See if your balance is growing or shrinking
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Quick Overview</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Income, expenses, and savings at a glance
                  </p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      Balance Panel Understanding ✓
                    </h4>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Perfect! You now understand how the balance panel works. This will be your financial command center in SpendWise.
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
                  Why This Knowledge Matters
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Understanding these concepts will transform your financial management
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Financial Benefits */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Financial Benefits
                  </h3>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Better Budgeting</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Recurring transactions help you predict future cash flow and plan ahead
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Spot Patterns</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Easily identify spending patterns and subscription costs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Track Progress</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Monitor your financial health with clear balance insights
                      </p>
                    </div>
                  </div>
                </div>

                {/* Practical Benefits */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Practical Benefits
                  </h3>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Save Time</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        No need to manually enter salary, rent, or subscriptions every month
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Never Miss</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get notified about upcoming recurring transactions before they happen
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Eye className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Privacy Control</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Hide balances when sharing your screen or using in public
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    🎉 You're Ready to Take Control!
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    With this knowledge, you'll be able to effectively use SpendWise to improve your financial health and save time managing your money.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation buttons handled by modal footer */}
    </motion.div>
  );
};

export default ModernEducationStep;

