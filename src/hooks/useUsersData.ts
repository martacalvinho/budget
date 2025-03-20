import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';

// We read from the users view but subscribe to changes in user_profiles table
const TABLE_NAME = 'user_profiles';
const VIEW_NAME = 'users';

type User = Database['public']['Tables']['users']['Row'];

export function useUsersData() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from(VIEW_NAME)
          .select('*')
          .order('name');

        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err as Error);
        toast.error('Falha ao carregar utilizadores');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('users_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: TABLE_NAME },
        () => {
          // Refetch to ensure consistency when user_profiles changes
          fetchUsers();
        })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(VIEW_NAME)
      .select('*')
      .order('name');

    if (error) {
      console.error('Error refreshing users:', error);
      toast.error('Falha ao atualizar utilizadores');
      return;
    }

    setUsers(data || []);
    setLoading(false);
  };

  return { users, loading, error, refreshUsers };
}