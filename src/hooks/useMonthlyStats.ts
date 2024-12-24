import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { MonthlyStats } from '../types/user';
import { startOfMonth, endOfMonth } from 'date-fns';

export function useMonthlyStats(userId: string, date: Date) {
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        const monthlyStats = await userService.getMonthlyStats(userId, monthStart, monthEnd);
        setStats(monthlyStats);
        setError(null);
      } catch (err) {
        console.error('Error fetching monthly stats:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchStats();
    }
  }, [userId, date]);

  return { stats, loading, error };
}