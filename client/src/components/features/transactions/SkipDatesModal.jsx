/**
 * SkipDatesModal Component
 * UI for skipping specific dates in recurring transactions
 * ADDRESSES GAP #3: skip_dates array UI implementation
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  X,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  Clock
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { Modal, Button, Alert, Badge } from '../../ui';
import CalendarWidget from '../../common/CalendarWidget';
import { dateHelpers } from '../../../utils/helpers';
import { transactionAPI } from '../../../utils/api';
import toast from 'react-hot-toast';

const SkipDatesModal = ({ isOpen, onClose, template, onSuccess }) => {
  const { t, language } = useLanguage();
  const [selectedDates, setSelectedDates] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const isRTL = language === 'he';

  const handleAddDate = (date) => {
    const dateStr = dateHelpers.toISODate(date);
    if (!selectedDates.includes(dateStr)) {
      setSelectedDates([...selectedDates, dateStr].sort());
    }
    setShowCalendar(false);
  };

  const handleRemoveDate = (dateStr) => {
    setSelectedDates(selectedDates.filter(d => d !== dateStr));
  };

  const handleSave = async () => {
    if (selectedDates.length === 0) {
      toast.error(t('transactions.skipDates.selectAtLeast') || 'Please select at least one date');
      return;
    }
    
    setSaving(true);
    
    try {
      // Use the correct API method
      await transactionAPI.skipTemplateDates(template.id, selectedDates);
      
      toast.success(t('transactions.skipDates.success') || 'Dates skipped successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Skip dates error:', error);
      toast.error(t('transactions.skipDates.error') || 'Failed to skip dates');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('transactions.skipDates.title')}
      size="medium"
    >
      <div className="space-y-4">
        <Alert type="info">
          <Clock className="w-4 h-4" />
          <p className="text-sm">
            {t('transactions.skipDates.info', { 
              name: template?.description,
              interval: t(`actions.frequencies.${template?.interval_type}`)
            })}
          </p>
        </Alert>

        {/* Date Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('transactions.skipDates.selectDates')}
            </label>
            <Button
              variant="outline"
              size="small"
              onClick={() => setShowCalendar(!showCalendar)}
              icon={Calendar}
            >
              {t('transactions.skipDates.addDate')}
            </Button>
          </div>

          {showCalendar && (
            <div className="mb-4">
              <CalendarWidget
                selectedDate={new Date()}
                onDateSelect={handleAddDate}
                minDate={new Date()}
                inline
              />
            </div>
          )}

          {/* Selected Dates List */}
          {selectedDates.length > 0 ? (
            <div className="space-y-2">
              {selectedDates.map(dateStr => (
                <motion.div
                  key={dateStr}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {dateHelpers.format(dateStr, 'PPP', language)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => handleRemoveDate(dateStr)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('transactions.skipDates.noDatesSelected')}
            </div>
          )}
        </div>

        {/* Current Skip Dates */}
        {template?.skip_dates?.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('transactions.skipDates.alreadySkipped')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {template.skip_dates.map(date => (
                <Badge key={date} variant="default" size="small">
                  {dateHelpers.format(date, 'PP', language)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={selectedDates.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            {t('transactions.skipDates.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SkipDatesModal;