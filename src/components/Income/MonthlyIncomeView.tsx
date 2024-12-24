import React from 'react';
import { useMonthlyIncome } from '../../hooks/useMonthlyIncome';
import { format } from 'date-fns';

interface MonthlyIncomeViewProps {
  year: number;
  month: number;
}

const MonthlyIncomeView: React.FC<MonthlyIncomeViewProps> = ({ year, month }) => {
  const { monthlyIncome, loading } = useMonthlyIncome(year, month);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-pulse text-gray-600">Loading monthly income...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500 mb-1">Base Income</div>
          <div className="text-2xl font-bold">
            €{monthlyIncome.baseIncome.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500 mb-1">Adjustments</div>
          <div className="text-2xl font-bold">
            €{monthlyIncome.adjustments.reduce((sum, adj) => sum + adj.amount, 0)
                .toLocaleString('de-DE', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm text-gray-500 mb-1">Total Income</div>
          <div className="text-2xl font-bold text-green-600">
            €{monthlyIncome.totalIncome.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {monthlyIncome.adjustments.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-semibold mb-4">Adjustments</h3>
          <div className="space-y-2">
            {monthlyIncome.adjustments.map(adjustment => (
              <div
                key={adjustment.id}
                className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md"
              >
                <div>
                  <div className="font-medium">{adjustment.type}</div>
                  {adjustment.description && (
                    <div className="text-sm text-gray-500">{adjustment.description}</div>
                  )}
                  <div className="text-sm text-gray-500">
                    {format(new Date(adjustment.date), 'MMM d, yyyy')}
                  </div>
                </div>
                <div className="font-semibold">
                  €{adjustment.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyIncomeView;