import React from 'react';
import type { Database } from '../../types/database';

type Prediction = Database['public']['Tables']['predictions']['Row'];

interface PredictionChartProps {
  predictions: Prediction[];
}

const PredictionChart: React.FC<PredictionChartProps> = ({ predictions }) => {
  const totalIncome = predictions
    .filter(p => p.type === 'income')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalExpenses = predictions
    .filter(p => p.type === 'expense')
    .reduce((sum, p) => sum + p.amount, 0);

  const expectedSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (expectedSavings / totalIncome) * 100 : 0;

  const formatCurrency = (amount: number) => 
    `€${amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-green-600 mb-1">Expected Income</div>
          <div className="text-2xl font-bold text-green-700">
            {formatCurrency(totalIncome)}
          </div>
        </div>

        <div className="p-4 bg-red-50 rounded-lg">
          <div className="text-sm text-red-600 mb-1">Expected Expenses</div>
          <div className="text-2xl font-bold text-red-700">
            {formatCurrency(totalExpenses)}
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-600 mb-1">Expected Savings</div>
          <div className="text-2xl font-bold text-blue-700">
            {formatCurrency(expectedSavings)}
          </div>
          <div className="text-sm text-blue-600 mt-1">
            {savingsRate.toFixed(1)}% savings rate
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Category Breakdown</h4>
        {predictions
          .filter(p => p.type === 'expense')
          .map(prediction => {
            const percentage = (prediction.amount / totalExpenses) * 100;
            return (
              <div key={prediction.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{prediction.category}</span>
                  <span>{formatCurrency(prediction.amount)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default PredictionChart;