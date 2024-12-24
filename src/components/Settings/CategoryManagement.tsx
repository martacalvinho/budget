import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import type { Database } from '../../types/database';

type Category = Database['public']['Tables']['categories']['Row'];

interface CategoryManagementProps {
  type: 'fixed' | 'flexible';
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ type }) => {
  const { categories, loading } = useCategories();
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }

    // Check for duplicate category
    if (categories.some(cat => cat.name.toLowerCase() === newCategory.toLowerCase())) {
      toast.error('Category already exists');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          name: newCategory.trim(),
          type: type
        });

      if (error) throw error;
      
      setNewCategory('');
      toast.success('Category added successfully');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const filteredCategories = categories.filter(cat => cat.type === type);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">
          {type === 'fixed' ? 'Fixed' : 'Flexible'} Categories
        </h2>
        <div className="text-center py-4">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">
        {type === 'fixed' ? 'Fixed' : 'Flexible'} Categories
      </h2>
      
      <form onSubmit={handleAddCategory} className="mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Add Category
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCategories.length === 0 ? (
          <p className="text-gray-500 text-center py-4 col-span-2">No categories added yet</p>
        ) : (
          filteredCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <span className="text-gray-700">{category.name}</span>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                title="Delete category"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryManagement;