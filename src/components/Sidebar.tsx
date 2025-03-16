import React from 'react';
import { 
  LayoutDashboard, 
  BarChart2, 
  Settings, 
  LogOut, 
  LogIn,
  Wallet,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: any;
  onAuthClick: () => void;
  onSignOut: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onAuthClick,
  onSignOut,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'income', label: 'Rendimento', icon: DollarSign },
    { id: 'analytics', label: 'Análises', icon: BarChart2 },
    { id: 'predictions', label: 'Previsões', icon: TrendingUp },
    { id: 'settings', label: 'Definições', icon: Settings },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white fixed h-full flex flex-col">
      <div className="px-6 py-4 flex items-center gap-2 border-b border-gray-700">
        <Wallet className="h-6 w-6" />
        <span className="text-xl font-bold">Aplicação de Orçamento</span>
      </div>
      <div className="flex-grow px-4 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`w-full flex items-center gap-2 py-2 px-4 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="px-4 py-4 border-t border-gray-700">
        {currentUser ? (
          <button
            className="w-full flex items-center gap-2 py-2 px-4 rounded-lg text-red-400 hover:bg-gray-700 transition-colors"
            onClick={onSignOut}
          >
            <LogOut className="h-5 w-5" />
            Terminar Sessão
          </button>
        ) : (
          <button
            className="w-full flex items-center gap-2 py-2 px-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            onClick={onAuthClick}
          >
            <LogIn className="h-5 w-5" />
            Iniciar Sessão / Registar
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;