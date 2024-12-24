import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  name: string;
  type: 'Adult' | 'Child';
  monthlyIncome: number;
  email?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

export interface SalaryHistory {
  id: string;
  userId: string;
  amount: number;
  month: number;
  year: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

export interface MonthlyStats {
  income: number;
  expenses: number;
  savings: number;
  categories: {
    [category: string]: number;
  };
  transactions: Array<{
    id: string;
    amount: number;
    category: string;
    description?: string;
    date: Timestamp;
    type: 'income' | 'expense';
  }>;
}

export interface UserStats {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  savingsGoal: number;
  monthlyStats: {
    [key: string]: {
      income: number;
      expenses: number;
      savings: number;
      categories: {
        [category: string]: number;
      };
    };
  };
  categoryStats: {
    [category: string]: number;
  };
}