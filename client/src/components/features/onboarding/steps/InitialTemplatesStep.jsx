import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, DollarSign, Home, Phone, CheckCircle, Clock,
  ChevronDown, Trash2
} from 'lucide-react';

import { useLanguage } from '../../../../context/LanguageContext';
import { useCurrency } from '../../../../context/CurrencyContext';
import { cn } from '../../../../utils/helpers';
import { Button } from '../../../ui';

const InitialTemplatesStep = ({ onNext, onPrevious, stepData, updateStepData }) => {
  const { t, language } = useLanguage();
  const { currency } = useCurrency();
  const isRTL = language === 'he';
  
  const [templates, setTemplates] = useState(stepData.templates || []);

  const templateSuggestions = [
    {
      id: 'salary',
      icon: DollarSign,
      title: t('onboarding.welcome.examples.salary'),
      type: 'income',
      amount: 5000,
      frequency: 'monthly'
    },
    {
      id: 'rent',
      icon: Home,
      title: t('onboarding.welcome.examples.rent'),
      type: 'expense',
      amount: 1200,
      frequency: 'monthly'
    },
    {
      id: 'phone',
      icon: Phone,
      title: t('onboarding.welcome.examples.phone'),
      type: 'expense',
      amount: 50,
      frequency: 'monthly'
    }
  ];

  const addFromSuggestion = (suggestion) => {
    const newTemplate = {
      id: Date.now().toString(),
      ...suggestion
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

  const handleContinue = () => {
    updateStepData({ templates });
    onNext();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 text-white rounded-full mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('onboarding.templates.title')}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300">
            {t('onboarding.templates.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {templateSuggestions.map((suggestion) => {
            const isAdded = templates.some(t => t.title === suggestion.title);
            
            return (
              <button
                key={suggestion.id}
                onClick={() => !isAdded && addFromSuggestion(suggestion)}
                disabled={isAdded}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all text-left",
                  isAdded 
                    ? "bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed"
                    : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <suggestion.icon className="w-6 h-6 text-blue-600" />
                  {isAdded && <CheckCircle className="w-5 h-5 text-green-500" />}
                </div>
                
                <h4 className="font-medium text-gray-900 mb-1">
                  {suggestion.title}
                </h4>
                
                <p className="text-sm text-gray-500">
                  {suggestion.type === 'income' ? '+' : '-'}
                  {suggestion.amount.toLocaleString()} {currency}
                </p>
              </button>
            );
          })}
        </div>

        {templates.length > 0 && (
          <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('templates.yourTemplates')} ({templates.length})
          </h3>
            
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center">
                    <template.icon className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {template.title}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {template.amount.toLocaleString()} {currency}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTemplate(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl">
          <Clock className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {templates.length > 0 
              ? t('templates.setupComplete', { count: templates.length })
              : t('templates.setupOptional')
            }
          </h4>
          <p className="text-gray-600 dark:text-gray-300">
            {templates.length > 0 
              ? t('templates.canAddMore')
              : t('templates.canSkipForNow')
            }
          </p>
        </div>

        <div className={cn(
          "flex justify-between items-center pt-6 border-t",
          isRTL ? "flex-row-reverse" : ""
        )}>
          <Button
            variant="ghost"
            onClick={onPrevious}
            className="flex items-center"
          >
            {isRTL ? <ChevronDown className="w-4 h-4 mr-2 rotate-90" /> : <ChevronDown className="w-4 h-4 ml-2 -rotate-90" />}
            {t('onboarding.common.previous')}
          </Button>

          <Button
            onClick={handleContinue}
            className="flex items-center bg-green-500 hover:bg-green-600 text-white px-8"
          >
            {t('onboarding.common.complete')}
            <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default InitialTemplatesStep; 