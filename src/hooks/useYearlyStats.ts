import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';

type Purchase = Database['public']['Tables']['purchases']['Row'];
type SalaryHistory = Database['public']['Tables']['salary_history']['Row'];

interface YearlyStats {
  monthlyStats: Record<string, {
    income: number;
    expenses: number;
    savings: number;
    categories: Record<string, number>;
  }>;
  totalIncome: number;
  totalExpenses: number;
  savingsGoal: number;
  categoryStats: Record<string, number>;
}

export function useYearlyStats(userId: string | undefined, year: number) {
  const [stats, setStats] = useState<YearlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) return;

      try {
        // Fetch purchases for the year
        const { data: purchases, error: purchasesError } = await supabase
          .from('purchases')
          .select('*')
          .eq('user_id', userId)
          .gte('date', `${year}-01-01`)
          .lte('date', `${year}-12-31`);

        if (purchasesError) throw purchasesError;

        // Fetch salary history for the year
        const { data: salaryHistory, error: salaryError } = await supabase
          .from('salary_history')
          .select('*')
          .eq('user_id', userId)
          .eq('year', year);

        if (salaryError) throw salaryError;

        // Calculate monthly stats
        const monthlyStats: YearlyStats['monthlyStats'] = {};
        const categoryStats: Record<string, number> = {};

        // Initialize monthly stats
        for (let month = 1; month <= 12; month++) {
          const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
          monthlyStats[monthKey] = {
            income: 0,
            expenses: 0,
            savings: 0,
            categories: {}
          };
        }

        // Process purchases
        purchases?.forEach((purchase) => {
          const monthKey = purchase.date.substring(0, 7);
          const amount = Number(purchase.amount);

          monthlyStats[monthKey].expenses += amount;
          monthlyStats[monthKey].categories[purchase.category] = 
            (monthlyStats[monthKey].categories[purchase.category] || 0) + amount;
          
          categoryStats[purchase.category] = 
            (categoryStats[purchase.category] || 0) + amount;
        });

        // Process salary history
        salaryHistory?.forEach((salary) => {
          const monthKey = `${year}-${salary.month.toString().padStart(2, '0')}`;
          monthlyStats[monthKey].income = Number(salary.amount);
        });

        // Calculate savings for each month
        Object.keys(monthlyStats).forEach((monthKey) => {
          monthlyStats[monthKey].savings = 
            monthlyStats[monthKey].income - monthlyStats[monthKey].expenses;
        });

        const totalIncome = Object.values(monthlyStats)
          .reduce((sum, month) => sum + month.income, 0);
        const totalExpenses = Object.values(monthlyStats)
          .reduce((sum, month) => sum + month.expenses, 0);

        setStats({
          monthlyStats,
          totalIncome,
          totalExpenses,
          savingsGoal: totalIncome * 0.2, // Example: 20% of income
          categoryStats
        });
      } catch (err) {
        console.error('Error fetching yearly stats:', err);
        setError(err as Error);
        toast.error('Failed to load yearly statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId, year]);

  return { stats, loading, error };
}