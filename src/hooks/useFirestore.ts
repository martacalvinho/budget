import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  DocumentData,
  QuerySnapshot,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';

interface FirestoreOptions {
  collectionName: string;
  orderByField?: string;
  limitCount?: number;
  realtime?: boolean;
}

export function useFirestore<T>({ 
  collectionName, 
  orderByField = 'date', 
  limitCount = 10,
  realtime = false 
}: FirestoreOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const fetchData = async () => {
      try {
        const queryConstraints = [];
        
        if (orderByField) {
          queryConstraints.push(orderBy(orderByField, 'desc'));
        }
        
        if (limitCount) {
          queryConstraints.push(limit(limitCount));
        }

        const q = query(collection(db, collectionName), ...queryConstraints);

        if (realtime) {
          unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
            const items = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as T[];
            setData(items);
            setLoading(false);
          }, (err) => {
            setError(err as Error);
            setLoading(false);
          });
        } else {
          const snapshot = await getDocs(q);
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as T[];
          setData(items);
          setLoading(false);
        }
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchData();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [collectionName, orderByField, limitCount, realtime]);

  return { data, loading, error };
}