/**
 * BulkDeleteModal — confirmation for deleting the selected transactions.
 * (Bank rows are tombstoned server-side so they can't re-import.)
 */

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

import { useTranslation } from '../../../../stores';
import { Button, Modal } from '../../../ui';

const BulkDeleteModal = ({ isOpen, count, onClose, onConfirm }) => {
  const { t } = useTranslation('transactions');
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('bulkDelete.title') || 'Delete Transactions'} size="sm">
      <div className="p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {t('selection.count', { count }) || `${count} selected`}
        </p>
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
          <div className="flex items-center text-red-800 dark:text-red-200 gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{t('bulkDelete.cannotUndo') || 'This action cannot be undone.'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">{t('actions.cancel') || 'Cancel'}</Button>
          <Button variant="destructive" onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
            <Trash2 className="w-4 h-4 me-2" /> {t('bulkDelete.deleteAll') || 'Delete All'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkDeleteModal;
