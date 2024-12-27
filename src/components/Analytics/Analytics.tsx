import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from 'lucide-react';
import { useUsers } from '../../contexts/UserContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

interface CategorySpending {
  category: string;
  amount: number;
  budgeted: number;
  percentage: number;
}

export default function Analytics() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [loading, setLoading] = useState(true);
  const { users } = useUsers();
  const [currentMonthStats, setCurrentMonthStats] = useState({
    expenses: 0,
    prevExpenses: 0,
    income: 0,
    prevIncome: 0,
    budgetUsed: 0,
    savingsRate: 0
  });

  useEffect(() => {
    if (users.length > 0) {
      fetchData();
    }
  }, [users]);

  const fetchData = async () => {
    try {
      // Get the first user (assuming this is the main user)
      const user = users[0];
      if (!user) throw new Error('No user found');

      console.log('Current user:', user.id); // Debug log

      const currentDate = new Date();
      const currentMonth = startOfMonth(currentDate);
      const prevMonth = startOfMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));

      // Get current month's expenses from Dashboard (purchases table)
      const { data: currentMonthExpenses, error: expensesError } = await supabase
        .from('purchases')
        .select('amount, date')
        .gte('date', currentMonth.toISOString())
        .lte('date', endOfMonth(currentDate).toISOString())
        .eq('user_id', user.id);

      console.log('Current month expenses:', currentMonthExpenses, 'Error:', expensesError); // Debug log

      const { data: prevMonthExpenses, error: prevExpensesError } = await supabase
        .from('purchases')
        .select('amount, date')
        .gte('date', prevMonth.toISOString())
        .lte('date', endOfMonth(prevMonth).toISOString())
        .eq('user_id', user.id);

      console.log('Previous month expenses:', prevMonthExpenses, 'Error:', prevExpensesError); // Debug log

      // Get income from Income tab (users table)
      const { data: baseIncome, error: baseIncomeError } = await supabase
        .from('users')
        .select('monthly_income')
        .eq('id', user.id)
        .single();

      console.log('Base income:', baseIncome, 'Error:', baseIncomeError);

      // Get monthly income overrides from monthly_income_overrides table
      const { data: incomeOverride, error: overrideError } = await supabase
        .from('monthly_income_overrides')
        .select('amount')
        .eq('user_id', user.id)
        .eq('month', format(currentDate, 'yyyy-MM'))
        .single();

      console.log('Income override:', incomeOverride, 'Error:', overrideError);

      // Get budget information for current month
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('month', format(currentDate, 'yyyy-MM'));

      console.log('Budgets:', budgets, 'Error:', budgetsError);

      // Calculate current month stats with null checks
      const currentExpensesTotal = currentMonthExpenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) ?? 0;
      const prevExpensesTotal = prevMonthExpenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) ?? 0;
      const currentIncome = (incomeOverride?.amount ?? baseIncome?.monthly_income) ?? 0;
      const prevIncome = baseIncome?.monthly_income ?? 0;
      const totalBudget = budgets?.reduce((sum, budget) => sum + (budget.amount || 0), 0) ?? 0;

      console.log('Calculated totals:', {
        currentExpensesTotal,
        prevExpensesTotal,
        currentIncome,
        prevIncome,
        totalBudget
      }); // Debug log

      setCurrentMonthStats({
        expenses: currentExpensesTotal,
        prevExpenses: prevExpensesTotal,
        income: currentIncome,
        prevIncome,
        budgetUsed: totalBudget > 0 ? (currentExpensesTotal / totalBudget) * 100 : 0,
        savingsRate: currentIncome > 0 ? ((currentIncome - currentExpensesTotal) / currentIncome) * 100 : 0
      });

      // Get category spending with null checks
      const { data: recentPurchases, error: recentPurchasesError } = await supabase
        .from('purchases')
        .select('amount, category')
        .gte('date', currentMonth.toISOString())
        .lte('date', endOfMonth(currentDate).toISOString())
        .eq('user_id', user.id);

      console.log('Recent purchases:', recentPurchases, 'Error:', recentPurchasesError); // Debug log

      // Process category spending with null checks
      const categoryTotals = recentPurchases?.reduce((acc: {[key: string]: number}, purchase) => {
        if (purchase.category && purchase.amount) {
          acc[purchase.category] = (acc[purchase.category] || 0) + purchase.amount;
        }
        return acc;
      }, {}) || {};

      const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

      const categoryStats = Object.entries(categoryTotals).map(([category, amount]) => {
        const budget = budgets?.find(b => b.category === category);
        return {
          category,
          amount,
          budgeted: budget?.amount || 0,
          percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
        };
      });

      console.log('Category stats:', categoryStats); // Debug log

      setCategorySpending(categoryStats.sort((a, b) => b.amount - a.amount));

      // Get historical data for trend
      const months = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        return {
          start: startOfMonth(date),
          end: endOfMonth(date),
          month: format(date, 'MMM yyyy')
        };
      }).reverse();

      const monthlyStats = await Promise.all(months.map(async ({ start, end, month }) => {
        const { data: expenses } = await supabase
          .from('purchases')
          .select('amount')
          .gte('date', start.toISOString())
          .lte('date', end.toISOString())
          .eq('user_id', user.id);

        const { data: monthOverride } = await supabase
          .from('monthly_income_overrides')
          .select('amount')
          .eq('user_id', user.id)
          .eq('month', format(start, 'yyyy-MM'))
          .single();

        const monthIncome = monthOverride?.amount ?? baseIncome?.monthly_income ?? 0;
        const monthExpenses = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) ?? 0;

        return {
          month,
          income: monthIncome,
          expenses: monthExpenses,
          savings: monthIncome - monthExpenses
        };
      }));

      console.log('Monthly stats:', monthlyStats); // Debug log

      setMonthlyData(monthlyStats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading analytics...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Monthly Expenses</h3>
            <div className={`flex items-center ${
              currentMonthStats.expenses > currentMonthStats.prevExpenses ? 'text-red-500' : 'text-green-500'
            }`}>
              {currentMonthStats.expenses > currentMonthStats.prevExpenses ? 
                <TrendingUp className="h-5 w-5" /> : 
                <TrendingDown className="h-5 w-5" />
              }
              <span className="ml-1">
                {Math.abs(
                  ((currentMonthStats.expenses - currentMonthStats.prevExpenses) / 
                  currentMonthStats.prevExpenses) * 100
                ).toFixed(1)}%
              </span>
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            €{currentMonthStats.expenses.toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-gray-500">vs last month</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Monthly Income</h3>
            <div className={`flex items-center ${
              currentMonthStats.income > currentMonthStats.prevIncome ? 'text-green-500' : 'text-red-500'
            }`}>
              {currentMonthStats.income > currentMonthStats.prevIncome ? 
                <TrendingUp className="h-5 w-5" /> : 
                <TrendingDown className="h-5 w-5" />
              }
              <span className="ml-1">
                {Math.abs(
                  ((currentMonthStats.income - currentMonthStats.prevIncome) / 
                  currentMonthStats.prevIncome) * 100
                ).toFixed(1)}%
              </span>
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            €{currentMonthStats.income.toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-gray-500">vs last month</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Savings Rate</h3>
            <PiggyBank className="h-6 w-6 text-blue-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {currentMonthStats.savingsRate.toFixed(1)}%
          </p>
          <p className="mt-1 text-sm text-gray-500">of income saved</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Budget Status</h3>
            <DollarSign className="h-6 w-6 text-blue-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {currentMonthStats.budgetUsed.toFixed(1)}%
          </p>
          <p className="mt-1 text-sm text-gray-500">of total budget used</p>
        </div>
      </div>

      {/* Income vs Expenses Trend */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Income vs Expenses Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#0088FE" name="Income" />
              <Line type="monotone" dataKey="expenses" stroke="#FF8042" name="Expenses" />
              <Line type="monotone" dataKey="savings" stroke="#00C49F" name="Savings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Top Spending Categories */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Top Spending Categories</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySpending.slice(0, 5)}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {categorySpending.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget vs Actual */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Budget vs Actual Spending</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
                <Legend />
                <Bar dataKey="budgeted" name="Budget" fill="#0088FE" />
                <Bar dataKey="amount" name="Actual" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Details Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Category Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budgeted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categorySpending.map((category, index) => (
                <tr key={category.category} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {category.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    €{category.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    €{category.budgeted.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.percentage.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      category.amount > category.budgeted
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {category.amount > category.budgeted ? 'Over Budget' : 'Within Budget'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
