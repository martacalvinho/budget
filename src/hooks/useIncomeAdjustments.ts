import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';

type IncomeAdjustment = Database['public']['Tables']['income_adjustments']['Row'];

export function useIncomeAdjustments(year?: number, month?: number) {
  const [adjustments, setAdjustments] = useState<IncomeAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAdjustments = async () => {
      try {
        let query = supabase
          .from('income_adjustments')
          .select('*')
          .order('date', { ascending: false });

        if (year && month) {
          const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
          const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
          query = query
            .gte('date', startDate)
            .lte('date', endDate);
        }

        const { data, error } = await query;
        if (error) throw error;
        setAdjustments(data || []);
      } catch (err) {
        console.error('Error fetching income adjustments:', err);
        setError(err as Error);
        toast.error('Failed to load income adjustments');
      } finally {
        setLoading(false);
      }
    };

    fetchAdjustments();

    const subscription = supabase
      .channel('income_adjustments_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'income_adjustments' },
        () => fetchAdjustments()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [year, month]);

  return { adjustments, loading, error };
}