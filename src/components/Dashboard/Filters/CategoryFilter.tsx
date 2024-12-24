import React from 'react';
import { Tag } from 'lucide-react';
import { useCategories } from '../../../hooks/useCategories';

interface CategoryFilterProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ selectedCategories, onChange }) => {
  const { categories } = useCategories();

  const handleToggleCategory = (categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      onChange(selectedCategories.filter(c => c !== categoryName));
    } else {
      onChange([...selectedCategories, categoryName]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(category => (
        <button
          key={category.id}
          onClick={() => handleToggleCategory(category.name)}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
            selectedCategories.includes(category.name)
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Tag className="h-3 w-3" />
          {category.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;