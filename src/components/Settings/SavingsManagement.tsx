import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { useSavings } from '../../hooks/useSavings';
import toast from 'react-hot-toast';
import type { Database } from '../../types/database';

type Saving = Database['public']['Tables']['savings']['Row'];

const SavingsManagement: React.FC = () => {
  const [currentSavings, setCurrentSavings] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentSavings: latestSavings, loading, error } = useSavings();

  const handleSavingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('savings')
        .insert({
          amount: currentSavings,
          date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;
      
      toast.success('Savings updated successfully');
      setCurrentSavings(0);
    } catch (err) {
      console.error('Error updating savings:', err);
      toast.error('Failed to update savings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-pulse text-gray-600">Loading savings data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading savings data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Current Savings</h3>
        <form onSubmit={handleSavingsUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">€</span>
              </div>
              <input
                type="number"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(Number(e.target.value))}
                className="block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Savings'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Current Total Savings</h3>
        <p className="text-3xl font-bold text-gray-900">
          €{latestSavings.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Last updated: {format(new Date(), 'PPP')}
        </p>
      </div>
    </div>
  );
};

export default SavingsManagement;