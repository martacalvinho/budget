import React from 'react';
import { format, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthPickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

const MonthPicker: React.FC<MonthPickerProps> = ({ selectedDate, onChange }) => {
  const handlePreviousMonth = () => {
    onChange(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(selectedDate, 1);
    if (nextMonth <= new Date()) {
      onChange(nextMonth);
    }
  };

  const isCurrentMonth = format(selectedDate, 'MM/yyyy') === format(new Date(), 'MM/yyyy');

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handlePreviousMonth}
        className="p-2 hover:bg-gray-100 rounded-full"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      
      <span className="text-lg font-medium">
        {format(selectedDate, 'MMMM yyyy')}
      </span>
      
      <button
        onClick={handleNextMonth}
        disabled={isCurrentMonth}
        className={`p-2 rounded-full ${
          isCurrentMonth ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'
        }`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

export default MonthPicker;