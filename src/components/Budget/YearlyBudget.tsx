import React from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import pt from 'date-fns/locale/pt';
import { Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCategories } from '../../hooks/useCategories';

export interface YearlyBudgetProps {
  year: string;
  onYearChange: (year: string) => void;
}

interface MonthlyData {
  [category: string]: {
    [month: string]: number;
  };
}

interface BudgetData {
  [category: string]: {
    [month: string]: number;
  };
}

interface IncomeData {
  [month: string]: number;
}

export default function YearlyBudget({ year, onYearChange }: YearlyBudgetProps) {
  const { categories } = useCategories();
  const [selectedYear, setSelectedYear] = React.useState(year);

  React.useEffect(() => {
    if (selectedYear !== year) {
      onYearChange(selectedYear);
    }
  }, [selectedYear, year, onYearChange]);
  const [actualData, setActualData] = React.useState<MonthlyData>({});
  const [budgetData, setBudgetData] = React.useState<BudgetData>({});
  const [budgetedIncome, setBudgetedIncome] = React.useState<IncomeData>({});
  const [carregando, setCarregando] = React.useState(true);
  const [income, setIncome] = React.useState<{ [month: string]: number }>({});
  const [savings, setSavings] = React.useState<{ [month: string]: number }>({});
  const [mode, setMode] = React.useState<'budget' | 'actual'>('budget');
  const [editingCell, setEditingCell] = React.useState<{
    category: string;
    month: string;
    value: string;
    type?: 'income';
  } | null>(null);

  const [showFillPrompt, setShowFillPrompt] = React.useState(false);
  const [fillValue, setFillValue] = React.useState<{
    category: string;
    month: string;
    value: number;
  } | null>(null);

  const [totalSavings, setTotalSavings] = React.useState(0);

  const fetchTotalSavings = async () => {
    try {
      const { data, error } = await supabase
        .from('savings_accounts')
        .select('balance');
      
      if (error) throw error;
      
      const total = data?.reduce((sum, account) => sum + Number(account.balance), 0) || 0;
      setTotalSavings(total);
    } catch (error) {
      console.error('Erro ao buscar poupanças:', error);
    }
  };

  const fetchBudgetData = async () => {
    try {
      // Fetch budget categories
      const { data: budgetData, error: budgetError } = await supabase
        .from('yearly_budgets')
        .select('*')
        .eq('year', selectedYear);

      if (budgetError) throw budgetError;

      // Fetch budgeted income
      const { data: incomeData, error: incomeError } = await supabase
        .from('yearly_budgets')
        .select('*')
        .eq('year', selectedYear)
        .eq('category', 'Income');

      if (incomeError) throw incomeError;

      const budgetTemp: BudgetData = {};
      const incomeTemp: IncomeData = {};

      budgetData?.forEach(item => {
        if (item.category !== 'Income') {
          if (!budgetTemp[item.category]) {
            budgetTemp[item.category] = {};
          }
          budgetTemp[item.category][item.month] = Number(item.amount);
        }
      });

      incomeData?.forEach(item => {
        incomeTemp[item.month] = Number(item.amount);
      });

      setBudgetData(budgetTemp);
      setBudgetedIncome(incomeTemp);
    } catch (error) {
      console.error('Erro ao buscar dados do orçamento:', error);
      toast.error('Falha ao carregar dados do orçamento');
    }
  };

  const fetchActualData = async () => {
    try {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .select('amount, category, date')
        .gte('date', startDate)
        .lte('date', endDate);

      if (purchaseError) throw purchaseError;

      const actualTemp: MonthlyData = {};
      const incomeTemp: { [month: string]: number } = {};
      const savingsTemp: { [month: string]: number } = {};

      purchaseData?.forEach(purchase => {
        const month = format(new Date(purchase.date), 'MMMM', { locale: pt });
        const amount = Number(purchase.amount);

        if (!actualTemp[purchase.category]) {
          actualTemp[purchase.category] = {};
        }
        actualTemp[purchase.category][month] = 
          (actualTemp[purchase.category][month] || 0) + amount;

        if (amount > 0) {
          incomeTemp[month] = (incomeTemp[month] || 0) + amount;
        }
        if (purchase.category === 'Savings') {
          savingsTemp[month] = (savingsTemp[month] || 0) + Math.abs(amount);
        }
      });

      setActualData(actualTemp);
      setIncome(incomeTemp);
      setSavings(savingsTemp);
    } catch (error) {
      console.error('Erro ao buscar dados reais:', error);
      toast.error('Falha ao carregar dados de gastos reais');
    }
  };

  const handleCellEdit = async (category: string, month: string, value: string, type?: 'income') => {
    const amount = parseFloat(value);
    if (isNaN(amount)) {
      toast.error('Por favor, insira um número válido');
      return;
    }

    try {
      if (type === 'income') {
        await saveYearlyBudget('Income', month, amount);
        setBudgetedIncome(prev => ({
          ...prev,
          [month]: amount
        }));
      } else {
        await saveYearlyBudget(category, month, amount);
      }
      
      // After saving, show prompt to fill rest of months
      const monthIndex = months.indexOf(month);
      if (monthIndex < months.length - 1) {
        setFillValue({ category, month, value: amount });
        setShowFillPrompt(true);
      }

    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error);
      toast.error('Falha ao atualizar orçamento');
    }
  };

  const saveYearlyBudget = async (category: string, month: string, amount: number) => {
    const { error } = await supabase
      .from('yearly_budgets')
      .upsert({
        year: selectedYear,
        month,
        category,
        amount
      }, {
        onConflict: 'year,month,category'
      });

    if (error) throw error;

    setBudgetData(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [month]: amount
      }
    }));

    setEditingCell(null);
    toast.success('Orçamento atualizado');
  };

  const handleFillRestOfMonths = async (fill: boolean) => {
    if (!fillValue || !fill) {
      setShowFillPrompt(false);
      setFillValue(null);
      return;
    }

    const startMonthIndex = months.indexOf(fillValue.month) + 1;
    
    try {
      const promises = months
        .slice(startMonthIndex)
        .map(month => saveYearlyBudget(fillValue.category, month, fillValue.value));
      
      await Promise.all(promises);
      toast.success('Meses restantes atualizados');
    } catch (error) {
      console.error('Erro ao preencher meses:', error);
      toast.error('Falha ao preencher meses restantes');
    }

    setShowFillPrompt(false);
    setFillValue(null);
  };

  const calculateTotal = (categories: string[], month: string): number => {
    const data = mode === 'budget' ? budgetData : actualData;
    return categories.reduce((total, category) => {
      return total + Math.abs(data[category]?.[month] || 0);
    }, 0);
  };

  const calculateYearlyAverage = (categories: string[]): number => {
    let total = 0;
    let monthCount = 0;
    months.forEach(month => {
      const monthTotal = calculateTotal(categories, month);
      if (monthTotal > 0) {
        total += monthTotal;
        monthCount++;
      }
    });
    return monthCount > 0 ? total / monthCount : 0;
  };

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const data = mode === 'budget' ? budgetData : actualData;

  React.useEffect(() => {
    const fetchData = async () => {
      setCarregando(true);
      await Promise.all([fetchBudgetData(), fetchActualData(), fetchTotalSavings()]);
      setCarregando(false);
    };
    fetchData();
  }, [selectedYear, categories]);

  React.useMemo(() => {
    const fixedCategories = categories
      .filter(cat => cat.type === 'fixed')
      .map(cat => cat.name);
    const flexibleCategories = categories
      .filter(cat => cat.type === 'flexible')
      .map(cat => cat.name);
    return { fixedCategories, flexibleCategories };
  }, [categories]);

  if (carregando) {
    return <div className="text-center py-4">A carregar dados anuais...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>
          <div className="flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => setMode('budget')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                mode === 'budget'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Orçamento
            </button>
            <button
              onClick={() => setMode('actual')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-b border-r ${
                mode === 'actual'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Real
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 sticky left-0 bg-gray-100">Categoria</th>
              {months.map(month => (
                <th key={month} className="border p-2 text-right min-w-[100px]">{month}</th>
              ))}
              <th className="border p-2 text-right">Média</th>
            </tr>
          </thead>
          <tbody>
            {/* Fixed Expenses */}
            <tr className="bg-gray-50">
              <td colSpan={14} className="border p-2 font-semibold">Despesas Fixas</td>
            </tr>
            {categories.filter(cat => cat.type === 'fixed').map(cat => (
              <tr key={cat.name}>
                <td className="border p-2 sticky left-0 bg-white">{cat.name}</td>
                {months.map(month => (
                  <td key={month} className="border p-2 text-right text-red-600">
                    {editingCell?.category === cat.name && editingCell?.month === month ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editingCell.value}
                        onChange={(e) => setEditingCell({
                          ...editingCell,
                          value: e.target.value
                        })}
                        onBlur={() => handleCellEdit(cat.name, month, editingCell.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellEdit(cat.name, month, editingCell.value);
                          } else if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        className="w-full px-2 py-1 text-right border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className={`${mode === 'budget' ? 'cursor-pointer hover:bg-gray-50 transition-colors duration-150' : ''} 
                                  ${mode === 'budget' ? 'relative group' : ''}`}
                        onClick={() => {
                          if (mode === 'budget') {
                            setEditingCell({
                              category: cat.name,
                              month,
                              value: (data[cat.name]?.[month] || '0').toString()
                            });
                          }
                        }}
                      >
                        {data[cat.name]?.[month] ? 
                          `€${Math.abs(data[cat.name][month]).toFixed(2)}` : 
                          mode === 'budget' ? '€0.00' : ''}
                        {mode === 'budget' && (
                          <div className="hidden group-hover:block absolute top-1/2 right-2 transform -translate-y-1/2">
                            <Edit2 className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                ))}
                <td className="border p-2 text-right">
                  €{calculateYearlyAverage([cat.name]).toFixed(2)}
                </td>
              </tr>
            ))}
            <tr className="font-semibold bg-gray-50">
              <td className="border p-2 sticky left-0 bg-gray-50">TOTAL (fixo)</td>
              {months.map(month => (
                <td key={month} className="border p-2 text-right text-red-600">
                  €{calculateTotal(categories.filter(cat => cat.type === 'fixed').map(cat => cat.name), month).toFixed(2)}
                </td>
              ))}
              <td className="border p-2 text-right">
                €{calculateYearlyAverage(categories.filter(cat => cat.type === 'fixed').map(cat => cat.name)).toFixed(2)}
              </td>
            </tr>

            {/* Flexible Expenses */}
            <tr className="bg-gray-50">
              <td colSpan={14} className="border p-2 font-semibold">Despesas Flexíveis</td>
            </tr>
            {categories.filter(cat => cat.type === 'flexible').map(cat => (
              <tr key={cat.name}>
                <td className="border p-2 sticky left-0 bg-white">{cat.name}</td>
                {months.map(month => (
                  <td key={month} className="border p-2 text-right">
                    {editingCell?.category === cat.name && editingCell?.month === month ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editingCell.value}
                        onChange={(e) => setEditingCell({
                          ...editingCell,
                          value: e.target.value
                        })}
                        onBlur={() => handleCellEdit(cat.name, month, editingCell.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellEdit(cat.name, month, editingCell.value);
                          } else if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        className="w-full px-2 py-1 text-right border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className={`${mode === 'budget' ? 'cursor-pointer hover:bg-gray-50 transition-colors duration-150' : ''} 
                                  ${mode === 'budget' ? 'relative group' : ''}`}
                        onClick={() => {
                          if (mode === 'budget') {
                            setEditingCell({
                              category: cat.name,
                              month,
                              value: (data[cat.name]?.[month] || '0').toString()
                            });
                          }
                        }}
                      >
                        {data[cat.name]?.[month] ? 
                          `€${Math.abs(data[cat.name][month]).toFixed(2)}` : 
                          mode === 'budget' ? '€0.00' : ''}
                        {mode === 'budget' && (
                          <div className="hidden group-hover:block absolute top-1/2 right-2 transform -translate-y-1/2">
                            <Edit2 className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                ))}
                <td className="border p-2 text-right">
                  €{calculateYearlyAverage([cat.name]).toFixed(2)}
                </td>
              </tr>
            ))}
            <tr className="font-semibold bg-gray-50">
              <td className="border p-2 sticky left-0 bg-gray-50">TOTAL (flexível)</td>
              {months.map(month => (
                <td key={month} className="border p-2 text-right text-red-600">
                  €{calculateTotal(categories.filter(cat => cat.type === 'flexible').map(cat => cat.name), month).toFixed(2)}
                </td>
              ))}
              <td className="border p-2 text-right">
                €{calculateYearlyAverage(categories.filter(cat => cat.type === 'flexible').map(cat => cat.name)).toFixed(2)}
              </td>
            </tr>

            {/* Summary Section */}
            <tr className="font-semibold">
              <td className="border p-2 sticky left-0 bg-white">Rendimento</td>
              {months.map(month => (
                <td key={month} className="border p-2 text-right text-green-600">
                  {mode === 'budget' ? (
                    editingCell?.type === 'income' && editingCell?.month === month ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editingCell.value}
                        onChange={(e) => setEditingCell({
                          ...editingCell,
                          value: e.target.value
                        })}
                        onBlur={() => handleCellEdit('Income', month, editingCell.value, 'income')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellEdit('Income', month, editingCell.value, 'income');
                          } else if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        className="w-full px-2 py-1 text-right border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                        onClick={() => setEditingCell({
                          category: 'Income',
                          month,
                          value: (budgetedIncome[month] || '0').toString(),
                          type: 'income'
                        })}
                      >
                        €{(budgetedIncome[month] || 0).toFixed(2)}
                      </div>
                    )
                  ) : (
                    `€${(income[month] || 0).toFixed(2)}`
                  )}
                </td>
              ))}
              <td className="border p-2 text-right text-green-600">
                €{mode === 'budget' 
                  ? (Object.values(budgetedIncome).reduce((a, b) => a + b, 0) / Math.max(Object.keys(budgetedIncome).length, 1)).toFixed(2)
                  : (Object.values(income).reduce((a, b) => a + b, 0) / Math.max(Object.keys(income).length, 1)).toFixed(2)}
              </td>
            </tr>

            <tr className="font-semibold">
              <td className="border p-2 sticky left-0 bg-white">Despesas</td>
              {months.map(month => {
                const totalExpenses = mode === 'budget'
                  ? calculateTotal([...categories.filter(cat => cat.type === 'fixed').map(cat => cat.name), ...categories.filter(cat => cat.type === 'flexible').map(cat => cat.name)], month)
                  : Object.entries(data)
                      .filter(([category]) => category !== 'Income')
                      .reduce((total, [_, monthData]) => total + Math.abs(monthData[month] || 0), 0);
                return (
                  <td key={month} className="border p-2 text-right text-red-600">
                    €{totalExpenses.toFixed(2)}
                  </td>
                );
              })}
              <td className="border p-2 text-right text-red-600">
                €{calculateYearlyAverage([...categories.filter(cat => cat.type === 'fixed').map(cat => cat.name), ...categories.filter(cat => cat.type === 'flexible').map(cat => cat.name)]).toFixed(2)}
              </td>
            </tr>

            <tr className="font-semibold">
              <td className="border p-2 sticky left-0 bg-white">Poupanças</td>
              {months.map(month => {
                const monthlyIncome = mode === 'budget' ? budgetedIncome[month] || 0 : income[month] || 0;
                const monthlyExpenses = mode === 'budget'
                  ? calculateTotal([...categories.filter(cat => cat.type === 'fixed').map(cat => cat.name), ...categories.filter(cat => cat.type === 'flexible').map(cat => cat.name)], month)
                  : Object.entries(data)
                      .filter(([category]) => category !== 'Income')
                      .reduce((total, [_, monthData]) => total + Math.abs(monthData[month] || 0), 0);
                const monthlySavings = monthlyIncome - monthlyExpenses;
                return (
                  <td key={month} className="border p-2 text-right">
                    €{monthlySavings.toFixed(2)}
                  </td>
                );
              })}
              <td className="border p-2 text-right">
                €{mode === 'budget'
                  ? (Object.values(budgetedIncome).reduce((a, b) => a + b, 0) - 
                     calculateYearlyAverage([...categories.filter(cat => cat.type === 'fixed').map(cat => cat.name), ...categories.filter(cat => cat.type === 'flexible').map(cat => cat.name)]) * 12).toFixed(2)
                  : (Object.values(savings).reduce((a, b) => a + b, 0) / Math.max(Object.keys(savings).length, 1)).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Savings Projection */}
      <div className="mt-8 p-6 bg-white rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Projeção de Poupanças</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Saldo Inicial {selectedYear}</p>
            <p className="text-xl font-semibold">€{totalSavings.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-600">Saldo Final {selectedYear}</p>
            <p className="text-xl font-semibold">
              €{(totalSavings + (mode === 'budget'
                ? Object.values(budgetedIncome).reduce((a, b) => a + b, 0) - 
                  calculateYearlyAverage([...categories.filter(cat => cat.type === 'fixed').map(cat => cat.name), ...categories.filter(cat => cat.type === 'flexible').map(cat => cat.name)]) * 12
                : Object.values(savings).reduce((a, b) => a + b, 0))).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Fill Rest of Months Prompt */}
      {showFillPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Fill Remaining Months</h3>
            <p className="mb-4">
              Would you like to use €{fillValue?.value.toFixed(2)} for {fillValue?.category} for the remaining months of {selectedYear}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleFillRestOfMonths(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                No, Thanks
              </button>
              <button
                onClick={() => handleFillRestOfMonths(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Yes, Fill All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
