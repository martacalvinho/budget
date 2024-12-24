import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type IncomeSource = {
  id: string;
  name: string;
  type: 'salary' | 'bonus' | 'investment' | 'other';
  currency: string;
  isRecurring: boolean;
};

type IncomeRecord = Database['public']['Tables']['salary_history']['Row'];
type MonthlySummary = {
  totalIncome: number;
  byCurrency: Record<string, number>;
  bySource: Record<string, number>;
  recurring: number;
  nonRecurring: number;
};

type YearlySummary = MonthlySummary & {
  monthlyBreakdown: Record<number, MonthlySummary>;
  averageMonthlyIncome: number;
  trends: {
    highestMonth: number;
    lowestMonth: number;
    yearOverYearGrowth: number;
  };
};

export const incomeService = {
  async addIncomeSource(data: Omit<IncomeSource, 'id'>): Promise<string> {
    const { data: newSource, error } = await supabase
      .from('income_sources')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return newSource.id;
  },

  async addIncomeRecord(data: Omit<IncomeRecord, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const { data: newRecord, error } = await supabase
      .from('salary_history')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return newRecord.id;
  },

  async getUserIncomeSources(userId: string): Promise<IncomeSource[]> {
    const { data, error } = await supabase
      .from('income_sources')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getMonthlyIncome(userId: string, month: number, year: number): Promise<MonthlySummary> {
    const { data, error } = await supabase
      .from('salary_history')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year);

    if (error) throw error;

    const summary: MonthlySummary = {
      totalIncome: 0,
      byCurrency: {},
      bySource: {},
      recurring: 0,
      nonRecurring: 0
    };

    data?.forEach(record => {
      summary.totalIncome += record.amount;
      // Note: In this schema we don't track currency, so defaulting to EUR
      summary.byCurrency['EUR'] = (summary.byCurrency['EUR'] || 0) + record.amount;
      summary.bySource[record.id] = record.amount;
    });

    return summary;
  },

  async getYearlyIncome(userId: string, year: number): Promise<YearlySummary> {
    const { data, error } = await supabase
      .from('salary_history')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .order('month');

    if (error) throw error;

    const monthlyBreakdown: Record<number, MonthlySummary> = {};
    let totalYearlyIncome = 0;

    // Initialize monthly summaries
    for (let month = 1; month <= 12; month++) {
      monthlyBreakdown[month] = {
        totalIncome: 0,
        byCurrency: {},
        bySource: {},
        recurring: 0,
        nonRecurring: 0
      };
    }

    // Process records
    data?.forEach(record => {
      const month = record.month;
      monthlyBreakdown[month].totalIncome += record.amount;
      monthlyBreakdown[month].byCurrency['EUR'] = 
        (monthlyBreakdown[month].byCurrency['EUR'] || 0) + record.amount;
      monthlyBreakdown[month].bySource[record.id] = record.amount;
      totalYearlyIncome += record.amount;
    });

    // Calculate trends
    const monthlyTotals = Object.values(monthlyBreakdown).map(m => m.totalIncome);
    const highestMonth = Math.max(...monthlyTotals);
    const lowestMonth = Math.min(...monthlyTotals.filter(t => t > 0));

    return {
      totalIncome: totalYearlyIncome,
      byCurrency: { EUR: totalYearlyIncome },
      bySource: data?.reduce((acc, record) => {
        acc[record.id] = record.amount;
        return acc;
      }, {} as Record<string, number>) || {},
      recurring: totalYearlyIncome, // Assuming all salary entries are recurring
      nonRecurring: 0,
      monthlyBreakdown,
      averageMonthlyIncome: totalYearlyIncome / 12,
      trends: {
        highestMonth,
        lowestMonth,
        yearOverYearGrowth: 0 // Would need previous year's data to calculate
      }
    };
  }
};