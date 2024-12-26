import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';

type Category = Database['public']['Tables']['categories']['Row'];

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
        .abortSignal(new AbortController().signal); // Force fresh data

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err as Error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, fetchCategories };
}