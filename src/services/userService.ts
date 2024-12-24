import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type User = Database['public']['Tables']['users']['Row'];
type SalaryHistory = Database['public']['Tables']['salary_history']['Row'];
type UserStats = {
  monthlyStats: Record<string, {
    income: number;
    expenses: number;
    savings: number;
    categories: Record<string, number>;
  }>;
  totalIncome: number;
  totalExpenses: number;
};

export const userService = {
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  },

  async getSalaryHistory(userId: string): Promise<SalaryHistory[]> {
    const { data, error } = await supabase
      .from('salary_history')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addSalaryHistory(data: Omit<SalaryHistory, 'id' | 'created_at' | 'updated_at'>): Promise<SalaryHistory> {
    const { data: newEntry, error } = await supabase
      .from('salary_history')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    // Update user's current monthly income
    await this.updateUser(data.user_id, { monthly_income: data.amount });

    return newEntry;
  },

  async getUserStats(userId: string, year: number): Promise<UserStats> {
    // Get purchases for the year
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`);

    if (purchasesError) throw purchasesError;

    // Get salary history for the year
    const { data: salaryHistory, error: salaryError } = await supabase
      .from('salary_history')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year);

    if (salaryError) throw salaryError;

    // Initialize monthly stats
    const monthlyStats: UserStats['monthlyStats'] = {};
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
    purchases?.forEach(purchase => {
      const monthKey = purchase.date.substring(0, 7);
      monthlyStats[monthKey].expenses += purchase.amount;
      monthlyStats[monthKey].categories[purchase.category] = 
        (monthlyStats[monthKey].categories[purchase.category] || 0) + purchase.amount;
    });

    // Process salary history
    salaryHistory?.forEach(salary => {
      const monthKey = `${year}-${salary.month.toString().padStart(2, '0')}`;
      monthlyStats[monthKey].income = salary.amount;
    });

    // Calculate savings and totals
    let totalIncome = 0;
    let totalExpenses = 0;

    Object.values(monthlyStats).forEach(month => {
      month.savings = month.income - month.expenses;
      totalIncome += month.income;
      totalExpenses += month.expenses;
    });

    return {
      monthlyStats,
      totalIncome,
      totalExpenses
    };
  }
};