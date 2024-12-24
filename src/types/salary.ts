import { Timestamp } from 'firebase/firestore';

export interface IncomeSource {
  id: string;
  name: string;
  type: 'salary' | 'bonus' | 'investment' | 'other';
  currency: string;
  isRecurring: boolean;
}

export interface IncomeRecord {
  id: string;
  userId: string;
  sourceId: string;
  amount: number;
  currency: string;
  date: Timestamp;
  month: number;
  year: number;
  notes?: string;
  attachments?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MonthlySummary {
  totalIncome: number;
  byCurrency: Record<string, number>;
  bySource: Record<string, number>;
  recurring: number;
  nonRecurring: number;
}

export interface YearlySummary extends MonthlySummary {
  monthlyBreakdown: Record<number, MonthlySummary>;
  averageMonthlyIncome: number;
  trends: {
    highestMonth: number;
    lowestMonth: number;
    yearOverYearGrowth: number;
  };
}