import React, { useState } from 'react';
import { format, addMonths, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { usePredictions } from '../../hooks/usePredictions';
import PredictionForm from './PredictionForm';
import PredictionsList from './PredictionsList';
import PredictionChart from './PredictionChart';

const PredictionsTab: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(startOfMonth(new Date()));
  const [showForm, setShowForm] = useState(false);
  const { categories } = useCategories();
  const { predictions, loading } = usePredictions(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1
  );

  const handlePreviousMonth = () => {
    setSelectedDate(prevDate => addMonths(prevDate, -1));
  };

  const handleNextMonth = () => {
    setSelectedDate(prevDate => addMonths(prevDate, 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-600">Loading predictions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-blue-500" />
          Financial Predictions
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-lg font-medium">
            {format(selectedDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Prediction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Overview</h3>
          <PredictionChart predictions={predictions} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Predictions List</h3>
          <PredictionsList 
            predictions={predictions}
            categories={categories}
            onEdit={(prediction) => {
              // Handle edit
            }}
          />
        </div>
      </div>

      {showForm && (
        <PredictionForm
          onClose={() => setShowForm(false)}
          categories={categories}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
};

export default PredictionsTab;