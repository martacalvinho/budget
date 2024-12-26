import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch transactions grouped by month and category
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      // Process data for monthly breakdown
      const processedData = processTransactionData(data || []);
      setMonthlyData(processedData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const processTransactionData = (transactions: any[]) => {
    // Group transactions by month
    const monthlyGroups = transactions.reduce((acc: any, transaction: any) => {
      const month = new Date(transaction.date).toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = {
          total: 0,
          categories: {}
        };
      }
      
      const amount = Math.abs(transaction.amount);
      acc[month].total += amount;
      
      if (transaction.category) {
        if (!acc[month].categories[transaction.category]) {
          acc[month].categories[transaction.category] = 0;
        }
        acc[month].categories[transaction.category] += amount;
      }
      
      return acc;
    }, {});

    return Object.entries(monthlyGroups).map(([month, data]: [string, any]) => ({
      month,
      ...data
    }));
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics</h2>

      {/* Monthly Breakdown */}
      <div className="space-y-4">
        {monthlyData.map((monthData) => (
          <div key={monthData.month} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">{monthData.month}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total Spending */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-medium mb-2">Total Spending</h4>
                <p className="text-2xl font-bold">€{monthData.total.toFixed(2)}</p>
              </div>

              {/* Category Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-medium mb-2">Category Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(monthData.categories).map(([category, amount]: [string, any]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-gray-600">{category}</span>
                      <span className="font-medium">€{amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
