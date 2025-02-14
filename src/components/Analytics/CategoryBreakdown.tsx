import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface CategoryData {
  category: string;
  actual: number;
  budgeted: number;
  variance: number;
}

interface Props {
  categoryData: CategoryData[];
}

export const CategoryBreakdown: React.FC<Props> = ({ categoryData }) => {
  const sortedData = [...categoryData].sort((a, b) => b.budgeted - a.budgeted);

  const totalBudgeted = categoryData.reduce((sum, item) => sum + item.budgeted, 0);
  const totalActual = categoryData.reduce((sum, item) => sum + item.actual, 0);
  const totalVariance = totalActual - totalBudgeted;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const variance = data.actual - data.budgeted;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="font-medium">{label}</p>
          <p className="text-sm">Budget: ${data.budgeted.toFixed(2)}</p>
          <p className="text-sm">Spent: ${data.actual.toFixed(2)}</p>
          <p className={`text-sm ${variance > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {variance > 0 ? 'Over by: ' : 'Under by: '}
            ${Math.abs(variance).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Budget vs Actual by Category</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-gray-600">Total Budgeted:</span>
            <span className="font-semibold ml-2">${totalBudgeted.toFixed(2)}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Total Actual:</span>
            <span className="font-semibold ml-2">${totalActual.toFixed(2)}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Total Variance:</span>
            <span className={`font-semibold ml-2 ${totalVariance > 0 ? 'text-red-500' : 'text-green-500'}`}>
              ${Math.abs(totalVariance).toFixed(2)}
              {totalVariance > 0 ? ' Over' : ' Under'}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[400px] w-full">
        <ResponsiveContainer>
          <BarChart
            data={sortedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            barSize={40}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
            <XAxis 
              dataKey="category" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="budgeted" 
              name="Target Value" 
              fill="#1d4ed8"
            >
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-budget-${index}`}
                  fill="#1d4ed8"
                  fillOpacity={0.3}
                />
              ))}
            </Bar>
            <Bar 
              dataKey="actual" 
              name="Actual Value" 
              fill="#93c5fd"
            >
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-actual-${index}`}
                  fill="#93c5fd"
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Variance Analysis Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Budget Variance Analysis</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-right">Budgeted</th>
                <th className="px-4 py-2 text-right">Actual</th>
                <th className="px-4 py-2 text-right">Variance</th>
                <th className="px-4 py-2 text-right">% of Budget</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item) => {
                const percentOfBudget = item.budgeted ? (item.actual / item.budgeted) * 100 : 0;
                const variance = item.actual - item.budgeted;
                const isOverBudget = variance > 0;
                return (
                  <tr key={item.category} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{item.category}</td>
                    <td className="px-4 py-2 text-right">${item.budgeted.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">${item.actual.toFixed(2)}</td>
                    <td className={`px-4 py-2 text-right flex items-center justify-end gap-1
                      ${isOverBudget ? 'text-red-500' : 'text-green-500'}`}>
                      {isOverBudget ? (
                        <ArrowUpCircle className="w-4 h-4" />
                      ) : (
                        <ArrowDownCircle className="w-4 h-4" />
                      )}
                      ${Math.abs(variance).toFixed(2)}
                    </td>
                    <td className={`px-4 py-2 text-right ${
                      isOverBudget ? 'text-red-500' : 'text-gray-900'
                    }`}>
                      {percentOfBudget.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};