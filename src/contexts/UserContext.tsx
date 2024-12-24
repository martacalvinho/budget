import React, { createContext, useContext } from 'react';
import { useUsersData } from '../hooks/useUsersData';
import type { Database } from '../types/database';

type User = Database['public']['Tables']['users']['Row'];

interface UserContextType {
  users: User[];
  loading: boolean;
  error: Error | null;
  refreshUsers: () => Promise<void>;
  getUserById: (id: string) => User | undefined;
  getUsersByIds: (ids: string[]) => User[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { users, loading, error, refreshUsers } = useUsersData();

  const getUserById = (id: string) => {
    return users.find(user => user.id === id);
  };

  const getUsersByIds = (ids: string[]) => {
    return users.filter(user => ids.includes(user.id));
  };

  return (
    <UserContext.Provider value={{
      users,
      loading,
      error,
      refreshUsers,
      getUserById,
      getUsersByIds
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
};