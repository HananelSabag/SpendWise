/**
 * 🪟 MODALS TRANSLATIONS - ENGLISH
 * Modal dialogs, forms, and overlays translations
 * @version 1.0.0
 */

export default {
  // Edit Transaction Modal
  edit: {
    edit: {
      title: 'Edit Transaction',
      subtitle: 'Update transaction details'
    },
    duplicate: {
      title: 'Duplicate Transaction',
      subtitle: 'Create a copy of this transaction'
    },
    view: {
      title: 'View Transaction',
      subtitle: 'Transaction details'
    },
    success: {
      updateTitle: 'Transaction Updated',
      updateMessage: 'Transaction has been updated successfully',
      duplicateTitle: 'Transaction Duplicated',
      duplicateMessage: 'Transaction has been duplicated successfully'
    }
  },

  // Delete Transaction Modal
  delete: {
    title: 'Delete Transaction',
    description: 'Are you sure you want to delete this transaction? This action cannot be undone.',
    warning: 'This will permanently remove the transaction from your records.',
    confirm: 'Delete Transaction',
    cancel: 'Cancel',
    
    // Recurring transaction delete options
    recurring: {
      title: 'Delete Recurring Transaction',
      options: 'Choose deletion option:',
      single: 'Delete This Occurrence Only',
      singleDescription: 'Remove only this specific transaction instance',
      future: 'Delete This and Future Occurrences',
      futureDescription: 'Stop generating future transactions from this template',
      all: 'Delete All Occurrences',
      allDescription: 'Remove all past and future transactions from this template',
      allWarning: 'This will delete ALL transactions from this recurring template, including past transactions.',
      futureWarning: 'This will stop future transactions but keep past ones.'
    }
  },

  // Common modal actions
  common: {
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    duplicate: 'Duplicate',
    loading: 'Loading...',
    saving: 'Saving...',
    deleting: 'Deleting...'
  }
};

