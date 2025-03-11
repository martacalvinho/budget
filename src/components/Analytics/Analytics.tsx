import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useUsers } from '../../contexts/UserContext';
import { CategoryBreakdown } from './CategoryBreakdown';
import { TimeAnalysis } from './TimeAnalysis';

import { ChevronDown, ChevronUp } from 'lucide-react';

interface UserSpending {
  userId: string;
  userName: string;
  totalSpent: number;
  categoryBreakdown: { [key: string]: number };
  highestCategory: {
    category: string;
    amount: number;
  };
}

interface TotalStats {
  totalIncome: number;
  totalExpenses: number;
  totalBudgeted: number;
  totalSpent: number;
}

const UserSpendingDetails: React.FC<{ user: UserSpending }> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <h3 className="text-lg font-medium">{user.userName}</h3>
          <p className="text-2xl font-bold">${Math.abs(user.totalSpent).toFixed(2)}</p>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="mt-4 space-y-2">
          {Object.entries(user.categoryBreakdown)
            .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
            .map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center py-1">
                <span className="text-gray-600">{category}</span>
                <span className="font-medium">${Math.abs(amount).toFixed(2)}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default function Analytics() {
  const { users } = useUsers();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userSpending, setUserSpending] = useState<UserSpending[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [totalStats, setTotalStats] = useState<TotalStats>({
    totalIncome: 0,
    totalExpenses: 0,
    totalBudgeted: 0,
    totalSpent: 0
  });
  const [topSpender, setTopSpender] = useState<UserSpending | null>(null);
  const [timeAnalysisData, setTimeAnalysisData] = useState<any[]>([]);


  useEffect(() => {
    if (users.length > 0) {
      fetchData();
      fetchHistoricalData();
    }
  }, [users, selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = startOfMonth(selectedMonth);
      const endDate = endOfMonth(selectedMonth);

      // Get users and their base income
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, monthly_income');

      if (usersError) throw usersError;
      if (!users || users.length === 0) {
        throw new Error('No users found');
      }

      // Get monthly overrides for the specific month
      const { data: monthlyOverrides } = await supabase
        .from('monthly_income_overrides')
        .select('*')
        .eq('month', format(selectedMonth, 'yyyy-MM', { locale: pt }));

      // Get extra income for the month
      const { data: extraIncomes } = await supabase
        .from('extra_income')
        .select('amount')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());

      // Calculate base total (including overrides)
      const baseTotal = users?.reduce((total, user) => {
        const override = monthlyOverrides?.find(o => o.user_id === user.id);
        const amount = override ? override.amount : user.monthly_income;
        return total + (amount || 0);
      }, 0) || 0;

      // Calculate extra income total
      const extraTotal = extraIncomes?.reduce((total, income) => total + (income.amount || 0), 0) || 0;

      // Calculate total income
      const totalIncome = baseTotal + extraTotal;

      // Fetch user spending data
      const userSpendingPromises = users.map(async (user) => {
        const { data: purchases, error: purchasesError } = await supabase
          .from('purchases')
          .select('amount, category, date')
          .eq('user_id', user.id)
          .gte('date', startDate.toISOString())
          .lte('date', endDate.toISOString());

        if (purchasesError) throw purchasesError;

        const categoryBreakdown: { [key: string]: number } = {};
        let totalSpent = 0;
        let highestCategory = { category: '', amount: 0 };

        purchases?.forEach((purchase) => {
          const category = purchase.category || 'Uncategorized';
          const amount = purchase.amount; // Keep negative values for correct sorting
          categoryBreakdown[category] = (categoryBreakdown[category] || 0) + amount;
          totalSpent += amount;

          if (Math.abs(categoryBreakdown[category]) > Math.abs(highestCategory.amount)) {
            highestCategory = {
              category,
              amount: categoryBreakdown[category]
            };
          }
        });

        return {
          userId: user.id,
          userName: user.name || user.email,
          totalSpent,
          categoryBreakdown,
          highestCategory
        };
      });

      const userSpendingData = await Promise.all(userSpendingPromises);
      setUserSpending(userSpendingData);

      // Find top spender (based on absolute total spent)
      const topSpender = userSpendingData.reduce((prev, current) => 
        Math.abs(current.totalSpent) > Math.abs(prev.totalSpent) ? current : prev
      , userSpendingData[0]);
      
      setTopSpender(topSpender);

      // Fetch total stats
      // Get all categories and their budgets for the current month
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('month', format(selectedMonth, 'yyyy-MM', { locale: pt }));

      if (budgetsError) throw budgetsError;

      // Calculate total income and budgeted amount
      const totalExpenses = userSpendingData.reduce((sum, user) => sum + user.totalSpent, 0);
      const totalBudgeted = budgets?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      setTotalStats({
        totalIncome,
        totalExpenses,
        totalBudgeted,
        totalSpent: totalExpenses
      });

      // Process category data for the chart
      const allCategories = new Set([
        ...Object.keys(userSpendingData.reduce((acc, user) => ({
          ...acc,
          ...user.categoryBreakdown
        }), {})),
        ...(budgets?.map(b => b.category) || [])
      ]);

      const processedCategoryData = Array.from(allCategories).map(category => {
        const actualSpent = userSpendingData.reduce(
          (sum, user) => sum + Math.abs(user.categoryBreakdown[category] || 0),
          0
        );
        const budgetItem = budgets?.find(b => b.category === category);
        const budgetedAmount = budgetItem?.amount || 0;

        return {
          category,
          actual: actualSpent,
          budgeted: budgetedAmount,
          variance: actualSpent - budgetedAmount
        };
      });

      setCategoryData(processedCategoryData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const fetchHistoricalData = async () => {
    try {
      // Fetch last 12 months of data
      const monthsData = await Promise.all(
        Array.from({ length: 12 }).map(async (_, i) => {
          const date = subMonths(selectedMonth, i);
          const start = startOfMonth(date);
          const end = endOfMonth(date);

          // Get spending data
          const { data: purchases } = await supabase
            .from('purchases')
            .select('amount, category, date, created_at')
            .gte('date', start.toISOString())
            .lte('date', end.toISOString());

          // Get budget data
          const { data: budgets } = await supabase
            .from('budgets')
            .select('amount')
            .eq('month', format(date, 'yyyy-MM'));

          const totalSpent = purchases?.reduce((sum, p) => sum + Math.abs(p.amount), 0) || 0;
          const totalBudgeted = budgets?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0;

          // Calculate behavioral data
          const categoryData = purchases?.reduce((acc: any, p) => {
            if (!acc[p.category]) {
              acc[p.category] = {
                totalAmount: 0,
                count: 0,
                times: []
              };
            }
            acc[p.category].totalAmount += Math.abs(p.amount);
            acc[p.category].count += 1;
            acc[p.category].times.push(new Date(p.created_at).getHours());
            return acc;
          }, {});

          const behaviorData = Object.entries(categoryData || {}).map(([category, data]: [string, any]) => ({
            category,
            avgSize: data.totalAmount / data.count,
            frequency: data.count,
            peakTime: `${Math.round(data.times.reduce((a: number, b: number) => a + b, 0) / data.times.length)}:00`
          }));

          return {
            month: start.toISOString(),
            totalSpent,
            totalBudgeted,
            behaviorData
          };
        })
      );

      setTimeAnalysisData(monthsData);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  const getFilteredData = () => {
    let filteredSpending = [...userSpending];
    
    if (selectedUser !== 'all') {
      filteredSpending = filteredSpending.filter(user => user.userId === selectedUser);
    }
    
    if (selectedCategory !== 'all') {
      filteredSpending = filteredSpending.map(user => ({
        ...user,
        categoryBreakdown: {
          [selectedCategory]: user.categoryBreakdown[selectedCategory] || 0
        }
      }));
    }
    
    return filteredSpending;
  };

  const allCategories = Array.from(new Set(
    userSpending.flatMap(user => Object.keys(user.categoryBreakdown))
  )).sort();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-pulse text-gray-600">A carregar dados de análise...</div>
      </div>
    );
  }

  if (!userSpending.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <p className="text-gray-600">Não existem dados de gastos disponíveis para o período selecionado.</p>
      </div>
    );
  }

  const budgetUsedPercentage = totalStats.totalBudgeted 
    ? (Math.abs(totalStats.totalExpenses) / totalStats.totalBudgeted) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <select
            className="w-full border rounded-md p-2"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="all">Todos os Utilizadores</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <select
            className="w-full border rounded-md p-2"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Todas as Categorias</option>
            {allCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <input
            type="month"
            className="w-full border rounded-md p-2"
            value={format(selectedMonth, 'yyyy-MM', { locale: pt })}
            onChange={(e) => setSelectedMonth(new Date(e.target.value))}
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-500">Rendimento Total</h3>
          <p className="text-2xl font-bold">${totalStats.totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-500">Despesas Totais</h3>
          <p className="text-2xl font-bold">${Math.abs(totalStats.totalExpenses).toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-500">Orçamento Total</h3>
          <p className="text-2xl font-bold">${totalStats.totalBudgeted.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-500">Orçamento Utilizado</h3>
          <p className="text-2xl font-bold">{budgetUsedPercentage.toFixed(1)}%</p>
        </div>
      </div>

      {/* Top Spender Card */}
      {topSpender && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">Maior Gastador</h2>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600">Utilizador</p>
              <p className="font-medium">{topSpender.userName}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Gasto</p>
              <p className="font-medium">${Math.abs(topSpender.totalSpent).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Maior Gasto por Categoria</p>
              <p className="font-medium">{topSpender.highestCategory.category}</p>
              <p className="text-sm text-gray-500">
                ${Math.abs(topSpender.highestCategory.amount).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User Spending Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {getFilteredData()
          .sort((a, b) => Math.abs(b.totalSpent) - Math.abs(a.totalSpent))
          .map(user => (
            <UserSpendingDetails key={user.userId} user={user} />
          ))}
      </div>

      {/* Category Breakdown */}
      <CategoryBreakdown categoryData={selectedCategory === 'all' ? categoryData : categoryData.filter(item => item.category === selectedCategory)} />

      {/* Time Analysis */}
      <TimeAnalysis data={timeAnalysisData} />
    </div>
  );
};
