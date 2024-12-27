import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { parseBankStatement, ParsedTransaction } from '../../utils/bankStatementParser';
import TransactionCategorizer from './TransactionCategorizer';
import toast from 'react-hot-toast';
import { useUsers } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabase';

export default function BankStatements() {
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statementYear, setStatementYear] = useState<number>(new Date().getFullYear());
  const { users } = useUsers();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting file upload process');
      const fileData = await file.arrayBuffer();
      console.log('File converted to ArrayBuffer');

      const parsedTx = await parseBankStatement(fileData);
      console.log('Parsing complete, transactions:', parsedTx.length);

      // Get the year from the first transaction's date
      if (parsedTx.length > 0) {
        const firstTx = parsedTx[0];
        // If the month is greater than current month, it's likely from previous year
        const currentMonth = new Date().getMonth() + 1;
        const txMonth = parseInt(firstTx.dateOfPurchase.split('.')[1]);
        const year = txMonth > currentMonth ? new Date().getFullYear() - 1 : new Date().getFullYear();
        setStatementYear(year);
      }
      
      setTransactions(parsedTx);
      toast.success(`Parsed ${parsedTx.length} transactions`);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Failed to parse bank statement');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransaction = async (transaction: ParsedTransaction) => {
    try {
      // If it's a debit (money going out), make it negative
      // If it's a credit (money coming in), keep it positive
      const totalAmount = transaction.credit || -(transaction.debit || 0);
      const splitAmount = totalAmount / (transaction.users?.length || 1);
      
      // Format date correctly for database (YYYY-MM-DD)
      const [day, month] = transaction.dateOfPurchase.split('.');
      const year = transaction.statementYear || new Date().getFullYear().toString();
      
      // Swap month and day since bank uses European format
      const date = `${year}-${day.padStart(2, '0')}-${month.padStart(2, '0')}`;

      console.log('Saving transaction with date:', date, 'from statement year:', transaction.statementYear);

      // Create a purchase record for each user in the split
      const purchases = transaction.users?.map(userId => ({
        user_id: userId,
        amount: splitAmount,
        category: transaction.category || '',
        description: transaction.description,
        date,
        total_amount: Math.abs(totalAmount),
        split_between: transaction.users?.length || 1
      })) || [];

      if (purchases.length === 0) {
        throw new Error('No users assigned to this transaction');
      }

      console.log('Saving purchases:', purchases);

      const { data, error } = await supabase
        .from('purchases')
        .insert(purchases);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast.success('Transaction saved successfully');
      
      // Remove the transaction from the list
      setTransactions(prev => prev.filter(t => 
        t.dateRemoved !== transaction.dateRemoved || 
        t.dateOfPurchase !== transaction.dateOfPurchase ||
        t.description !== transaction.description
      ));
    } catch (error) {
      console.error('Error saving transaction:', error);
      if (error instanceof Error) {
        toast.error(`Failed to save transaction: ${error.message}`);
      } else {
        toast.error('Failed to save transaction');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bank Statements</h2>
        <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Statement
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileUpload}
            disabled={loading}
          />
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Processing bank statement...</p>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction, index) => (
                <TransactionCategorizer
                  key={`${transaction.dateRemoved}-${transaction.dateOfPurchase}-${index}`}
                  transaction={transaction}
                  onSave={handleSaveTransaction}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
