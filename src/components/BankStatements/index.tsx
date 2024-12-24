import React, { useState } from 'react';
import StatementUploader from './StatementUploader';
import TransactionCategorizer from './TransactionCategorizer';
import type { Transaction } from '../../types/transactions';

const BankStatements: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const handleComplete = () => {
    setTransactions([]);
  };

  return (
    <div className="space-y-6">
      <StatementUploader onTransactionsFound={setTransactions} />
      {transactions.length > 0 && (
        <TransactionCategorizer 
          transactions={transactions}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
};

export default BankStatements;