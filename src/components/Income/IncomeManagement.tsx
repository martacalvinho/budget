import React, { useState } from 'react';
import { Plus, DollarSign } from 'lucide-react';
import IncomeSourceForm from './IncomeSourceForm';
import IncomeAdjustmentForm from './IncomeAdjustmentForm';
import IncomeSourcesList from './IncomeSourcesList';
import MonthlyIncomeView from './MonthlyIncomeView';
import DateFilter from '../Dashboard/Filters/DateFilter';

const IncomeManagement: React.FC = () => {
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-blue-500" />
          Income Management
        </h2>
        <div className="flex items-center gap-4">
          <DateFilter
            selectedDate={selectedDate}
            onChange={setSelectedDate}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowSourceForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Income Source
            </button>
            <button
              onClick={() => setShowAdjustmentForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Adjustment
            </button>
          </div>
        </div>
      </div>

      <MonthlyIncomeView
        year={selectedDate.getFullYear()}
        month={selectedDate.getMonth() + 1}
      />

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Income Sources</h3>
        <IncomeSourcesList onEdit={() => {}} />
      </div>

      {showSourceForm && (
        <IncomeSourceForm
          onClose={() => setShowSourceForm(false)}
          onSaved={() => setShowSourceForm(false)}
        />
      )}

      {showAdjustmentForm && (
        <IncomeAdjustmentForm
          onClose={() => setShowAdjustmentForm(false)}
          onSaved={() => setShowAdjustmentForm(false)}
        />
      )}
    </div>
  );
};

export default IncomeManagement;