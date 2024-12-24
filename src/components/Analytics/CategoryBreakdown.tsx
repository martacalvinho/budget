import React from 'react';
import { PieChart } from 'lucide-react';

interface CategoryBreakdownProps {
  categoryStats: Record<string, number>;
}

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ categoryStats }) => {
  const totalExpenses = Object.values(categoryStats).reduce((sum, amount) => sum + amount, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <PieChart className="h-5 w-5 text-blue-500" />
        <h3 className="text-xl font-semibold">Category Breakdown</h3>
      </div>
      <div className="space-y-4">
        {Object.entries(categoryStats)
          .sort(([, a], [, b]) => b - a)
          .map(([category, amount]) => {
            const percentage = totalExpenses ? (amount / totalExpenses) * 100 : 0;
            return (
              <div key={category} className="flex items-center">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                    <span className="text-sm text-gray-500">
                      €{amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      <span className="text-xs text-gray-400 ml-1">
                        ({percentage.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default CategoryBreakdown;