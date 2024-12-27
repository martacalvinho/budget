import React, { useState } from 'react';
import { Save, Tag, Users, Split } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { ParsedTransaction } from '../../utils/bankStatementParser';
import { useUsers } from '../../contexts/UserContext';
import toast from 'react-hot-toast';

interface TransactionCategorizerProps {
  transaction: ParsedTransaction;
  onSave: (transaction: ParsedTransaction) => void;
}

const TransactionCategorizer: React.FC<TransactionCategorizerProps> = ({ 
  transaction,
  onSave
}) => {
  const { categories } = useCategories();
  const { users } = useUsers();
  const [category, setCategory] = useState<string>(transaction.category || '');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!category) {
      toast.error('Please select a category');
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error('Please assign at least one user');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...transaction,
        category,
        users: selectedUsers
      });
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const amount = transaction.debit || -(transaction.credit || 0);
  const isSplit = selectedUsers.length > 1;

  return (
    <tr className={`${category && selectedUsers.length > 0 ? 'bg-green-50' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {transaction.dateOfPurchase}
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
        {transaction.cardNumber && (
          <p className="text-xs text-gray-500">Card: {transaction.cardNumber}</p>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`text-sm font-medium ${amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
          €{Math.abs(amount).toFixed(2)}
        </span>
        {isSplit && (
          <p className="text-xs text-gray-500">
            €{(Math.abs(amount) / selectedUsers.length).toFixed(2)} per person
          </p>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => handleUserToggle(u.id)}
              className={`px-2 py-1 rounded-full text-xs ${
                selectedUsers.includes(u.id)
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {u.name}
            </button>
          ))}
        </div>
      </td>
      <td className="px-6 py-4">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">Select category...</option>
          <optgroup label="Fixed Expenses">
            {categories
              .filter(cat => cat.type === 'fixed')
              .map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))
            }
          </optgroup>
          <optgroup label="Flexible Expenses">
            {categories
              .filter(cat => cat.type === 'flexible')
              .map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))
            }
          </optgroup>
        </select>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={handleSave}
          disabled={saving || !category || selectedUsers.length === 0}
          className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:hover:text-blue-600"
        >
          Save
        </button>
      </td>
    </tr>
  );
};

export default TransactionCategorizer;