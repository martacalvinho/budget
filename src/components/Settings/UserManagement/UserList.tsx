import React from 'react';
import { Pencil, Trash2, CreditCard, Wallet } from 'lucide-react';
import type { Database } from '../../../types/database';

type User = Database['public']['Tables']['users']['Row'];

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onSelectSalaryHistory: (userId: string) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  onEdit,
  onDelete,
  onSelectSalaryHistory
}) => {
  return (
    <div className="space-y-4">
      {users.map(user => (
        <div
          key={user.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{user.name}</h3>
              {user.card_number && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <CreditCard className="h-4 w-4" />
                  {user.card_number}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-4">
              <span>{user.type}</span>
              {user.monthly_income > 0 && (
                <span className="flex items-center gap-1">
                  <Wallet className="h-4 w-4" />
                  €{user.monthly_income.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </span>
              )}
              {user.email && <span>{user.email}</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(user)}
              className="p-2 text-blue-600 hover:text-blue-800"
              title="Edit user"
            >
              <Pencil className="h-5 w-5" />
            </button>
            <button
              onClick={() => onSelectSalaryHistory(user.id)}
              className="p-2 text-green-600 hover:text-green-800"
              title="View salary history"
            >
              <Wallet className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(user.id)}
              className="p-2 text-red-600 hover:text-red-800"
              title="Delete user"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserList;