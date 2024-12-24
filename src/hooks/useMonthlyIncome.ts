import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getMonthDateRange } from '../utils/dateUtils';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';

type IncomeSource = Database['public']['Tables']['income_sources']['Row'];
type IncomeAdjustment = Database['public']['Tables']['income_adjustments']['Row'];

interface MonthlyIncome {
  baseIncome: number;
  adjustments: IncomeAdjustment[];
  totalIncome: number;
  sources: IncomeSource[];
}

export function useMonthlyIncome(year: number, month: number) {
  const [monthlyIncome, setMonthlyIncome] = useState<MonthlyIncome>({
    baseIncome: 0,
    adjustments: [],
    totalIncome: 0,
    sources: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMonthlyIncome = async () => {
      try {
        const { startDate, endDate } = getMonthDateRange(year, month);

        // Fetch income sources
        const { data: sources, error: sourcesError } = await supabase
          .from('income_sources')
          .select('*')
          .or(`end_date.is.null,end_date.gte.${startDate}`)
          .lte('start_date', endDate);

        if (sourcesError) throw sourcesError;

        // Fetch adjustments for the month
        const { data: adjustments, error: adjustmentsError } = await supabase
          .from('income_adjustments')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate);

        if (adjustmentsError) throw adjustmentsError;

        const baseIncome = sources?.reduce((sum, source) => {
          if (source.frequency === 'monthly') {
            return sum + source.amount;
          }
          if (source.frequency === 'yearly') {
            return sum + (source.amount / 12);
          }
          if (source.frequency === 'quarterly') {
            return sum + (source.amount / 3);
          }
          return sum;
        }, 0) || 0;

        const adjustmentsTotal = adjustments?.reduce((sum, adj) => sum + adj.amount, 0) || 0;

        setMonthlyIncome({
          baseIncome,
          adjustments: adjustments || [],
          totalIncome: baseIncome + adjustmentsTotal,
          sources: sources || []
        });
      } catch (err) {
        console.error('Error fetching monthly income:', err);
        setError(err as Error);
        toast.error('Failed to load monthly income');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyIncome();
  }, [year, month]);

  return { monthlyIncome, loading, error };
}