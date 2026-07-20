import { institutionKind } from '../components/features/bankSync/bankSyncMeta';

export function transactionTotalsContribution(
  transaction,
  { includeCreditCardActivity = false } = {},
) {
  const amount = Math.abs(Number(transaction?.amount));
  const isCreditCard = institutionKind(transaction?.bank_source) === 'credit_card';

  if (!Number.isFinite(amount) || (isCreditCard && !includeCreditCardActivity)) {
    return { income: 0, expenses: 0 };
  }

  return transaction?.type === 'income'
    ? { income: amount, expenses: 0 }
    : { income: 0, expenses: amount };
}

export function summarizeTransactionCashFlow(transactions, options) {
  return (transactions || []).reduce((totals, transaction) => {
    const contribution = transactionTotalsContribution(transaction, options);
    totals.totalIncome += contribution.income;
    totals.totalExpenses += contribution.expenses;
    return totals;
  }, { totalIncome: 0, totalExpenses: 0 });
}
