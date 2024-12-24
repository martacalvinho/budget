import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';

type Saving = Database['public']['Tables']['savings']['Row'];

export function useSavings() {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSavings = async () => {
      try {
        const { data, error } = await supabase
          .from('savings')
          .select('*')
          .order('date', { ascending: false })
          .limit(1);

        if (error) throw error;
        setSavings(data || []);
      } catch (err) {
        console.error('Error fetching savings:', err);
        setError(err as Error);
        toast.error('Failed to load savings');
      } finally {
        setLoading(false);
      }
    };

    fetchSavings();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('savings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'savings' },
        (payload) => {
          fetchSavings(); // Refetch to ensure consistency
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const currentSavings = savings[0]?.amount || 0;

  return { currentSavings, loading, error };
}