import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import PurchasesList from '../PurchasesList';
import AddPurchasePopup from '../AddPurchasePopup';
import BankStatements from '../BankStatements/BankStatements';

export default function Dashboard() {
  const [showAddPurchase, setShowAddPurchase] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Stats will be added later */}
      </div>

      <div className="space-y-6">
        <BankStatements />
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Purchases</h2>
            <button
              onClick={() => setShowAddPurchase(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Purchase
            </button>
          </div>
          <PurchasesList />
        </div>
      </div>

      {showAddPurchase && (
        <AddPurchasePopup
          onClose={() => setShowAddPurchase(false)}
          onPurchaseAdded={() => {
            setShowAddPurchase(false);
          }}
        />
      )}
    </div>
  );
}
