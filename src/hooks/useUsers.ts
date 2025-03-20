import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';

// Constants for table and view names
const VIEW_NAME = 'users';
const TABLE_NAME = 'user_profiles';

// Type for reading from users view
type User = Database['public']['Tables']['users']['Row'];

export function useUsers() {
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

    // Subscribe to realtime changes in user_profiles table
    const subscription = supabase
      .channel('user_profiles_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: TABLE_NAME },
        () => {
          fetchUsers(); // Refetch to ensure consistency
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