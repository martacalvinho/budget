import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Users, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUsers } from '../contexts/UserContext';
import { useCategories } from '../hooks/useCategories';
import type { Database } from '../types/database';

type Category = Database['public']['Tables']['categories']['Row'];

interface AddPurchasePopupProps {
  onClose: () => void;
  onPurchaseAdded: () => void;
}

const AddPurchasePopup: React.FC<AddPurchasePopupProps> = ({
  onClose,
  onPurchaseAdded,
}) => {
  const { users } = useUsers();
  const { categories, loading: categoriesLoading } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    userIds: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    if (formData.userIds.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    try {
      const amount = parseFloat(formData.amount);
      const splitAmount = amount / formData.userIds.length;

      // Create purchases for each user
      const { error } = await supabase
        .from('purchases')
        .insert(
          formData.userIds.map(userId => ({
            user_id: userId,
            amount: splitAmount,
            category: formData.category,
            description: formData.description,
            date: formData.date,
            total_amount: amount,
            split_between: formData.userIds.length
          }))
        );

      if (error) throw error;
      
      toast.success('Purchase added successfully');
      onPurchaseAdded();
    } catch (error) {
      console.error('Error adding purchase:', error);
      toast.error('Failed to add purchase');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !formData.userIds.includes(user.id)
  );

  const handleUserSelect = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      userIds: [...prev.userIds, userId]
    }));
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handleRemoveUser = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      userIds: prev.userIds.filter(id => id !== userId)
    }));
  };

  const groupedCategories = categories.reduce((acc, category) => {
    if (!acc[category.type]) {
      acc[category.type] = [];
    }
    acc[category.type].push(category);
    return acc;
  }, {} as Record<string, Category[]>);

  const selectedUsers = formData.userIds
    .map(userId => users.find(user => user.id === userId))
    .filter(user => user !== undefined);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Add New Purchase</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-2 border rounded-md"
              required
              disabled={categoriesLoading}
            >
              <option value="">Select a category</option>
              {groupedCategories.fixed && (
                <optgroup label="Fixed Expenses">
                  {groupedCategories.fixed.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {groupedCategories.flexible && (
                <optgroup label="Flexible Expenses">
                  {groupedCategories.flexible.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Split Between Users
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedUsers.map(user => user && (
                <div
                  key={user.id}
                  className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                >
                  <span>{user.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(user.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="relative">
              <div className="flex items-center">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Type to search users..."
                  className="w-full p-2 border rounded-md"
                />
                <Users className="absolute right-3 h-5 w-5 text-gray-400" />
              </div>
              {showSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleUserSelect(user.id)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {user.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">
                      {searchTerm ? 'No matching users found' : 'Type to search users'}
                    </div>
                  )}
                </div>
              )}
            </div>
            {formData.userIds.length > 0 && formData.amount && (
              <p className="text-sm text-gray-500 mt-2">
                Split amount: €{(parseFloat(formData.amount) / formData.userIds.length).toFixed(2)} per person
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Purchase
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPurchasePopup;