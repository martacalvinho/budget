import React, { useState, useEffect, useMemo } from 'react';
import { Save, Tag, Users, Split } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import type { Transaction } from '../../types/transactions';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../contexts/AuthContext';
import { useUsers } from '../../contexts/UserContext';

interface TransactionCategorizerProps {
  transactions: Transaction[];
  onComplete: () => void;
}

interface TransactionState {
  category: string;
  users: string[];
}

const TransactionCategorizer: React.FC<TransactionCategorizerProps> = ({ 
  transactions, 
  onComplete 
}) => {
  const { categories } = useCategories();
  const { user } = useAuthContext();
  const { users } = useUsers();
  const [transactionStates, setTransactionStates] = useState<Record<string, TransactionState>>({});
  const [saving, setSaving] = useState(false);

  // Auto-assign users based on card numbers in transaction description
  useEffect(() => {
    const newStates = { ...transactionStates };
    
    transactions.forEach(transaction => {
      if (!newStates[transaction.id]) {
        newStates[transaction.id] = {
          category: '',
          users: []
        };
      }

      if (transaction.description) {
        const cardMatch = transaction.description.match(/COMPRA (\d{4})/);
        if (cardMatch) {
          const cardNumber = cardMatch[1];
          const matchedUser = users.find(u => u.card_number === cardNumber);
          if (matchedUser && !newStates[transaction.id].users.includes(matchedUser.id)) {
            newStates[transaction.id].users = [matchedUser.id];
          }
        }
      }
    });

    setTransactionStates(newStates);
  }, [transactions, users]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    let totalSpent = 0;
    let totalReceived = 0;
    let fixedExpenses = 0;
    let flexibleExpenses = 0;
    let month = '';

    transactions.forEach(transaction => {
      // Extract month from transaction date (format: DD.MM)
      const [, transactionMonth] = transaction.date.split('.');
      if (!month) month = transactionMonth;

      if (transaction.amount < 0) {
        totalSpent += Math.abs(transaction.amount);
        
        // Add to category totals if categorized
        const category = transactionStates[transaction.id]?.category;
        if (category) {
          const categoryType = categories.find(c => c.name === category)?.type;
          if (categoryType === 'fixed') {
            fixedExpenses += Math.abs(transaction.amount);
          } else if (categoryType === 'flexible') {
            flexibleExpenses += Math.abs(transaction.amount);
          }
        }
      } else {
        totalReceived += transaction.amount;
      }
    });

    const monthName = new Date(2024, parseInt(month) - 1).toLocaleString('default', { month: 'long' });

    return {
      month: monthName,
      totalSpent,
      totalReceived,
      fixedExpenses,
      flexibleExpenses,
      uncategorizedExpenses: totalSpent - (fixedExpenses + flexibleExpenses)
    };
  }, [transactions, transactionStates, categories]);

  const handleSave = async () => {
    if (!user) return;

    const uncategorized = transactions.some(t => !transactionStates[t.id]?.category);
    if (uncategorized) {
      toast.error('Please categorize all transactions');
      return;
    }

    const unassigned = transactions.some(t => !transactionStates[t.id]?.users.length);
    if (unassigned) {
      toast.error('Please assign users to all transactions');
      return;
    }

    setSaving(true);
    try {
      const purchases = transactions.flatMap(transaction => {
        const state = transactionStates[transaction.id];
        const amount = Math.abs(transaction.amount);
        const splitAmount = amount / state.users.length;

        return state.users.map(userId => ({
          user_id: userId,
          amount: splitAmount,
          total_amount: amount,
          category: state.category,
          description: transaction.description,
          date: transaction.date
        }));
      });

      const { error } = await supabase
        .from('purchases')
        .insert(purchases);

      if (error) throw error;
      
      toast.success('Transactions saved successfully');
      onComplete();
    } catch (error) {
      console.error('Error saving transactions:', error);
      toast.error('Failed to save transactions');
    } finally {
      setSaving(false);
    }
  };

  const handleUserToggle = (transactionId: string, userId: string) => {
    setTransactionStates(prev => {
      const current = prev[transactionId]?.users || [];
      const updated = current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId];
      
      return {
        ...prev,
        [transactionId]: {
          ...prev[transactionId],
          users: updated
        }
      };
    });
  };

  const handleCategoryChange = (transactionId: string, category: string) => {
    setTransactionStates(prev => ({
      ...prev,
      [transactionId]: {
        ...prev[transactionId],
        category
      }
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Categorize Transactions</h2>
          <div className="text-sm text-gray-600 mt-1">
            {summary.month} Summary:
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <span className="text-red-600">Total Spent: €{summary.totalSpent.toFixed(2)}</span>
                <div className="text-xs mt-1">
                  <div>Fixed: €{summary.fixedExpenses.toFixed(2)}</div>
                  <div>Flexible: €{summary.flexibleExpenses.toFixed(2)}</div>
                  <div>Uncategorized: €{summary.uncategorizedExpenses.toFixed(2)}</div>
                </div>
              </div>
              <div>
                <span className="text-green-600">Total Received: €{summary.totalReceived.toFixed(2)}</span>
                <div className="text-xs mt-1">
                  <div>Net: €{(summary.totalReceived - summary.totalSpent).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-5 w-5 mr-2" />
          Save All
        </button>
      </div>

      <div className="space-y-4">
        {transactions.map(transaction => {
          const state = transactionStates[transaction.id] || { category: '', users: [] };
          const isSplit = state.users.length > 1;

          return (
            <div 
              key={transaction.id}
              className={`p-4 rounded-lg border ${
                state.category && state.users.length > 0
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-gray-500">{transaction.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    €{Math.abs(transaction.amount).toFixed(2)}
                  </p>
                  {isSplit && (
                    <p className="text-sm text-gray-500">
                      €{(Math.abs(transaction.amount) / state.users.length).toFixed(2)} per person
                    </p>
                  )}
                  <p className="text-xs text-gray-400">Balance: €{transaction.balance.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <select
                    value={state.category}
                    onChange={(e) => handleCategoryChange(transaction.id, e.target.value)}
                    className="flex-1 p-2 border rounded-md"
                  >
                    <option value="">Select category...</option>
                    <optgroup label="Fixed Expenses">
                      {categories
                        .filter(cat => cat.type === 'fixed')
                        .map(category => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))
                      }
                    </optgroup>
                    <optgroup label="Flexible Expenses">
                      {categories
                        .filter(cat => cat.type === 'flexible')
                        .map(category => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))
                      }
                    </optgroup>
                  </select>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <Users className="h-4 w-4 text-gray-400" />
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleUserToggle(transaction.id, u.id)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        state.users.includes(u.id)
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {u.name}
                    </button>
                  ))}
                </div>

                {isSplit && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Split className="h-4 w-4" />
                    Split {state.users.length} ways
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransactionCategorizer;