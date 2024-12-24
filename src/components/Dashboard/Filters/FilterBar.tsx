import React from 'react';
import { Filter } from 'lucide-react';
import DateFilter from './DateFilter';
import CategoryFilter from './CategoryFilter';
import UserFilter from './UserFilter';

interface FilterBarProps {
  selectedDate: Date;
  selectedCategories: string[];
  selectedUsers: string[];
  onDateChange: (date: Date) => void;
  onCategoriesChange: (categories: string[]) => void;
  onUsersChange: (users: string[]) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  selectedDate,
  selectedCategories,
  selectedUsers,
  onDateChange,
  onCategoriesChange,
  onUsersChange
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
      <div className="flex items-center gap-2 text-gray-700">
        <Filter className="h-5 w-5" />
        <span className="font-medium">Filters</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <DateFilter
            selectedDate={selectedDate}
            onChange={onDateChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories
          </label>
          <CategoryFilter
            selectedCategories={selectedCategories}
            onChange={onCategoriesChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Users
          </label>
          <UserFilter
            selectedUsers={selectedUsers}
            onChange={onUsersChange}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;