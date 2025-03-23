import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useUsers } from '../../contexts/UserContext';
import SalaryHistoryForm from './SalaryHistoryForm';
import SalaryHistoryList from './SalaryHistoryList';
import type { Database } from '../../types/database';
import UserList from './UserManagement/UserList';
import UserForm from './UserManagement/UserForm';

// Type for reading from users view
type User = Database['public']['Tables']['users']['Row'];

// Type for writing to user_profiles table
interface UserProfileData {
  name: string;
  type: 'Adult' | 'Child';
  monthly_income: number;
  card_number?: string | null;
}

const UserManagement: React.FC = () => {
  const { users, loading, refreshUsers } = useUsers();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentUserProfiles, setCurrentUserProfiles] = useState<User[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Load only profiles owned by the current user
  React.useEffect(() => {
    const fetchOwnedProfiles = async () => {
      try {
        setLoadingProfiles(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('User not authenticated');
          return;
        }
        
        // Filter to only show profiles owned by the current user
        const ownedProfiles = users.filter(profile => {
          return profile.owner_id === user.id;
        });
        
        setCurrentUserProfiles(ownedProfiles);
      } catch (error) {
        console.error('Error fetching owned profiles:', error);
        toast.error('Falha ao carregar perfis');
      } finally {
        setLoadingProfiles(false);
      }
    };
    
    if (!loading && users.length > 0) {
      fetchOwnedProfiles();
    }
  }, [users, loading]);



  const handleAddUser = async (userData: UserProfileData) => {
    try {
      // Call the insert_user_profile function
      const { error } = await supabase.rpc('insert_user_profile', {
        p_name: userData.name,
        p_type: userData.type,
        p_monthly_income: userData.monthly_income,
        p_card_number: userData.card_number || null
      });

      if (error) {
        console.error('Error calling insert_user_profile:', error);
        throw new Error(error.message || 'Falha ao adicionar utilizador');
      }
      
      await refreshUsers();
      toast.success('Utilizador adicionado com sucesso!');
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(error.message || 'Não foi possível adicionar o utilizador');
      console.error('Error adding user:', error);
    }
  };

  const handleUpdateUser = async (userData: UserProfileData) => {
    if (!editingUser) return;

    try {
      // When updating, we only update the fields from UserProfileData
      const updateData = {
        name: userData.name,
        type: userData.type,
        monthly_income: parseFloat(String(userData.monthly_income)) || 0,
        card_number: userData.card_number || null
      };

      // Update the user_profiles table
      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', editingUser.id);

      if (error) throw error;
      
      setEditingUser(null);
      await refreshUsers();
      toast.success('Utilizador atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Falha ao atualizar utilizador');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Delete from user_profiles table directly
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      await refreshUsers();
      toast.success('Utilizador eliminado com sucesso!');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Falha ao eliminar utilizador');
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-600">A carregar utilizadores...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          {editingUser ? 'Editar Utilizador' : 'Adicionar Novo Utilizador'}
        </h2>
        <UserForm
          initialData={editingUser ?? undefined}
          onSubmit={editingUser ? handleUpdateUser : handleAddUser}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Lista de Utilizadores</h2>
        {loadingProfiles ? (
          <div className="p-4 text-gray-600">A carregar perfis de utilizador...</div>
        ) : (
          <UserList
            users={currentUserProfiles}
            onEdit={setEditingUser}
            onDelete={handleDeleteUser}
            onSelectSalaryHistory={setSelectedUserId}
          />
        )}
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