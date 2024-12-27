import React from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface SharedUser {
  id: string;
  shared_with_email: string;
  created_at: string;
}

export default function UserSharing() {
  const [sharedUsers, setSharedUsers] = React.useState<SharedUser[]>([]);
  const [newEmail, setNewEmail] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  const fetchSharedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSharedUsers(data || []);
    } catch (error) {
      console.error('Error fetching shared users:', error);
      toast.error('Failed to load shared users');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSharedUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    try {
      const { error } = await supabase
        .from('shared_users')
        .insert([
          {
            owner_id: (await supabase.auth.getUser()).data.user?.id,
            shared_with_email: newEmail.toLowerCase(),
          },
        ]);

      if (error) throw error;

      toast.success('User added successfully');
      setNewEmail('');
      fetchSharedUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(error.message === 'duplicate key value violates unique constraint' 
        ? 'This email has already been added'
        : 'Failed to add user');
    }
  };

  const handleRemoveUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shared_users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('User removed successfully');
      fetchSharedUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading shared users...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">Share Your Budget</h2>
      
      <form onSubmit={handleAddUser} className="mb-8">
        <div className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-2">Shared With</h3>
        {sharedUsers.length === 0 ? (
          <p className="text-gray-500">No users shared with yet</p>
        ) : (
          <ul className="divide-y">
            {sharedUsers.map((user) => (
              <li key={user.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-gray-900">{user.shared_with_email}</p>
                  <p className="text-sm text-gray-500">
                    Added {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveUser(user.id)}
                  className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
                  title="Remove user"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
