import { endOfMonth, startOfMonth, format } from 'date-fns';

export function getMonthDateRange(year: number, month: number) {
  // month is 1-based in our API but 0-based in Date
  const date = new Date(year, month - 1, 1);
  const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
  
  return { startDate, endDate };
}