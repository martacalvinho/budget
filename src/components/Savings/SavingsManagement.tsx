import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SavingsAccount {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  last_updated: string;
}

interface SavingsHistory {
  id: string;
  account_id: string;
  balance: number;
  recorded_at: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: string;
  status: 'in_progress' | 'completed' | 'cancelled';
}

export default function SavingsManagement() {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'bank',
    currency: 'EUR',
    balance: 0,
    balance_date: new Date().toISOString().split('T')[0]
  });

  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: 0,
    target_date: '',
    category: '',
    current_amount: 0,
  });

  const [balanceHistory, setBalanceHistory] = useState<SavingsHistory[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  useEffect(() => {
    fetchSavingsData();
    if (selectedAccount) {
      fetchBalanceHistory(selectedAccount);
    }
  }, [selectedAccount]);

  const fetchSavingsData = async () => {
    try {
      const [accountsResponse, goalsResponse] = await Promise.all([
        supabase.from('savings_accounts').select('*'),
        supabase.from('savings_goals').select('*')
      ]);

      if (accountsResponse.error) throw accountsResponse.error;
      if (goalsResponse.error) throw goalsResponse.error;

      setAccounts(accountsResponse.data || []);
      setGoals(goalsResponse.data || []);
    } catch (error) {
      console.error('Error fetching savings data:', error);
      toast.error('Failed to load savings data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceHistory = async (accountId: string) => {
    try {
      const { data, error } = await supabase
        .from('savings_history')
        .select('*')
        .eq('account_id', accountId)
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      setBalanceHistory(data || []);
    } catch (error) {
      console.error('Error fetching balance history:', error);
      toast.error('Failed to load balance history');
    }
  };

  const addAccount = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error: accountError } = await supabase
        .from('savings_accounts')
        .insert([{
          name: newAccount.name,
          type: newAccount.type,
          currency: newAccount.currency,
          balance: newAccount.balance,
          last_updated: new Date(newAccount.balance_date).toISOString(),
          user_id: userData.user.id
        }]);

      if (accountError) throw accountError;

      toast.success('Savings account added successfully');
      setShowAddAccount(false);
      setNewAccount({ 
        name: '', 
        type: 'bank', 
        currency: 'EUR', 
        balance: 0, 
        balance_date: new Date().toISOString().split('T')[0] 
      });
      fetchSavingsData();
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error('Failed to add savings account');
    }
  };

  const addGoal = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error } = await supabase
        .from('savings_goals')
        .insert([{
          ...newGoal,
          status: 'in_progress',
          user_id: userData.user.id
        }]);

      if (error) throw error;

      toast.success('Savings goal added successfully');
      setShowAddGoal(false);
      setNewGoal({ name: '', target_amount: 0, target_date: '', category: '', current_amount: 0 });
      fetchSavingsData();
    } catch (error) {
      console.error('Error adding goal:', error);
      toast.error('Failed to add savings goal');
    }
  };

  const updateAccountBalance = async (id: string, balance: number, date: string) => {
    try {
      const { error } = await supabase
        .from('savings_accounts')
        .update({ 
          balance, 
          last_updated: new Date(date).toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Balance updated successfully');
      fetchSavingsData();
      if (selectedAccount === id) {
        fetchBalanceHistory(id);
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error('Failed to update balance');
    }
  };

  const getTotalSavings = () => {
    return accounts.reduce((total, account) => total + account.balance, 0);
  };

  const renderBalanceHistoryChart = () => {
    if (!selectedAccount || balanceHistory.length === 0) return null;

    const account = accounts.find(a => a.id === selectedAccount);
    if (!account) return null;

    const data = {
      labels: balanceHistory.map(h => new Date(h.recorded_at).toLocaleDateString()),
      datasets: [
        {
          label: `Balance History - ${account.name}`,
          data: balanceHistory.map(h => h.balance),
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: 'Savings Balance History'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };

    return (
      <div className="mt-8 p-4 bg-white rounded-lg shadow">
        <Line data={data} options={options} />
      </div>
    );
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Savings Management</h2>

      {/* Savings Accounts Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Savings Accounts</h3>
          <button
            onClick={() => setShowAddAccount(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <PlusCircle size={20} /> Add Account
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(account => (
            <div key={account.id} className="p-4 bg-white rounded-lg shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold">{account.name}</h4>
                <span className="text-sm text-gray-500">{account.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold">
                    {account.currency} {account.balance.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Last updated: {new Date(account.last_updated).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedAccount(account.id)}
                    className="p-2 hover:bg-gray-100 rounded text-blue-600"
                  >
                    View History
                  </button>
                  <button
                    onClick={() => {
                      const newBalance = prompt('Enter new balance:', account.balance.toString());
                      const newDate = prompt('Enter date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
                      if (newBalance && !isNaN(parseFloat(newBalance)) && newDate) {
                        updateAccountBalance(account.id, parseFloat(newBalance), newDate);
                      }
                    }}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Savings */}
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="text-lg">Total Savings: <span className="font-bold">€{getTotalSavings().toFixed(2)}</span></p>
        </div>

        {/* Balance History Chart */}
        {renderBalanceHistoryChart()}
      </div>

      {/* Savings Goals Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Savings Goals</h3>
          <button
            onClick={() => setShowAddGoal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <PlusCircle size={20} /> Add Goal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(goal => (
            <div key={goal.id} className="p-4 bg-white rounded-lg shadow">
              <h4 className="font-semibold mb-2">{goal.name}</h4>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{((goal.current_amount / goal.target_amount) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${(goal.current_amount / goal.target_amount) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>€{goal.current_amount.toFixed(2)} / €{goal.target_amount.toFixed(2)}</span>
                <span className="text-gray-500">Due: {new Date(goal.target_date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add Savings Account</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Account Name</label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newAccount.type}
                  onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="bank">Bank Account</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="investment">Investment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <select
                  value={newAccount.currency}
                  onChange={e => setNewAccount({ ...newAccount, currency: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Initial Balance</label>
                <input
                  type="number"
                  value={newAccount.balance}
                  onChange={e => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Balance Date</label>
                <input
                  type="date"
                  value={newAccount.balance_date}
                  onChange={e => setNewAccount({ ...newAccount, balance_date: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddAccount(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={addAccount}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add Savings Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Goal Name</label>
                <input
                  type="text"
                  value={newGoal.name}
                  onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={newGoal.category}
                  onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select a category</option>
                  <option value="wedding">Wedding</option>
                  <option value="travel">Travel</option>
                  <option value="emergency">Emergency Fund</option>
                  <option value="house">House</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target Amount</label>
                <input
                  type="number"
                  value={newGoal.target_amount}
                  onChange={e => setNewGoal({ ...newGoal, target_amount: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current Amount</label>
                <input
                  type="number"
                  value={newGoal.current_amount}
                  onChange={e => setNewGoal({ ...newGoal, current_amount: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target Date</label>
                <input
                  type="date"
                  value={newGoal.target_date}
                  onChange={e => setNewGoal({ ...newGoal, target_date: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddGoal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={addGoal}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
