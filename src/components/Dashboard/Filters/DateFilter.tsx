import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';

interface DateFilterProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ selectedDate, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(subMonths(selectedDate, 1))}
        className="p-1 hover:bg-gray-100 rounded-full"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="text-sm font-medium">
        {format(selectedDate, 'MMMM yyyy')}
      </span>
      <button
        onClick={() => onChange(addMonths(selectedDate, 1))}
        className="p-1 hover:bg-gray-100 rounded-full"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

export default DateFilter;