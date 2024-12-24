import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useUsers } from '../contexts/UserContext';

interface Stats {
  totalIncome: number;
  totalExpenses: number;
  monthlyStats: {
    [key: string]: {
      income: number;
      expenses: number;
      savings: number;
    };
  };
}

export const useStats = (userId?: string) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentUser } = useUsers();

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) {
        setStats(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const purchasesQuery = query(
          collection(db, 'purchases'),
          where('userId', '==', userId || currentUser.uid)
        );

        const salaryQuery = query(
          collection(db, 'salaryHistory'),
          where('userId', '==', userId || currentUser.uid)
        );

        const [purchasesSnapshot, salarySnapshot] = await Promise.all([
          getDocs(purchasesQuery),
          getDocs(salaryQuery)
        ]);

        const purchases = purchasesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const salaries = salarySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate stats
        const monthlyStats: Stats['monthlyStats'] = {};
        const totalIncome = salaries.reduce((sum, salary) => sum + salary.amount, 0);
        const totalExpenses = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

        setStats({
          totalIncome,
          totalExpenses,
          monthlyStats
        });
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId, currentUser]);

  return { stats, loading, error };
};