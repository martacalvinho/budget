import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface TimeAnalysisProps {
  data: {
    month: string;
    totalSpent: number;
    totalBudgeted: number;
  }[];
}

export const TimeAnalysis: React.FC<TimeAnalysisProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">Time-based Analysis</h2>
      
      {/* Month-over-Month Trends */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Monthly Spending Trends</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={(value) => format(new Date(value), 'MMM yyyy')}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `$${value.toFixed(2)}`}
                labelFormatter={(label) => format(new Date(label), 'MMMM yyyy')}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalSpent" 
                name="Actual Spending"
                stroke="#93c5fd" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="totalBudgeted" 
                name="Budget"
                stroke="#1d4ed8" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* YTD Budget Tracking */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Year-to-Date Budget Tracking</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">YTD Spending</p>
            <p className="text-2xl font-bold text-blue-600">
              ${data.reduce((sum, month) => sum + month.totalSpent, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">YTD Budget</p>
            <p className="text-2xl font-bold text-blue-900">
              ${data.reduce((sum, month) => sum + month.totalBudgeted, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Seasonal Patterns */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Seasonal Spending Patterns</h3>
        <div className="space-y-2">
          {['Winter', 'Spring', 'Summer', 'Fall'].map(season => {
            const seasonalAvg = data.reduce((sum, month) => sum + month.totalSpent, 0) / data.length;
            return (
              <div key={season} className="flex items-center">
                <span className="w-20 text-gray-600">{season}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, (seasonalAvg / 1000) * 100)}%` }}
                  />
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  ${seasonalAvg.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
