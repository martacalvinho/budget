import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Euro, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

// Helper functions
const getCurrentMonthDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

const formatMonthDisplay = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
};

const getMonthOptions = () => {
  const options = [];
  const currentDate = new Date();
  // Show last 12 months and next 2 months
  for (let i = -11; i <= 2; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const dateStr = date.toISOString().split('T')[0];
    options.push(dateStr);
  }
  return options;
};

interface User {
  id: string;
  name: string;
  type: 'Adult' | 'Child';
  monthly_income: number;
}

interface MonthlyIncomeOverride {
  id: string;
  user_id: string;
  amount: number;
  month: string;
}

interface ExtraIncome {
  id: string;
  from_person: string;
  description: string;
  amount: number;
  date: string;
  recurring: boolean;
  user_id: string;
}

export default function Income() {
  const [extraIncomes, setExtraIncomes] = useState<ExtraIncome[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [monthlyOverrides, setMonthlyOverrides] = useState<MonthlyIncomeOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showBaseIncomeForm, setShowBaseIncomeForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [baseIncomeMontante, setBaseIncomeMontante] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthDate());
  const [formData, setFormData] = useState({
    from_person: '',
    description: '',
    amount: '',
    date: '',
    recurring: false
  });

  useEffect(() => {
    fetchIncomes();
    fetchUsers();
    fetchMonthlyOverrides();
  }, [selectedMonth]); // Refetch when month changes

  const fetchMonthlyOverrides = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_income_overrides')
        .select('*')
        .eq('month', selectedMonth);

      if (error) throw error;
      setMonthlyOverrides(data || []);
    } catch (error) {
      console.error('Error fetching monthly overrides:', error);
      toast.error('Failed to load monthly income overrides');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, type, monthly_income')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao obter utilizadores:', error);
      toast.error('Falha ao carregar utilizadores');
    }
  };

  const fetchIncomes = async () => {
    try {
      const startOfMonth = new Date(selectedMonth);
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('extra_income')
        .select('*')
        .gte('date', startOfMonth.toISOString())
        .lte('date', endOfMonth.toISOString())
        .order('date', { ascending: false });

      if (error) throw error;
      setExtraIncomes(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao obter rendimentos:', error);
      toast.error('Falha ao carregar rendimentos extra');
      setLoading(false);
    }
  };

  const handleBaseIncomeUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const amount = parseFloat(baseIncomeMontante);
      const existingOverride = monthlyOverrides.find(o => o.user_id === editingUser.id);

      if (existingOverride) {
        // Update existing override
        const { error } = await supabase
          .from('monthly_income_overrides')
          .update({ amount })
          .eq('id', existingOverride.id);

        if (error) throw error;
      } else {
        // Create new override
        const { error } = await supabase
          .from('monthly_income_overrides')
          .insert({
            user_id: editingUser.id,
            amount,
            month: selectedMonth
          });

        if (error) throw error;
      }

      toast.success('Rendimento base atualizado para este mês');
      setShowBaseIncomeForm(false);
      setEditingUser(null);
      setBaseIncomeMontante('');
      fetchMonthlyOverrides();
    } catch (error) {
      console.error('Erro ao atualizar rendimento base:', error);
      toast.error('Falha ao atualizar rendimento base');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const incomeData = {
        ...formData,
        amount: parseFloat(formData.amount),
        user_id: user.id
      };

      if (editingId) {
        const { error } = await supabase
          .from('extra_income')
          .update(incomeData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Rendimento atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('extra_income')
          .insert([incomeData]);

        if (error) throw error;
        toast.success('Rendimento adicionado com sucesso');
      }

      setShowAddForm(false);
      setEditingId(null);
      setFormData({
        from_person: '',
        description: '',
        amount: '',
        date: '',
        recurring: false
      });
      fetchIncomes();
    } catch (error) {
      console.error('Error saving income:', error);
      toast.error('Failed to save income');
    }
  };

  const handleEdit = (income: ExtraIncome) => {
    setFormData({
      from_person: income.from_person,
      description: income.description,
      amount: income.amount.toString(),
      date: income.date,
      recurring: income.recurring
    });
    setEditingId(income.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income?')) return;

    try {
      const { error } = await supabase
        .from('extra_income')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Income deleted successfully');
      fetchIncomes();
    } catch (error) {
      console.error('Error deleting income:', error);
      toast.error('Failed to delete income');
    }
  };

  // Calculate monthly totals
  const extraTotal = extraIncomes.reduce((total, income) => total + income.amount, 0);

  const baseTotal = users.reduce((total, user) => {
    // Check if there's an override for this month
    const override = monthlyOverrides.find(o => o.user_id === user.id);
    // Use override amount if exists, otherwise use default monthly_income
    const amount = override ? override.amount : user.monthly_income;
    return total + (amount || 0);
  }, 0);

  const totalIncome = baseTotal + extraTotal;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Month Selector */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              const date = new Date(selectedMonth);
              date.setMonth(date.getMonth() - 1);
              setSelectedMonth(date.toISOString().split('T')[0]);
            }}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {getMonthOptions().map((date) => (
              <option key={date} value={date}>
                {formatMonthDisplay(date)}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              const date = new Date(selectedMonth);
              date.setMonth(date.getMonth() + 1);
              setSelectedMonth(date.toISOString().split('T')[0]);
            }}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {selectedMonth === getCurrentMonthDate() && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Rendimento Extra
          </button>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rendimento Base Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Rendimento Base</h2>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">€{baseTotal.toFixed(2)}</p>
          <div className="mt-4 space-y-2">
            {users.map(user => {
              const override = monthlyOverrides.find(o => o.user_id === user.id);
              const amount = override ? override.amount : user.monthly_income;
              return (
                <div key={user.id} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{user.name}</span>
                  <div className="flex items-center">
                    <span className={`text-gray-900 ${override ? 'font-medium text-blue-600' : ''}`}>
                      €{amount.toFixed(2)}
                      {override && (
                        <span className="ml-1 text-xs text-gray-500">
                          (normalmente €{user.monthly_income.toFixed(2)})
                        </span>
                      )}
                    </span>
                    <button
                        onClick={() => {
                          setEditingUser(user);
                          setBaseIncomeMontante((override?.amount || user.monthly_income).toString());
                          setShowBaseIncomeForm(true);
                        }}
                        className="ml-2 text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rendimento Extra Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Rendimento Extra</h2>
            <Euro className="h-8 w-8 text-green-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-green-600">€{extraTotal.toFixed(2)}</p>
          <p className="text-sm text-gray-500">{formatMonthDisplay(selectedMonth)}</p>
        </div>

        {/* Rendimento Total Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Rendimento Total</h2>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-purple-600">€{totalIncome.toFixed(2)}</p>
          <p className="text-sm text-gray-500">{formatMonthDisplay(selectedMonth)}</p>
        </div>
      </div>


      {/* Rendimento Extra Form */}
      {showAddForm && (
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              {editingId ? 'Editar Rendimento Extra' : 'Adicionar Rendimento Extra'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">De</label>
                <select
                  value={formData.from_person}
                  onChange={(e) => setFormData({ ...formData, from_person: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione a origem</option>
                  {users.map(user => (
                    <option key={user.id} value={user.name}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  placeholder="Qual é a finalidade deste rendimento?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Montante</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">€</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="block w-full pl-7 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex items-center h-full pt-6">
                <label className="flex items-center space-x-2 text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.recurring}
                    onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span>Rendimento Recorrente</span>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  setFormData({ from_person: '', description: '', amount: '', date: '', recurring: false });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editingId ? 'Atualizar Rendimento' : 'Guardar Rendimento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rendimento Base Form */}
      {showBaseIncomeForm && (
        <div className="mb-8">
          <form onSubmit={handleBaseIncomeUpdate} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Atualizar Rendimento Base para {editingUser?.name}
            </h3>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700">Rendimento Base Mensal</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">€</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={baseIncomeMontante}
                  onChange={(e) => setBaseIncomeMontante(e.target.value)}
                  className="block w-full pl-7 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowBaseIncomeForm(false);
                  setEditingUser(null);
                  setBaseIncomeMontante('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Atualizar Rendimento Base
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rendimento Extras Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-2 text-gray-500">A carregar...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    De
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {extraIncomes.map((income) => (
                  <tr key={income.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{income.from_person}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{income.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">€{income.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(income.date).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {income.recurring ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Recorrente
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Único
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      <div className="flex justify-end space-x-3">
                        <button 
                          onClick={() => handleEdit(income)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(income.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
