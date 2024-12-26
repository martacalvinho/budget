import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { parseBankStatement } from '../../utils/bankStatementParser';
import TransactionCategorizer from './TransactionCategorizer';
import toast from 'react-hot-toast';

interface ParsedTransaction {
  date: string;
  type: string;
  cardNumber?: string;
  description: string;
  amount: number;
  balance: number;
}

export default function BankStatements() {
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bank Statements</h2>
        
        <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Upload className="h-5 w-5 mr-2" />
          Upload Statement
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {loading ? (
        <div className="text-center py-4">Processing statement...</div>
      ) : error ? (
        <div className="text-center py-4 text-red-600">
          Error: {error}
        </div>
      ) : transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((tx, idx) => (
            <div key={idx} className="border rounded p-4 bg-white shadow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {tx.date}
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      {tx.type}
                    </span>
                    {tx.cardNumber && (
                      <span className="text-sm text-gray-500">
                        Card: {tx.cardNumber}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-900">
                    {tx.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)}€
                  </p>
                  <p className="text-sm text-gray-500">
                    Balance: {tx.balance.toFixed(2)}€
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">
            Upload a bank statement to view transactions
          </p>
        </div>
      )}
    </div>
  );
}
