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
import { format } from 'date-fns';

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
      <div>
        <h3 className="text-lg font-semibold mb-4">Monthly Spending Trends</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[...data].reverse()}>
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
    </div>
  );
};
