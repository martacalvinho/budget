import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface TransactionData {
  category: string;
  avgSize: number;
  frequency: number;
  peakTime: string;
}

interface UserBehaviorProps {
  data: TransactionData[];
}

export const UserBehavior: React.FC<UserBehaviorProps> = ({ data }) => {
  const sortedByAvg = [...data].sort((a, b) => b.avgSize - a.avgSize);
  const sortedByFreq = [...data].sort((a, b) => b.frequency - a.frequency);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">User Behavior Analysis</h2>

      {/* Average Transaction Size */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Average Transaction Size by Category</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedByAvg}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="category"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Bar 
                dataKey="avgSize" 
                name="Average Transaction"
                fill="#93c5fd"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction Frequency */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Transaction Frequency by Category</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedByFreq}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="category"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value} transactions`} />
              <Bar 
                dataKey="frequency" 
                name="Number of Transactions"
                fill="#1d4ed8"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Peak Times */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Peak Transaction Times</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedByFreq.slice(0, 6).map(item => (
            <div key={item.category} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{item.category}</p>
                  <p className="text-sm text-gray-600">Peak Time: {item.peakTime}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{item.frequency} transactions</p>
                  <p className="text-sm text-gray-600">Avg: ${item.avgSize.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
