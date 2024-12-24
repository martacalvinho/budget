import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useIncomeSources } from '../../hooks/useIncomeSources';
import toast from 'react-hot-toast';

interface IncomeAdjustmentFormProps {
  onClose: () => void;
  onSaved: () => void;
}

const IncomeAdjustmentForm: React.FC<IncomeAdjustmentFormProps> = ({ onClose, onSaved }) => {
  const { incomeSources } = useIncomeSources();
  const [formData, setFormData] = useState({
    sourceId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'bonus',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('income_adjustments')
        .insert({
          source_id: formData.sourceId,
          amount: Number(formData.amount),
          date: formData.date,
          type: formData.type,
          description: formData.description || null
        });

      if (error) throw error;
      
      toast.success('Income adjustment added successfully');
      onSaved();
      onClose();
    } catch (error) {
      console.error('Error adding income adjustment:', error);
      toast.error('Failed to add income adjustment');
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

        <h2 className="text-2xl font-bold mb-6">Add Income Adjustment</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Income Source
            </label>
            <select
              value={formData.sourceId}
              onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select income source</option>
              {incomeSources.map(source => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
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
              required
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="bonus">Bonus</option>
              <option value="gift">Gift</option>
              <option value="adjustment">Adjustment</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded-md"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Add Adjustment
          </button>
        </form>
      </div>
    </div>
  );
};

export default IncomeAdjustmentForm;