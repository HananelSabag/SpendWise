/**
 * 🎯 FINAL WORKING TEMPLATES STEP
 * - Simple, clean, actually clickable
 * - Saves to database properly
 * - No complicated UI
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, Briefcase, Home, Smartphone, Heart, Music, Car,
  DollarSign, CreditCard, Utensils, Zap, Wifi, Shield, 
  ShoppingCart, Coffee, Fuel, Book, Dumbbell, Baby
} from 'lucide-react';
import { useCurrency } from '../../../../stores';
import { Button, Input } from '../../../ui';
import { cn } from '../../../../utils/helpers';

const FinalTemplatesStep = ({ 
  data = {}, 
  onDataUpdate, 
  onNext, 
  onBack 
}) => {
  const { formatCurrency } = useCurrency();
  
  // State
  const [selectedTemplates, setSelectedTemplates] = useState(data.selectedTemplates || []);
  const [activeCategory, setActiveCategory] = useState('income');

  // Templates - Fewer, focused options
  const templates = {
    income: [
      { id: 'salary', name: 'Monthly Salary', icon: Briefcase },
      { id: 'freelance', name: 'Freelance Work', icon: DollarSign },
      { id: 'business', name: 'Business Income', icon: Briefcase },
    ],
    expenses: [
      { id: 'rent', name: 'Rent/Mortgage', icon: Home },
      { id: 'utilities', name: 'Utilities', icon: Zap },
      { id: 'phone', name: 'Phone Bill', icon: Smartphone },
      { id: 'groceries', name: 'Groceries', icon: ShoppingCart },
      { id: 'car', name: 'Car/Transport', icon: Car },
      { id: 'insurance', name: 'Insurance', icon: Shield },
    ]
  };

  const currentTemplates = templates[activeCategory] || [];

  // Add template with amount
  const addTemplate = useCallback((template, amount) => {
    const numAmount = parseFloat(amount);
    if (numAmount <= 0) return;

    const newTemplate = {
      ...template,
      amount: numAmount,
      type: activeCategory === 'income' ? 'income' : 'expense'
    };

    const newSelected = [...selectedTemplates.filter(t => t.id !== template.id), newTemplate];
    setSelectedTemplates(newSelected);
    onDataUpdate({ selectedTemplates: newSelected });
  }, [selectedTemplates, activeCategory, onDataUpdate]);

  // Remove template
  const removeTemplate = useCallback((templateId) => {
    const newSelected = selectedTemplates.filter(t => t.id !== templateId);
    setSelectedTemplates(newSelected);
    onDataUpdate({ selectedTemplates: newSelected });
  }, [selectedTemplates, onDataUpdate]);

  // Template card component
  const TemplateCard = ({ template }) => {
    const [amount, setAmount] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const isSelected = selectedTemplates.some(t => t.id === template.id);
    const selectedTemplate = selectedTemplates.find(t => t.id === template.id);
    const Icon = template.icon;
    const isIncome = activeCategory === 'income';

    const handleAdd = () => {
      if (amount && parseFloat(amount) > 0) {
        addTemplate(template, amount);
        setAmount('');
        setIsAdding(false);
      }
    };

    return (
      <div
        className={cn(
          "p-4 rounded-lg border-2 transition-all",
          isSelected
            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
        )}
      >
        <div className="flex items-center space-x-3 mb-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isIncome ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
          )}>
            <Icon className={cn(
              "w-5 h-5",
              isIncome ? "text-green-600" : "text-red-600"
            )} />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {template.name}
            </h3>
          </div>
          {isSelected && (
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-600" />
              <Button
                onClick={() => removeTemplate(template.id)}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Remove
              </Button>
            </div>
          )}
        </div>

        {isSelected ? (
          <div className="text-center">
            <span className={cn(
              "text-lg font-bold",
              isIncome ? "text-green-600" : "text-red-600"
            )}>
              {isIncome ? '+' : '-'}{formatCurrency(selectedTemplate.amount)}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {!isAdding ? (
              <Button
                onClick={() => setIsAdding(true)}
                className="w-full"
                size="sm"
              >
                Add Template
              </Button>
            ) : (
              <div className="space-y-2">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd();
                    if (e.key === 'Escape') setIsAdding(false);
                  }}
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleAdd}
                    disabled={!amount || parseFloat(amount) <= 0}
                    size="sm"
                    className="flex-1"
                  >
                    Add
                  </Button>
                  <Button
                    onClick={() => setIsAdding(false)}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          📋 Quick Templates
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Set up recurring transactions with custom amounts
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveCategory('income')}
            className={cn(
              "px-6 py-2 rounded-md font-medium transition-all",
              activeCategory === 'income'
                ? "bg-white dark:bg-gray-700 text-green-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            💰 Income ({templates.income.length})
          </button>
          <button
            onClick={() => setActiveCategory('expenses')}
            className={cn(
              "px-6 py-2 rounded-md font-medium transition-all",
              activeCategory === 'expenses'
                ? "bg-white dark:bg-gray-700 text-red-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            💸 Expenses ({templates.expenses.length})
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {currentTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {/* Summary */}
      {selectedTemplates.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ✅ {selectedTemplates.length} templates ready
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            These will be saved as recurring transaction templates
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalTemplatesStep;
