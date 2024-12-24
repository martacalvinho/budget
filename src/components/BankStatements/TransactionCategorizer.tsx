import React, { useState } from 'react';
import { Save, Tag } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import type { Transaction } from '../../types/transactions';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../contexts/AuthContext';

interface TransactionCategorizerProps {
  transactions: Transaction[];
  onComplete: () => void;
}

const TransactionCategorizer: React.FC<TransactionCategorizerProps> = ({ 
  transactions, 
  onComplete 
}) => {
  const { categories } = useCategories();
  const { user } = useAuthContext();
  const [selectedCategories, setSelectedCategories] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    const uncategorized = transactions.some(t => !selectedCategories[t.id]);
    if (uncategorized) {
      toast.error('Please categorize all transactions');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('purchases')
        .insert(
          transactions.map(transaction => ({
            user_id: user.id,
            amount: Math.abs(transaction.amount),
            category: selectedCategories[transaction.id],
            description: transaction.description,
            date: transaction.date
          }))
        );

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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Categorize Transactions</h2>
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
        {transactions.map(transaction => (
          <div 
            key={transaction.id}
            className={`p-4 rounded-lg border ${
              selectedCategories[transaction.id] 
                ? 'border-green-200 bg-green-50' 
                : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">{transaction.description}</p>
                <p className="text-sm text-gray-500">{transaction.date}</p>
              </div>
              <p className={`font-semibold ${
                transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                €{Math.abs(transaction.amount).toFixed(2)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-400" />
              <select
                value={selectedCategories[transaction.id] || ''}
                onChange={(e) => setSelectedCategories(prev => ({
                  ...prev,
                  [transaction.id]: e.target.value
                }))}
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionCategorizer;