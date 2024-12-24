import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type MonthlyStats = {
  income: number;
  expenses: number;
  savings: number;
  categories: Record<string, number>;
};

export const analyticsService = {
  async getUserStats(userId: string, startDate: Date, endDate: Date) {
    try {
      // Get purchases
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date');

      if (purchasesError) throw purchasesError;

      // Get salary history
      const { data: salaryHistory, error: salaryError } = await supabase
        .from('salary_history')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date');

      if (salaryError) throw salaryError;

      // Calculate monthly stats
      const monthlyStats: Record<string, MonthlyStats> = {};

      // Initialize stats for each month in the range
      const months = new Set([
        ...purchases?.map(p => p.date.substring(0, 7)) || [],
        ...salaryHistory?.map(s => `${s.year}-${s.month.toString().padStart(2, '0')}`) || []
      ]);

      months.forEach(month => {
        monthlyStats[month] = {
          income: 0,
          expenses: 0,
          savings: 0,
          categories: {}
        };
      });

      // Process purchases
      purchases?.forEach(purchase => {
        const month = purchase.date.substring(0, 7);
        monthlyStats[month].expenses += purchase.amount;
        monthlyStats[month].categories[purchase.category] = 
          (monthlyStats[month].categories[purchase.category] || 0) + purchase.amount;
      });

      // Process salary history
      salaryHistory?.forEach(salary => {
        const month = `${salary.year}-${salary.month.toString().padStart(2, '0')}`;
        monthlyStats[month].income = salary.amount;
      });

      // Calculate savings
      Object.values(monthlyStats).forEach(month => {
        month.savings = month.income - month.expenses;
      });

      return monthlyStats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  },

  async addHistoricalData(data: {
    userId: string;
    date: Date;
    amount: number;
    type: 'income' | 'expense';
    category?: string;
    description?: string;
  }) {
    try {
      if (data.type === 'income') {
        const { error } = await supabase
          .from('salary_history')
          .insert({
            user_id: data.userId,
            amount: data.amount,
            month: data.date.getMonth() + 1,
            year: data.date.getFullYear(),
            notes: data.description || null
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('purchases')
          .insert({
            user_id: data.userId,
            amount: data.amount,
            category: data.category || 'Other',
            description: data.description || null,
            date: data.date.toISOString().split('T')[0]
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error adding historical data:', error);
      throw error;
    }
  }
};