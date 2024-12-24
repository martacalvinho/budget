import React from 'react';
import { Pencil, Trash2, Calendar } from 'lucide-react';
import { useIncomeSources } from '../../hooks/useIncomeSources';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface IncomeSourcesListProps {
  onEdit: (sourceId: string) => void;
}

const IncomeSourcesList: React.FC<IncomeSourcesListProps> = ({ onEdit }) => {
  const { incomeSources, loading } = useIncomeSources();

  const handleDelete = async (sourceId: string) => {
    try {
      const { error } = await supabase
        .from('income_sources')
        .delete()
        .eq('id', sourceId);

      if (error) throw error;
      toast.success('Income source deleted successfully');
    } catch (error) {
      console.error('Error deleting income source:', error);
      toast.error('Failed to delete income source');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-pulse text-gray-600">Loading income sources...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incomeSources.map(source => (
        <div
          key={source.id}
          className="bg-white p-4 rounded-lg shadow-md"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{source.name}</h3>
              <div className="text-sm text-gray-500 space-y-1">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {source.frequency} ({source.type})
                </div>
                {source.start_date && (
                  <div>
                    Start date: {new Date(source.start_date).toLocaleDateString()}
                  </div>
                )}
                {source.end_date && (
                  <div>
                    End date: {new Date(source.end_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-right">
                <div className="font-semibold text-lg">
                  €{source.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-500">per {source.frequency}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(source.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Pencil className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(source.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {incomeSources.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          No income sources added yet
        </div>
      )}
    </div>
  );
};

export default IncomeSourcesList;