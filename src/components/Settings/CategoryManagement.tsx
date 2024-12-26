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
  const { categories, loading, fetchCategories } = useCategories();
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Split the input by commas and trim each category
    const categoryNames = newCategory
      .split(',')
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0);

    if (categoryNames.length === 0) {
      toast.error('Category name cannot be empty');
      return;
    }

    // Check for duplicate categories
    const duplicates = categoryNames.filter(newCat => 
      categories.some(existingCat => 
        existingCat.name.toLowerCase() === newCat.toLowerCase()
      )
    );

    if (duplicates.length > 0) {
      toast.error(`Categories already exist: ${duplicates.join(', ')}`);
      return;
    }

    try {
      // Create an array of category objects to insert
      const categoryObjects = categoryNames.map(name => ({
        name,
        type
      }));

      const { error } = await supabase
        .from('categories')
        .insert(categoryObjects);

      if (error) throw error;
      
      setNewCategory('');
      await fetchCategories();
      toast.success(
        categoryNames.length === 1
          ? 'Category added successfully'
          : `${categoryNames.length} categories added successfully`
      );
    } catch (error) {
      console.error('Error adding categories:', error);
      toast.error('Failed to add categories');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // Delete the category
      const { error, status } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      
      if (status === 204) {
        // Force an immediate refetch
        await fetchCategories();
        toast.success('Category deleted successfully');
      } else {
        throw new Error('Unexpected response from server');
      }
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
            placeholder={type === 'fixed' ? "Category name" : "Category names (comma-separated)"}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Add {type === 'fixed' ? 'Category' : 'Categories'}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-md"
          >
            <span>{category.name}</span>
            <button
              onClick={() => handleDeleteCategory(category.id)}
              className="text-red-600 hover:text-red-800 transition-colors p-2 rounded hover:bg-red-50"
              title="Delete category"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {filteredCategories.length === 0 && (
          <div className="text-gray-500 text-center py-4">
            No {type} categories added yet
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManagement;