import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat, Pause, Play, Edit3, Trash2, Eye, Calendar, Clock, RefreshCw, StopCircle } from 'lucide-react';
import { Button, Badge } from '../../../ui';
import { cn, dateHelpers } from '../../../../utils/helpers';
import { useTranslation } from '../../../../stores';

const TemplateCard = ({ template, onEdit, onDelete, onPauseResume, onRegenerate, onStop, formatCurrency }) => {
  const { t } = useTranslation('transactions');
  const [expanded, setExpanded] = useState(false);
  const isActive = template.status === 'active' || template.is_active === true;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn('rounded-lg border overflow-hidden', isActive ? 'border-green-200 bg-green-50/30 dark:border-green-700 dark:bg-green-900/10' : 'border-gray-200 bg-gray-50/30 dark:border-gray-700 dark:bg-gray-800/30')}>
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', isActive ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500')}>
            <Repeat className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">{template.description || t('recurring.noDescription', 'Recurring')}</h4>
              <Badge variant={isActive ? 'success' : 'secondary'} size="sm">{isActive ? t('recurring.active', 'Active') : t('recurring.paused', 'Paused')}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span>{template.category_name || t('category.uncategorized', 'Uncategorized')}</span>
              <span>•</span>
              <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />{t(`recurring.frequency.${template.frequency || template.interval_type}`, template.frequency || template.interval_type || 'monthly')}</span>
              {template.next_run_date && (
                <>
                  <span>•</span>
                  <span className="flex items-center"><Clock className="w-3 h-3 mr-1" />{t('recurring.nextRun', 'Next')}: {dateHelpers.formatShort(template.next_run_date)}</span>
                </>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className={cn('font-bold text-lg', template.type === 'income' ? 'text-green-600' : 'text-red-600')}>
              {template.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(template.amount))}
            </div>
            <div className="text-sm text-gray-500">{t(`transaction.type.${template.type}`, template.type)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700" onClick={() => setExpanded((v) => !v)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-yellow-600 hover:text-yellow-700" onClick={() => onEdit(template)}>
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className={cn(isActive ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700')} onClick={() => onPauseResume(template)}>
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700" onClick={onRegenerate}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700" onClick={onStop}>
            <StopCircle className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => onDelete(template)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('recurring.created', 'Created')}:</span>
                <div className="text-gray-500">{dateHelpers.formatMedium(template.created_at)}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('recurring.totalRuns', 'Total Runs')}:</span>
                <div className="text-gray-500">{template.execution_count || 0}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('recurring.lastRun', 'Last Run')}:</span>
                <div className="text-gray-500">{template.last_run_date ? dateHelpers.formatMedium(template.last_run_date) : t('recurring.never', 'Never')}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('recurring.endDate', 'End Date')}:</span>
                <div className="text-gray-500">{template.end_date ? dateHelpers.formatMedium(template.end_date) : t('recurring.indefinite', 'Indefinite')}</div>
              </div>
            </div>
            {template.notes && (
              <div className="mt-3">
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('fields.notes', 'Notes')}:</span>
                <div className="text-gray-500 mt-1">{template.notes}</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TemplateCard;


