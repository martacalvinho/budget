import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Database } from '../../types/database';

type Prediction = Database['public']['Tables']['predictions']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface PredictionsListProps {
  predictions: Prediction[];
  categories: Category[];
  onEdit: (prediction: Prediction) => void;
}

const PredictionsList: React.FC<PredictionsListProps> = ({
  predictions,
  categories,
  onEdit
}) => {
  const formatCurrency = (amount: number) => 
    `€${amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;

  const groupedPredictions = predictions.reduce((acc, prediction) => {
    if (!acc[prediction.type]) {
      acc[prediction.type] = [];
    }
    acc[prediction.type].push(prediction);
    return acc;
  }, {} as Record<string, Prediction[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedPredictions).map(([type, items]) => (
        <div key={type}>
          <h4 className="text-lg font-semibold mb-3 capitalize">{type}s</h4>
          <div className="space-y-2">
            {items.map(prediction => (
              <div
                key={prediction.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium">{prediction.category}</div>
                  {prediction.notes && (
                    <div className="text-sm text-gray-500">{prediction.notes}</div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`font-semibold ${
                      prediction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(prediction.amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {prediction.confidence}% confidence
                    </div>
                  </div>
                  <button
                    onClick={() => onEdit(prediction)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <Pencil className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {predictions.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          No predictions added yet
        </div>
      )}
    </div>
  );
};

export default PredictionsList;