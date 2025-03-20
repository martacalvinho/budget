import React, { useState } from 'react';
import type { Database } from '../../../types/database';

// Read from users view
type User = Database['public']['Tables']['users']['Row'];

// For writing, we use a custom type that matches user_profiles table
interface UserProfileData {
  name: string;
  type: 'Adult' | 'Child';
  monthly_income: number;
  card_number?: string | null;
}

interface UserFormProps {
  initialData?: User;
  onSubmit: (data: UserProfileData) => Promise<void>;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState<UserProfileData>({
    name: initialData?.name ?? '',
    type: initialData?.type ?? 'Adult',
    monthly_income: initialData?.monthly_income ?? 0,
    card_number: initialData?.card_number ?? ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a clean version of the data
    const cleanData: UserProfileData = {
      name: formData.name.trim(),
      type: formData.type,
      monthly_income: formData.monthly_income,
      card_number: formData.card_number?.trim() || null
    };

    await onSubmit(cleanData);
    
    if (!initialData) {
      setFormData({
        name: '',
        type: 'Adult',
        monthly_income: 0,
        card_number: ''
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Adult' | 'Child' })}
            className="w-full p-2 border rounded-md"
          >
            <option value="Adult">Adulto</option>
            <option value="Child">Criança</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rendimento Mensal
          </label>
          <input
            type="number"
            value={formData.monthly_income}
            onChange={(e) => setFormData({ ...formData, monthly_income: Number(e.target.value) })}
            className="w-full p-2 border rounded-md"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número do Cartão (Últimos 4 dígitos)
          </label>
          <input
            type="text"
            value={formData.card_number || ''}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
              setFormData({ ...formData, card_number: value });
            }}
            className="w-full p-2 border rounded-md"
            placeholder="e.g. 3840"
            maxLength={4}
            pattern="[0-9]{4}"
          />
        </div>
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        {initialData ? 'Atualizar Utilizador' : 'Adicionar Utilizador'}
      </button>
    </form>
  );
};

export default UserForm;