import { useState, useEffect } from 'react';
import { Query, getDocs, QuerySnapshot } from 'firebase/firestore';

interface QueryResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

export function useFirebaseQuery<T>(query: Query, dependencies: any[] = []): QueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const snapshot: QuerySnapshot = await getDocs(query);
        
        if (mounted) {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as T[];
          
          setData(items);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, dependencies);

  return { data, loading, error };
}