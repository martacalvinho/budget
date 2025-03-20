import React, { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import PurchasesList from '../PurchasesList';
import AddPurchasePopup from '../AddPurchasePopup';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function Dashboard() {
  const purchasesListRef = React.useRef<{ fetchPurchases: () => Promise<void> }>(null);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  // Always start with first day of current month
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));

  const handlePreviousMonth = () => {
    setSelectedMonth(prev => {
      const newDate = startOfMonth(subMonths(prev, 1));
      console.log('Mês anterior:', {
        current: format(prev, 'yyyy-MM-dd'),
        new: format(newDate, 'yyyy-MM-dd'),
        month: format(newDate, 'MMMM yyyy', { locale: pt })
      });
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => {
      const newDate = startOfMonth(addMonths(prev, 1));
      console.log('Próximo mês:', {
        current: format(prev, 'yyyy-MM-dd'),
        new: format(newDate, 'yyyy-MM-dd'),
        month: format(newDate, 'MMMM yyyy', { locale: pt })
      });
      return newDate;
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Stats will be added later */}
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold">Compras Recentes</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousMonth}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium min-w-[100px] text-center" data-component-name="Dashboard">
                  {format(selectedMonth, 'MMMM yyyy', { locale: pt })}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowAddPurchase(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Adicionar Compra
            </button>
          </div>
          <PurchasesList 
            ref={purchasesListRef}
            filters={{ 
              date: selectedMonth
            }} 
          />
        </div>
      </div>

      {showAddPurchase && (
        <AddPurchasePopup
          onClose={() => setShowAddPurchase(false)}
          onPurchaseAdded={() => {
            // Refresh purchases list
            if (purchasesListRef.current) {
              purchasesListRef.current.fetchPurchases();
            }
            setShowAddPurchase(false);
          }}
        />
      )}
    </div>
  );
}
