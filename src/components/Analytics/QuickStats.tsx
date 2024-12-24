import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from 'lucide-react';

interface Stats {
  totalIncome: number;
  totalExpenses: number;
  savingsGoal: number;
  monthlyStats: Record<string, {
    income: number;
    expenses: number;
    savings: number;
    categories: Record<string, number>;
  }>;
}

interface QuickStatsProps {
  stats: Stats;
}

const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => {
  const currentDate = new Date();
  const currentMonthKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
  const previousMonthKey = `${currentDate.getFullYear()}-${(currentDate.getMonth()).toString().padStart(2, '0')}`;

  const currentMonth = stats.monthlyStats[currentMonthKey] || {
    income: 0,
    expenses: 0,
    savings: 0,
    categories: {}
  };

  const previousMonth = stats.monthlyStats[previousMonthKey] || {
    income: 0,
    expenses: 0,
    savings: 0,
    categories: {}
  };

  const calculatePercentChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const formatCurrency = (amount: number) => 
    `€${amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;

  const formatPercentage = (value: number) => 
    `${value.toFixed(1)}%`;

  const savingsRate = currentMonth.income > 0 
    ? (currentMonth.savings / currentMonth.income) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Monthly Income</p>
            <p className="text-2xl font-bold">{formatCurrency(currentMonth.income)}</p>
          </div>
          <div className={`p-3 rounded-full ${
            currentMonth.income >= previousMonth.income ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <DollarSign className={`h-6 w-6 ${
              currentMonth.income >= previousMonth.income ? 'text-green-600' : 'text-red-600'
            }`} />
          </div>
        </div>
        <p className={`text-sm mt-2 ${
          currentMonth.income >= previousMonth.income ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatPercentage(Math.abs(calculatePercentChange(currentMonth.income, previousMonth.income)))} vs last month
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Monthly Expenses</p>
            <p className="text-2xl font-bold">{formatCurrency(currentMonth.expenses)}</p>
          </div>
          <div className={`p-3 rounded-full ${
            currentMonth.expenses <= previousMonth.expenses ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {currentMonth.expenses <= previousMonth.expenses ? (
              <TrendingDown className="h-6 w-6 text-green-600" />
            ) : (
              <TrendingUp className="h-6 w-6 text-red-600" />
            )}
          </div>
        </div>
        <p className={`text-sm mt-2 ${
          currentMonth.expenses <= previousMonth.expenses ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatPercentage(Math.abs(calculatePercentChange(currentMonth.expenses, previousMonth.expenses)))} vs last month
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Monthly Savings</p>
            <p className="text-2xl font-bold">{formatCurrency(currentMonth.savings)}</p>
          </div>
          <div className={`p-3 rounded-full ${
            currentMonth.savings >= previousMonth.savings ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <PiggyBank className={`h-6 w-6 ${
              currentMonth.savings >= previousMonth.savings ? 'text-green-600' : 'text-red-600'
            }`} />
          </div>
        </div>
        <p className={`text-sm mt-2 ${
          currentMonth.savings >= previousMonth.savings ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatPercentage(Math.abs(calculatePercentChange(currentMonth.savings, previousMonth.savings)))} vs last month
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Savings Rate</p>
            <p className="text-2xl font-bold">{formatPercentage(savingsRate)}</p>
          </div>
          <div className={`p-3 rounded-full ${savingsRate >= 20 ? 'bg-green-100' : 'bg-red-100'}`}>
            {savingsRate >= 20 ? (
              <TrendingUp className="h-6 w-6 text-green-600" />
            ) : (
              <TrendingDown className="h-6 w-6 text-red-600" />
            )}
          </div>
        </div>
        <p className="text-sm mt-2 text-gray-500">Target: 20%</p>
      </div>
    </div>
  );
};

export default QuickStats;