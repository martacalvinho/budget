import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';

type Purchase = Database['public']['Tables']['purchases']['Row'];

export function usePurchases(userId?: string) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        let query = supabase
          .from('purchases')
          .select('*')
          .order('date', { ascending: false });

        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        if (error) throw error;
        setPurchases(data || []);
      } catch (err) {
        console.error('Error fetching purchases:', err);
        setError(err as Error);
        toast.error('Failed to load purchases');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('purchases_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'purchases' },
        (payload) => {
          fetchPurchases(); // Refetch to ensure consistency
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return { purchases, loading, error };
}