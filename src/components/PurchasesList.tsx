import React, { useState, useEffect } from 'react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
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

const PurchasesList: React.FC<PurchasesListProps> = ({ filters }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const { users } = useUsers();

  useEffect(() => {
    console.log('Filter date changed:', filters?.date);
    fetchPurchases();
  }, [filters?.date]); // Refetch when month changes

  const fetchPurchases = async () => {
    try {
      let query = supabase
        .from('purchases')
        .select('*');

      // Apply date filter if present
      if (filters?.date) {
        // Set the date to the first of the selected month to ensure correct month filtering
        const filterDate = new Date(filters.date.getFullYear(), filters.date.getMonth(), 1);
        const start = startOfMonth(filterDate);
        const end = endOfMonth(filterDate);
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');
        
        console.log('Fetching purchases for date range:', {
          originalDate: filters.date,
          filterDate,
          startStr,
          endStr,
          filterMonth: filterDate.getMonth() + 1,
          filterYear: filterDate.getFullYear()
        });

        // Debug query
        const { data: debugData } = await query
          .gte('date', startStr)
          .lte('date', endStr);
        
        console.log('Debug - Raw query results:', debugData);

        query = query
          .gte('date', startStr)
          .lte('date', endStr);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      console.log('Fetched purchases:', data?.map(p => ({
        id: p.id,
        date: p.date,
        amount: p.amount,
        description: p.description
      })));
      setPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPurchases(purchases.filter(p => p.id !== id));
      toast.success('Purchase deleted successfully');
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast.error('Failed to delete purchase');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      return format(parseISO(dateString), 'dd.MM.yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown User';
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
    const key = `${purchase.date}-${purchase.category}-${purchase.total_amount || purchase.amount}-${purchase.description || ''}`;
    
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

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (Object.keys(groupedPurchases).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No purchases found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                        <span className="text-blue-600">Split {purchase.users.length} ways</span>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      €{(purchase.total_amount || purchase.amount).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </span>
                    {purchase.users.length > 1 && (
                      <span className="text-xs text-gray-500">
                        €{(purchase.amount).toLocaleString('de-DE', { minimumFractionDigits: 2 })} per person
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
};

export default PurchasesList;