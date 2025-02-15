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
        const currentUser = (await supabase.auth.getUser()).data.user;
        if (!currentUser) throw new Error('No authenticated user');

        // First, get the list of users who have shared their budget with the current user
        const { data: sharedWith } = await supabase
          .from('shared_users')
          .select('owner_id')
          .eq('shared_with_email', currentUser.email);

        // Get purchases for the specified user or all shared users
        let query = supabase
          .from('purchases')
          .select('*')
          .order('date', { ascending: false });

        if (userId) {
          // If a specific user is requested, check if we have access
          const hasAccess = userId === currentUser.id || 
            sharedWith?.some(share => share.owner_id === userId);
          
          if (!hasAccess) {
            throw new Error('No access to this user\'s purchases');
          }
          query = query.eq('user_id', userId);
        } else {
          // If no specific user, get purchases for current user and all users who shared
          const accessibleUserIds = [
            currentUser.id,
            ...(sharedWith?.map(share => share.owner_id) || [])
          ];
          query = query.in('user_id', accessibleUserIds);
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