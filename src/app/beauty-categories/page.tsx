'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import ImageUpload from '@/components/ImageUpload';

interface Category {
  _id: string;
  name: string;
  description?: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

type CategoryType = 'winter' | 'summer' | 'cloth' | 'woman-care' | 'kids' | 'perfume';

const categoryTypeConfig = {
  winter: {
    label: 'Winter Categories',
    api: {
      getAll: () => apiService.getWinterCategories(),
      getById: (id: string) => apiService.getWinterCategory(id),
      create: (data: any) => apiService.createWinterCategory(data),
      update: (id: string, data: any) => apiService.updateWinterCategory(id, data),
      delete: (id: string) => apiService.deleteWinterCategory(id)
    }
  },
  summer: {
    label: 'Summer Categories',
    api: {
      getAll: () => apiService.getSummerCategories(),
      getById: (id: string) => apiService.getSummerCategory(id),
      create: (data: any) => apiService.createSummerCategory(data),
      update: (id: string, data: any) => apiService.updateSummerCategory(id, data),
      delete: (id: string) => apiService.deleteSummerCategory(id)
    }
  },
  cloth: {
    label: 'Cloth Categories',
    api: {
      getAll: () => apiService.getClothCategories(),
      getById: (id: string) => apiService.getClothCategory(id),
      create: (data: any) => apiService.createClothCategory(data),
      update: (id: string, data: any) => apiService.updateClothCategory(id, data),
      delete: (id: string) => apiService.deleteClothCategory(id)
    }
  },
  'woman-care': {
    label: 'Woman Care Categories',
    api: {
      getAll: () => apiService.getWomanCareCategories(),
      getById: (id: string) => apiService.getWomanCareCategory(id),
      create: (data: any) => apiService.createWomanCareCategory(data),
      update: (id: string, data: any) => apiService.updateWomanCareCategory(id, data),
      delete: (id: string) => apiService.deleteWomanCareCategory(id)
    }
  },
  kids: {
    label: 'Kids Categories',
    api: {
      getAll: () => apiService.getKidsCategories(),
      getById: (id: string) => apiService.getKidsCategory(id),
      create: (data: any) => apiService.createKidsCategory(data),
      update: (id: string, data: any) => apiService.updateKidsCategory(id, data),
      delete: (id: string) => apiService.deleteKidsCategory(id)
    }
  },
  perfume: {
    label: 'Perfume Categories',
    api: {
      getAll: () => apiService.getPerfumeCategories(),
      getById: (id: string) => apiService.getPerfumeCategory(id),
      create: (data: any) => apiService.createPerfumeCategory(data),
      update: (id: string, data: any) => apiService.updatePerfumeCategory(id, data),
      delete: (id: string) => apiService.deletePerfumeCategory(id)
    }
  }
};

function BeautyCategoriesPage() {
  const [activeCategoryType, setActiveCategoryType] = useState<CategoryType>('winter');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image: '',
    sortOrder: 0,
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, [activeCategoryType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await categoryTypeConfig[activeCategoryType].api.getAll();
      setCategories(response.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      image: '',
      sortOrder: 0,
      isActive: true
    });
    setShowModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      image: category.image,
      sortOrder: category.sortOrder,
      isActive: category.isActive
    });
    setShowModal(true);
  };

  const handleViewCategory = (category: Category) => {
    setViewingCategory(category);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await categoryTypeConfig[activeCategoryType].api.delete(id);
      toast.success('Category deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoryTypeConfig[activeCategoryType].api.update(editingCategory._id, categoryForm);
        toast.success('Category updated successfully');
      } else {
        await categoryTypeConfig[activeCategoryType].api.create(categoryForm);
        toast.success('Category created successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <SparklesIcon className="h-8 w-8 text-pink-500" />
              Beauty Categories Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage categories for all beauty sections
            </p>
          </div>
        </div>

        {/* Category Type Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {(Object.keys(categoryTypeConfig) as CategoryType[]).map((type) => (
              <button
                key={type}
                onClick={() => setActiveCategoryType(type)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeCategoryType === type
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {categoryTypeConfig[type].label}
              </button>
            ))}
          </nav>
        </div>

        {/* Categories List */}
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleCreateCategory}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add {categoryTypeConfig[activeCategoryType].label.split(' ')[0]} Category
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div key={category._id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="relative h-48">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                  {!category.isActive && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                      Inactive
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">{category.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-400">Order: {category.sortOrder}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewCategory(category)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No categories found. Create one to get started.</p>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h2>
                <form onSubmit={handleSubmitCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      rows={3}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
                    <ImageUpload
                      value={categoryForm.image}
                      onChange={(value) => setCategoryForm({ ...categoryForm, image: value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                      <input
                        type="number"
                        value={categoryForm.sortOrder}
                        onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: parseInt(e.target.value) || 0 })}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={categoryForm.isActive}
                          onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700"
                    >
                      {editingCategory ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {viewingCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold">View Category Details</h2>
                  <button
                    onClick={() => setViewingCategory(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <img
                      src={viewingCategory.image}
                      alt={viewingCategory.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{viewingCategory.name}</h3>
                    {viewingCategory.description && (
                      <p className="text-gray-600 mt-2">{viewingCategory.description}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <span className={viewingCategory.isActive ? 'text-green-600' : 'text-red-600'}>
                        {viewingCategory.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Sort Order:</span> {viewingCategory.sortOrder}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {new Date(viewingCategory.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span>{' '}
                      {new Date(viewingCategory.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

export default function BeautyCategoriesPageWrapper() {
  return (
    <ProtectedRoute>
      <BeautyCategoriesPage />
    </ProtectedRoute>
  );
}

