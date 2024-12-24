import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { incomeService } from '../../services/incomeService';
import toast from 'react-hot-toast';

interface IncomeSourceFormProps {
  userId: string;
  onSourceAdded: () => void;
}

const IncomeSourceForm: React.FC<IncomeSourceFormProps> = ({ userId, onSourceAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'salary' as const,
    currency: 'EUR',
    isRecurring: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await incomeService.addIncomeSource({
        ...formData,
        userId
      });
      setFormData({
        name: '',
        type: 'salary',
        currency: 'EUR',
        isRecurring: true
      });
      onSourceAdded();
      toast.success('Income source added successfully');
    } catch (error) {
      console.error('Error adding income source:', error);
      toast.error('Failed to add income source');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Plus className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Add Income Source</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full p-2 border rounded-md"
            >
              <option value="salary">Salary</option>
              <option value="bonus">Bonus</option>
              <option value="investment">Investment</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recurring
            </label>
            <div className="flex items-center h-[42px]">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">Monthly recurring</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Income Source
        </button>
      </form>
    </div>
  );
};

export default IncomeSourceForm;