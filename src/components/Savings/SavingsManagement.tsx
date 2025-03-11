import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { PlusCircle, Edit2 } from 'lucide-react';
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
  status: 'em_progresso' | 'concluido' | 'cancelado';
}

export default function SavingsManagement() {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [completedGoals, setCompletedGoals] = useState<SavingsGoal[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [carregando, setCarregando] = useState(true);

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
      const [accountsResponse, goalsResponse, completedResponse] = await Promise.all([
        supabase.from('savings_accounts').select('*'),
        supabase.from('savings_goals').select('*').eq('status', 'em_progresso'),
        supabase.from('savings_goals').select('*').eq('status', 'concluido')
      ]);

      if (accountsResponse.error) throw accountsResponse.error;
      if (goalsResponse.error) throw goalsResponse.error;
      if (completedResponse.error) throw completedResponse.error;

      setAccounts(accountsResponse.data || []);
      setGoals(goalsResponse.data || []);
      setCompletedGoals(completedResponse.data || []);
    } catch (error) {
      console.error('Erro ao buscar dados de poupanças:', error);
      toast.error('Falha ao carregar dados de poupanças');
    } finally {
      setCarregando(false);
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
      console.error('Erro ao buscar histórico de saldo:', error);
      toast.error('Falha ao carregar histórico de saldo');
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

      toast.success('Conta de poupança adicionada com sucesso');
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
      console.error('Erro ao adicionar conta:', error);
      toast.error('Falha ao adicionar conta de poupança');
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
          status: 'em_progresso',
          user_id: userData.user.id
        }]);

      if (error) throw error;

      toast.success('Objetivo de poupança adicionado com sucesso');
      setShowAddGoal(false);
      setNewGoal({ name: '', target_amount: 0, target_date: '', category: '', current_amount: 0 });
      fetchSavingsData();
    } catch (error) {
      console.error('Erro ao adicionar objetivo:', error);
      toast.error('Falha ao adicionar objetivo de poupança');
    }
  };

  const updateGoalAmount = async (id: string, additionalAmount: number) => {
    try {
      const goal = goals.find(g => g.id === id);
      if (!goal) return;

      const newAmount = goal.current_amount + additionalAmount;
      const newStatus = newAmount >= goal.target_amount ? 'concluido' : 'em_progresso';

      const { error } = await supabase
        .from('savings_goals')
        .update({ 
          current_amount: newAmount,
          status: newStatus
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Poupança atualizada com sucesso');
      fetchSavingsData();
    } catch (error) {
      console.error('Erro ao atualizar poupança:', error);
      toast.error('Falha ao atualizar poupança');
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

      toast.success('Saldo atualizado com sucesso');
      fetchSavingsData();
      if (selectedAccount === id) {
        fetchBalanceHistory(id);
      }
    } catch (error) {
      console.error('Erro ao atualizar saldo:', error);
      toast.error('Falha ao atualizar saldo');
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
          label: `Histórico de Saldo - ${account.name}`,
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
          text: 'Histórico de Saldo de Poupanças'
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

  if (carregando) {
    return <div className="text-center py-4">A carregar dados de poupanças...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Gestão de Poupanças</h2>

      {/* Savings Accounts Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Contas de Poupança</h3>
          <button
            onClick={() => setShowAddAccount(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <PlusCircle size={20} /> Adicionar Conta
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
                    Última atualização: {new Date(account.last_updated).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedAccount(account.id)}
                    className="p-2 hover:bg-gray-100 rounded text-blue-600"
                  >
                    Ver Histórico
                  </button>
                  <button
                    onClick={() => {
                      const newBalance = prompt('Insira novo saldo:', account.balance.toString());
                      const newDate = prompt('Insira a data (AAAA-MM-DD):', new Date().toISOString().split('T')[0]);
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
          <p className="text-lg">Total de Poupanças: <span className="font-bold">€{getTotalSavings().toFixed(2)}</span></p>
        </div>

        {/* Balance History Chart */}
        {renderBalanceHistoryChart()}
      </div>

      {/* Savings Goals Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Objetivos de Poupança</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Histórico
            </button>
            <button
              onClick={() => setShowAddGoal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <PlusCircle size={20} /> Adicionar Objetivo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(goal => (
            <div key={goal.id} className="p-4 bg-white rounded-lg shadow">
              <h4 className="font-semibold mb-2">{goal.name}</h4>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progresso</span>
                  <span>{((goal.current_amount / goal.target_amount) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${(goal.current_amount / goal.target_amount) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span>€{goal.current_amount.toFixed(2)} / €{goal.target_amount.toFixed(2)}</span>
                <span className="text-gray-500">Data limite: {new Date(goal.target_date).toLocaleDateString('pt-PT')}</span>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedGoalId(goal.id);
                    setShowContributeModal(true);
                  }}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1"
                >
                  <PlusCircle size={16} />
                  Adicionar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Adicionar Conta de Poupança</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome da Conta</label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={newAccount.type}
                  onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="bank">Conta Bancária</option>
                  <option value="crypto">Criptomoeda</option>
                  <option value="investment">Investimento</option>
                  <option value="savings">Poupança</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Moeda</label>
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
                <label className="block text-sm font-medium mb-1">Saldo Inicial</label>
                <input
                  type="number"
                  value={newAccount.balance}
                  onChange={e => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data do Saldo</label>
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
                Cancelar
              </button>
              <button
                onClick={addAccount}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Adicionar Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Histórico de Objetivos Concluídos</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Objetivo</th>
                    <th className="text-left py-2">Categoria</th>
                    <th className="text-right py-2">Montante Final</th>
                    <th className="text-right py-2">Data de Conclusão</th>
                  </tr>
                </thead>
                <tbody>
                  {completedGoals.map(goal => (
                    <tr key={goal.id} className="border-b">
                      <td className="py-2">{goal.name}</td>
                      <td className="py-2">{goal.category}</td>
                      <td className="text-right py-2">€{goal.current_amount.toFixed(2)}</td>
                      <td className="text-right py-2">{new Date(goal.target_date).toLocaleDateString('pt-PT')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {showContributeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Adicionar Poupança</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Montante a Adicionar</label>
                <input
                  type="number"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowContributeModal(false);
                  setContributionAmount('');
                  setSelectedGoalId(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (selectedGoalId && contributionAmount && !isNaN(parseFloat(contributionAmount))) {
                    updateGoalAmount(selectedGoalId, parseFloat(contributionAmount));
                    setShowContributeModal(false);
                    setContributionAmount('');
                    setSelectedGoalId(null);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Adicionar Objetivo de Poupança</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Objetivo</label>
                <input
                  type="text"
                  value={newGoal.name}
                  onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select
                  value={newGoal.category}
                  onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="casamento">Casamento</option>
                  <option value="viagem">Viagem</option>
                  <option value="emergencia">Fundo de Emergência</option>
                  <option value="casa">Casa</option>
                  <option value="educacao">Educação</option>
                  <option value="reforma">Reforma</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Montante Alvo</label>
                <input
                  type="number"
                  value={newGoal.target_amount}
                  onChange={e => setNewGoal({ ...newGoal, target_amount: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Montante Atual</label>
                <input
                  type="number"
                  value={newGoal.current_amount}
                  onChange={e => setNewGoal({ ...newGoal, current_amount: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data Alvo</label>
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
                Cancelar
              </button>
              <button
                onClick={addGoal}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Adicionar Objetivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
