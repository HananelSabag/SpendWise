import React from 'react';

const RecentTransactions = () => {
  // Dummy data - will be replaced with real data
  const transactions = [
    { id: 1, type: 'expense', amount: 150, description: 'קניות בסופר', time: '12:30' },
    { id: 2, type: 'income', amount: 350, description: 'משכורת', time: '09:15' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-medium mb-4">פעולות אחרונות</h3>
      <div className="space-y-4">
        {transactions.map(transaction => (
          <div 
            key={transaction.id}
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                transaction.type === 'expense' ? 'bg-red-100' : 'bg-green-100'
              }`}>
                {transaction.type === 'expense' ? '-' : '+'}
              </div>
              <div>
                <p className="font-medium">{transaction.description}</p>
                <p className="text-sm text-gray-500">{transaction.time}</p>
              </div>
            </div>
            <span className={`font-bold ${
              transaction.type === 'expense' ? 'text-red-500' : 'text-green-500'
            }`}>
              ₪{transaction.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTransactions;