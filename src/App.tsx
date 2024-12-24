import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import PurchasesList from './components/PurchasesList';
import AddPurchasePopup from './components/AddPurchasePopup';
import AuthPopup from './components/AuthPopup';
import Sidebar from './components/Sidebar';
import UserManagement from './components/Settings/UserManagement';
import CategoryManagement from './components/Settings/CategoryManagement';
import SavingsManagement from './components/Settings/SavingsManagement';
import YearlyBreakdown from './components/Analytics/YearlyBreakdown';
import BankStatements from './components/BankStatements';
import LandingPage from './components/LandingPage';
import IncomeManagement from './components/Income/IncomeManagement';
import PredictionsTab from './components/Predictions/PredictionsTab';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';

const DashboardContent = () => {
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const { user } = useAuthContext();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Stats will be added by QuickStats component */}
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
              Add Purchase
            </button>
          </div>
          <PurchasesList purchases={[]} />
        </div>
      </div>

      {showAddPurchase && (
        <AddPurchasePopup
          onClose={() => setShowAddPurchase(false)}
          onPurchaseAdded={() => setShowAddPurchase(false)}
        />
      )}
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const { user, loading, signOut } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage onGetStarted={() => setShowAuthPopup(true)} />
        {showAuthPopup && (
          <AuthPopup
            onClose={() => setShowAuthPopup(false)}
            isLogin={isLogin}
            setIsLogin={setIsLogin}
          />
        )}
      </>
    );
  }

  return (
    <UserProvider>
      <div className="min-h-screen bg-gray-100">
        <Toaster position="top-right" />
        
        <div className="flex">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={user}
            onAuthClick={() => setShowAuthPopup(true)}
            onSignOut={signOut}
          />

          <div className="ml-64 p-8 flex-1">
            {activeTab === 'dashboard' && <DashboardContent />}
            {activeTab === 'income' && <IncomeManagement />}
            {activeTab === 'analytics' && <YearlyBreakdown />}
            {activeTab === 'predictions' && <PredictionsTab />}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <UserManagement />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CategoryManagement type="fixed" />
                  <CategoryManagement type="flexible" />
                </div>
                <SavingsManagement />
              </div>
            )}
          </div>
        </div>

        {showAuthPopup && (
          <AuthPopup
            onClose={() => setShowAuthPopup(false)}
            isLogin={isLogin}
            setIsLogin={setIsLogin}
          />
        )}
      </div>
    </UserProvider>
  );
};

const AppWrapper = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

export default AppWrapper;