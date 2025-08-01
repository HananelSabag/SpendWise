/**
 * 📚 TRANSACTION EDUCATION STEP - New Onboarding Page 2
 * Visual education about recurring vs one-time transactions with live examples
 * @version 3.0.0 - REDESIGNED ONBOARDING
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Repeat, Calendar, DollarSign, Coffee, Car, Home,
  Briefcase, TrendingUp, ArrowRight, CheckCircle,
  Clock, Zap, BarChart3
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation, useCurrency } from '../../../../stores';

import { Button, Card, Badge } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 📚 Transaction Education Step Component
 */
const TransactionEducationStep = ({ 
  data = {}, 
  onDataUpdate, 
  onNext, 
  onBack 
}) => {
  // ✅ Zustand stores
  const { t, isRTL } = useTranslation('onboarding');
  const { formatCurrency } = useCurrency();

  // ✅ Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedExample, setSelectedExample] = useState('coffee');

  // ✅ Example transactions for demonstration
  const exampleTransactions = {
    oneTime: [
      {
        id: 'coffee',
        description: 'Coffee at Starbucks',
        amount: 5.50,
        type: 'expense',
        icon: Coffee,
        category: 'Food & Dining',
        date: 'Today'
      },
      {
        id: 'gas',
        description: 'Gas Station Fill-up',
        amount: 45.00,
        type: 'expense',
        icon: Car,
        category: 'Transportation',
        date: 'Yesterday'
      },
      {
        id: 'freelance',
        description: 'Freelance Project Payment',
        amount: 750.00,
        type: 'income',
        icon: Briefcase,
        category: 'Work',
        date: '3 days ago'
      }
    ],
    recurring: [
      {
        id: 'salary',
        description: 'Monthly Salary',
        amount: 4500.00,
        type: 'income',
        icon: Briefcase,
        category: 'Salary',
        frequency: 'Every month',
        template_id: 'sal_001'
      },
      {
        id: 'rent',
        description: 'Apartment Rent',
        amount: 1200.00,
        type: 'expense',
        icon: Home,
        category: 'Housing',
        frequency: 'Every month',
        template_id: 'rent_001'
      },
      {
        id: 'subscription',
        description: 'Netflix Subscription',
        amount: 15.99,
        type: 'expense',
        icon: TrendingUp,
        category: 'Entertainment',
        frequency: 'Every month',
        template_id: 'sub_001'
      }
    ]
  };

  // ✅ Mock TransactionCard component for demo
  const DemoTransactionCard = ({ transaction, isRecurring = false, className = '' }) => {
    const isIncome = transaction.type === 'income';
    const IconComponent = transaction.icon;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className={cn("cursor-pointer", className)}
      >
        <Card className={cn(
          "p-4 hover:shadow-lg transition-all duration-300 rounded-xl relative",
          // 🔄 Enhanced visual distinction for recurring transactions
          isRecurring ? [
            "bg-gradient-to-r from-purple-50 via-purple-25 to-indigo-50 dark:from-purple-900/30 dark:via-purple-800/20 dark:to-indigo-900/30",
            "border-l-4 border-l-purple-500 dark:border-l-purple-400",
            "border-2 border-purple-200 dark:border-purple-600",
            "shadow-lg shadow-purple-100/50 dark:shadow-purple-900/30"
          ] : [
            "border-2 border-gray-200 dark:border-gray-700",
            "bg-white dark:bg-gray-800"
          ]
        )}>
          {/* 🎨 Recurring transaction indicator */}
          {isRecurring && (
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800">
              <Repeat className="w-3 h-3 text-white" />
            </div>
          )}
          
          {/* Main content */}
          <div className="flex items-start gap-3 w-full">
            {/* Icon */}
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border-2",
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
              <IconComponent className="w-6 h-6" />
            </div>
            
            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={cn(
                      "font-semibold text-base",
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
                        Recurring
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{transaction.category}</span>
                    {isRecurring ? (
                      <span className="text-purple-600 dark:text-purple-400">
                        • {transaction.frequency}
                      </span>
                    ) : (
                      <span>• {transaction.date}</span>
                    )}
                  </div>
                </div>
                
                {/* Amount */}
                <div className="text-right">
                  <div className={cn(
                    "font-bold text-lg",
                    isIncome 
                      ? isRecurring ? "text-green-700" : "text-green-600"
                      : isRecurring ? "text-red-700" : "text-red-600"
                  )}>
                    {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                  {isRecurring && (
                    <div className="text-xs text-purple-600 font-medium">
                      Recurring
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

  // ✅ Handle next step
  const handleNext = () => {
    onDataUpdate({ ...data, understoodConcepts: true });
    onNext();
  };

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
          className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg"
        >
          <BarChart3 className="w-8 h-8 text-white" />
        </motion.div>
        
        <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-white">
          Understanding Your Transactions 📊
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          Learn the difference between one-time and recurring transactions
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This is the foundation of smart financial management
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'onetime', label: 'One-Time', icon: Calendar },
            { id: 'recurring', label: 'Recurring', icon: Repeat }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center px-4 py-2 rounded-md font-medium transition-all text-sm",
                  activeTab === tab.id
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid lg:grid-cols-2 gap-8"
          >
            {/* One-Time Transactions */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mr-4">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    One-Time Transactions
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Individual purchases or income
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Happen once, manually entered</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Like coffee, gas, shopping</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Standard white/gray styling</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {exampleTransactions.oneTime.map((transaction) => (
                  <DemoTransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    isRecurring={false}
                  />
                ))}
              </div>
            </Card>

            {/* Recurring Transactions */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mr-4">
                  <Repeat className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Recurring Transactions
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Automatic, repeating transactions
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Automatically repeat on schedule</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Like salary, rent, subscriptions</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Purple styling with special badges</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {exampleTransactions.recurring.map((transaction) => (
                  <DemoTransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    isRecurring={true}
                  />
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'onetime' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  One-Time Transactions
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Individual transactions that happen once and are manually entered
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Instant</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enter them when they happen
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Variable</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Different amounts each time
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Flexible</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No fixed schedule
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Examples of One-Time Transactions:</h3>
                {exampleTransactions.oneTime.map((transaction) => (
                  <DemoTransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    isRecurring={false}
                  />
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'recurring' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Repeat className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Recurring Transactions
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Automatic transactions that repeat on a schedule
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Repeat className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Automatic</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Added automatically on schedule
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Scheduled</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Weekly, monthly, or yearly
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-pink-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Predictable</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Help with budgeting
                  </p>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  🎨 Visual Recognition
                </h4>
                <p className="text-purple-800 dark:text-purple-200 text-sm">
                  Recurring transactions have special purple styling, badges, and indicators so you can easily spot them in your transaction list.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Examples of Recurring Transactions:</h3>
                {exampleTransactions.recurring.map((transaction) => (
                  <DemoTransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    isRecurring={true}
                  />
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Benefits Section */}
      <Card className="p-6 mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🚀 Why This Matters for Your Financial Health
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Better Budgeting</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Recurring transactions help predict future cash flow
              </p>
            </div>
            
            <div className="text-center">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Save Time</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No need to manually enter salary, rent every month
              </p>
            </div>
            
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Track Patterns</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                See spending patterns and subscription costs
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <Button
          variant="outline"
          onClick={onBack}
          className="min-w-[120px]"
        >
          Back
        </Button>
        
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Step 2 of 3 • Transaction Education
          </p>
        </div>
        
        <Button
          variant="primary"
          onClick={handleNext}
          className="min-w-[120px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          Next: Quick Setup
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};

export default TransactionEducationStep;