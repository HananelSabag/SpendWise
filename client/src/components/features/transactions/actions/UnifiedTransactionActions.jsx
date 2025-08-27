import React from 'react';

import AddTransactionModal from '../../transactions/modals/AddTransactionModal.jsx';
import EditTransactionModal from '../../transactions/modals/EditTransactionModal.jsx';
import RecurringSetupModal from '../../transactions/modals/RecurringSetupModal.jsx';
import DeleteTransaction from '../../transactions/DeleteTransaction.jsx';
import { useTransactionActions } from '../../../../hooks/useTransactionActions';
import { useNotifications } from '../../../../stores';

/**
 * UnifiedTransactionActions
 * Global, page-agnostic orchestrator for transaction actions (one-time and recurring)
 * Listens to window events and opens the appropriate modal.
 *
 * Events:
 * - 'transaction:add'                     → open add modal
 * - 'transaction:edit'        { tx }      → open edit modal
 * - 'transaction:duplicate'   { tx }      → open duplicate modal
 * - 'transaction:delete'      { tx }      → open delete modal (smart recurring aware)
 * - 'transaction:recurring'   { tx }      → open recurring setup modal (edit/create)
 */
const UnifiedTransactionActions = () => {
  const [showAdd, setShowAdd] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [showDelete, setShowDelete] = React.useState(false);
  const [showRecurringSetup, setShowRecurringSetup] = React.useState(false);
  const [editMode, setEditMode] = React.useState('edit'); // 'edit' | 'duplicate'
  const [selectedTx, setSelectedTx] = React.useState(null);

  // ✅ Add transaction actions and notifications
  const { deleteTransaction } = useTransactionActions();
  const { addNotification } = useNotifications();

  // Handlers
  const handleAdd = React.useCallback(() => {
    setShowAdd(true);
  }, []);

  const handleEdit = React.useCallback((tx) => {
    if (!tx) return;
    setSelectedTx(tx);
    setEditMode('edit');
    setShowEdit(true);
  }, []);

  const handleDuplicate = React.useCallback((tx) => {
    if (!tx) return;
    setSelectedTx(tx);
    setEditMode('duplicate');
    setShowEdit(true);
  }, []);

  const handleDelete = React.useCallback((tx) => {
    if (!tx) return;
    setSelectedTx(tx);
    setShowDelete(true);
  }, []);

  const handleRecurring = React.useCallback((tx) => {
    // If tx provided → edit recurring; if not → create recurring template from scratch
    setSelectedTx(tx || null);
    setShowRecurringSetup(true);
  }, []);

  // Event listeners
  React.useEffect(() => {
    const onAdd = () => handleAdd();
    const onEdit = (e) => handleEdit(e?.detail?.tx || e?.detail || null);
    const onDuplicate = (e) => handleDuplicate(e?.detail?.tx || e?.detail || null);
    const onDelete = (e) => handleDelete(e?.detail?.tx || e?.detail || null);
    const onRecurring = (e) => handleRecurring(e?.detail?.tx || e?.detail || null);

    window.addEventListener('transaction:add', onAdd);
    window.addEventListener('transaction:edit', onEdit);
    window.addEventListener('transaction:duplicate', onDuplicate);
    window.addEventListener('transaction:delete', onDelete);
    window.addEventListener('transaction:recurring', onRecurring);

    return () => {
      window.removeEventListener('transaction:add', onAdd);
      window.removeEventListener('transaction:edit', onEdit);
      window.removeEventListener('transaction:duplicate', onDuplicate);
      window.removeEventListener('transaction:delete', onDelete);
      window.removeEventListener('transaction:recurring', onRecurring);
    };
  }, [handleAdd, handleEdit, handleDuplicate, handleDelete, handleRecurring]);

  // Success handler: soft-close and let existing invalidation logic run via hooks inside modals
  const handleSuccess = React.useCallback(() => {
    setShowAdd(false);
    setShowEdit(false);
    setShowDelete(false);
    setShowRecurringSetup(false);
    setSelectedTx(null);
  }, []);

  // ✅ Handle delete success with actual API call
  const handleDeleteSuccess = React.useCallback(async (transactionId, options) => {
    try {
      await deleteTransaction(transactionId, options);
      addNotification({
        type: 'success',
        message: 'Transaction deleted successfully',
        duration: 3000
      });
      handleSuccess(); // Close modal and cleanup
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      addNotification({
        type: 'error',
        message: error.message || 'Failed to delete transaction',
        duration: 4000
      });
    }
  }, [deleteTransaction, addNotification, handleSuccess]);

  return (
    <>
      {/* Add */}
      <AddTransactionModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={handleSuccess}
      />

      {/* Edit / Duplicate */}
      <EditTransactionModal
        isOpen={showEdit}
        onClose={() => {
          setShowEdit(false);
          setSelectedTx(null);
        }}
        onSuccess={handleSuccess}
        onDelete={(tx) => handleDelete(tx || selectedTx)}
        onDuplicate={(data) => {
          // When duplicate action is chosen inside Edit modal, keep modal logic
          // The Edit modal will call parent-provided onDuplicate which triggers create inside it
          return data;
        }}
        transaction={selectedTx}
        mode={editMode}
      />

      {/* Recurring Setup */}
      <RecurringSetupModal
        isOpen={showRecurringSetup}
        onClose={() => {
          setShowRecurringSetup(false);
          setSelectedTx(null);
        }}
        onSuccess={handleSuccess}
        initialData={selectedTx}
        mode={selectedTx ? 'edit' : 'create'}
      />

      {/* Delete */}
      {showDelete && selectedTx && (
        <DeleteTransaction
          transaction={selectedTx}
          onClose={() => {
            setShowDelete(false);
            setSelectedTx(null);
          }}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </>
  );
};

export default UnifiedTransactionActions;


