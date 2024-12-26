import { TransactionCategory } from '../utils/transactionCategorizer';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: TransactionCategory;
}