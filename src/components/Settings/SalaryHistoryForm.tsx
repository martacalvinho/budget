import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSalaryHistory } from '../../hooks/useSalaryHistory';
import type { Database } from '../../types/database';

type SalaryHistoryInsert = Database['public']['Tables']['salary_history']['Insert'];

interface SalaryHistoryFormProps {
  userId: string;
  onEntryAdded?: () => void;
}

const SalaryHistoryForm: React.FC<SalaryHistoryFormProps> = ({ userId, onEntryAdded }) => {
  const { addSalaryEntry } = useSalaryHistory(userId);
  const [formData, setFormData] = useState<Omit<SalaryHistoryInsert, 'user_id'>>({
    amount: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notes: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addSalaryEntry(formData);
      setFormData({
        amount: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        notes: null
      });
      onEntryAdded?.();
    } catch (error) {
      console.error('Error submitting salary entry:', error);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Plus className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Add Salary Entry</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
              className="w-full p-2 border rounded-md"
              required
            >
              {months.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              className="w-full p-2 border rounded-md"
              min="2000"
              max={new Date().getFullYear()}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (€)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full p-2 border rounded-md"
              step="0.01"
              min="0"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
            className="w-full p-2 border rounded-md"
            rows={2}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Salary Entry
        </button>
      </form>
    </div>
  );
};

export default SalaryHistoryForm;