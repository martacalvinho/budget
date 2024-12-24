import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';

type SalaryHistory = Database['public']['Tables']['salary_history']['Row'];
type SalaryHistoryInsert = Database['public']['Tables']['salary_history']['Insert'];

export function useSalaryHistory(userId: string) {
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSalaryHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('salary_history')
          .select('*')
          .eq('user_id', userId)
          .order('year', { ascending: false })
          .order('month', { ascending: false });

        if (error) throw error;
        setSalaryHistory(data || []);
      } catch (err) {
        console.error('Error fetching salary history:', err);
        setError(err as Error);
        toast.error('Failed to load salary history');
      } finally {
        setLoading(false);
      }
    };

    fetchSalaryHistory();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('salary_history_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'salary_history', filter: `user_id=eq.${userId}` },
        (payload) => {
          fetchSalaryHistory(); // Refetch to ensure consistency
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const addSalaryEntry = async (entry: Omit<SalaryHistoryInsert, 'user_id'>) => {
    try {
      const { error } = await supabase
        .from('salary_history')
        .insert({
          ...entry,
          user_id: userId
        });

      if (error) throw error;
      toast.success('Salary entry added successfully');
    } catch (err) {
      console.error('Error adding salary entry:', err);
      toast.error('Failed to add salary entry');
      throw err;
    }
  };

  return {
    salaryHistory,
    loading,
    error,
    addSalaryEntry
  };
}