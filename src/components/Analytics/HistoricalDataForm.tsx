import React, { useState } from 'react';
import { userService } from '../../services/userService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

interface HistoricalDataFormProps {
  selectedDate: Date;
  onDataAdded: () => void;
}

const HistoricalDataForm: React.FC<HistoricalDataFormProps> = ({ selectedDate, onDataAdded }) => {
  const [formData, setFormData] = useState({
    income: '',
    expenses: '',
    category: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.income && !formData.expenses) {
      toast.error('Please enter either income or expenses');
      return;
    }

    try {
      if (formData.income) {
        await userService.addHistoricalIncome({
          amount: Number(formData.income),
          date: selectedDate,
          description: formData.description
        });
      }

      if (formData.expenses) {
        await userService.addHistoricalExpense({
          amount: Number(formData.expenses),
          category: formData.category,
          date: selectedDate,
          description: formData.description
        });
      }

      setFormData({
        income: '',
        expenses: '',
        category: '',
        description: ''
      });

      toast.success('Historical data added successfully');
      onDataAdded();
    } catch (error) {
      console.error('Error adding historical data:', error);
      toast.error('Failed to add historical data');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Plus className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Add Historical Data</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Income
            </label>
            <input
              type="number"
              value={formData.income}
              onChange={(e) => setFormData({ ...formData, income: e.target.value })}
              placeholder="Enter amount"
              className="w-full p-2 border rounded-md"
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expenses
            </label>
            <input
              type="number"
              value={formData.expenses}
              onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
              placeholder="Enter amount"
              className="w-full p-2 border rounded-md"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category (for expenses)
          </label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="Enter category"
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter description"
            className="w-full p-2 border rounded-md"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Historical Data
        </button>
      </form>
    </div>
  );
};

export default HistoricalDataForm;