'use client';

import React, { useState, useEffect, useCallback } from 'react';

// Helper function to extract error message safely
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return defaultMessage;
};
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  SparklesIcon,
  XMarkIcon
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

interface CategoryFormData {
  name: string;
  description: string;
  image: string;
  sortOrder: number;
  isActive: boolean;
}

const categoryTypeConfig = {
  winter: {
    label: 'Winter Categories',
    api: {
      getAll: () => apiService.getWinterCategories(),
      getById: (id: string) => apiService.getWinterCategory(id),
      create: (data: CategoryFormData) => apiService.createWinterCategory(data),
      update: (id: string, data: CategoryFormData) => apiService.updateWinterCategory(id, data),
      delete: (id: string) => apiService.deleteWinterCategory(id)
    }
  },
  summer: {
    label: 'Summer Categories',
    api: {
      getAll: () => apiService.getSummerCategories(),
      getById: (id: string) => apiService.getSummerCategory(id),
      create: (data: CategoryFormData) => apiService.createSummerCategory(data),
      update: (id: string, data: CategoryFormData) => apiService.updateSummerCategory(id, data),
      delete: (id: string) => apiService.deleteSummerCategory(id)
    }
  },
  cloth: {
    label: 'Cloth Categories',
    api: {
      getAll: () => apiService.getClothCategories(),
      getById: (id: string) => apiService.getClothCategory(id),
      create: (data: CategoryFormData) => apiService.createClothCategory(data),
      update: (id: string, data: CategoryFormData) => apiService.updateClothCategory(id, data),
      delete: (id: string) => apiService.deleteClothCategory(id)
    }
  },
  'woman-care': {
    label: 'Woman Care Categories',
    api: {
      getAll: () => apiService.getWomanCareCategories(),
      getById: (id: string) => apiService.getWomanCareCategory(id),
      create: (data: CategoryFormData) => apiService.createWomanCareCategory(data),
      update: (id: string, data: CategoryFormData) => apiService.updateWomanCareCategory(id, data),
      delete: (id: string) => apiService.deleteWomanCareCategory(id)
    }
  },
  kids: {
    label: 'Kids Categories',
    api: {
      getAll: () => apiService.getKidsCategories(),
      getById: (id: string) => apiService.getKidsCategory(id),
      create: (data: CategoryFormData) => apiService.createKidsCategory(data),
      update: (id: string, data: CategoryFormData) => apiService.updateKidsCategory(id, data),
      delete: (id: string) => apiService.deleteKidsCategory(id)
    }
  },
  perfume: {
    label: 'Perfume Categories',
    api: {
      getAll: () => apiService.getPerfumeCategories(),
      getById: (id: string) => apiService.getPerfumeCategory(id),
      create: (data: CategoryFormData) => apiService.createPerfumeCategory(data),
      update: (id: string, data: CategoryFormData) => apiService.updatePerfumeCategory(id, data),
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

  const fetchData = useCallback(async () => {
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
  }, [activeCategoryType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to delete category'));
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
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to save category'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-2xl border border-gray-100 bg-white" />
        <div className="h-96 animate-pulse rounded-2xl border border-gray-100 bg-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <SparklesIcon className="h-7 w-7 text-pink-500" />
              Beauty Categories Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage categories for all beauty sections
            </p>
          </div>
          <button
            onClick={handleCreateCategory}
            className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="h-5 w-5" />
            Add {categoryTypeConfig[activeCategoryType].label.split(' ')[0]} Category
          </button>
        </div>

        {/* Category Type Tabs */}
        <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm">
          {(Object.keys(categoryTypeConfig) as CategoryType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveCategoryType(type)}
              className={`rounded-xl px-4 py-2 text-sm whitespace-nowrap ${
                activeCategoryType === type
                  ? 'bg-pink-600 font-semibold text-white shadow-sm'
                  : 'font-medium text-gray-600 hover:bg-pink-50'
              }`}
            >
              {categoryTypeConfig[type].label}
            </button>
          ))}
        </div>

        {/* Categories List */}
        <div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div key={category._id} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-pink-600 shadow-sm">
                    Order {category.sortOrder}
                  </span>
                  <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm ${
                    category.isActive ? 'bg-emerald-500/95' : 'bg-red-500/95'
                  }`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  {category.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{category.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-end gap-1 border-t border-gray-100 pt-3">
                    <button
                      onClick={() => handleViewCategory(category)}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-600"
                      title="View"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-600"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category._id)}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                <SparklesIcon className="h-7 w-7" />
              </div>
              <p className="mt-4 text-lg font-medium text-gray-900">Nothing here yet</p>
              <p className="mt-1 text-sm text-gray-500">Create a category to get started.</p>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6">
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmitCategory} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      required
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Image *</label>
                    <div className="mt-1">
                      <ImageUpload
                        value={categoryForm.image}
                        onChange={(value) => setCategoryForm({ ...categoryForm, image: value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                      <input
                        type="number"
                        value={categoryForm.sortOrder}
                        onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: parseInt(e.target.value) || 0 })}
                        className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
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
                </div>
                <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {viewingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6">
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">View Category Details</h3>
                <button
                  onClick={() => setViewingCategory(null)}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                <div className="relative h-56 w-full overflow-hidden rounded-xl bg-gray-100">
                  <img
                    src={viewingCategory.image}
                    alt={viewingCategory.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{viewingCategory.name}</h3>
                  {viewingCategory.description && (
                    <p className="mt-2 text-sm text-gray-600">{viewingCategory.description}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>{' '}
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      viewingCategory.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {viewingCategory.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Sort Order:</span> {viewingCategory.sortOrder}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>{' '}
                    {new Date(viewingCategory.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Updated:</span>{' '}
                    {new Date(viewingCategory.updatedAt).toLocaleDateString()}
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

