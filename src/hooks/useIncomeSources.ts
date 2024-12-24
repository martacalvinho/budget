import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';

type IncomeSource = Database['public']['Tables']['income_sources']['Row'];

export function useIncomeSources() {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchIncomeSources = async () => {
      try {
        const { data, error } = await supabase
          .from('income_sources')
          .select('*')
          .order('name');

        if (error) throw error;
        setIncomeSources(data || []);
      } catch (err) {
        console.error('Error fetching income sources:', err);
        setError(err as Error);
        toast.error('Failed to load income sources');
      } finally {
        setLoading(false);
      }
    };

    fetchIncomeSources();

    const subscription = supabase
      .channel('income_sources_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'income_sources' },
        () => fetchIncomeSources()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { incomeSources, loading, error };
}