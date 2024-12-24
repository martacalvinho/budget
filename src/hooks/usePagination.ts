import { useState } from 'react';
import { Query, getDocs, QuerySnapshot } from 'firebase/firestore';

interface PaginationState<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function usePagination<T>(
  baseQuery: Query,
  pageSize: number = 10
): PaginationState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const snapshot: QuerySnapshot = await getDocs(baseQuery);
      
      const newItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      setItems(prev => [...prev, ...newItems]);
      setHasMore(newItems.length === pageSize);
      
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastDoc(lastVisible);
    } catch (error) {
      console.error('Pagination error:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  return { items, loading, hasMore, loadMore };
}