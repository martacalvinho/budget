import React, { useState, useEffect } from 'react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Trash2, Users, Split } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useUsers } from '../contexts/UserContext';
import type { Database } from '../types/database';

type Purchase = Database['public']['Tables']['purchases']['Row'];

interface PurchasesListProps {
  filters?: {
    date?: Date;
    categories?: string[];
    users?: string[];
  };
}

const PurchasesList = React.forwardRef<{ fetchPurchases: () => Promise<void> }, PurchasesListProps>(({ filters }, ref) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const { users } = useUsers();

  const fetchPurchases = async () => {
    try {
      let query = supabase
        .from('purchases')
        .select('*');

      // Apply date filter if present
      if (filters?.date) {
        const filterDate = new Date(filters.date.getFullYear(), filters.date.getMonth(), 1);
        const start = startOfMonth(filterDate);
        const end = endOfMonth(filterDate);
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');
        
        query = query
          .gte('date', startStr)
          .lte('date', endStr);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Erro ao obter compras:', error);
      toast.error('Falha ao carregar compras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [filters?.date]); // Refetch when month changes

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPurchases(purchases.filter(p => p.id !== id));
      toast.success('Compra eliminada com sucesso');
    } catch (error) {
      console.error('Erro ao eliminar a compra:', error);
      toast.error('Falha ao eliminar a compra');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      return format(parseISO(dateString), 'dd.MM.yyyy', { locale: pt });
    } catch (error) {
      return 'Data Inválida';
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Utilizador Desconhecido';
  };

  // Apply filters
  const filteredPurchases = purchases.filter(purchase => {
    if (filters?.date) {
      const purchaseDate = new Date(purchase.date);
      const filterDate = filters.date;
      if (
        purchaseDate.getMonth() !== filterDate.getMonth() ||
        purchaseDate.getFullYear() !== filterDate.getFullYear()
      ) {
        return false;
      }
    }

    if (filters?.categories?.length && !filters.categories.includes(purchase.category)) {
      return false;
    }

    if (filters?.users?.length && !filters.users.includes(purchase.user_id)) {
      return false;
    }

    return true;
  });

  // Group purchases by their unique identifiers
  const groupedPurchases = filteredPurchases.reduce((acc, purchase) => {
    const key = `${purchase.date}-${purchase.category}-${purchase.amount}-${purchase.description || ''}`;
    
    if (!acc[key]) {
      acc[key] = {
        ...purchase,
        users: [getUserName(purchase.user_id)]
      };
    } else {
      acc[key].users.push(getUserName(purchase.user_id));
    }
    return acc;
  }, {} as Record<string, Purchase & { users: string[] }>);

  // Calculate totals
  const totals = Object.values(groupedPurchases).reduce((acc, purchase) => {
    const amount = parseFloat(purchase.amount.toString());
    if (amount >= 0) {
      acc.received += amount;
    } else {
      acc.sent += Math.abs(amount);
    }
    return acc;
  }, { received: 0, sent: 0 });

  const netAmount = totals.received - totals.sent;

  // Expose fetchPurchases via ref
  React.useImperativeHandle(ref, () => ({
    fetchPurchases
  }));

  if (loading) {
    return <div className="text-center py-4">A carregar...</div>;
  }

  if (Object.keys(groupedPurchases).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhuma compra encontrada
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" data-component-name="PurchasesList">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Compras Recentes</h2>
        </div>
        <div className="flex items-center gap-6 mr-4">
          <div className="flex flex-col items-end">
            <span className="text-sm text-gray-500">Total Recebido</span>
            <span className="text-lg font-semibold text-green-600">+€{totals.received.toFixed(2)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm text-gray-500">Total Enviado</span>
            <span className="text-lg font-semibold text-red-600">-€{Math.abs(totals.sent).toFixed(2)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm text-gray-500">Montante Líquido</span>
            <span className={`text-lg font-semibold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netAmount >= 0 ? '+' : ''}{netAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilizadores</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montante</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Object.values(groupedPurchases)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((purchase) => (
              <tr key={purchase.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(purchase.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    {purchase.users.length > 1 ? (
                      <>
                        <Split className="h-4 w-4 text-blue-500" />
                        <span className="text-blue-600">Dividido por {purchase.users.length}</span>
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4" />
                        <span>{purchase.users[0]}</span>
                      </>
                    )}
                  </div>
                  {purchase.users.length > 1 && (
                    <div className="mt-1 text-xs text-gray-400">
                      {purchase.users.join(', ')}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {purchase.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {purchase.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex flex-col items-end">
                    <span className={`text-sm font-semibold ${
                      purchase.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {purchase.amount >= 0 ? '+' : '-'}€{Math.abs(purchase.amount).toFixed(2)}
                    </span>
                    {purchase.users.length > 1 && (
                      <span className="text-xs text-gray-500">
                        €{Math.abs(purchase.amount).toFixed(2)} por pessoa
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => handleDelete(purchase.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
});

export default PurchasesList;