import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  BarChart2,
  Settings,
  LogOut,
  PiggyBank,
  FileText,
  Coins
} from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const { signOut } = useAuthContext();

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/income', icon: Wallet, label: 'Income' },
    { path: '/budget', icon: PiggyBank, label: 'Budget' },
    { path: '/savings', icon: Coins, label: 'Savings' },
    { path: '/analytics', icon: BarChart2, label: 'Analytics' },
    { path: '/statements', icon: FileText, label: 'Statements' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="flex items-center mb-8">
        <span className="text-xl font-bold">Finance App</span>
      </div>

      <nav className="space-y-2">
        {menuItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(path)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}

        <button
          onClick={signOut}
          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
}
