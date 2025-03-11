import React, { useState } from 'react';
import { Users, Split } from 'lucide-react';
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
      toast.error('Por favor selecione uma categoria');
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error('Por favor atribua pelo menos um utilizador');
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
      console.error('Erro ao guardar transação:', error);
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
          <p className="text-xs text-gray-500">Cartão: {transaction.cardNumber}</p>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-semibold ${
            transaction.description.startsWith('PT61114457 MGAM') ? 'text-blue-600' :
            transaction.credit ? 'text-green-600' : 'text-red-600'
          }`}>
            {transaction.credit ? 
              `€${transaction.credit}` : 
              `€${transaction.debit}`
            }
          </span>
          {isSplit && (
            <p className="text-xs text-gray-500">
              €{(Math.abs(amount) / selectedUsers.length).toFixed(2)} por pessoa
            </p>
          )}
        </div>
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
          <option value="">Selecione categoria...</option>
          <optgroup label="Despesas Fixas">
            {categories
              .filter(cat => cat.type === 'fixed')
              .map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))
            }
          </optgroup>
          <optgroup label="Despesas Flexíveis">
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
          Guardar
        </button>
      </td>
    </tr>
  );
};

export default TransactionCategorizer;