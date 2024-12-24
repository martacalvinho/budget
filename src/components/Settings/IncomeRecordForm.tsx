import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { incomeService } from '../../services/incomeService';
import { IncomeSource } from '../../types/salary';
import toast from 'react-hot-toast';

interface IncomeRecordFormProps {
  userId: string;
  onRecordAdded: () => void;
}

const IncomeRecordForm: React.FC<IncomeRecordFormProps> = ({ userId, onRecordAdded }) => {
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [formData, setFormData] = useState({
    sourceId: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  useEffect(() => {
    const loadSources = async () => {
      try {
        const userSources = await incomeService.getUserIncomeSources(userId);
        setSources(userSources);
        if (userSources.length > 0) {
          setFormData(prev => ({ ...prev, sourceId: userSources[0].id }));
        }
      } catch (error) {
        console.error('Error loading income sources:', error);
        toast.error('Failed to load income sources');
      }
    };

    loadSources();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sourceId || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const date = new Date(formData.date);
      const source = sources.find(s => s.id === formData.sourceId);
      
      if (!source) {
        toast.error('Invalid income source');
        return;
      }

      await incomeService.addIncomeRecord({
        userId,
        sourceId: formData.sourceId,
        amount: Number(formData.amount),
        currency: source.currency,
        date: date,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        notes: formData.notes
      });

      setFormData({
        sourceId: sources[0].id,
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
      });

      onRecordAdded();
      toast.success('Income record added successfully');
    } catch (error) {
      console.error('Error adding income record:', error);
      toast.error('Failed to add income record');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Add Income Record</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {sources.map(source => (
                <option key={source.id} value={source.id}>
                  {source.name} ({source.currency})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
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
            Notes (Optional)
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
          Add Income Record
        </button>
      </form>
    </div>
  );
};

export default IncomeRecordForm;