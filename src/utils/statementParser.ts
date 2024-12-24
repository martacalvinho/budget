import { v4 as uuidv4 } from 'uuid';
import type { Transaction } from '../types/transactions';

export async function parseCSV(content: string): Promise<Transaction[]> {
  const lines = content.split('\n');
  if (lines.length < 2) {
    throw new Error('Invalid CSV file');
  }

  // Remove header row and empty lines
  const rows = lines
    .slice(1)
    .filter(line => line.trim().length > 0);

  return rows.map(row => {
    const columns = row.split(',').map(col => col.trim());
    
    // Assuming CSV format: Date,Description,Amount
    // Adjust these indexes based on your bank's CSV format
    return {
      id: uuidv4(),
      date: columns[0],
      description: columns[1],
      amount: parseFloat(columns[2].replace(/[^-0-9.]/g, ''))
    };
  });
}