import React from 'react';
import { format } from 'date-fns';
import { useSalaryHistory } from '../../hooks/useSalaryHistory';
import type { Database } from '../../types/database';

type SalaryHistory = Database['public']['Tables']['salary_history']['Row'];

interface SalaryHistoryListProps {
  userId: string;
}

const SalaryHistoryList: React.FC<SalaryHistoryListProps> = ({ userId }) => {
  const { salaryHistory, loading } = useSalaryHistory(userId);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-pulse text-gray-600">Loading salary history...</div>
      </div>
    );
  }

  const groupByYear = (entries: SalaryHistory[]) => {
    return entries.reduce((acc, entry) => {
      if (!acc[entry.year]) {
        acc[entry.year] = [];
      }
      acc[entry.year].push(entry);
      return acc;
    }, {} as Record<number, SalaryHistory[]>);
  };

  const groupedHistory = groupByYear(salaryHistory);
  const years = Object.keys(groupedHistory).sort((a, b) => Number(b) - Number(a));

  const formatCurrency = (amount: number) => 
    `€${amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;

  const getMonthName = (month: number) => {
    return format(new Date(2000, month - 1), 'MMMM');
  };

  return (
    <div className="space-y-6">
      {years.map(year => (
        <div key={year} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-50 px-6 py-3">
            <h4 className="text-lg font-semibold text-gray-900">{year}</h4>
          </div>
          <div className="divide-y divide-gray-200">
            {groupedHistory[Number(year)]
              .sort((a, b) => b.month - a.month)
              .map(entry => (
                <div key={entry.id} className="px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-900">
                        {getMonthName(entry.month)}
                      </span>
                      {entry.notes && (
                        <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>
                      )}
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(entry.amount)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {salaryHistory.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No salary history available
        </div>
      )}
    </div>
  );
};

export default SalaryHistoryList;