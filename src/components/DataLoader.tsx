import React from 'react';
import { useFirebaseQuery } from '../hooks/useFirebaseQuery';
import { Query } from 'firebase/firestore';

interface DataLoaderProps<T> {
  query: Query;
  children: (data: T[]) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: (error: Error) => React.ReactNode;
}

export function DataLoader<T>({
  query,
  children,
  loadingComponent = <div>Loading...</div>,
  errorComponent = (error) => <div>Error: {error.message}</div>
}: DataLoaderProps<T>) {
  const { data, loading, error } = useFirebaseQuery<T>(query);

  if (loading) return <>{loadingComponent}</>;
  if (error) return <>{errorComponent(error)}</>;
  
  return <>{children(data)}</>;
}