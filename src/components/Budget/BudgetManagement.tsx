import { useState, useEffect } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { supabase } from '../../lib/supabase';
import { Edit2, Save, AlertCircle, TrendingUp, Target, Bell, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { format } from 'date-fns';
import YearlyBudget from './YearlyBudget'; // Import the YearlyBudget component

interface BudgetItem {
  id: string;
  category: string;
  amount: number;
  type: 'fixed' | 'flexible';
  month: string;
  spent?: number;
}

interface SpendingData {
  [category: string]: number;
}

export default function BudgetManagement() {
  const { categories } = useCategories();
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [, setCarregando] = useState(true);
  const [editAmount, setEditAmount] = useState<string>('');
  const [isTableCreated, setIsTableCreated] = useState(false);
  const [spendingData, setSpendingData] = useState<SpendingData>({});
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [copiando, setCopiando] = useState(false);
  const [view, setView] = useState<'monthly' | 'yearly'>('monthly');

  const fetchSpendingData = async () => {
    try {
      // Parse the selected month (format: "YYYY-MM")
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');
      
      console.log('Fetching budget spending for:', {
        selectedMonth,
        startStr,
        endStr
      });

      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .select('amount, category')
        .gte('date', startStr)
        .lte('date', endStr);

      if (purchaseError) throw purchaseError;

      console.log('Budget purchase data:', purchaseData);

      // Calculate spending by category
      const spending = purchaseData?.reduce((acc: SpendingData, purchase) => {
        const category = purchase.category;
        acc[category] = (acc[category] || 0) + Number(purchase.amount);
        return acc;
      }, {});

      console.log('Calculated spending:', spending);
      setSpendingData(spending || {});
    } catch (error) {
      console.error('Error fetching spending data:', error);
      toast.error('Failed to load spending data');
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setCarregando(true);
      try {
        // Check if table exists
        const { error: tableCheckError } = await supabase
          .from('budgets')
          .select('id')
          .limit(1);

        if (tableCheckError) {
          setIsTableCreated(false);
          setCarregando(false);
          return;
        }

        setIsTableCreated(true);

        // First try to get budget from yearly_budgets
        const [year, month] = selectedMonth.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1, 1)
          .toLocaleString('default', { month: 'long' });

        const { data: yearlyData, error: yearlyError } = await supabase
          .from('yearly_budgets')
          .select('*')
          .eq('year', year)
          .eq('month', monthName);

        // If we have yearly budget data, use it
        if (!yearlyError && yearlyData && yearlyData.length > 0) {
          const convertedBudgets = await Promise.all(yearlyData.map(async (yb) => {
            // Check if a monthly budget already exists
            const { data: existingBudget } = await supabase
              .from('budgets')
              .select('*')
              .eq('month', selectedMonth)
              .eq('category', yb.category)
              .single();

            if (existingBudget) {
              return existingBudget;
            }

            // Create a new monthly budget based on yearly budget
            const { data: newBudget, error: insertError } = await supabase
              .from('budgets')
              .insert({
                category: yb.category,
                amount: yb.amount,
                type: categories.find(c => c.name === yb.category)?.type || 'flexible',
                month: selectedMonth
              })
              .select()
              .single();

            if (insertError) {
              console.error('Error creating monthly budget:', insertError);
              return null;
            }

            return newBudget;
          }));

          setBudgets(convertedBudgets.filter(Boolean));
        } else {
          // Fallback to existing monthly budgets
          const { data: budgetData, error: budgetError } = await supabase
            .from('budgets')
            .select('*')
            .eq('month', selectedMonth);

          if (budgetError) throw budgetError;
          setBudgets(budgetData || []);
        }

        // Fetch initial spending data
        await fetchSpendingData();
      } catch (error) {
        console.error('Error:', error);
        toast.error('Falha ao carregar dados do orçamento');
      } finally {
        setCarregando(false);
      }
    };

    fetchData();
  }, [selectedMonth, categories]);

  // Set up real-time subscription for purchases
  useEffect(() => {
    const subscription = supabase
      .channel('purchases_channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'purchases' 
        }, 
        (payload) => {
          console.log('Purchase change detected:', payload); // Debug log
          fetchSpendingData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedMonth]);

  const handleAdd = async (category: string, type: 'fixed' | 'flexible') => {
    if (!isTableCreated) {
      toast.error('Tabela de orçamento ainda não criada. Por favor, execute a migração primeiro.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          category,
          amount: 0,
          type,
          month: selectedMonth
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setBudgets(prev => [...prev, data]);
        setEditingId(data.id);
        setEditAmount('0');
        toast.success('Categoria de orçamento adicionada');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Falha ao adicionar categoria de orçamento');
    }
  };

  const handleSave = async (id: string) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Por favor, insira um montante válido');
      return;
    }

    try {
      const { error } = await supabase
        .from('budgets')
        .update({ amount })
        .eq('id', id);

      if (error) throw error;

      setBudgets(budgets.map(b => 
        b.id === id ? { ...b, amount } : b
      ));
      toast.success('Orçamento atualizado com sucesso');
      setEditingId(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Falha ao atualizar orçamento');
    }
  };

  const handleCopyBudget = async () => {
    if (selectedMonths.length === 0) {
      toast.error('Por favor, selecione pelo menos um mês');
      return;
    }

    setCopiando(true);
    try {
      // Get current budgets
      const { data: currentBudgets, error: fetchError } = await supabase
        .from('budgets')
        .select('*')
        .eq('month', selectedMonth);

      if (fetchError) throw fetchError;

      // Create new budgets for each selected month
      for (const targetMonth of selectedMonths) {
        const newBudgets = currentBudgets?.map(budget => ({
          category: budget.category,
          amount: budget.amount,
          type: budget.type,
          month: targetMonth
        }));

        const { error: insertError } = await supabase
          .from('budgets')
          .upsert(newBudgets || [], {
            onConflict: 'category,month',
            ignoreDuplicates: false
          });

        if (insertError) throw insertError;
      }

      toast.success('Orçamento copiado com sucesso');
      setShowCopyModal(false);
      setSelectedMonths([]);
    } catch (error) {
      console.error('Error copying budget:', error);
      toast.error('Falha ao copiar orçamento');
    } finally {
      setCopiando(false);
    }
  };

  const getNextMonths = (count: number = 12) => {
    const months = [];
    const currentDate = new Date(selectedMonth + '-01');
    
    for (let i = 1; i <= count; i++) {
      const nextDate = new Date(currentDate);
      nextDate.setMonth(currentDate.getMonth() + i);
      months.push(nextDate.toISOString().slice(0, 7));
    }
    
    return months;
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev => 
      prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  };

  const renderBudgetCard = (budget: BudgetItem) => {
    const spent = Math.abs(spendingData[budget.category] || 0);
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const remaining = budget.amount - spent;
    const isOverBudget = spent > budget.amount;

    return (
      <div
        key={budget.id}
        className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-medium text-lg">{budget.category}</h4>
            <p className="text-sm text-gray-500">
              {budget.type === 'fixed' ? 'Despesa Fixa' : 'Despesa Flexível'}
            </p>
          </div>
          <div className="w-20 h-20">
            <CircularProgressbar
              value={Math.min(percentage, 100)}
              text={`${Math.round(percentage)}%`}
              styles={buildStyles({
                pathColor: isOverBudget ? '#ef4444' : '#3b82f6',
                textColor: isOverBudget ? '#ef4444' : '#3b82f6',
                trailColor: '#e5e7eb'
              })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Orçamento:</span>
            {editingId === budget.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-sm"
                  min="0"
                  step="0.01"
                  autoFocus
                />
                <button
                  onClick={() => handleSave(budget.id)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                >
                  <Save className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium">€{budget.amount.toFixed(2)}</span>
                <button
                  onClick={() => {
                    setEditingId(budget.id);
                    setEditAmount(budget.amount.toString());
                  }}
                  className="p-1 text-gray-600 hover:text-gray-800"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Gasto:</span>
            <span className={`font-medium ${isOverBudget ? 'text-red-600' : ''}`}>
              €{spent.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Restante:</span>
            <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              {isOverBudget ? '-' : ''}€{Math.abs(remaining).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const getUnbudgetedCategories = (type: 'fixed' | 'flexible') => {
    const budgetedCategories = new Set(budgets.map(b => b.category));
    return categories
      .filter(c => c.type === type && !budgetedCategories.has(c.name));
  };

  if (!isTableCreated) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                A tabela de orçamento ainda não foi criada. Por favor, execute a migração no editor SQL do Supabase.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = Object.values(spendingData).reduce((sum, val) => sum + Math.abs(val || 0), 0);
  const totalRemaining = totalBudget - totalSpent;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Gestão de Orçamento</h2>
          <div className="flex items-center gap-4">
            <div className="flex rounded-md shadow-sm" role="group">
              <button
                onClick={() => setView('monthly')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                  view === 'monthly'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setView('yearly')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-b border-r ${
                  view === 'yearly'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Anual
              </button>
            </div>
            {view === 'monthly' && (
              <>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                />
                <button
                  onClick={() => setShowCopyModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  Copiar Orçamento
                </button>
              </>
            )}
          </div>
        </div>

        {view === 'monthly' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-blue-700 font-medium">Orçamento Total</h3>
                <TrendingUp className="h-5 w-5 text-blue-700" />
              </div>
              <p className="text-2xl font-bold text-blue-700 mt-2">
                €{totalBudget.toFixed(2)}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-green-700 font-medium">Total Gasto</h3>
                <Target className="h-5 w-5 text-green-700" />
              </div>
              <p className="text-2xl font-bold text-green-700 mt-2">
                €{Object.values(spendingData).reduce((sum, val) => sum + Math.abs(val || 0), 0).toFixed(2)}
              </p>
            </div>

            <div className={`${totalRemaining >= 0 ? 'bg-blue-50' : 'bg-red-50'} rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <h3 className={`${totalRemaining >= 0 ? 'text-blue-700' : 'text-red-700'} font-medium`}>
                  Restante
                </h3>
                <Bell className={`h-5 w-5 ${totalRemaining >= 0 ? 'text-blue-700' : 'text-red-700'}`} />
              </div>
              <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-blue-700' : 'text-red-700'} mt-2`}>
                €{Math.abs(totalRemaining).toFixed(2)}
                {totalRemaining < 0 && ' acima do orçamento'}
              </p>
            </div>
          </div>
        )}
      </div>

      {view === 'monthly' ? (
        <div className="space-y-8">
          {/* Fixed Expenses */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-medium">Despesas Fixas</h3>
              {getUnbudgetedCategories('fixed').length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAdd(e.target.value, 'fixed');
                      e.target.value = '';
                    }
                  }}
                  className="px-3 py-2 border rounded-lg text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>Adicionar Despesa Fixa</option>
                  {getUnbudgetedCategories('fixed').map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgets
                .filter(b => b.type === 'fixed')
                .map(renderBudgetCard)}
            </div>
          </div>

          {/* Flexible Expenses */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-medium">Despesas Flexíveis</h3>
              {getUnbudgetedCategories('flexible').length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAdd(e.target.value, 'flexible');
                      e.target.value = '';
                    }
                  }}
                  className="px-3 py-2 border rounded-lg text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>Adicionar Despesa Flexível</option>
                  {getUnbudgetedCategories('flexible').map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgets
                .filter(b => b.type === 'flexible')
                .map(renderBudgetCard)}
            </div>
          </div>
        </div>
      ) : (
        <YearlyBudget year={selectedMonth.slice(0, 4)} onYearChange={(year) => setSelectedMonth(`${year}-${selectedMonth.slice(5, 7)}`)} />
      )}

      {/* Copy Budget Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Copiar Orçamento para Meses Futuros</h3>
              <button
                onClick={() => setShowCopyModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Selecione os meses para os quais deseja copiar o orçamento atual:
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {getNextMonths().map((month) => (
                <label
                  key={month}
                  className={`
                    flex items-center gap-2 p-3 rounded-lg border cursor-pointer
                    ${selectedMonths.includes(month) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={selectedMonths.includes(month)}
                    onChange={() => toggleMonth(month)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm">
                    {new Date(month + '-01').toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCopyModal(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCopyBudget}
                disabled={copiando || selectedMonths.length === 0}
                className={`
                  px-4 py-2 rounded-md text-white
                  ${copiando || selectedMonths.length === 0
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'}
                `}
              >
                {copiando ? 'A copiar...' : 'Copiar Orçamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
