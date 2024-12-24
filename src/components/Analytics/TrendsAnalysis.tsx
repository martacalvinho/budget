import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MonthlyData {
  income: number;
  expenses: number;
  savings: number;
  categories: Record<string, number>;
}

interface TrendsAnalysisProps {
  monthlyStats: Record<string, MonthlyData>;
}

const TrendsAnalysis: React.FC<TrendsAnalysisProps> = ({ monthlyStats }) => {
  const months = Object.keys(monthlyStats).sort();
  const monthlyIncomes = months.map(month => monthlyStats[month].income);
  const monthlyExpenses = months.map(month => monthlyStats[month].expenses);

  const averageIncome = monthlyIncomes.reduce((sum, val) => sum + val, 0) / months.length;
  const averageExpenses = monthlyExpenses.reduce((sum, val) => sum + val, 0) / months.length;

  const incomeGrowth = months.length > 1
    ? ((monthlyStats[months[months.length - 1]].income - monthlyStats[months[0]].income) 
      / monthlyStats[months[0]].income) * 100
    : 0;

  const expenseGrowth = months.length > 1
    ? ((monthlyStats[months[months.length - 1]].expenses - monthlyStats[months[0]].expenses) 
      / monthlyStats[months[0]].expenses) * 100
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-6">Financial Trends</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-medium">Income Trend</h4>
            {incomeGrowth >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
          </div>
          <p className="text-2xl font-bold mb-2">
            €{averageIncome.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500">Average monthly income</p>
          <p className={`text-sm mt-2 ${incomeGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {incomeGrowth.toFixed(1)}% YTD change
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-medium">Expense Trend</h4>
            {expenseGrowth <= 0 ? (
              <TrendingDown className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingUp className="h-5 w-5 text-red-500" />
            )}
          </div>
          <p className="text-2xl font-bold mb-2">
            €{averageExpenses.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500">Average monthly expenses</p>
          <p className={`text-sm mt-2 ${expenseGrowth <= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {expenseGrowth.toFixed(1)}% YTD change
          </p>
        </div>
      </div>

      <div className="relative h-64">
        {/* Chart visualization would go here */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          Chart visualization would go here
        </div>
      </div>
    </div>
  );
};

export default TrendsAnalysis;