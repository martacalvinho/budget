import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { UserStats } from '../types/user';

export function useUserStats(userId: string, year: number) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const userStats = await userService.getUserStats(userId, year);
        setStats(userStats);
        setError(null);
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchStats();
    }
  }, [userId, year]);

  return { stats, loading, error };
}