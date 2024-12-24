import React from 'react';
import { Users } from 'lucide-react';
import { useUsers } from '../../../contexts/UserContext';

interface UserFilterProps {
  selectedUsers: string[];
  onChange: (users: string[]) => void;
}

const UserFilter: React.FC<UserFilterProps> = ({ selectedUsers, onChange }) => {
  const { users } = useUsers();

  const handleToggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      onChange(selectedUsers.filter(id => id !== userId));
    } else {
      onChange([...selectedUsers, userId]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {users.map(user => (
        <button
          key={user.id}
          onClick={() => handleToggleUser(user.id)}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
            selectedUsers.includes(user.id)
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users className="h-3 w-3" />
          {user.name}
        </button>
      ))}
    </div>
  );
};

export default UserFilter;