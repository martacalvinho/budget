import React, { useState } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useYearlyStats } from '../../hooks/useYearlyStats';
import QuickStats from './QuickStats';
import CategoryBreakdown from './CategoryBreakdown';
import TrendsAnalysis from './TrendsAnalysis';
import HistoricalDataForm from './HistoricalDataForm';
import { Plus } from 'lucide-react';

const YearlyBreakdown: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [editMode, setEditMode] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'categories' | 'trends'>('overview');
  
  const { user } = useAuthContext();
  const { stats, loading } = useYearlyStats(user?.id, selectedYear);

  const yearRange = Array.from(
    { length: currentYear - 2020 + 1 }, 
    (_, i) => currentYear - i
  );

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Financial Analytics</h2>
        <div className="flex gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 border rounded-md"
          >
            {yearRange.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            onClick={() => setEditMode(!editMode)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Historical Data
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setSelectedView('overview')}
          className={`px-4 py-2 rounded-md ${
            selectedView === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedView('categories')}
          className={`px-4 py-2 rounded-md ${
            selectedView === 'categories' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setSelectedView('trends')}
          className={`px-4 py-2 rounded-md ${
            selectedView === 'trends' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Trends
        </button>
      </div>

      {editMode && <HistoricalDataForm selectedDate={new Date()} onDataAdded={() => {}} />}

      {stats && (
        <>
          <QuickStats stats={stats} />

          {selectedView === 'overview' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-6">Yearly Overview</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Savings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Savings Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {months.map((month, index) => {
                      const monthKey = `${selectedYear}-${(index + 1).toString().padStart(2, '0')}`;
                      const monthData = stats.monthlyStats[monthKey];
                      const savingsRate = monthData.income > 0 
                        ? (monthData.savings / monthData.income) * 100 
                        : 0;

                      return (
                        <tr key={month}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {month}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            €{monthData.income.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            €{monthData.expenses.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            €{monthData.savings.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={savingsRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {savingsRate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedView === 'categories' && <CategoryBreakdown categoryStats={stats.categoryStats} />}
          {selectedView === 'trends' && <TrendsAnalysis monthlyStats={stats.monthlyStats} />}
        </>
      )}
    </div>
  );
};

export default YearlyBreakdown;