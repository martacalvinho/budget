import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';

type Prediction = Database['public']['Tables']['predictions']['Row'];

export function usePredictions(year: number, month: number) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const { data, error } = await supabase
          .from('predictions')
          .select('*')
          .eq('year', year)
          .eq('month', month)
          .order('type')
          .order('category');

        if (error) throw error;
        setPredictions(data || []);
      } catch (err) {
        console.error('Error fetching predictions:', err);
        setError(err as Error);
        toast.error('Failed to load predictions');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('predictions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'predictions' },
        (payload) => {
          fetchPredictions();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [year, month]);

  return { predictions, loading, error };
}