import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../../types/database';

type Category = Database['public']['Tables']['categories']['Row'];

interface PredictionFormProps {
  onClose: () => void;
  categories: Category[];
  selectedDate: Date;
  initialData?: any;
}

const PredictionForm: React.FC<PredictionFormProps> = ({
  onClose,
  categories,
  selectedDate,
  initialData
}) => {
  const [formData, setFormData] = useState({
    type: initialData?.type || 'expense',
    category: initialData?.category || '',
    amount: initialData?.amount || '',
    notes: initialData?.notes || '',
    confidence: initialData?.confidence || 80
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('predictions')
        .upsert({
          year: selectedDate.getFullYear(),
          month: selectedDate.getMonth() + 1,
          ...formData,
          amount: Number(formData.amount),
          confidence: Number(formData.confidence)
        });

      if (error) throw error;
      
      toast.success('Prediction saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving prediction:', error);
      toast.error('Failed to save prediction');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">
          {initialData ? 'Edit' : 'Add'} Prediction
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
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
            >
              <option value="">Select a category</option>
              {formData.type === 'expense' ? (
                <>
                  <optgroup label="Fixed Expenses">
                    {categories
                      .filter(cat => cat.type === 'fixed')
                      .map(category => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Flexible Expenses">
                    {categories
                      .filter(cat => cat.type === 'flexible')
                      .map(category => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                  </optgroup>
                </>
              ) : (
                <optgroup label="Income Sources">
                  <option value="Salary">Salary</option>
                  <option value="Bonus">Bonus</option>
                  <option value="Other">Other</option>
                </optgroup>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (€)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full p-2 border rounded-md"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confidence (%)
            </label>
            <input
              type="range"
              value={formData.confidence}
              onChange={(e) => setFormData({ ...formData, confidence: e.target.value })}
              className="w-full"
              min="0"
              max="100"
              step="5"
            />
            <div className="text-sm text-gray-500 text-center">
              {formData.confidence}% confident
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2 border rounded-md"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Prediction
          </button>
        </form>
      </div>
    </div>
  );
};

export default PredictionForm;