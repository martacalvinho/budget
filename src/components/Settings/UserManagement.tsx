import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useUsers } from '../../contexts/UserContext';
import SalaryHistoryForm from './SalaryHistoryForm';
import SalaryHistoryList from './SalaryHistoryList';
import type { Database } from '../../types/database';
import UserList from './UserManagement/UserList';
import UserForm from './UserManagement/UserForm';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

const UserManagement: React.FC = () => {
  const { users, loading, refreshUsers } = useUsers();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleAddUser = async (userData: UserInsert) => {
    try {
      const { error } = await supabase
        .from('users')
        .insert(userData);

      if (error) throw error;
      
      await refreshUsers();
      toast.success('User added successfully');
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Failed to add user');
    }
  };

  const handleUpdateUser = async (userData: UserInsert) => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', editingUser.id);

      if (error) throw error;
      
      setEditingUser(null);
      await refreshUsers();
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      await refreshUsers();
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  if (loading) {
    return <div className="p-4">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          {editingUser ? 'Edit User' : 'Add New User'}
        </h2>
        <UserForm
          initialData={editingUser ?? undefined}
          onSubmit={editingUser ? handleUpdateUser : handleAddUser}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">User List</h2>
        <UserList
          users={users}
          onEdit={setEditingUser}
          onDelete={handleDeleteUser}
          onSelectSalaryHistory={setSelectedUserId}
        />
      </div>

      {selectedUserId && (
        <div className="space-y-6">
          <SalaryHistoryForm 
            userId={selectedUserId}
            onEntryAdded={refreshUsers}
          />
          <SalaryHistoryList userId={selectedUserId} />
        </div>
      )}
    </div>
  );
};

export default UserManagement;